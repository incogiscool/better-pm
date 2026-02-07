"use client";

import { useState } from "react";
import type { Column } from "@/components/task-column";
import { TaskColumn } from "@/components/task-column";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { useTaskSocket } from "@/hooks/use-task-socket";

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

export default function Page() {
  const { tasks } = useTaskSocket();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = selectedTaskId
    ? (tasks.find((t) => t.id === selectedTaskId) ?? null)
    : null;

  const selectedColumn = selectedTask
    ? COLUMNS.find((c) => c.id === selectedTask.column)
    : undefined;

  return (
    <>
      <div className="grid h-screen grid-cols-5 gap-6 bg-muted/30 p-6">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter(
            (task) => task.column === column.id,
          );
          return (
            <TaskColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              onTaskClick={(task) => setSelectedTaskId(task.id)}
            />
          );
        })}
      </div>

      <TaskDetailSheet
        task={selectedTask}
        column={selectedColumn}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null);
        }}
      />
    </>
  );
}
