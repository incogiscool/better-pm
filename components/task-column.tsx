"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { createTask } from "@/lib/api";

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
  githubIssueUrl?: string;
  prUrl?: string;
  branchName?: string;
  agentStatus?: string;
  assignedEngineerId?: string;
}

export interface Column {
  id: string;
  title: string;
  color: string;
  progress: number;
}

interface TaskColumnProps {
  column: Column;
  tasks: Task[];
  className?: string;
  onTaskClick?: (task: Task) => void;
}

function StatusIcon({ color, progress }: { color: string; progress: number }) {
  const radius = 6;
  const circumference = 2 * Math.PI * radius;

  if (progress >= 100) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill={color} />
        <path
          d="M5.5 8L7.5 10L11 6"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle
        cx="8"
        cy="8"
        r={radius}
        stroke={color}
        strokeWidth="1.5"
        opacity={progress === 0 ? 1 : 0.3}
      />
      {progress > 0 && (
        <circle
          cx="8"
          cy="8"
          r={radius}
          stroke={color}
          strokeWidth="2"
          strokeDasharray={`${(progress / 100) * circumference} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 8 8)"
        />
      )}
    </svg>
  );
}

function DraggableTaskCard({
  task,
  onTaskClick,
}: {
  task: Task;
  onTaskClick?: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: { task } });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card
        size="sm"
        className={cn(
          "cursor-pointer transition-colors hover:bg-accent/50",
          isDragging && "opacity-50",
        )}
        onClick={() => onTaskClick?.(task)}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {task.identifier}
            </span>
            {task.agentStatus && task.agentStatus !== "idle" && (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <span className="size-1.5 animate-pulse rounded-full bg-orange-400" />
                {task.agentStatus === "awaiting-close"
                  ? "awaiting"
                  : task.agentStatus}
              </span>
            )}
          </div>
          <CardTitle>{task.name}</CardTitle>
        </CardHeader>
        {task.labels && task.labels.length > 0 && (
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {task.labels.map((label) => (
                <Badge
                  key={label.name}
                  variant="outline"
                  className="gap-1.5 text-xs font-normal"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function InlineCreateForm({
  columnId,
  onDone,
}: {
  columnId: string;
  onDone: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  async function handleSubmit() {
    const name = value.trim();
    if (!name) {
      onDone();
      return;
    }
    await createTask({ name, column: columnId });
    setValue("");
    onDone();
  }

  return (
    <Card size="sm" className="mb-2">
      <CardHeader>
        <Input
          ref={inputRef}
          autoFocus
          placeholder="Task name..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") onDone();
          }}
          onBlur={handleSubmit}
          className="h-7 border-none p-0 text-sm shadow-none focus-visible:ring-0"
        />
      </CardHeader>
    </Card>
  );
}

export function TaskColumn({
  column,
  tasks,
  className,
  onTaskClick,
}: TaskColumnProps) {
  const [creating, setCreating] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-0 flex-col rounded-lg transition-colors",
        isOver && "bg-accent/30",
        className,
      )}
    >
      <div className="flex items-center gap-2 pb-3">
        <StatusIcon color={column.color} progress={column.progress} />
        <h2 className="text-sm font-medium">{column.title}</h2>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
        <button
          className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setCreating(true)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-px">
          {creating && (
            <InlineCreateForm
              columnId={column.id}
              onDone={() => setCreating(false)}
            />
          )}
          {tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
