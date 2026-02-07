import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const engineers = pgTable("engineers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  avatarUrl: text("avatar_url"),
  discordId: text("discord_id").unique(),
  githubUsername: text("github_username").unique(),
  skills: text("skills").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: text("identifier").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  column: text("column").notNull().default("backlog"),
  githubIssueNumber: integer("github_issue_number"),
  githubIssueUrl: text("github_issue_url"),
  prUrl: text("pr_url"),
  branchName: text("branch_name"),
  assignedEngineerId: uuid("assigned_engineer_id").references(
    () => engineers.id,
  ),
  agentStatus: text("agent_status").default("idle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const taskLabels = pgTable("task_labels", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
});

export const agentSessions = pgTable("agent_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  status: text("status").notNull().default("running"),
});

export const agentEvents = pgTable("agent_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => agentSessions.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const engineersRelations = relations(engineers, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  labels: many(taskLabels),
  milestones: many(milestones),
  assignedEngineer: one(engineers, {
    fields: [tasks.assignedEngineerId],
    references: [engineers.id],
  }),
  sessions: many(agentSessions),
}));

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  task: one(tasks, {
    fields: [milestones.taskId],
    references: [tasks.id],
  }),
}));

export const agentSessionsRelations = relations(
  agentSessions,
  ({ one, many }) => ({
    task: one(tasks, {
      fields: [agentSessions.taskId],
      references: [tasks.id],
    }),
    events: many(agentEvents),
  }),
);

export const agentEventsRelations = relations(agentEvents, ({ one }) => ({
  session: one(agentSessions, {
    fields: [agentEvents.sessionId],
    references: [agentSessions.id],
  }),
}));
