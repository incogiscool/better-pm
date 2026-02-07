"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

export function TaskColumn({
  column,
  tasks,
  className,
  onTaskClick,
}: TaskColumnProps) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex items-center gap-2 pb-3">
        <StatusIcon color={column.color} progress={column.progress} />
        <h2 className="text-sm font-medium">{column.title}</h2>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-px">
          {tasks.map((task) => (
            <Card
              key={task.id}
              size="sm"
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => onTaskClick?.(task)}
            >
              <CardHeader>
                <span className="text-xs text-muted-foreground">
                  {task.identifier}
                </span>
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
