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
  githubIssueNumber?: number;
  githubIssueUrl?: string;
  prUrl?: string;
  branchName?: string;
  assignedEngineerId?: string;
  agentStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Engineer {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  discordId?: string;
  githubUsername?: string;
  skills?: string[];
  createdAt?: string;
}

export interface AgentSession {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt?: string;
  status: string;
}

export interface AgentEvent {
  id: string;
  sessionId: string;
  type: string;
  message: string;
  metadata?: unknown;
  createdAt: string;
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
  html_url: string;
  labels: GitHubLabel[];
  milestone: GitHubMilestone | null;
}

export type WsMessage =
  | { type: "task:created"; task: Task }
  | { type: "task:updated"; task: Task }
  | { type: "task:deleted"; taskId: string }
  | { type: "tasks:init"; tasks: Task[] }
  | { type: "agent:event"; taskId: string; event: AgentEvent };
