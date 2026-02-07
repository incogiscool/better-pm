import {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addLabel,
  removeLabel,
  addMilestone,
  toggleMilestone,
  removeMilestone,
} from "../db/queries";
import { wsManager } from "../lib/ws-manager";
import { createIssue } from "../lib/github";
import { triggerAgent } from "../agent";

export async function handleGetTasks(corsOrigin: string): Promise<Response> {
  console.log("[tasks] GET all tasks");
  const tasks = await getAllTasks();
  console.log(`[tasks] Found ${tasks.length} tasks`);
  return Response.json(
    { tasks },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleGetTask(
  id: string,
  corsOrigin: string,
): Promise<Response> {
  console.log("[tasks] GET task:", id);
  const task = await getTask(id);
  if (!task) {
    console.warn("[tasks] Task not found:", id);
    return Response.json(
      { error: "Task not found" },
      { status: 404, headers: { "Access-Control-Allow-Origin": corsOrigin } },
    );
  }
  return Response.json(
    { task },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleCreateTask(
  req: Request,
  corsOrigin: string,
): Promise<Response> {
  const body = (await req.json()) as {
    name?: string;
    description?: string;
    column?: string;
    labels?: { name: string; color: string }[];
    milestones?: { title: string; completed?: boolean }[];
  };
  const { name, description, column, labels, milestones: ms } = body;
  console.log("[tasks] POST create task:", { name, description, column });

  if (!name) {
    console.warn("[tasks] Create task failed: name is required");
    return Response.json(
      { error: "name is required" },
      { status: 400, headers: { "Access-Control-Allow-Origin": corsOrigin } },
    );
  }

  let githubIssueNumber: number | undefined;
  let githubIssueUrl: string | undefined;

  const hasGithubConfig = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO);
  console.log("[tasks] GitHub config present:", hasGithubConfig, {
    token: process.env.GITHUB_TOKEN ? "set" : "missing",
    owner: process.env.GITHUB_OWNER ?? "missing",
    repo: process.env.GITHUB_REPO ?? "missing",
  });

  if (hasGithubConfig) {
    console.log("[tasks] Creating GitHub issue for:", name);
    try {
      const issue = await createIssue(
        name,
        description ?? "",
        labels?.map((l: { name: string }) => l.name),
      );
      githubIssueNumber = issue.number;
      githubIssueUrl = issue.html_url;
      console.log("[tasks] GitHub issue created:", { number: githubIssueNumber, url: githubIssueUrl });
    } catch (err) {
      console.error("[tasks] GitHub issue creation FAILED:", err);
    }
  }

  const task = await createTask({
    name,
    description,
    column,
    labels,
    milestones: ms,
    githubIssueNumber,
    githubIssueUrl,
  });
  console.log("[tasks] Task created:", { id: task.id, identifier: task.identifier, githubIssueNumber: task.githubIssueNumber });

  wsManager.broadcast({ type: "task:created", task });

  return Response.json(
    { task },
    { status: 201, headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleUpdateTask(
  req: Request,
  params: Record<string, string>,
  corsOrigin: string,
): Promise<Response> {
  const body = (await req.json()) as Record<string, unknown>;
  const id = params["id"]!;
  console.log("[tasks] PATCH update task:", id, body);
  const task = await updateTask(id, body as Parameters<typeof updateTask>[1]);

  if (!task) {
    console.warn("[tasks] Update failed, task not found:", id);
    return Response.json(
      { error: "Task not found" },
      { status: 404, headers: { "Access-Control-Allow-Origin": corsOrigin } },
    );
  }

  console.log("[tasks] Task updated:", { id: task.id, column: task.column });
  wsManager.broadcast({ type: "task:updated", task });

  return Response.json(
    { task },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleDeleteTask(
  params: Record<string, string>,
  corsOrigin: string,
): Promise<Response> {
  const id = params["id"]!;
  console.log("[tasks] DELETE task:", id);
  const deleted = await deleteTask(id);

  if (!deleted) {
    console.warn("[tasks] Delete failed, task not found:", id);
    return Response.json(
      { error: "Task not found" },
      { status: 404, headers: { "Access-Control-Allow-Origin": corsOrigin } },
    );
  }

  console.log("[tasks] Task deleted:", id);
  wsManager.broadcast({ type: "task:deleted", taskId: id });

  return Response.json(
    { success: true },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleAddLabel(
  req: Request,
  params: Record<string, string>,
  corsOrigin: string,
): Promise<Response> {
  const { name, color } = (await req.json()) as { name?: string; color?: string };
  console.log("[tasks] POST add label:", params["id"], { name, color });
  if (!name || !color) {
    return Response.json(
      { error: "name and color are required" },
      { status: 400, headers: { "Access-Control-Allow-Origin": corsOrigin } },
    );
  }

  const id = params["id"]!;
  await addLabel(id, name, color);
  const task = await getTask(id);
  if (task) wsManager.broadcast({ type: "task:updated", task });

  return Response.json(
    { task },
    { status: 201, headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleRemoveLabel(
  params: Record<string, string>,
  corsOrigin: string,
): Promise<Response> {
  const id = params["id"]!;
  const labelName = decodeURIComponent(params["name"]!);
  console.log("[tasks] DELETE label:", id, labelName);
  await removeLabel(id, labelName);
  const task = await getTask(id);
  if (task) wsManager.broadcast({ type: "task:updated", task });

  return Response.json(
    { task },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleAddMilestone(
  req: Request,
  params: Record<string, string>,
  corsOrigin: string,
): Promise<Response> {
  const { title } = (await req.json()) as { title?: string };
  console.log("[tasks] POST add milestone:", params["id"], title);
  if (!title) {
    return Response.json(
      { error: "title is required" },
      { status: 400, headers: { "Access-Control-Allow-Origin": corsOrigin } },
    );
  }

  const id = params["id"]!;
  const milestone = await addMilestone(id, title);
  const task = await getTask(id);
  if (task) wsManager.broadcast({ type: "task:updated", task });

  return Response.json(
    { milestone, task },
    { status: 201, headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleToggleMilestone(
  params: Record<string, string>,
  corsOrigin: string,
): Promise<Response> {
  console.log("[tasks] PATCH toggle milestone:", params["mid"]);
  const milestone = await toggleMilestone(params["mid"]!);
  if (!milestone) {
    return Response.json(
      { error: "Milestone not found" },
      { status: 404, headers: { "Access-Control-Allow-Origin": corsOrigin } },
    );
  }

  const task = await getTask(params["id"]!);
  if (task) wsManager.broadcast({ type: "task:updated", task });

  return Response.json(
    { milestone, task },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleRemoveMilestone(
  params: Record<string, string>,
  corsOrigin: string,
): Promise<Response> {
  console.log("[tasks] DELETE milestone:", params["mid"]);
  const deleted = await removeMilestone(params["mid"]!);
  if (!deleted) {
    return Response.json(
      { error: "Milestone not found" },
      { status: 404, headers: { "Access-Control-Allow-Origin": corsOrigin } },
    );
  }

  const task = await getTask(params["id"]!);
  if (task) wsManager.broadcast({ type: "task:updated", task });

  return Response.json(
    { task },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleApproveTask(
  params: Record<string, string>,
  corsOrigin: string,
): Promise<Response> {
  const id = params["id"]!;
  console.log("[tasks] POST approve task:", id);
  const existing = await getTask(id);
  if (!existing) {
    console.warn("[tasks] Approve failed, task not found:", id);
    return Response.json(
      { error: "Task not found" },
      { status: 404, headers: { "Access-Control-Allow-Origin": corsOrigin } },
    );
  }

  if (process.env.ANTHROPIC_API_KEY) {
    console.log("[tasks] Triggering agent for task:", id);
    triggerAgent(id);
  } else {
    console.log("[tasks] No ANTHROPIC_API_KEY, setting agent status to working");
    const task = await updateTask(id, { agentStatus: "working" });
    if (task) wsManager.broadcast({ type: "task:updated", task });
  }

  return Response.json(
    { task: existing },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}
