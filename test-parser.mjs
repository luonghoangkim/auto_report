// Quick parser smoke test — run with: node --input-type=module < test-parser.mjs
// Or: node test-parser.mjs (after saving as .mjs)

// Inline the core logic without TS to test quickly
// We test via ts-node / tsx since the source is TypeScript

import { execSync } from "child_process";
import { writeFileSync } from "fs";

const SAMPLE = `Name: Hoàng Kim Lương - 2026/04/16 (Sáng + Chiều)
Tasks:
1. [ CD - UI ] Thiết kế giao diện Tìm kiếm
   - Progress: 80%
   - Deadline: 03/04
2. Support member
   - Description: Hỗ trợ debug UI
3. [ UTE ] App Đại lý
   - Bugs: 3 (Critical: 0 | Major: 2 | Minor: 1)
   - Fixed: 5
   - Open: 4
   - Progress: 60%
   - Deadline: 02/04
Have trouble: Có nguy cơ chậm task Chatbot 1 ngày nếu không clarify thêm scope
Supported: N/A
Need support: N/A
Next task: Continue - [ CD - UI ] Thiết kế giao diện Tìm kiếm
Link:
1. https://leansolutions.vn/Project_Task/5601`;

// Write a tiny runner script
const runnerCode = `
import { splitIntoMemberBlocks } from "./src/lib/parser/splitReports.js";
import { extractMemberFields }   from "./src/lib/parser/extractFields.js";

const sample = \`${SAMPLE.replace(/`/g, "\\`")}\`;

const blocks = splitIntoMemberBlocks(sample);
console.log("\\n=== SPLIT: " + blocks.length + " blocks ===");

for (const [i, block] of blocks.entries()) {
  const r = extractMemberFields(block);
  console.log("\\n--- Member", i + 1, "---");
  console.log("Name:      ", r.memberName);
  console.log("Date:      ", r.reportDate ?? "(not detected)");
  console.log("Session:   ", r.session ?? "(none)");
  console.log("Confidence:", r.confidence);
  console.log("Tasks (" + r.tasks.length + "):");
  r.tasks.forEach((t, ti) => {
    console.log("  " + (ti+1) + ". [" + (t.projectTag ?? "no-tag") + "] " + t.title + "  " + (t.progress !== undefined ? t.progress + "%" : "no %"));
  });
  console.log("Trouble:   ", r.haveTrouble ?? "N/A");
  console.log("NextTask:  ", r.nextTask ?? "N/A");
  console.log("Links:     ", r.links.length);
}
`;

writeFileSync("/tmp/autoreport-test-runner.ts", runnerCode);

try {
  const result = execSync(
    "cd /Users/hoangluong/Documents/MyMac/AutoReport && npx tsx /tmp/autoreport-test-runner.ts",
    { encoding: "utf8", timeout: 30000 }
  );
  console.log(result);
} catch (e) {
  console.error("Error:", e.stdout || e.message);
}
