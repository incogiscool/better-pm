import { handleWebhook } from "./routes/webhook";
import {
  handleGetTasks,
  handleGetTask,
  handleCreateTask,
  handleUpdateTask,
  handleDeleteTask,
  handleAddLabel,
  handleRemoveLabel,
  handleAddMilestone,
  handleToggleMilestone,
  handleRemoveMilestone,
  handleApproveTask,
} from "./routes/tasks";
import {
  handleGetEngineers,
  handleGetEngineer,
  handleCreateEngineer,
} from "./routes/engineers";
import { handleGetSessions, handleGetEvents } from "./routes/sessions";
import { wsManager } from "./lib/ws-manager";
import { route, matchRoute } from "./lib/router";

const PORT = parseInt(process.env.PORT || "3001");
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const routes = [
  route("POST", "/api/webhook/github", (req) =>
    handleWebhook(req, CORS_ORIGIN),
  ),

  route("GET", "/api/tasks", () => handleGetTasks(CORS_ORIGIN)),
  route("POST", "/api/tasks", (req) => handleCreateTask(req, CORS_ORIGIN)),
  route("GET", "/api/tasks/:id", (_req, params) =>
    handleGetTask(params["id"]!, CORS_ORIGIN),
  ),
  route("PATCH", "/api/tasks/:id", (req, params) =>
    handleUpdateTask(req, params, CORS_ORIGIN),
  ),
  route("DELETE", "/api/tasks/:id", (_req, params) =>
    handleDeleteTask(params, CORS_ORIGIN),
  ),

  route("POST", "/api/tasks/:id/approve", (_req, params) =>
    handleApproveTask(params, CORS_ORIGIN),
  ),
  route("POST", "/api/tasks/:id/labels", (req, params) =>
    handleAddLabel(req, params, CORS_ORIGIN),
  ),
  route("DELETE", "/api/tasks/:id/labels/:name", (_req, params) =>
    handleRemoveLabel(params, CORS_ORIGIN),
  ),

  route("POST", "/api/tasks/:id/milestones", (req, params) =>
    handleAddMilestone(req, params, CORS_ORIGIN),
  ),
  route("PATCH", "/api/tasks/:id/milestones/:mid", (_req, params) =>
    handleToggleMilestone(params, CORS_ORIGIN),
  ),
  route("DELETE", "/api/tasks/:id/milestones/:mid", (_req, params) =>
    handleRemoveMilestone(params, CORS_ORIGIN),
  ),

  route("GET", "/api/engineers", () => handleGetEngineers(CORS_ORIGIN)),
  route("POST", "/api/engineers", (req) =>
    handleCreateEngineer(req, CORS_ORIGIN),
  ),
  route("GET", "/api/engineers/:id", (_req, params) =>
    handleGetEngineer(params["id"]!, CORS_ORIGIN),
  ),

  route("GET", "/api/tasks/:id/sessions", (_req, params) =>
    handleGetSessions(params["id"]!, CORS_ORIGIN),
  ),
  route("GET", "/api/sessions/:id/events", (_req, params) =>
    handleGetEvents(params["id"]!, CORS_ORIGIN),
  ),
];

Bun.serve({
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url);
    const start = Date.now();

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === "/ws") {
      console.log("[ws] Upgrade request received");
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        console.error("[ws] Upgrade failed");
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
      return undefined;
    }

    const matched = matchRoute(routes, req.method, url.pathname);
    if (matched) {
      console.log(`[req] ${req.method} ${url.pathname}`);
      try {
        const res = await matched.handler(req, matched.params);
        console.log(`[res] ${req.method} ${url.pathname} -> ${res.status} (${Date.now() - start}ms)`);
        return res;
      } catch (err) {
        console.error(`[err] ${req.method} ${url.pathname} ->`, err);
        return Response.json(
          { error: "Internal server error" },
          { status: 500, headers: corsHeaders() },
        );
      }
    }

    console.warn(`[404] ${req.method} ${url.pathname}`);
    return new Response("Not Found", { status: 404 });
  },

  websocket: {
    open(ws) {
      console.log("[ws] Client connected");
      wsManager.addClient(ws);
    },
    close(ws) {
      console.log("[ws] Client disconnected");
      wsManager.removeClient(ws);
    },
    message() {},
  },
});

console.log(`[server] Backend running on http://localhost:${PORT}`);
