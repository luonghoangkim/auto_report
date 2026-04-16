import type { IMemberReport } from "@/lib/models/ParsedReport";

interface LeaderTaskLike {
  title: string;
  picName: string;
  progress: number;
  deadline?: Date | null;
  bugMetrics?: {
    total: number;
    critical: number;
    major: number;
    minor: number;
    fixed: number;
    open: number;
  };
}

function formatDate(date: Date): string {
  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join("/");
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function pluralizeDay(count: number): string {
  return `${count} ngày`;
}

function daysLate(deadline: Date, reportDate: Date): number {
  const diff = startOfDay(reportDate).getTime() - startOfDay(deadline).getTime();
  return Math.max(1, Math.floor(diff / 86400000));
}

function normalizeText(value?: string) {
  return value?.trim() ?? "";
}

function dedupe(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

export function buildLeaderDailyReport(params: {
  leaderName: string;
  projectName: string;
  reportDate: Date;
  memberReports: IMemberReport[];
  tasks: LeaderTaskLike[];
}) {
  const { leaderName, projectName, reportDate, memberReports, tasks } = params;

  const troubleTexts = memberReports
    .map((report) => normalizeText(report.haveTrouble))
    .filter(Boolean);

  const delayedTasks = tasks.filter(
    (task) => task.deadline && startOfDay(task.deadline) < startOfDay(reportDate) && task.progress < 100
  );
  const completedTasks = memberReports.flatMap((report) =>
    (report.tasks ?? [])
      .filter((task) => task.progress === 100)
      .map((task) => `[${report.memberName}] ${task.title}`)
  );

  const riskRegex = /(nguy cơ|chậm|risk)/i;
  const hasRisk = troubleTexts.some((text) => riskRegex.test(text));

  const status = delayedTasks.length > 0 ? "Delay" : hasRisk ? "At-risk" : "On-track";
  const rootCause =
    delayedTasks.length > 0
      ? `${delayedTasks[0].title} đã quá deadline ${pluralizeDay(daysLate(delayedTasks[0].deadline as Date, reportDate))}.`
      : troubleTexts[0] ?? "Không có rủi ro nổi bật.";

  const bugSummary = memberReports.reduce(
    (acc, report) => {
      for (const task of report.tasks ?? []) {
        if (!task.bugMetrics) continue;
        acc.total += task.bugMetrics.total;
        acc.fixed += task.bugMetrics.fixed;
        acc.open += task.bugMetrics.open;
      }
      return acc;
    },
    { total: 0, fixed: 0, open: 0 }
  );

  const qualityAssessment =
    bugSummary.open > 0
      ? "Cần tiếp tục xử lý bug còn mở để giảm rủi ro bàn giao."
      : bugSummary.total > 0
        ? "Chất lượng ổn định, bug phát sinh đã được xử lý trong ngày."
        : "Không ghi nhận bug mới.";

  const tomorrowPlan = dedupe([
    ...memberReports.map((report) => normalizeText(report.nextTask)).filter(Boolean),
    ...tasks.filter((task) => task.progress < 100).map((task) => `${task.title} (${task.picName})`),
  ]);

  const managementRequests = dedupe(
    memberReports.map((report) => normalizeText(report.needSupport)).filter(Boolean)
  );

  const completedLines = completedTasks.length
    ? completedTasks.map((task) => `- ${task}`).join("\n")
    : "- Không";

  const delayedLines = delayedTasks.length
    ? delayedTasks
        .map((task) => {
          const reason = troubleTexts[0] ?? "Chưa hoàn thành trước deadline.";
          return [
            `- ${task.title} – trễ ${pluralizeDay(daysLate(task.deadline as Date, reportDate))}`,
            `  • ${reason}`,
            "  • Ảnh hưởng tiến độ xử lý và kế hoạch bàn giao tiếp theo",
          ].join("\n");
        })
        .join("\n")
    : "- Không";

  const tomorrowLines = tomorrowPlan.length
    ? tomorrowPlan.map((task) => `- ${task}`).join("\n")
    : "- Không";

  const managementLines = managementRequests.length
    ? managementRequests.map((request) => `- ${request}`).join("\n")
    : '- "Không"';

  return `${leaderName} – Daily Report ngày ${formatDate(reportDate)}

🍀 Dự án ${projectName}:
🔹 Tổng quan:
- Trạng thái: ${status}
- Nguyên nhân chính: ${rootCause}

1/ Tiến độ:
*Hoàn thành:
${completedLines}
*Chậm/Trễ:
${delayedLines}

2/ Chất lượng:
- Tổng bug: ${bugSummary.total}
- Đã fix: ${bugSummary.fixed}
- Bug còn mở: ${bugSummary.open}
- Đánh giá: ${qualityAssessment}

3/ Kế hoạch ngày mai:
${tomorrowLines}

4/ Đề xuất với MNG:
${managementLines}`;
}
