// Quick parser smoke test — run with: node --input-type=module < test-parser.mjs
// Or: node test-parser.mjs (after saving as .mjs)

// Inline the core logic without TS to test quickly
// We test via ts-node / tsx since the source is TypeScript

import { execSync } from "child_process";
import { writeFileSync } from "fs";

const SAMPLE = `Name: Nguyễn Hữu Huấn - 2026/04/14 (Sáng + Chiều)
Task:
1. [CD - UI] Xoá tài khoản (100%)
2. Fix issue list (7 issues)
ETC: N/A
Have trouble: N/A
Supported: N/A
Need support: N/A
Next task:  Fix issue list
Link: 
1. https://www.leansolutions.vn/Project_Task/5650
2. https://www.leansolutions.vn/Project_Task/5649

Name: Vương Thế Kiệt - 2026/04/14 (Sáng + Chiều)
Task: [ CD - AI ] Chat bot 
-feature: Nhớ được thông tin user (đáp ứng)
-fix bug chatbot (2 bugs)
ETC: N/A
Have trouble: N/A
Supported: N/A
Need support: N/A
Next task: [ CD - AI ] Chat bot  Test + Training tiếp cho chatbot
Link: https://leansolutions.vn/Project_Task/5623

Name: Võ Hoàng Nhật Nam - 2026/04/14 (Sáng)
Task:
•  Retest UI App Online (100% - DL: 14/04 -  71/71 case - Log 4 issue - 1 đề xuất)
•  Điều chỉnh Figma phần select màu phân loại SP (100% - DL: 14/04)
ETC: N/A
Have trouble: N/A
Supported: N/A
Need support: N/A
Next task: N/A
Link:
https://www.leansolutions.vn/Project_Task/5666
https://www.leansolutions.vn/Project_Task/5652`;

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
    console.log("  " + (ti+1) + ". [" + (t.moduleTag ?? "no-tag") + "] " + t.title + "  " + (t.progress !== undefined ? t.progress + "%" : "no %"));
  });
  console.log("Issues:    ", r.issues ?? "N/A");
  console.log("NextTasks: ", r.nextTasks ?? "N/A");
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
