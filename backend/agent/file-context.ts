import { Octokit } from "octokit";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

interface TreeItem {
  path: string;
  type: string;
}

export async function getRepoStructure(): Promise<string> {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return "(Repository structure unavailable - GitHub not configured)";
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  const { data } = await octokit.rest.git.getTree({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    tree_sha: "HEAD",
    recursive: "true",
  });

  const files = (data.tree as TreeItem[])
    .filter((item) => item.type === "blob")
    .filter((item) => !item.path.startsWith("node_modules/"))
    .filter((item) => !item.path.startsWith(".git/"))
    .filter((item) => !item.path.includes("bun.lock"))
    .map((item) => item.path);

  return files.join("\n");
}

export async function readFile(path: string): Promise<string | null> {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) return null;

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path,
    });

    if ("content" in data && data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
}
