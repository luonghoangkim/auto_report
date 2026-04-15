/**
 * Run: npx tsx scripts/test-parser.ts
 */
import { splitIntoMemberBlocks } from "../src/lib/parser/splitReports";
import { extractMemberFields }   from "../src/lib/parser/extractFields";

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

const blocks = splitIntoMemberBlocks(SAMPLE);
console.log(`\n✅ SPLIT: ${blocks.length} blocks detected\n`);

let allOk = true;

for (const [i, block] of blocks.entries()) {
  const r = extractMemberFields(block);
  const ok = r.memberName !== "Unknown" && r.reportDate && r.tasks.length > 0;
  if (!ok) allOk = false;

  console.log(`${"─".repeat(60)}`);
  console.log(`Member ${i + 1}: ${ok ? "✅" : "❌"}`);
  console.log(`  Name:       ${r.memberName}`);
  console.log(`  Date:       ${r.reportDate ?? "❌ NOT DETECTED"}`);
  console.log(`  Session:    ${r.session ?? "(none)"}`);
  console.log(`  Confidence: ${r.confidence}`);
  console.log(`  Tasks (${r.tasks.length}):`);
  if (r.tasks.length === 0) console.log("    ❌ NO TASKS DETECTED");
  r.tasks.forEach((t, ti) => {
    const tag      = t.moduleTag ? `[${t.moduleTag}]` : "[no-tag]";
    const progress = t.progress !== undefined ? `${t.progress}%` : "no %";
    console.log(`    ${ti + 1}. ${tag} "${t.title}"  →  ${progress}`);
  });
  console.log(`  Issues:     ${r.issues ?? "N/A"}`);
  console.log(`  NextTasks:  ${r.nextTasks ?? "N/A"}`);
  console.log(`  Links:      ${r.links?.length ?? 0}`);
}

console.log(`\n${"═".repeat(60)}`);
console.log(allOk ? "✅ ALL MEMBERS PARSED CORRECTLY" : "❌ SOME MEMBERS HAVE ISSUES");
