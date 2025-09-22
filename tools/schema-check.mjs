import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "docs/schema");
if (!fs.existsSync(ROOT)) {
  console.log("No docs/schema directory found.");
  process.exit(0);
}
const files = fs.readdirSync(ROOT).filter(f => f.endsWith(".json"));
if (!files.length) {
  console.log("No JSON schemas found in docs/schema.");
  process.exit(0);
}

let ok = true;
for (const f of files) {
  const p = path.join(ROOT, f);
  try {
    const content = JSON.parse(fs.readFileSync(p, "utf-8"));
    if (!content.$schema || !content.title) {
      console.error(`Schema ${f} missing $schema or title`);
      ok = false;
    }
  } catch (e) {
    console.error(`Invalid JSON in ${f}:`, e.message);
    ok = false;
  }
}
if (!ok) process.exit(1);
console.log("✅ JSON Schemas sanity OK");
