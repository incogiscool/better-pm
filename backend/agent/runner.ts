import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildTaskPrompt, buildRefinementPrompt } from "./prompts";
import { getRepoStructure, readFile } from "./file-context";
import { SessionManager } from "./session-manager";
import { createBranch, createPR, updateIssue } from "../lib/github";
import { updateTask, getTask } from "../db/queries";
import { wsManager } from "../lib/ws-manager";
import { Octokit } from "octokit";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const tools: Anthropic.Tool[] = [
  {
    name: "read_file",
    description: "Read the contents of a file from the repository",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path relative to repo root" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file in the repository",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path relative to repo root" },
        content: { type: "string", description: "File content to write" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_files",
    description: "List all files in the repository",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
];

interface FileChange {
  path: string;
  content: string;
}

async function refineDescription(
  anthropic: Anthropic,
  taskId: string,
  taskName: string,
  rawDescription: string,
  repoStructure: string,
  session: SessionManager,
): Promise<string> {
  console.log("[agent] Refining description for task:", taskId);
  await session.emit("thinking", "Refining task description into detailed spec...");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: buildRefinementPrompt(taskName, rawDescription, repoStructure),
      },
    ],
  });

  const refined = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  console.log("[agent] Description refined, length:", refined.length);
  await session.emit("thinking", "Task spec refined — saving to task and GitHub issue...");

  // Save refined description back to the task
  const updated = await updateTask(taskId, { description: refined });
  if (updated) wsManager.broadcast({ type: "task:updated", task: updated });

  // Update the linked GitHub issue with the refined description
  const task = await getTask(taskId);
  if (task?.githubIssueNumber) {
    try {
      await updateIssue(task.githubIssueNumber, { body: refined });
      console.log("[agent] GitHub issue #" + task.githubIssueNumber + " updated with refined spec");
    } catch (err) {
      console.error("[agent] Failed to update GitHub issue:", err);
    }
  }

  return refined;
}

export async function runAgent(
  taskId: string,
  taskName: string,
  taskDescription: string,
  branchBase: string = "main",
): Promise<void> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required");
  }

  const session = new SessionManager(taskId);
  await session.start();

  try {
    await session.emit("thinking", "Analyzing repository structure...");
    const repoStructure = await getRepoStructure();

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    // Step 1: Refine the raw description into a detailed spec
    const refinedDescription = await refineDescription(
      anthropic,
      taskId,
      taskName,
      taskDescription,
      repoStructure,
      session,
    );

    // Step 2: Implement using the refined spec
    await session.emit("thinking", "Starting implementation from refined spec...");

    const fileChanges: FileChange[] = [];

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: buildTaskPrompt(taskName, refinedDescription) },
    ];

    let continueLoop = true;

    while (continueLoop) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 8192,
        system: buildSystemPrompt(repoStructure),
        tools,
        messages,
      });

      const assistantContent = response.content;
      messages.push({ role: "assistant", content: assistantContent });

      if (response.stop_reason === "end_turn") {
        continueLoop = false;
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of assistantContent) {
          if (block.type !== "tool_use") continue;

          const input = block.input as Record<string, string>;

          switch (block.name) {
            case "read_file": {
              await session.emit("coding", `Reading ${input["path"]}`);
              const content = await readFile(input["path"]!);
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: content ?? "File not found",
              });
              break;
            }

            case "write_file": {
              await session.emit("coding", `Writing ${input["path"]}`);
              fileChanges.push({
                path: input["path"]!,
                content: input["content"]!,
              });
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: `File ${input["path"]} staged for commit`,
              });
              break;
            }

            case "list_files": {
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: repoStructure,
              });
              break;
            }

            default: {
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: "Unknown tool",
                is_error: true,
              });
            }
          }
        }

        messages.push({ role: "user", content: toolResults });
      }
    }

    if (fileChanges.length === 0) {
      await session.emit("completed", "No file changes needed");
      await session.complete();
      return;
    }

    await session.emit("committing", `Committing ${fileChanges.length} file(s)...`);

    const task = await updateTask(taskId, { agentStatus: "committing" });
    if (task) wsManager.broadcast({ type: "task:updated", task });

    const slugName = taskName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    const branchName = `agent/${slugName}`;

    try {
      await createBranch(branchBase, branchName);
    } catch {
      // Branch may already exist
    }

    await commitFiles(branchName, fileChanges, `feat: ${taskName}`);
    await session.emit("committing", `Committed to branch ${branchName}`);

    const pr = await createPR(
      `[Agent] ${taskName}`,
      `Automated implementation for task.\n\nCloses #${taskName}`,
      branchName,
      branchBase,
    );

    await session.emit("pr_created", `PR #${pr.number} created: ${pr.html_url}`);

    const updatedTask = await updateTask(taskId, {
      column: "in-review",
      prUrl: pr.html_url,
      branchName,
      agentStatus: "awaiting-close",
    });
    if (updatedTask) wsManager.broadcast({ type: "task:updated", task: updatedTask });

    await session.complete();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[agent] Error:", message);
    await session.fail(message);

    const task = await updateTask(taskId, { agentStatus: "idle" });
    if (task) wsManager.broadcast({ type: "task:updated", task });
  }
}

async function commitFiles(
  branch: string,
  files: FileChange[],
  message: string,
): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) throw new Error("GitHub not configured");

  const octokit = new Octokit({ auth: token });

  const { data: ref } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const baseSha = ref.object.sha;

  const { data: baseCommit } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: baseSha,
  });

  const blobs = await Promise.all(
    files.map(async (f) => {
      const { data } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: f.content,
        encoding: "utf-8",
      });
      return { path: f.path, sha: data.sha };
    }),
  );

  const { data: tree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.tree.sha,
    tree: blobs.map((b) => ({
      path: b.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: b.sha,
    })),
  });

  const { data: commit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree: tree.sha,
    parents: [baseSha],
  });

  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commit.sha,
  });
}
