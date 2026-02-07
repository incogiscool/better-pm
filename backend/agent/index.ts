import { runAgent } from "./runner";
import { getTask, updateTask } from "../db/queries";
import { wsManager } from "../lib/ws-manager";

export async function triggerAgent(taskId: string): Promise<void> {
  const task = await getTask(taskId);
  if (!task) throw new Error("Task not found");

  const updated = await updateTask(taskId, {
    agentStatus: "working",
    column: "active",
  });
  if (updated) wsManager.broadcast({ type: "task:updated", task: updated });

  runAgent(
    taskId,
    task.name,
    task.description ?? task.name,
  ).catch(async (err) => {
    console.error(`Agent failed for task ${taskId}:`, err);
    const reverted = await updateTask(taskId, { agentStatus: "idle" });
    if (reverted) wsManager.broadcast({ type: "task:updated", task: reverted });
  });
}
