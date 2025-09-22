import { execSync } from "node:child_process";

function getPRBody() {
  try {
    return execSync("gh pr view --json body -q .body").toString();
  } catch {
    return "";
  }
}

const body = getPRBody();
if (!/Acceptance Criteria/i.test(body)) {
  console.log("🟨 Suggestion: add an **Acceptance Criteria** checklist.");
}
try {
  const base = process.env.GITHUB_BASE_REF || "main";
  const changed = execSync(`git fetch origin ${base} && git diff --name-only origin/${base}...HEAD`).toString();
  if (/docs\/openapi\.yaml/.test(changed)) {
    console.log("🟪 OpenAPI changed → regenerate client in /packages/lib and add an ADR.");
  }
  if (/src\/|frontend\//.test(changed)) {
    console.log("🎨 UI changed → run `npm run tokens:check` and attach screenshots or Storybook.");
  }
} catch {}
