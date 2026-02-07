import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import {
  tasks,
  taskLabels,
  milestones,
  engineers,
  agentSessions,
  agentEvents,
} from "./schema";
import type { Task, Engineer, AgentSession, AgentEvent } from "../lib/types";

function serializeTask(row: {
  id: string;
  identifier: string;
  name: string;
  description: string | null;
  column: string;
  githubIssueNumber: number | null;
  githubIssueUrl: string | null;
  prUrl: string | null;
  branchName: string | null;
  assignedEngineerId: string | null;
  agentStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
  labels: { id: string; name: string; color: string }[];
  milestones: { id: string; title: string; completed: boolean }[];
}): Task {
  return {
    id: row.id,
    identifier: row.identifier,
    name: row.name,
    description: row.description ?? undefined,
    column: row.column,
    labels: row.labels.map((l) => ({ name: l.name, color: l.color })),
    milestones: row.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      completed: m.completed,
    })),
    githubIssueNumber: row.githubIssueNumber ?? undefined,
    githubIssueUrl: row.githubIssueUrl ?? undefined,
    prUrl: row.prUrl ?? undefined,
    branchName: row.branchName ?? undefined,
    assignedEngineerId: row.assignedEngineerId ?? undefined,
    agentStatus: row.agentStatus ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAllTasks(): Promise<Task[]> {
  const rows = await db.query.tasks.findMany({
    with: { labels: true, milestones: true },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  return rows.map(serializeTask);
}

export async function getTask(id: string): Promise<Task | undefined> {
  const row = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: { labels: true, milestones: true },
  });
  return row ? serializeTask(row) : undefined;
}

export async function getTaskByGithubIssueNumber(
  issueNumber: number,
): Promise<Task | undefined> {
  const row = await db.query.tasks.findFirst({
    where: eq(tasks.githubIssueNumber, issueNumber),
    with: { labels: true, milestones: true },
  });
  return row ? serializeTask(row) : undefined;
}

export async function generateIdentifier(): Promise<string> {
  const result = await db
    .select({
      maxNum: sql<number>`COALESCE(MAX(CAST(SUBSTRING(identifier FROM 'BPM-([0-9]+)') AS INTEGER)), 0)`,
    })
    .from(tasks);
  return `BPM-${(result[0]?.maxNum ?? 0) + 1}`;
}

export async function createTask(data: {
  name: string;
  description?: string;
  column?: string;
  githubIssueNumber?: number;
  githubIssueUrl?: string;
  identifier?: string;
  labels?: { name: string; color: string }[];
  milestones?: { title: string; completed?: boolean }[];
}): Promise<Task> {
  const identifier = data.identifier ?? (await generateIdentifier());

  const rows = await db
    .insert(tasks)
    .values({
      identifier,
      name: data.name,
      description: data.description,
      column: data.column ?? "backlog",
      githubIssueNumber: data.githubIssueNumber,
      githubIssueUrl: data.githubIssueUrl,
    })
    .returning();
  const inserted = rows[0]!;

  if (data.labels?.length) {
    await db.insert(taskLabels).values(
      data.labels.map((l) => ({
        taskId: inserted.id,
        name: l.name,
        color: l.color,
      })),
    );
  }

  if (data.milestones?.length) {
    await db.insert(milestones).values(
      data.milestones.map((m) => ({
        taskId: inserted.id,
        title: m.title,
        completed: m.completed ?? false,
      })),
    );
  }

  return (await getTask(inserted.id))!;
}

export async function updateTask(
  id: string,
  data: {
    name?: string;
    description?: string;
    column?: string;
    prUrl?: string;
    branchName?: string;
    assignedEngineerId?: string | null;
    agentStatus?: string;
  },
): Promise<Task | undefined> {
  const rows = await db
    .update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();

  if (!rows[0]) return undefined;
  return getTask(id);
}

export async function deleteTask(id: string): Promise<boolean> {
  const rows = await db
    .delete(tasks)
    .where(eq(tasks.id, id))
    .returning({ id: tasks.id });
  return rows.length > 0;
}

export async function replaceLabels(
  taskId: string,
  labels: { name: string; color: string }[],
): Promise<void> {
  await db.delete(taskLabels).where(eq(taskLabels.taskId, taskId));
  if (labels.length) {
    await db
      .insert(taskLabels)
      .values(labels.map((l) => ({ taskId, name: l.name, color: l.color })));
  }
}

export async function addLabel(
  taskId: string,
  name: string,
  color: string,
): Promise<void> {
  await db.insert(taskLabels).values({ taskId, name, color });
}

export async function removeLabel(
  taskId: string,
  name: string,
): Promise<void> {
  const rows = await db
    .select()
    .from(taskLabels)
    .where(eq(taskLabels.taskId, taskId));
  const target = rows.find((r) => r.name === name);
  if (target) {
    await db.delete(taskLabels).where(eq(taskLabels.id, target.id));
  }
}

