import fs from "node:fs";
import path from "node:path";

const ALLOWED = ["#5a3cf4", "#cbc0ff"]; // brand palette
const BAD_PATTERNS = [/#[0-9a-f]{6}/i, /box-shadow/i, /linear-gradient/i];

function walk(dir, acc=[]) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const roots = ["src", "frontend/src", "backend/src", "shared"].filter(fs.existsSync);
const files = roots.flatMap(r => walk(r)).filter(f => /\.(css|ts|tsx)$/.test(f));

const offenders = [];
for (const f of files) {
  const txt = fs.readFileSync(f, "utf-8");
  for (const rx of BAD_PATTERNS) {
    const m = txt.match(rx);
    if (m && !ALLOWED.some(c => txt.includes(c))) {
      offenders.push(f);
      break;
    }
  }
}

if (offenders.length) {
  console.error("❌ rogue style tokens:", offenders.slice(0, 50));
  process.exit(1);
}
console.log("✅ brand tokens OK");
