import { verifySignature } from "../lib/verify-signature";
import {
  mapIssueToTask,
  mapLabelsToTaskLabels,
  resolveColumn,
} from "../lib/github-mapper";
import { store } from "../lib/store";
import { wsManager } from "../lib/ws-manager";

export async function handleWebhook(
  req: Request,
  corsOrigin: string,
): Promise<Response> {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  if (!signature || !verifySignature(body, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (event === "ping") {
    return new Response("pong", { status: 200 });
  }

  if (event !== "issues") {
    return new Response("OK", { status: 200 });
  }

  const payload = JSON.parse(body);
  const { action, issue } = payload;
  const taskId = String(issue.id);

  switch (action) {
    case "opened": {
      const task = mapIssueToTask(issue);
      store.set(taskId, task);
      wsManager.broadcast({ type: "task:created", task });
      break;
    }

    case "edited": {
      const existing = store.get(taskId);
      if (existing) {
        existing.name = issue.title;
        existing.description = issue.body ?? undefined;
        store.set(taskId, existing);
        wsManager.broadcast({ type: "task:updated", task: existing });
      } else {
        const task = mapIssueToTask(issue);
        store.set(taskId, task);
        wsManager.broadcast({ type: "task:created", task });
      }
      break;
    }

    case "closed": {
      const existing = store.get(taskId);
      if (existing) {
        existing.column = "production";
        store.set(taskId, existing);
        wsManager.broadcast({ type: "task:updated", task: existing });
      }
      break;
    }

    case "reopened": {
      const existing = store.get(taskId);
      if (existing) {
        existing.column = "backlog";
        store.set(taskId, existing);
        wsManager.broadcast({ type: "task:updated", task: existing });
      }
      break;
    }

    case "labeled":
    case "unlabeled": {
      const existing = store.get(taskId);
      if (existing) {
        existing.labels = mapLabelsToTaskLabels(issue.labels);
        existing.column = resolveColumn(issue);
        store.set(taskId, existing);
        wsManager.broadcast({ type: "task:updated", task: existing });
      }
      break;
    }

    case "milestoned":
    case "demilestoned": {
      const existing = store.get(taskId);
      if (existing) {
        existing.milestones = issue.milestone
          ? [
              {
                id: String(issue.milestone.id),
                title: issue.milestone.title,
                completed: issue.milestone.state === "closed",
              },
            ]
          : [];
        store.set(taskId, existing);
        wsManager.broadcast({ type: "task:updated", task: existing });
      }
      break;
    }

    case "deleted": {
      store.delete(taskId);
      wsManager.broadcast({ type: "task:deleted", taskId });
      break;
    }
  }

  return new Response("OK", {
    status: 200,
    headers: { "Access-Control-Allow-Origin": corsOrigin },
  });
}