export async function addMilestone(
  taskId: string,
  title: string,
): Promise<{ id: string; title: string; completed: boolean }> {
  const rows = await db
    .insert(milestones)
    .values({ taskId, title })
    .returning();
  const inserted = rows[0]!;
  return {
    id: inserted.id,
    title: inserted.title,
    completed: inserted.completed,
  };
}

export async function toggleMilestone(
  id: string,
): Promise<{ id: string; title: string; completed: boolean } | undefined> {
  const existing = await db.query.milestones.findFirst({
    where: eq(milestones.id, id),
  });
  if (!existing) return undefined;

  const rows = await db
    .update(milestones)
    .set({
      completed: !existing.completed,
      completedAt: !existing.completed ? new Date() : null,
    })
    .where(eq(milestones.id, id))
    .returning();
  const updated = rows[0]!;

  return {
    id: updated.id,
    title: updated.title,
    completed: updated.completed,
  };
}

export async function removeMilestone(id: string): Promise<boolean> {
  const rows = await db
    .delete(milestones)
    .where(eq(milestones.id, id))
    .returning({ id: milestones.id });
  return rows.length > 0;
}

export async function replaceMilestones(
  taskId: string,
  newMilestones: { title: string; completed?: boolean }[],
): Promise<void> {
  await db.delete(milestones).where(eq(milestones.taskId, taskId));
  if (newMilestones.length) {
    await db.insert(milestones).values(
      newMilestones.map((m) => ({
        taskId,
        title: m.title,
        completed: m.completed ?? false,
      })),
    );
  }
}

export async function getAllEngineers(): Promise<Engineer[]> {
  const rows = await db.select().from(engineers);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    avatarUrl: r.avatarUrl ?? undefined,
    discordId: r.discordId ?? undefined,
    githubUsername: r.githubUsername ?? undefined,
    skills: r.skills ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getEngineer(id: string): Promise<Engineer | undefined> {
  const row = await db.query.engineers.findFirst({
    where: eq(engineers.id, id),
  });
  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl ?? undefined,
    discordId: row.discordId ?? undefined,
    githubUsername: row.githubUsername ?? undefined,
    skills: row.skills ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createEngineer(data: {
  name: string;
  email: string;
  avatarUrl?: string;
  discordId?: string;
  githubUsername?: string;
  skills?: string[];
}): Promise<Engineer> {
  const rows = await db.insert(engineers).values(data).returning();
  const inserted = rows[0]!;
  return {
    id: inserted.id,
    name: inserted.name,
    email: inserted.email,
    avatarUrl: inserted.avatarUrl ?? undefined,
    discordId: inserted.discordId ?? undefined,
    githubUsername: inserted.githubUsername ?? undefined,
    skills: inserted.skills ?? undefined,
    createdAt: inserted.createdAt.toISOString(),
  };
}

export async function getSessionsForTask(
  taskId: string,
): Promise<AgentSession[]> {
  const rows = await db
    .select()
    .from(agentSessions)
    .where(eq(agentSessions.taskId, taskId));
  return rows.map((r) => ({
    id: r.id,
    taskId: r.taskId,
    startedAt: r.startedAt.toISOString(),
    endedAt: r.endedAt?.toISOString(),
    status: r.status,
  }));
}

export async function getEventsForSession(
  sessionId: string,
): Promise<AgentEvent[]> {
  const rows = await db
    .select()
    .from(agentEvents)
    .where(eq(agentEvents.sessionId, sessionId));
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.sessionId,
    type: r.type,
    message: r.message,
    metadata: r.metadata ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createSession(taskId: string): Promise<AgentSession> {
  const rows = await db
    .insert(agentSessions)
    .values({ taskId })
    .returning();
  const inserted = rows[0]!;
  return {
    id: inserted.id,
    taskId: inserted.taskId,
    startedAt: inserted.startedAt.toISOString(),
    status: inserted.status,
  };
}

export async function addEvent(
  sessionId: string,
  type: string,
  message: string,
  metadata?: unknown,
): Promise<AgentEvent> {
  const rows = await db
    .insert(agentEvents)
    .values({ sessionId, type, message, metadata })
    .returning();
  const inserted = rows[0]!;
  return {
    id: inserted.id,
    sessionId: inserted.sessionId,
    type: inserted.type,
    message: inserted.message,
    metadata: inserted.metadata ?? undefined,
    createdAt: inserted.createdAt.toISOString(),
  };
}

export async function endSession(
  id: string,
  status: "completed" | "failed",
): Promise<void> {
  await db
    .update(agentSessions)
    .set({ status, endedAt: new Date() })
    .where(eq(agentSessions.id, id));
}
