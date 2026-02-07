import type { ServerWebSocket } from "bun";
import type { WsMessage } from "./types";
import { getAllTasks } from "./store";

class WsManager {
  private clients = new Set<ServerWebSocket<unknown>>();

  addClient(ws: ServerWebSocket<unknown>) {
    this.clients.add(ws);
    const initMessage: WsMessage = { type: "tasks:init", tasks: getAllTasks() };
    ws.send(JSON.stringify(initMessage));
  }

  removeClient(ws: ServerWebSocket<unknown>) {
    this.clients.delete(ws);
  }

  broadcast(message: WsMessage) {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      client.send(data);
    }
  }
}

export const wsManager = new WsManager();
