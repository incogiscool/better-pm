"use client";

import { useState } from "react";
import type { Column, Task } from "@/components/task-column";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  updateTask,
  approveTask,
  addMilestone,
  toggleMilestone,
  removeMilestone,
  deleteTask,
} from "@/lib/api";

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
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [newMilestone, setNewMilestone] = useState("");

  if (!task) return null;

  const completedCount =
    task.milestones?.filter((m) => m.completed).length ?? 0;
  const totalCount = task.milestones?.length ?? 0;

  async function handleTitleSave() {
    if (!task) return;
    const name = titleValue.trim();
    if (name && name !== task.name) {
      await updateTask(task.id, { name });
    }
    setEditingTitle(false);
  }

  async function handleDescSave() {
    if (!task) return;
    await updateTask(task.id, { description: descValue });
    setEditingDesc(false);
  }

  async function handleAddMilestone() {
    if (!task) return;
    const title = newMilestone.trim();
    if (!title) return;
    await addMilestone(task.id, title);
    setNewMilestone("");
  }

  async function handleToggleMilestone(milestoneId: string) {
    if (!task) return;
    await toggleMilestone(task.id, milestoneId);
  }

  async function handleRemoveMilestone(milestoneId: string) {
    if (!task) return;
    await removeMilestone(task.id, milestoneId);
  }

  async function handleApprove() {
    if (!task) return;
    await approveTask(task.id);
  }

  async function handleDelete() {
    if (!task) return;
    await deleteTask(task.id);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetDescription>{task.identifier}</SheetDescription>
          {editingTitle ? (
            <Input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") setEditingTitle(false);
              }}
              onBlur={handleTitleSave}
              className="text-lg font-semibold"
            />
          ) : (
            <SheetTitle
              className="cursor-pointer hover:text-muted-foreground"
              onClick={() => {
                setTitleValue(task.name);
                setEditingTitle(true);
              }}
            >
              {task.name}
            </SheetTitle>
          )}
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

          {task.agentStatus && task.agentStatus !== "idle" && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Agent
              </span>
              <div className="flex items-center gap-2">
                <span className="size-2 animate-pulse rounded-full bg-orange-400" />
                <span className="text-sm capitalize">{task.agentStatus}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Description
            </span>
            {editingDesc ? (
              <Textarea
                autoFocus
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingDesc(false);
                }}
                onBlur={handleDescSave}
                rows={4}
              />
            ) : (
              <p
                className="cursor-pointer rounded p-2 text-sm leading-relaxed transition-colors hover:bg-muted/50"
                onClick={() => {
                  setDescValue(task.description ?? "");
                  setEditingDesc(true);
                }}
              >
                {task.description || "Click to add description..."}
              </p>
            )}
          </div>

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

          {(task.githubIssueUrl || task.prUrl) && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Links
              </span>
              <div className="flex gap-2">
                {task.githubIssueUrl && (
                  <a
                    href={task.githubIssueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    GitHub Issue
                  </a>
                )}
                {task.prUrl && (
                  <a
                    href={task.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    Pull Request
                  </a>
                )}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Milestones
              </span>
              {totalCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {completedCount}/{totalCount}
                </span>
              )}
            </div>

            {totalCount > 0 && (
              <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{
                    width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              {task.milestones?.map((milestone) => (
                <label
                  key={milestone.id}
                  className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={milestone.completed}
                    onCheckedChange={() =>
                      handleToggleMilestone(milestone.id)
                    }
                    className="shrink-0"
                  />
                  <span
                    className={
                      milestone.completed
                        ? "flex-1 text-sm text-muted-foreground line-through"
                        : "flex-1 text-sm"
                    }
                  >
                    {milestone.title}
                  </span>
                  <button
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveMilestone(milestone.id);
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add milestone..."
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddMilestone();
                }}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            {task.agentStatus === "idle" && (
              <Button size="sm" onClick={handleApprove}>
                Approve for Agent
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
