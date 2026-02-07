"use client";

import type { Column, Task } from "@/components/task-column";
import { TaskColumn } from "@/components/task-column";

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
    column: "backlog",
    labels: [{ name: "Feature", color: "#9b51e0" }],
  },
  {
    id: "2",
    identifier: "BPM-13",
    name: "Create ticket API endpoint",
    column: "backlog",
    labels: [{ name: "Backend", color: "#2f80ed" }],
  },
  {
    id: "3",
    identifier: "BPM-12",
    name: "Knowledge base integration",
    column: "backlog",
    labels: [{ name: "Feature", color: "#9b51e0" }],
  },
  {
    id: "4",
    identifier: "BPM-11",
    name: "Design kanban board layout",
    column: "active",
    labels: [{ name: "Design", color: "#f2994a" }],
  },
  {
    id: "5",
    identifier: "BPM-10",
    name: "Implement GitHub issue sync",
    column: "active",
    labels: [
      { name: "Feature", color: "#9b51e0" },
      { name: "Backend", color: "#2f80ed" },
    ],
  },
  {
    id: "6",
    identifier: "BPM-9",
    name: "PR review automation",
    column: "active",
    labels: [{ name: "Improvement", color: "#27ae60" }],
  },
  {
    id: "7",
    identifier: "BPM-8",
    name: "Add agent session viewer",
    column: "in-review",
    labels: [{ name: "Feature", color: "#9b51e0" }],
  },
  {
    id: "8",
    identifier: "BPM-7",
    name: "Setup Neon database schema",
    column: "in-review",
    labels: [{ name: "Backend", color: "#2f80ed" }],
  },
  {
    id: "9",
    identifier: "BPM-6",
    name: "Engineer assignment logic",
    column: "ready-to-deploy",
    labels: [{ name: "Feature", color: "#9b51e0" }],
  },
  {
    id: "10",
    identifier: "BPM-5",
    name: "Deploy pipeline setup",
    column: "ready-to-deploy",
    labels: [{ name: "DevOps", color: "#eb5757" }],
  },
  {
    id: "11",
    identifier: "BPM-4",
    name: "Real-time status updates",
    column: "production",
    labels: [
      { name: "Feature", color: "#9b51e0" },
      { name: "Improvement", color: "#27ae60" },
    ],
  },
  {
    id: "12",
    identifier: "BPM-3",
    name: "Project scaffolding",
    column: "production",
    labels: [{ name: "Chore", color: "#95a2b3" }],
  },
];

export default function Page() {
  return (
    <div className="grid h-screen grid-cols-5 gap-6 bg-muted/30 p-6">
      {COLUMNS.map((column) => {
        const columnTasks = DEMO_TASKS.filter(
          (task) => task.column === column.id,
        );
        return (
          <TaskColumn key={column.id} column={column} tasks={columnTasks} />
        );
      })}
    </div>
  );
}
