/**
 * Deterministic / rule-based report parser.
 *
 * This is the DEFAULT provider – it requires NO paid API key.
 * It uses regex patterns + heuristics to extract structured data
 * from Vietnamese/English daily reports.
 */

import type {
  AIProvider,
  ExtractedTask,
  MemberReport,
  NormalizedTask,
  ParsedReportsOutput,
  ReportData,
} from "../types";
import { splitIntoMemberBlocks } from "../../parser/splitReports";
import { extractMemberFields } from "../../parser/extractFields";

export class DeterministicProvider implements AIProvider {
  name = "deterministic";

  async parseDailyReports(rawText: string): Promise<ParsedReportsOutput> {
    const blocks = splitIntoMemberBlocks(rawText);
    const members: MemberReport[] = blocks.map((block) =>
      extractMemberFields(block)
    );
    return {
      members,
      parseDate: new Date().toISOString(),
      provider: this.name,
    };
  }

  async normalizeTasks(parsed: ParsedReportsOutput): Promise<NormalizedTask[]> {
    const tasks: NormalizedTask[] = [];
    for (const member of parsed.members) {
      for (const t of member.tasks) {
        tasks.push({
          title:   t.title,
          picName: member.memberName,
          progress: t.progress ?? 0,
          tags:    [t.moduleTag, t.projectTag].filter(Boolean) as string[],
          links:   t.links ?? [],
          status:  progressToStatus(t.progress ?? 0),
        });
      }
    }
    return tasks;
  }

  async generateWeeklyReport(data: ReportData, template?: string): Promise<string> {
    if (template) return fillTemplate(template, data);
    return buildWeeklyReport(data);
  }

  async generateMonthlyReport(data: ReportData): Promise<string> {
    return buildMonthlyReport(data);
  }

