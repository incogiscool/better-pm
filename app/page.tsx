"use client";

import { useState } from "react";
import type { Column, Task } from "@/components/task-column";
import { TaskColumn } from "@/components/task-column";
import { TaskDetailSheet } from "@/components/task-detail-sheet";

const COLUMNS: Column[] = [
  { id: "backlog", title: "Backlog", color: "#95a2b3", progress: 0 },
  { id: "active", title: "Active", color: "#f2994a", progress: 25 },
  { id: "in-review", title: "In Review", color: "#6fcf97", progress: 50 },
  {
    id: "ready-to-deploy",
    title: "Ready to Deploy",
    color: "#2f80ed",
    progress: 75,
  },
  { id: "production", title: "Production", color: "#9b51e0", progress: 100 },
];

const DEMO_TASKS: Task[] = [
  {
    id: "1",
    identifier: "BPM-14",
    name: "Setup Discord bot listener",
    description:
      "Implement a Discord.js bot that monitors specific channels for task-related messages and triggers ticket creation.",
    column: "backlog",
    labels: [{ name: "Feature", color: "#9b51e0" }],
    milestones: [
      { id: "m1", title: "Initialize Discord.js project", completed: false },
      { id: "m2", title: "Configure bot permissions", completed: false },
      { id: "m3", title: "Implement message listener", completed: false },
      { id: "m4", title: "Add task detection logic", completed: false },
    ],
  },
  {
    id: "2",
    identifier: "BPM-13",
    name: "Create ticket API endpoint",
    description:
      "Build REST API endpoints for creating, reading, updating, and deleting tickets on the Kanban board.",
    column: "backlog",
    labels: [{ name: "Backend", color: "#2f80ed" }],
    milestones: [
      { id: "m5", title: "Define ticket schema", completed: false },
      { id: "m6", title: "Create POST /api/tickets", completed: false },
      { id: "m7", title: "Create GET /api/tickets", completed: false },
      { id: "m8", title: "Add validation middleware", completed: false },
    ],
  },
  {
    id: "3",
    identifier: "BPM-12",
    name: "Knowledge base integration",
    description:
      "Connect the knowledge base to the bot so it can match tasks to the best-suited engineer.",
    column: "backlog",
    labels: [{ name: "Feature", color: "#9b51e0" }],
    milestones: [
      { id: "m9", title: "Define knowledge base schema", completed: false },
      { id: "m10", title: "Build skill-matching algorithm", completed: false },
      { id: "m11", title: "Integrate with bot flow", completed: false },
    ],
  },
  {
    id: "4",
    identifier: "BPM-11",
    name: "Design kanban board layout",
    description:
      "Create the visual design for the Kanban board including column headers, task cards, and responsive layout.",
    column: "active",
    labels: [{ name: "Design", color: "#f2994a" }],
    milestones: [
      { id: "m12", title: "Wireframe board layout", completed: true },
      { id: "m13", title: "Design task card component", completed: true },
      { id: "m14", title: "Design column headers", completed: false },
      { id: "m15", title: "Add responsive breakpoints", completed: false },
    ],
  },
  {
    id: "5",
    identifier: "BPM-10",
    name: "Implement GitHub issue sync",
    description:
      "Sync tickets with GitHub issues so every Kanban ticket has a linked GitHub issue that stays in sync.",
    column: "active",
    labels: [
      { name: "Feature", color: "#9b51e0" },
      { name: "Backend", color: "#2f80ed" },
    ],
    milestones: [
      { id: "m16", title: "Setup GitHub App authentication", completed: true },
      { id: "m17", title: "Create issue on ticket creation", completed: true },
      { id: "m18", title: "Sync status changes bidirectionally", completed: false },
      { id: "m19", title: "Link PRs to issues", completed: false },
    ],
  },
  {
    id: "6",
    identifier: "BPM-9",
    name: "PR review automation",
    description:
      "Integrate CodeRabbit for automated code review on agent-generated pull requests.",
    column: "active",
    labels: [{ name: "Improvement", color: "#27ae60" }],
    milestones: [
      { id: "m20", title: "Configure CodeRabbit integration", completed: true },
      { id: "m21", title: "Setup review webhook handlers", completed: false },
      { id: "m22", title: "Auto-update ticket status on review", completed: false },
    ],
  },
  {
    id: "7",
    identifier: "BPM-8",
    name: "Add agent session viewer",
    description:
      "Build a UI component that shows the full agent session history when a ticket is expanded.",
    column: "in-review",
    labels: [{ name: "Feature", color: "#9b51e0" }],
    milestones: [
      { id: "m23", title: "Design session timeline UI", completed: true },
      { id: "m24", title: "Fetch session data from API", completed: true },
      { id: "m25", title: "Render agent actions and outputs", completed: true },
      { id: "m26", title: "Add real-time streaming", completed: false },
    ],
  },
  {
    id: "8",
    identifier: "BPM-7",
    name: "Setup Neon database schema",
    description:
      "Design and implement the PostgreSQL schema on Neon for tickets, sessions, and team data.",
    column: "in-review",
    labels: [{ name: "Backend", color: "#2f80ed" }],
    milestones: [
      { id: "m27", title: "Design ER diagram", completed: true },
      { id: "m28", title: "Create migration files", completed: true },
      { id: "m29", title: "Setup connection pooling", completed: true },
      { id: "m30", title: "Add seed data", completed: true },
    ],
  },
  {
    id: "9",
    identifier: "BPM-6",
    name: "Engineer assignment logic",
    description:
      "Automatically assign the best-suited engineer to a ticket based on skills and availability.",
    column: "ready-to-deploy",
    labels: [{ name: "Feature", color: "#9b51e0" }],
    milestones: [
      { id: "m31", title: "Define assignment criteria", completed: true },
      { id: "m32", title: "Build assignment algorithm", completed: true },
      { id: "m33", title: "Integrate with ticket creation", completed: true },
      { id: "m34", title: "Add Discord notification", completed: true },
    ],
  },
  {
    id: "10",
    identifier: "BPM-5",
    name: "Deploy pipeline setup",
    description: "Configure Vercel deployment pipeline with preview and production environments.",
    column: "ready-to-deploy",
    labels: [{ name: "DevOps", color: "#eb5757" }],
    milestones: [
      { id: "m35", title: "Configure Vercel project", completed: true },
      { id: "m36", title: "Setup environment variables", completed: true },
      { id: "m37", title: "Add preview deployments", completed: true },
    ],
  },
  {
    id: "11",
    identifier: "BPM-4",
    name: "Real-time status updates",
    description:
      "Show live status updates on tickets as agents work, such as 'Agent is writing component...' or 'PR created'.",
    column: "production",
    labels: [
      { name: "Feature", color: "#9b51e0" },
      { name: "Improvement", color: "#27ae60" },
    ],
    milestones: [
      { id: "m38", title: "Setup WebSocket server", completed: true },
      { id: "m39", title: "Implement status event types", completed: true },
      { id: "m40", title: "Build client-side listener", completed: true },
      { id: "m41", title: "Render live status on cards", completed: true },
    ],
  },
  {
    id: "12",
    identifier: "BPM-3",
    name: "Project scaffolding",
    description: "Initialize the Next.js project with TypeScript, Tailwind, and base UI components.",
    column: "production",
    labels: [{ name: "Chore", color: "#95a2b3" }],
    milestones: [
      { id: "m42", title: "Create Next.js project", completed: true },
      { id: "m43", title: "Configure Tailwind CSS", completed: true },
      { id: "m44", title: "Install ShadCN components", completed: true },
    ],
  },
];

export default function Page() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const selectedColumn = selectedTask
    ? COLUMNS.find((c) => c.id === selectedTask.column)
    : undefined;

  return (
    <>
      <div className="grid h-screen grid-cols-5 gap-6 bg-muted/30 p-6">
        {COLUMNS.map((column) => {
          const columnTasks = DEMO_TASKS.filter(
            (task) => task.column === column.id,
          );
          return (
            <TaskColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              onTaskClick={setSelectedTask}
            />
          );
        })}
      </div>

      <TaskDetailSheet
        task={selectedTask}
        column={selectedColumn}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </>
  );
}
