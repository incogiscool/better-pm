import { getAllTasks, getTask } from "../lib/store";

export function handleGetTasks(corsOrigin: string): Response {
  return Response.json(
    { tasks: getAllTasks() },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export function handleGetTask(id: string, corsOrigin: string): Response {
  const task = getTask(id);
  if (!task) {
    return Response.json(
      { error: "Task not found" },
      { status: 404, headers: { "Access-Control-Allow-Origin": corsOrigin } },
    );
  }
  return Response.json(
    { task },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}
