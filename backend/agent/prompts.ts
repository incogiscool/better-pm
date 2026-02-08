export function buildRefinementPrompt(
  taskName: string,
  rawDescription: string,
  repoStructure: string,
): string {
  return `You are a senior technical PM. A user submitted a casual task description. Refine it into a clear, concise implementation spec — max 1-2 paragraphs.

## Repo Structure
${repoStructure}

## Task: ${taskName}

## User's Description
${rawDescription}

---

Write a concise spec that covers: what to build, the key requirements, and which files to modify or create. Keep it to 1-2 focused paragraphs — no headers, no bullet-heavy lists, no fluff. Just a clear description an engineer can implement from.`;
}

export function buildSystemPrompt(repoStructure: string): string {
  return `You are an expert software engineer working on a codebase. You implement tasks by reading existing code, understanding patterns, and writing clean code that follows the project's conventions.

Repository structure:
${repoStructure}

Rules:
- Follow existing code patterns and conventions
- Write clean, readable TypeScript/JavaScript
- Do not add unnecessary comments
- Do not add emoji to code
- Keep changes minimal and focused on the task
- If a task requires multiple files, implement all of them

You have access to tools for reading files, writing files, and executing commands.`;
}

export function buildTaskPrompt(
  taskName: string,
  taskDescription: string,
): string {
  return `Implement the following task:

**${taskName}**

${taskDescription}

Read the relevant files first, understand the codebase, then implement the changes.`;
}
