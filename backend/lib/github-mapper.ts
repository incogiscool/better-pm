import type { Task, TaskLabel, GitHubIssue, GitHubLabel } from "./types";

const VALID_COLUMNS = ["backlog", "active", "in-review", "ready-to-deploy", "production"];

export function resolveColumn(issue: GitHubIssue): string {
  if (issue.state === "closed") return "production";

  const statusLabel = issue.labels.find((l) => l.name.startsWith("status:"));
  if (statusLabel) {
    const status = statusLabel.name.replace("status:", "");
    if (VALID_COLUMNS.includes(status)) return status;
  }

  return "backlog";
}

export function mapLabelsToTaskLabels(labels: GitHubLabel[]): TaskLabel[] {
  return labels
    .filter((l) => !l.name.startsWith("status:"))
    .map((l) => ({
      name: l.name,
      color: `#${l.color}`,
    }));
}

export function mapIssueToTask(issue: GitHubIssue): Task {
  return {
    id: String(issue.id),
    identifier: `GH-${issue.number}`,
    name: issue.title,
    description: issue.body ?? undefined,
    column: resolveColumn(issue),
    labels: mapLabelsToTaskLabels(issue.labels),
    milestones: issue.milestone
      ? [
          {
            id: String(issue.milestone.id),
            title: issue.milestone.title,
            completed: issue.milestone.state === "closed",
          },
        ]
      : [],
  };
}
