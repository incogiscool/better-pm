export interface TaskLabel {
  name: string;
  color: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  identifier: string;
  name: string;
  description?: string;
  column: string;
  labels?: TaskLabel[];
  milestones?: Milestone[];
}

export interface Column {
  id: string;
  title: string;
  color: string;
  progress: number;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
}

export interface GitHubMilestone {
  id: number;
  title: string;
  state: "open" | "closed";
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: GitHubLabel[];
  milestone: GitHubMilestone | null;
}

export type WsMessage =
  | { type: "task:created"; task: Task }
  | { type: "task:updated"; task: Task }
  | { type: "task:deleted"; taskId: string }
  | { type: "tasks:init"; tasks: Task[] };
