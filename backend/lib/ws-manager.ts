import type { ServerWebSocket } from "bun";
import type { WsMessage } from "./types";
import { getAllTasks } from "../db/queries";

class WsManager {
  private clients = new Set<ServerWebSocket<unknown>>();

  async addClient(ws: ServerWebSocket<unknown>) {
    this.clients.add(ws);
    console.log(`[ws] Client added, total: ${this.clients.size}`);
    const tasks = await getAllTasks();
    const initMessage: WsMessage = { type: "tasks:init", tasks };
    ws.send(JSON.stringify(initMessage));
    console.log(`[ws] Sent init with ${tasks.length} tasks`);
  }

  removeClient(ws: ServerWebSocket<unknown>) {
    this.clients.delete(ws);
    console.log(`[ws] Client removed, total: ${this.clients.size}`);
  }

  broadcast(message: WsMessage) {
    const data = JSON.stringify(message);
    console.log(`[ws] Broadcasting ${message.type} to ${this.clients.size} clients`);
    for (const client of this.clients) {
      client.send(data);
    }
  }
}

export const wsManager = new WsManager();
