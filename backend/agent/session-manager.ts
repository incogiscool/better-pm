import {
  createSession,
  addEvent,
  endSession,
} from "../db/queries";
import { wsManager } from "../lib/ws-manager";
import type { AgentEvent } from "../lib/types";

export class SessionManager {
  private sessionId: string | null = null;
  private taskId: string;

  constructor(taskId: string) {
    this.taskId = taskId;
  }

  async start(): Promise<string> {
    const session = await createSession(this.taskId);
    this.sessionId = session.id;
    await this.emit("thinking", "Starting agent session...");
    return session.id;
  }

  async emit(
    type: string,
    message: string,
    metadata?: unknown,
  ): Promise<AgentEvent> {
    if (!this.sessionId) throw new Error("Session not started");

    const event = await addEvent(this.sessionId, type, message, metadata);
    wsManager.broadcast({
      type: "agent:event",
      taskId: this.taskId,
      event,
    });
    return event;
  }

  async complete(): Promise<void> {
    if (!this.sessionId) return;
    await endSession(this.sessionId, "completed");
    await this.emit("completed", "Agent session completed");
  }

  async fail(error: string): Promise<void> {
    if (!this.sessionId) return;
    await this.emit("error", error);
    await endSession(this.sessionId, "failed");
  }
}
