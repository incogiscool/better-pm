import { handleWebhook } from "./routes/webhook";
import { handleGetTasks, handleGetTask } from "./routes/tasks";
import { wsManager } from "./lib/ws-manager";

const PORT = parseInt(process.env.PORT || "3001");
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

Bun.serve({
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
      return undefined;
    }

    if (req.method === "POST" && url.pathname === "/api/webhook/github") {
      return handleWebhook(req, CORS_ORIGIN);
    }

    if (req.method === "GET" && url.pathname === "/api/tasks") {
      return handleGetTasks(CORS_ORIGIN);
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/tasks/")) {
      const id = url.pathname.split("/api/tasks/")[1];
      if (id) return handleGetTask(id, CORS_ORIGIN);
    }

    return new Response("Not Found", { status: 404 });
  },

  websocket: {
    open(ws) {
      wsManager.addClient(ws);
    },
    close(ws) {
      wsManager.removeClient(ws);
    },
    message() {},
  },
});

console.log(`Backend running on http://localhost:${PORT}`);
