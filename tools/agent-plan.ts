/**
 * Agent Plan Tool: helps structure tasks with SSOT references
 * Usage: npm run agent:plan
 */

import { execSync } from "node:child_process";

interface PlanItem {
  task: string;
  role: "planner" | "architect" | "web" | "api" | "qa";
  files: string[];
  ssotRef?: string;
}

function getCurrentBranch(): string {
  try {
    return execSync("git branch --show-current").toString().trim();
  } catch {
    return "main";
  }
}

function getChangedFiles(): string[] {
  try {
    const base = "main";
    return execSync(`git diff --name-only ${base}...HEAD`)
      .toString()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function generatePlan(): PlanItem[] {
  const changedFiles = getChangedFiles();
  const plan: PlanItem[] = [];

  // Analyze changed files and suggest plan items
  if (changedFiles.some(f => f.startsWith("docs/"))) {
    plan.push({
      task: "Update documentation",
      role: "planner",
      files: changedFiles.filter(f => f.startsWith("docs/")),
      ssotRef: "docs/system.md#L1"
    });
  }

  if (changedFiles.some(f => f.startsWith("src/") || f.startsWith("frontend/"))) {
    plan.push({
      task: "Update UI components",
      role: "web",
      files: changedFiles.filter(f => f.startsWith("src/") || f.startsWith("frontend/")),
      ssotRef: "docs/architecture.md#L45"
    });
  }

  if (changedFiles.some(f => f.startsWith("backend/"))) {
    plan.push({
      task: "Update API endpoints",
      role: "api",
      files: changedFiles.filter(f => f.startsWith("backend/")),
      ssotRef: "docs/architecture.md#L80"
    });
  }

  if (changedFiles.some(f => f.startsWith("shared/"))) {
    plan.push({
      task: "Update shared types/utils",
      role: "architect",
      files: changedFiles.filter(f => f.startsWith("shared/")),
      ssotRef: "docs/architecture.md#L120"
    });
  }

  return plan;
}

function main() {
  console.log("🤖 Agent Plan Generator");
  console.log("======================");

  const branch = getCurrentBranch();
  console.log(`Current branch: ${branch}`);

  const plan = generatePlan();

  if (plan.length === 0) {
    console.log("✅ No changes detected. Start by modifying files to generate a plan.");
    return;
  }

  console.log("\n📋 Suggested Plan:");
  console.log("==================");

  plan.forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.task}`);
    console.log(`   Role: ${item.role}`);
    console.log(`   Files: ${item.files.join(", ")}`);
    if (item.ssotRef) {
      console.log(`   SSOT Ref: ${item.ssotRef}`);
    }
  });

  console.log("\n💡 Next Steps:");
  console.log("1. Review the plan above");
  console.log("2. Ensure SSOT references are accurate");
  console.log("3. Use 'npm run agent:run' to execute with role constraints");
  console.log("4. Run 'npm run tokens:check' before committing UI changes");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}