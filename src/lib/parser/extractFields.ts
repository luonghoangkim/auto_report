import type { ExtractedTask, MemberReport } from "../ai/types";

const URL_REGEX = /https?:\/\/[^\s\])>,"']+/g;
const NAME_LINE_RE = /^Name:\s*(.+?)\s*[-–]\s*(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s*\(([^)]*)\))?\s*$/i;
const TASK_ITEM_RE = /^\s*\d+\.\s*.+$/;
const FIELD_LINE_RE = /^\s*[-•*+]\s*([A-Za-z ]+):\s*(.+?)\s*$/;
const PROJECT_TAG_RE = /^(\[\s*[^\]]+?\s*\])\s*(.+)$/;
const TASK_HEADER_RE = /^Tasks?:$/i;

function normalizeProjectTag(rawTag: string): string {
  const inside = rawTag.slice(1, -1).trim().replace(/[ \t]+/g, " ");
  return `[${inside}]`;
}

function sanitizeLine(line: string): string {
  return line
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function isSectionStart(line: string): boolean {
  return /^(ETC|Have trouble|Supported|Need support|Next task|Link):/i.test(line);
}

function getSectionLine(lines: string[], label: string): string | undefined {
  return lines.find((line) => line.toLowerCase().startsWith(label.toLowerCase()));
}

function normalizeOptionalValue(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed.toUpperCase() !== "N/A" ? trimmed : undefined;
}

function parseSession(raw?: string): MemberReport["session"] {
  const value = raw?.trim().toLowerCase() ?? "";
  if (!value) return undefined;
  if (value.includes("sáng") && value.includes("chiều")) return "Cả ngày";
  if (value.includes("cả ngày")) return "Cả ngày";
  if (value.includes("sáng")) return "Sáng";
  if (value.includes("chiều")) return "Chiều";
  return undefined;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDeadline(value: string, reportDate: string): string | null {
  // Accept both "18/04" and "18/04 - Dời deadline ..."
  const match = value.match(/(\d{1,2})\/(\d{1,2})/);
  if (!match) return null;

  const [, day, month] = match;
  const reportYear = Number(reportDate.slice(0, 4));
  return toIsoDate(reportYear, Number(month), Number(day));
}

function parseLeadingCount(value: string): number | null {
  const match = value.match(/^(\d+)\b/);
  if (!match) return null;
  const count = Number(match[1]);
  return Number.isNaN(count) ? null : count;
}

function parseBugMetrics(value: string) {
  const bugMatch = value.match(
    /^(\d+)\s*\(Critical:\s*(\d+)\s*\|\s*Major:\s*(\d+)\s*\|\s*Minor:\s*(\d+)\)$/i
  );
  if (bugMatch) {
    return {
      total: Number(bugMatch[1]),
      critical: Number(bugMatch[2]),
      major: Number(bugMatch[3]),
      minor: Number(bugMatch[4]),
      fixed: 0,
      open: 0,
    };
  }

  // Also accept simple daily format:
  // - "6"
  // - "6 (6 App New)"
  const simpleMatch = value.match(/^(\d+)(?:\s*\((.*?)\))?\s*$/i);
  if (!simpleMatch) return null;

  return {
    total: Number(simpleMatch[1]),
    critical: 0,
    major: 0,
    minor: 0,
    fixed: 0,
    open: 0,
  };
}

function parseTaskHeader(line: string): Pick<
  ExtractedTask,
  "title" | "projectTag" | "isSupport" | "description" | "deadline" | "bugMetrics"
> | null {
  if (!TASK_ITEM_RE.test(line)) return null;

  const rawTitle = line.replace(/^\s*\d+\.\s*/, "").trim();
  if (!rawTitle) return null;
  const tagMatch = rawTitle.match(PROJECT_TAG_RE);
  const projectTag = tagMatch?.[1] ? normalizeProjectTag(tagMatch[1]) : undefined;
  const taskTitleWithoutTag = (tagMatch?.[2] ?? rawTitle).trim();
  const title = projectTag ? `${projectTag} ${taskTitleWithoutTag}` : taskTitleWithoutTag;
  const isSupport = /^Support member$/i.test(taskTitleWithoutTag);

  return {
    title,
    projectTag,
    isSupport,
    description: undefined,
    deadline: null,
    bugMetrics: undefined,
  };
}

function parseTasks(lines: string[], reportDate: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  let currentTask: ExtractedTask | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const taskHeader = parseTaskHeader(line);
    if (taskHeader) {
      currentTask = {
        ...taskHeader,
        progress: undefined,
        links: [],
        subtasks: [],
        confidence: 1,
      };
      tasks.push(currentTask);
      continue;
    }

    if (!currentTask) continue;

    const fieldMatch = line.match(FIELD_LINE_RE);
    if (!fieldMatch) continue;

    const key = fieldMatch[1].trim().toLowerCase();
    const value = fieldMatch[2].trim();

    if (key === "progress") {
      const progress = Number(value.replace("%", "").trim());
      if (!Number.isNaN(progress)) currentTask.progress = Math.max(0, Math.min(100, progress));
      continue;
    }

    if (key === "deadline") {
      currentTask.deadline = parseDeadline(value, reportDate);
      continue;
    }

    if (key === "description") {
      currentTask.description = normalizeOptionalValue(value);
      continue;
    }

    if (key === "bugs") {
      currentTask.bugMetrics = parseBugMetrics(value) ?? undefined;
      continue;
    }

    if (key === "bug") {
      currentTask.bugMetrics = parseBugMetrics(value) ?? undefined;
      continue;
    }

    if (key === "feature" || key === "features") {
      const featureText = normalizeOptionalValue(value);
      if (featureText) {
        currentTask.description = currentTask.description
          ? `${currentTask.description} | Feature: ${featureText}`
          : `Feature: ${featureText}`;

        // Fallback rule for leader daily quality section:
        // when member only logs Feature and doesn't provide Bug,
        // count that Feature number into bug total/open.
        const featureCount = parseLeadingCount(featureText);
        if (featureCount !== null && !currentTask.bugMetrics) {
          currentTask.bugMetrics = {
            total: featureCount,
            critical: 0,
            major: 0,
            minor: 0,
            fixed: 0,
            open: featureCount,
          };
        }
      }
      continue;
    }

    if (key === "fixed") {
      const fixed = Number(value);
      if (!Number.isNaN(fixed)) {
        currentTask.bugMetrics = {
          total: currentTask.bugMetrics?.total ?? 0,
          critical: currentTask.bugMetrics?.critical ?? 0,
          major: currentTask.bugMetrics?.major ?? 0,
          minor: currentTask.bugMetrics?.minor ?? 0,
          fixed,
          open: currentTask.bugMetrics?.open ?? 0,
        };
      }
      continue;
    }

    if (key === "open") {
      const open = Number(value);
      if (!Number.isNaN(open)) {
        currentTask.bugMetrics = {
          total: currentTask.bugMetrics?.total ?? 0,
          critical: currentTask.bugMetrics?.critical ?? 0,
          major: currentTask.bugMetrics?.major ?? 0,
          minor: currentTask.bugMetrics?.minor ?? 0,
          fixed: currentTask.bugMetrics?.fixed ?? 0,
          open,
        };
      }
    }
  }

  return tasks;
}

function collectTaskLines(lines: string[]): string[] {
  const taskStart = lines.findIndex((line) => TASK_HEADER_RE.test(line));
  if (taskStart === -1) return [];

  const taskLines: string[] = [];
  for (let i = taskStart + 1; i < lines.length; i++) {
    const line = lines[i];
    if (isSectionStart(line)) break;
    taskLines.push(line);
  }
  return taskLines;
}

function getSectionValue(lines: string[], label: string): string | undefined {
  const line = getSectionLine(lines, label);
  if (!line) return undefined;
  return normalizeOptionalValue(line.slice(label.length));
}

function getLinks(lines: string[]): string[] {
  const linkIndex = lines.findIndex((line) => /^Link:\s*$/i.test(line));
  if (linkIndex === -1) return [];

  const links = new Set<string>();
  for (let i = linkIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const matches = line.match(URL_REGEX) ?? [];
    matches.forEach((url) => links.add(url));
  }
  return Array.from(links);
}

export function extractMemberFields(rawBlock: string): MemberReport {
  const lines = rawBlock
    .split("\n")
    .map(sanitizeLine)
    .filter((line) => line.length > 0);
  const hasStrictFormat = lines.some((line) => /^Name:/i.test(line)) && lines.some((line) => TASK_HEADER_RE.test(line));
  const nameLine = lines.find((line) => /^Name:/i.test(line)) ?? "";
  const nameMatch = nameLine.match(NAME_LINE_RE);

  if (!hasStrictFormat || !nameMatch) {
    return {
      memberName: "Unknown",
      reportDate: undefined,
      session: undefined,
      tasks: [],
      haveTrouble: undefined,
      supported: undefined,
      needSupport: undefined,
      nextTask: undefined,
      links: [],
      rawBlock,
      confidence: 0,
    };
  }

  const memberName = nameMatch[1].trim();
  const reportDate = toIsoDate(Number(nameMatch[2]), Number(nameMatch[3]), Number(nameMatch[4]));
  const session = parseSession(nameMatch[5]);
  const tasks = parseTasks(collectTaskLines(lines), reportDate);

  return {
    memberName,
    reportDate,
    session,
    tasks,
    haveTrouble: getSectionValue(lines, "Have trouble:"),
    supported: getSectionValue(lines, "Supported:"),
    needSupport: getSectionValue(lines, "Need support:"),
    nextTask: getSectionValue(lines, "Next task:"),
    links: getLinks(lines),
    rawBlock,
    confidence: tasks.length > 0 ? 1 : 0.4,
  };
}
