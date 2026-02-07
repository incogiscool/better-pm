const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  console.log(`[bot:api] ${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[bot:api] ${method} ${path} FAILED (${res.status}):`, text);
    throw new Error(`API ${method} ${path} failed (${res.status}): ${text}`);
  }

  const data = await res.json() as T;
  console.log(`[bot:api] ${method} ${path} -> ${res.status} OK`);
  return data;
}

export interface TaskResponse {
  id: string;
  identifier: string;
  name: string;
  description?: string;
  column: string;
  labels?: { name: string; color: string }[];
  milestones?: { id: string; title: string; completed: boolean }[];
  githubIssueUrl?: string;
  prUrl?: string;
  agentStatus?: string;
}

export async function getTasks(): Promise<{ tasks: TaskResponse[] }> {
  return request("GET", "/api/tasks");
}

export async function getTask(
  id: string,
): Promise<{ task: TaskResponse }> {
  return request("GET", `/api/tasks/${id}`);
}

export async function createTask(data: {
  name: string;
  description?: string;
  column?: string;
  labels?: { name: string; color: string }[];
}): Promise<{ task: TaskResponse }> {
  return request("POST", "/api/tasks", data);
}

export async function updateTask(
  id: string,
  data: Record<string, unknown>,
): Promise<{ task: TaskResponse }> {
  return request("PATCH", `/api/tasks/${id}`, data);
}

export async function approveTask(
  id: string,
): Promise<{ task: TaskResponse }> {
  return request("POST", `/api/tasks/${id}/approve`);
}

export interface EngineerResponse {
  id: string;
  name: string;
  email: string;
  discordId?: string;
  githubUsername?: string;
  skills?: string[];
}

export async function getEngineers(): Promise<{
  engineers: EngineerResponse[];
}> {
  return request("GET", "/api/engineers");
}

export async function createEngineer(data: {
  name: string;
  email: string;
  discordId?: string;
  githubUsername?: string;
  skills?: string[];
}): Promise<{ engineer: EngineerResponse }> {
  return request("POST", "/api/engineers", data);
}
