const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function createTask(data: {
  name: string;
  description?: string;
  column?: string;
}) {
  return request<{ task: unknown }>("POST", "/api/tasks", data);
}

export async function updateTask(
  id: string,
  data: Record<string, unknown>,
) {
  return request<{ task: unknown }>("PATCH", `/api/tasks/${id}`, data);
}

export async function deleteTask(id: string) {
  return request<{ success: boolean }>("DELETE", `/api/tasks/${id}`);
}

export async function approveTask(id: string) {
  return request<{ task: unknown }>("POST", `/api/tasks/${id}/approve`);
}

export async function addMilestone(taskId: string, title: string) {
  return request<{ milestone: unknown }>(
    "POST",
    `/api/tasks/${taskId}/milestones`,
    { title },
  );
}

export async function toggleMilestone(taskId: string, milestoneId: string) {
  return request<{ milestone: unknown }>(
    "PATCH",
    `/api/tasks/${taskId}/milestones/${milestoneId}`,
  );
}

export async function removeMilestone(taskId: string, milestoneId: string) {
  return request<{ task: unknown }>(
    "DELETE",
    `/api/tasks/${taskId}/milestones/${milestoneId}`,
  );
}
