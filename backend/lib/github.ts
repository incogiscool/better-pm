import { Octokit } from "octokit";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

function getOctokit() {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is required");
  return new Octokit({ auth: GITHUB_TOKEN });
}

function getRepoParams() {
  if (!GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error("GITHUB_OWNER and GITHUB_REPO are required");
  }
  return { owner: GITHUB_OWNER, repo: GITHUB_REPO };
}

export async function createIssue(
  title: string,
  body: string,
  labels?: string[],
) {
  console.log("[github] Creating issue:", { title, labels });
  const octokit = getOctokit();
  const repo = getRepoParams();
  console.log("[github] Using repo:", `${repo.owner}/${repo.repo}`);
  try {
    const response = await octokit.rest.issues.create({
      ...repo,
      title,
      body,
      labels,
    });
    console.log("[github] Issue created successfully:", { number: response.data.number, url: response.data.html_url });
    return response.data;
  } catch (err) {
    console.error("[github] Issue creation FAILED:", err);
    throw err;
  }
}

export async function updateIssue(
  issueNumber: number,
  updates: { title?: string; body?: string; state?: "open" | "closed"; labels?: string[] },
) {
  console.log("[github] Updating issue:", issueNumber, updates);
  const octokit = getOctokit();
  const repo = getRepoParams();
  const response = await octokit.rest.issues.update({
    ...repo,
    issue_number: issueNumber,
    ...updates,
  });
  console.log("[github] Issue updated:", issueNumber);
  return response.data;
}

export async function closeIssue(issueNumber: number) {
  console.log("[github] Closing issue:", issueNumber);
  return updateIssue(issueNumber, { state: "closed" });
}

export async function createBranch(baseBranch: string, newBranch: string) {
  console.log("[github] Creating branch:", newBranch, "from", baseBranch);
  const octokit = getOctokit();
  const repo = getRepoParams();

  const { data: ref } = await octokit.rest.git.getRef({
    ...repo,
    ref: `heads/${baseBranch}`,
  });
  console.log("[github] Base branch SHA:", ref.object.sha);

  const response = await octokit.rest.git.createRef({
    ...repo,
    ref: `refs/heads/${newBranch}`,
    sha: ref.object.sha,
  });
  console.log("[github] Branch created:", newBranch);
  return response.data;
}

export async function createPR(
  title: string,
  body: string,
  head: string,
  base: string,
) {
  console.log("[github] Creating PR:", { title, head, base });
  const octokit = getOctokit();
  const repo = getRepoParams();
  const response = await octokit.rest.pulls.create({
    ...repo,
    title,
    body,
    head,
    base,
  });
  console.log("[github] PR created:", { number: response.data.number, url: response.data.html_url });
  return response.data;
}

export async function getPRStatus(prNumber: number) {
  console.log("[github] Getting PR status:", prNumber);
  const octokit = getOctokit();
  const repo = getRepoParams();
  const response = await octokit.rest.pulls.get({
    ...repo,
    pull_number: prNumber,
  });
  console.log("[github] PR status:", { number: prNumber, state: response.data.state });
  return response.data;
}
