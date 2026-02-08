import type { TaskLabel, GitHubLabel } from "./types";

const VALID_COLUMNS = ["backlog", "active", "in-review", "production"];

export function resolveColumn(issue: {
  state: string;
  labels: { name: string }[];
}): string {
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
