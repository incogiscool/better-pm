import { getSessionsForTask, getEventsForSession } from "../db/queries";

export async function handleGetSessions(
  taskId: string,
  corsOrigin: string,
): Promise<Response> {
  console.log("[sessions] GET sessions for task:", taskId);
  const sessions = await getSessionsForTask(taskId);
  console.log(`[sessions] Found ${sessions.length} sessions`);
  return Response.json(
    { sessions },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleGetEvents(
  sessionId: string,
  corsOrigin: string,
): Promise<Response> {
  console.log("[sessions] GET events for session:", sessionId);
  const events = await getEventsForSession(sessionId);
  console.log(`[sessions] Found ${events.length} events`);
  return Response.json(
    { events },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}
