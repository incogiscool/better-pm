import { verifySignature } from "../lib/verify-signature";
import {
  mapLabelsToTaskLabels,
  resolveColumn,
} from "../lib/github-mapper";
import {
  getTaskByGithubIssueNumber,
  createTask,
  updateTask,
  deleteTask,
  replaceLabels,
  replaceMilestones,
  getTask,
} from "../db/queries";
import { wsManager } from "../lib/ws-manager";

export async function handleWebhook(
  req: Request,
  corsOrigin: string,
): Promise<Response> {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  console.log("[webhook] Received event:", event, "signature present:", !!signature);

  if (!signature || !verifySignature(body, signature)) {
    console.error("[webhook] Signature verification FAILED");
    return new Response("Unauthorized", { status: 401 });
  }

  if (event === "ping") {
    console.log("[webhook] Ping received, responding with pong");
    return new Response("pong", { status: 200 });
  }

  // GitHub sends form-encoded body when content type is application/x-www-form-urlencoded
  let jsonBody = body;
  if (body.startsWith("payload=")) {
    const encoded = body.slice("payload=".length);
    jsonBody = decodeURIComponent(encoded.replace(/\+/g, " "));
    console.log("[webhook] Decoded form-encoded payload");
  }

  const payload = JSON.parse(jsonBody);
  console.log("[webhook] Processing event:", event, "action:", payload.action);

  if (event === "issues") {
    await handleIssueEvent(payload);
  } else if (event === "pull_request") {
    await handlePullRequestEvent(payload);
  } else if (event === "pull_request_review") {
    await handlePullRequestReviewEvent(payload);
  } else {
    console.log("[webhook] Unhandled event type:", event);
  }

  return new Response("OK", {
    status: 200,
    headers: { "Access-Control-Allow-Origin": corsOrigin },
  });
}

async function handleIssueEvent(payload: {
  action: string;
  issue: {
    number: number;
    title: string;
    body: string | null;
    state: string;
    html_url: string;
    labels: { id: number; name: string; color: string }[];
    milestone: { id: number; title: string; state: string } | null;
  };
}) {
  const { action, issue } = payload;
  console.log("[webhook:issues]", action, "issue #" + issue.number, issue.title);
  const existing = await getTaskByGithubIssueNumber(issue.number);
  console.log("[webhook:issues] Existing task:", existing ? existing.id : "none");

  switch (action) {
    case "opened": {
      if (existing) {
        console.log("[webhook:issues] Task already exists for issue #" + issue.number + ", skipping creation");
        break;
      }
      const labels = mapLabelsToTaskLabels(issue.labels);
      const column = resolveColumn({
        state: issue.state as "open" | "closed",
        labels: issue.labels,
      });
      console.log("[webhook:issues] Creating task from issue, column:", column);
      const task = await createTask({
        name: issue.title,
        description: issue.body ?? undefined,
        column,
        githubIssueNumber: issue.number,
        githubIssueUrl: issue.html_url,
        identifier: `GH-${issue.number}`,
        labels,
        milestones: issue.milestone
          ? [
              {
                title: issue.milestone.title,
                completed: issue.milestone.state === "closed",
              },
            ]
          : [],
      });
      console.log("[webhook:issues] Task created:", task.id);
      wsManager.broadcast({ type: "task:created", task });
      break;
    }

    case "edited": {
      if (existing) {
        console.log("[webhook:issues] Updating existing task:", existing.id);
        const task = await updateTask(existing.id, {
          name: issue.title,
          description: issue.body ?? undefined,
        });
        if (task) wsManager.broadcast({ type: "task:updated", task });
      } else {
        console.log("[webhook:issues] No existing task, creating from edited issue");
        const labels = mapLabelsToTaskLabels(issue.labels);
        const column = resolveColumn({
          state: issue.state as "open" | "closed",
          labels: issue.labels,
        });
        const task = await createTask({
          name: issue.title,
          description: issue.body ?? undefined,
          column,
          githubIssueNumber: issue.number,
          githubIssueUrl: issue.html_url,
          identifier: `GH-${issue.number}`,
          labels,
        });
        wsManager.broadcast({ type: "task:created", task });
      }
      break;
    }

    case "closed": {
      if (existing) {
        console.log("[webhook:issues] Closing task:", existing.id);
        const task = await updateTask(existing.id, { column: "production", agentStatus: "idle" });
        if (task) wsManager.broadcast({ type: "task:updated", task });
      }
      break;
    }

    case "reopened": {
      if (existing) {
        console.log("[webhook:issues] Reopening task:", existing.id);
        const task = await updateTask(existing.id, { column: "backlog" });
        if (task) wsManager.broadcast({ type: "task:updated", task });
      }
      break;
    }

    case "labeled":
    case "unlabeled": {
      if (existing) {
        console.log("[webhook:issues] Label change on task:", existing.id);
        const labels = mapLabelsToTaskLabels(issue.labels);
        const column = resolveColumn({
          state: issue.state as "open" | "closed",
          labels: issue.labels,
        });
        await replaceLabels(existing.id, labels);
        await updateTask(existing.id, { column });
        const task = await getTask(existing.id);
        if (task) wsManager.broadcast({ type: "task:updated", task });
      }
      break;
    }

    case "milestoned":
    case "demilestoned": {
      if (existing) {
        console.log("[webhook:issues] Milestone change on task:", existing.id);
        await replaceMilestones(
          existing.id,
          issue.milestone
            ? [
                {
                  title: issue.milestone.title,
                  completed: issue.milestone.state === "closed",
                },
              ]
            : [],
        );
        const task = await getTask(existing.id);
        if (task) wsManager.broadcast({ type: "task:updated", task });
      }
      break;
    }

    case "deleted": {
      if (existing) {
        console.log("[webhook:issues] Deleting task:", existing.id);
        await deleteTask(existing.id);
        wsManager.broadcast({ type: "task:deleted", taskId: existing.id });
      }
      break;
    }

    default:
      console.log("[webhook:issues] Unhandled action:", action);
  }
}