  async generateProjectReport(data: ReportData): Promise<string> {
    return buildProjectReport(data);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function progressToStatus(p: number): NormalizedTask["status"] {
  if (p === 0)   return "todo";
  if (p < 80)    return "doing";
  if (p < 100)   return "review";
  return "done";
}

function fillTemplate(template: string, data: ReportData): string {
  const done    = data.tasks.filter((t) => t.status === "done");
  const ongoing = data.tasks.filter((t) => t.status !== "done");
  return template
    .replace("{{PROJECT}}", data.project.name)
    .replace("{{FROM}}", data.dateRange.from)
    .replace("{{TO}}", data.dateRange.to)
    .replace("{{MEMBERS}}", data.members.join(", "))
    .replace("{{DONE_TASKS}}", done.map((t) => `- ${t.title} (${t.picName}) ${t.progress}%`).join("\n"))
    .replace("{{ONGOING_TASKS}}", ongoing.map((t) => `- ${t.title} (${t.picName}) ${t.progress}%`).join("\n"))
    .replace("{{ISSUES}}", data.issues.map((i) => `- ${i}`).join("\n") || "Không có")
    .replace("{{SUPPORT}}", data.support.map((s) => `- ${s}`).join("\n") || "Không có")
    .replace("{{NEXT_TASKS}}", data.nextTasks.map((n) => `- ${n}`).join("\n") || "Chưa xác định");
}

function buildWeeklyReport(data: ReportData): string {
  const { project, tasks, issues, support, nextTasks, dateRange, members } = data;
  const done    = tasks.filter((t) => t.status === "done");
  const ongoing = tasks.filter((t) => t.status !== "done");

  return `BÁO CÁO TUẦN
Dự án: ${project.name}
Tuần: ${dateRange.from} – ${dateRange.to}
Thành viên: ${members.join(", ")}

1. TỔNG QUAN TUẦN
- Tổng số công việc: ${tasks.length}
- Đã hoàn thành: ${done.length}
- Đang thực hiện: ${ongoing.length}

2. CÔNG VIỆC ĐÃ THỰC HIỆN
${done.length ? done.map((t) => `- [${t.picName}] ${t.title} – ${t.progress}%`).join("\n") : "Chưa có công việc hoàn thành"}

3. CÔNG VIỆC ĐANG THỰC HIỆN
${ongoing.length ? ongoing.map((t) => `- [${t.picName}] ${t.title} – ${t.progress}%`).join("\n") : "Không có"}

4. VẤN ĐỀ / KHÓ KHĂN
${issues.length ? issues.map((i) => `- ${i}`).join("\n") : "Không có vấn đề phát sinh"}

5. KẾ HOẠCH TUẦN TỚI
${nextTasks.length ? nextTasks.map((n) => `- ${n}`).join("\n") : "Chưa xác định"}

6. CẦN HỖ TRỢ
${support.length ? support.map((s) => `- ${s}`).join("\n") : "Không cần hỗ trợ"}
`;
}

function buildMonthlyReport(data: ReportData): string {
  const { project, tasks, issues, support, nextTasks, dateRange, members } = data;
  const done    = tasks.filter((t) => t.status === "done");
  const ongoing = tasks.filter((t) => t.status !== "done");

  return `BÁO CÁO THÁNG
Dự án: ${project.name}
Tháng: ${dateRange.from} – ${dateRange.to}
Thành viên: ${members.join(", ")}

1. TÓM TẮT CHUNG
- Tổng công việc: ${tasks.length}
- Hoàn thành: ${done.length} (${tasks.length ? Math.round((done.length / tasks.length) * 100) : 0}%)
- Đang thực hiện: ${ongoing.length}

2. CÔNG VIỆC HOÀN THÀNH
${done.length ? done.map((t) => `- [${t.picName}] ${t.title}`).join("\n") : "Chưa có"}

3. CÔNG VIỆC ĐANG THỰC HIỆN
${ongoing.length ? ongoing.map((t) => `- [${t.picName}] ${t.title} – ${t.progress}%`).join("\n") : "Không có"}

4. VẤN ĐỀ VÀ KHÓ KHĂN
${issues.length ? issues.map((i) => `- ${i}`).join("\n") : "Không có"}

5. CẦN HỖ TRỢ
${support.length ? support.map((s) => `- ${s}`).join("\n") : "Không cần"}

6. KẾ HOẠCH THÁNG TỚI
${nextTasks.length ? nextTasks.map((n) => `- ${n}`).join("\n") : "Chưa xác định"}
`;
}

function buildProjectReport(data: ReportData): string {
  const { project, tasks, issues, support, dateRange } = data;
  const byPIC = tasks.reduce<Record<string, typeof tasks>>((acc, t) => {
    if (!acc[t.picName]) acc[t.picName] = [];
    acc[t.picName].push(t);
    return acc;
  }, {});

  const overallProgress =
    tasks.length
      ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
      : 0;

  return `BÁO CÁO TIẾN ĐỘ DỰ ÁN
Dự án: ${project.name}
${project.description ? `Mô tả: ${project.description}` : ""}
Cập nhật đến: ${dateRange.to}
Tiến độ tổng thể: ${overallProgress}%

1. TỔNG QUAN
- Tổng số công việc: ${tasks.length}
- Hoàn thành: ${tasks.filter((t) => t.status === "done").length}
- Đang thực hiện: ${tasks.filter((t) => t.status === "doing" || t.status === "review").length}
- Chưa bắt đầu: ${tasks.filter((t) => t.status === "todo").length}

2. TIẾN ĐỘ THEO THÀNH VIÊN
${Object.entries(byPIC)
  .map(([pic, ptasks]) => {
    const avg = Math.round(ptasks.reduce((s, t) => s + t.progress, 0) / ptasks.length);
    return `${pic} (${avg}% trung bình):\n${ptasks.map((t) => `  - ${t.title} – ${t.progress}% [${t.status}]`).join("\n")}`;
  })
  .join("\n\n")}

3. VẤN ĐỀ / CHẶN
${issues.length ? issues.map((i) => `- ${i}`).join("\n") : "Không có"}

4. CẦN HỖ TRỢ
${support.length ? support.map((s) => `- ${s}`).join("\n") : "Không cần"}
`;
}
