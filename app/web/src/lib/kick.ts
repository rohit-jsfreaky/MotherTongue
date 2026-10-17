import "server-only";

/**
 * Wake the worker (a GitHub Actions workflow that drains the job queue). Fire-and-forget: if it fails or no token is
 * configured, the workflow's 5-minute schedule picks the job up anyway — the app never waits on the worker.
 */
export async function kickWorker() {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) return;
  const repo = process.env.WORKER_REPO ?? "rohit-jsfreaky/mothertongue";
  try {
    await fetch(`https://api.github.com/repos/${repo}/actions/workflows/worker.yml/dispatches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      body: JSON.stringify({ ref: "main" }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // The schedule is the safety net.
  }
}
