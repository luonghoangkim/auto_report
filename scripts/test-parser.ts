/**
 * Run: npx tsx scripts/test-parser.ts
 */
import { splitIntoMemberBlocks } from "../src/lib/parser/splitReports";
import { extractMemberFields }   from "../src/lib/parser/extractFields";

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
1. https://leansolutions.vn/Project_Task/5601

Name: Võ Hoàng Nhật Nam - 2026/04/16 (Sáng)
Tasks:
1. [ CD - UI ] Retest UI App Online
   - Progress: 100%
   - Deadline: 16/04
Have trouble: N/A
Supported: N/A
Need support: Cần confirm scope chatbot
Next task: [ CD - UI ] Điều chỉnh Figma
Link:
1. https://leansolutions.vn/Project_Task/5666`;

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
    const tag      = t.projectTag ? `${t.projectTag}` : "[no-tag]";
    const progress = t.progress !== undefined ? `${t.progress}%` : "no %";
    console.log(`    ${ti + 1}. ${tag} "${t.title}"  →  ${progress}`);
  });
  console.log(`  Trouble:    ${r.haveTrouble ?? "N/A"}`);
  console.log(`  NextTask:   ${r.nextTask ?? "N/A"}`);
  console.log(`  Links:      ${r.links?.length ?? 0}`);
}

console.log(`\n${"═".repeat(60)}`);
console.log(allOk ? "✅ ALL MEMBERS PARSED CORRECTLY" : "❌ SOME MEMBERS HAVE ISSUES");
