import type { Task } from "./types";

export const store = new Map<string, Task>();

export function getAllTasks(): Task[] {
  return Array.from(store.values());
}

export function getTask(id: string): Task | undefined {
  return store.get(id);
}
