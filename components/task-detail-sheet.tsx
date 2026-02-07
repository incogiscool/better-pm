"use client";

import type { Column, Task } from "@/components/task-column";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface TaskDetailSheetProps {
  task: Task | null;
  column?: Column;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailSheet({
  task,
  column,
  open,
  onOpenChange,
}: TaskDetailSheetProps) {
  if (!task) return null;

  const completedCount =
    task.milestones?.filter((m) => m.completed).length ?? 0;
  const totalCount = task.milestones?.length ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetDescription>{task.identifier}</SheetDescription>
          <SheetTitle>{task.name}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4">
          {column && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Status
              </span>
              <Badge variant="secondary" className="w-fit gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                {column.title}
              </Badge>
            </div>
          )}

          {task.description && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Description
              </span>
              <p className="text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Labels
              </span>
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
            </div>
          )}

          {task.milestones && task.milestones.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Milestones
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {completedCount}/{totalCount}
                  </span>
                </div>

                <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  {task.milestones.map((milestone) => (
                    <label
                      key={milestone.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={milestone.completed}
                        disabled
                        className="shrink-0"
                      />
                      <span
                        className={
                          milestone.completed
                            ? "text-sm text-muted-foreground line-through"
                            : "text-sm"
                        }
                      >
                        {milestone.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
