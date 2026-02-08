"use client";

import { useState } from "react";
import { DndContext, type DragEndEvent, pointerWithin } from "@dnd-kit/core";
import type { Column, Task } from "@/components/task-column";
import { TaskColumn } from "@/components/task-column";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { useTaskSocket } from "@/hooks/use-task-socket";
import { updateTask } from "@/lib/api";

const COLUMNS: Column[] = [
  { id: "backlog", title: "Backlog", color: "#95a2b3", progress: 0 },
  { id: "active", title: "Active", color: "#f2994a", progress: 33 },
  { id: "in-review", title: "Awaiting Close", color: "#2f80ed", progress: 66 },
  { id: "production", title: "Production", color: "#9b51e0", progress: 100 },
];

export default function Page() {
  const { tasks, connected } = useTaskSocket();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const selectedTask = selectedTaskId
    ? (tasks.find((t) => t.id === selectedTaskId) ?? null)
    : null;

  const selectedColumn = selectedTask
    ? COLUMNS.find((c) => c.id === selectedTask.column)
    : undefined;

  const filteredTasks = filter
    ? tasks.filter(
        (t) =>
          t.name.toLowerCase().includes(filter.toLowerCase()) ||
          t.identifier.toLowerCase().includes(filter.toLowerCase()),
      )
    : tasks;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const task = active.data.current?.task as Task | undefined;
    if (!task) return;

    const newColumn = over.id as string;
    if (task.column === newColumn) return;

    await updateTask(task.id, { column: newColumn });
  }

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      <header className="flex items-center gap-4 border-b bg-background px-6 py-3">
        <h1 className="text-lg font-semibold">Better PM</h1>
        <div className="relative ml-auto">
          <input
            type="text"
            placeholder="Filter tasks..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 w-56 rounded-md border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`size-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
          />
          <span className="text-xs text-muted-foreground">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </header>

      <DndContext onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
        <div className="grid flex-1 grid-cols-4 gap-6 overflow-hidden p-6">
          {COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter(
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
      </DndContext>

      <TaskDetailSheet
        task={selectedTask}
        column={selectedColumn}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null);
        }}
      />
    </div>
  );
}
