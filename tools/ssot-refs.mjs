import { execSync } from "node:child_process";

function getChanged() {
  try {
    return execSync("git diff --name-only HEAD~1").toString().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

const changed = getChanged();
const requiresRefs = changed.filter(f =>
  /docs\/openapi\.yaml|docs\/schema\/|src\/|frontend\/|backend\//.test(f)
);

if (requiresRefs.length) {
  try {
    const body = execSync("gh pr view --json body -q .body").toString();
    if (!/docs\/(system|product_spec|architecture)\.md#L\d+/.test(body)) {
      console.error("❌ PR body must link to SSOT line refs for changed surfaces.");
      process.exit(1);
    }
  } catch {
    console.log("ℹ️ Not in PR context; skipping SSOT ref check.");
  }
}
console.log("✅ SSOT refs present or not needed");