async function handlePullRequestEvent(payload: {
  action: string;
  pull_request: {
    number: number;
    html_url: string;
    body: string | null;
    merged: boolean;
    head: { ref: string };
  };
}) {
  const { action, pull_request: pr } = payload;
  console.log("[webhook:pr]", action, "PR #" + pr.number);

  const issueNumber = extractIssueNumber(pr.body);
  console.log("[webhook:pr] Extracted issue number from body:", issueNumber);
  if (!issueNumber) return;

  const existing = await getTaskByGithubIssueNumber(issueNumber);
  console.log("[webhook:pr] Linked task:", existing ? existing.id : "none");
  if (!existing) return;

  switch (action) {
    case "opened": {
      console.log("[webhook:pr] PR opened, moving task to in-review");
      const task = await updateTask(existing.id, {
        column: "in-review",
        prUrl: pr.html_url,
        branchName: pr.head.ref,
      });
      if (task) wsManager.broadcast({ type: "task:updated", task });
      break;
    }

    case "closed": {
      if (pr.merged) {
        console.log("[webhook:pr] PR merged, moving task to production");
        const task = await updateTask(existing.id, { column: "production", agentStatus: "idle" });
        if (task) wsManager.broadcast({ type: "task:updated", task });
      } else {
        console.log("[webhook:pr] PR closed without merge");
      }
      break;
    }
  }
}

async function handlePullRequestReviewEvent(payload: {
  action: string;
  review: { state: string };
  pull_request: { body: string | null };
}) {
  const { action, review, pull_request: pr } = payload;
  console.log("[webhook:pr-review]", action, "state:", review.state);
  if (action !== "submitted") return;

  const issueNumber = extractIssueNumber(pr.body);
  console.log("[webhook:pr-review] Extracted issue number:", issueNumber);
  if (!issueNumber) return;

  const existing = await getTaskByGithubIssueNumber(issueNumber);
  console.log("[webhook:pr-review] Linked task:", existing ? existing.id : "none");
  if (!existing) return;

  if (review.state === "approved") {
    console.log("[webhook:pr-review] Review approved, moving to production");
    const task = await updateTask(existing.id, {
      column: "production",
      agentStatus: "idle",
    });
    if (task) wsManager.broadcast({ type: "task:updated", task });
  }
}

function extractIssueNumber(body: string | null): number | null {
  if (!body) return null;
  const patterns = [
    /(?:closes|fixes|resolves)\s+#(\d+)/i,
    /(?:close|fix|resolve)\s+#(\d+)/i,
    /#(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match?.[1]) return parseInt(match[1]);
  }
  return null;
}
