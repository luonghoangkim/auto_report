/**
 * extractFields.ts  — v2
 *
 * Handles the real-world Vietnamese team report format:
 *
 *   Name: Nguyễn Hữu Huấn - 2026/04/14 (Sáng + Chiều)
 *   Task:
 *   1. [CD - UI] Xoá tài khoản (100%)
 *   2. Fix issue list (7 issues)
 *   ETC: N/A
 *   Have trouble: N/A
 *   Supported: N/A
 *   Need support: N/A
 *   Next task: Fix issue list
 *   Link:
 *   1. https://...
 */

import type { ExtractedTask, MemberReport } from "../ai/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s\)\]>,"]+/g;

// Groups of synonyms → section keys
const SECTION_PATTERNS: Array<{ key: SectionKey; re: RegExp }> = [
  // Task / work — check FIRST (most common)
  { key: "tasks",         re: /^\s*[\*_]*(công việc|nhiệm vụ|task|tasks|đã làm|hoàn thành|thực hiện|work done|work)[\*_]*\s*[:\-–]/i },
  // Issues / trouble
  { key: "issues",        re: /^\s*[\*_]*(vấn đề|khó khăn|issue|problem|blocker|blocked|tồn tại|have trouble|trouble|difficulty)[\*_]*\s*[:\-–]/i },
  // Support given
  { key: "supportGiven",  re: /^\s*[\*_]*(đã hỗ trợ|support given|hỗ trợ cho|hỗ trợ người khác|supported)[\*_]*\s*[:\-–]/i },
  // Support needed
  { key: "supportNeeded", re: /^\s*[\*_]*(cần hỗ trợ|need support|support needed|nhờ hỗ trợ|cần giúp)[\*_]*\s*[:\-–]/i },
  // Next tasks / plan
  { key: "nextTasks",     re: /^\s*[\*_]*(kế hoạch|next task|next tasks|next|sẽ làm|tomorrow|ngày mai|tuần tới|plan)[\*_]*\s*[:\-–]/i },
  // Skip sections — ETC, Link, Note, etc.
  { key: "_skip",         re: /^\s*[\*_]*(ETC|link|links|note|ghi chú|deadline|DL|review)[\*_]*\s*[:\-–]/i },
];

type SectionKey = "tasks" | "issues" | "supportNeeded" | "supportGiven" | "nextTasks" | "_skip";

// ─── Date parsing ─────────────────────────────────────────────────────────────

const DATE_PATTERNS: Array<{ re: RegExp; parse: (m: RegExpMatchArray) => string }> = [
  // yyyy/MM/dd  (e.g. 2026/04/14) — check BEFORE dd/MM/yyyy to avoid mismatch
  { re: /(\d{4})\/(\d{1,2})\/(\d{1,2})/, parse: (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` },
  // yyyy-MM-dd
  { re: /(\d{4})-(\d{2})-(\d{2})/,       parse: (m) => m[0] },
  // dd/MM/yyyy or dd-MM-yyyy
  { re: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, parse: (m) => `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` },
  // dd tháng MM năm yyyy
  { re: /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i, parse: (m) => `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` },
];

function parseDate(text: string): string | undefined {
  for (const { re, parse } of DATE_PATTERNS) {
    const m = text.match(re);
    if (m) return parse(m as RegExpMatchArray);
  }
  return undefined;
}

// ─── Name cleaning ────────────────────────────────────────────────────────────
// Strip " - 2026/04/14 (Sáng + Chiều)" suffix from name lines

function cleanName(raw: string): string {
  return raw
    // Remove " - yyyy/MM/dd ..." or " - dd/MM/yyyy ..."
    .replace(/\s*[-–]\s*\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}.*/,   "")
    .replace(/\s*[-–]\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}.*/, "")
    // Remove session suffix like (Sáng + Chiều) or (Sáng) at end
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

// ─── Session detection ────────────────────────────────────────────────────────

const SESSION_PATTERNS: Array<[RegExp, string]> = [
  [/\b(sáng\s*\+\s*chiều|sang\s*\+\s*chieu|cả ngày|full.?day|all day)\b/i, "full-day"],
  [/\b(sáng|morning|am)\b/i, "morning"],
  [/\b(chiều|afternoon|pm)\b/i, "afternoon"],
];

function detectSession(text: string): string | undefined {
  for (const [re, label] of SESSION_PATTERNS) {
    if (re.test(text)) return label;
  }
  return undefined;
}

// ─── Task extraction from a single line ───────────────────────────────────────

const PROGRESS_RE = /(\d{1,3})\s*%/;

// Module tag: [CD - UI], [ CD - AI ], [FE], [BACKEND], etc.
// Only matches square brackets (not parens, to avoid matching "(7 issues)")
const MODULE_TAG_RE = /\[\s*([^\]]+?)\s*\]/;

function extractTaskFromLine(line: string): ExtractedTask | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed === "N/A" || trimmed === "-") return null;

  // Accept: bullet lines (1. / - / • / *) OR tagged lines ([TAG] content)
  const bulletMatch = trimmed.match(/^(?:[-•*+]|\d+[.):])\s*(.+)/);
  const taggedMatch  = trimmed.match(/^\[\s*[^\]]+\s*\]\s*.+/);

  let raw: string;
  if (bulletMatch) {
    raw = bulletMatch[1].trim();
  } else if (taggedMatch) {
    raw = trimmed;
  } else {
    return null;
  }

  // Skip lines that are clearly not tasks (just "N/A" or very short)
  if (raw === "N/A" || raw.length < 3) return null;

  // Extract progress %
  const pMatch   = raw.match(PROGRESS_RE);
  const progress = pMatch ? Math.min(100, parseInt(pMatch[1], 10)) : undefined;

  // Do not extract or remove module tags from the task title per user request
  const moduleTag = undefined;

  // Build clean title: remove (%progress), DL: deadline notation
  const title = raw
    .replace(/\s*-\s*DL:\s*[\d\/]+/gi, "")  // remove "- DL: 14/04"
    .replace(/\s*-\s*\d+\/\d+\s*case\b[^))]*/i, "")  // remove "- 71/71 case ..."
    .replace(PROGRESS_RE, "")             // remove 100%
    .replace(/\(\s*\)/g, "")             // remove empty parens ()
    .replace(/\(\s*-[^)]*\)/g, "")       // remove (- something) leftover parens
    .replace(/#[A-Za-z0-9_-]+/g, "")    // remove #hashtags
    .replace(/\s+/g, " ")
    .trim()
    // Strip trailing punctuation
    .replace(/[-–:,(]+$/, "")
    .trim();

  if (title.length < 2) return null;

  const taskLinks = Array.from(new Set(raw.match(URL_REGEX) ?? []));

  return {
    title,
    moduleTag,
    progress,
    links: taskLinks,
    subtasks: [],
    confidence: pMatch ? 0.85 : 0.65,
  };
}

// ─── Main extractor ───────────────────────────────────────────────────────────

const NAME_HEADER_RE =
  /^[\*_]*(Họ và tên|Họ tên|Tên|Name|Reporter|Thành viên|Member)[\*_]*\s*[:\-–]\s*(.+)/im;
const BOLD_NAME_RE   =
  /^\*\*([^\*]{3,60})\*\*/m;

export function extractMemberFields(rawBlock: string): MemberReport {
  const lines  = rawBlock.split("\n");
  const scores: number[] = [];

  // ── Name ──────────────────────────────────────────────────
  let memberName = "Unknown";
  let nameConf   = 0.3;

  const nameHeaderMatch = rawBlock.match(NAME_HEADER_RE);
  if (nameHeaderMatch) {
    memberName = cleanName(nameHeaderMatch[2].trim());
    nameConf   = 0.95;
  } else {
    // Try bold name: **Trần Thị B**
    const boldMatch = rawBlock.match(BOLD_NAME_RE);
    if (boldMatch) {
      memberName = boldMatch[1].trim();
      nameConf   = 0.8;
    } else {
      // Fallback: first non-empty, short line without colon
      for (const line of lines) {
        const t = line.trim().replace(/^[-–*#>]+\s*/, "").trim();
        if (t.length > 3 && t.length < 60 && !t.includes(":") && /\p{L}/u.test(t)) {
          memberName = t;
          nameConf   = 0.5;
          break;
        }
      }
    }
  }
  scores.push(nameConf);

  // ── Date ──────────────────────────────────────────────────
  // Look in Name line first (e.g. "- 2026/04/14"), then entire block
  const nameLine  = lines.find((l) => NAME_HEADER_RE.test(l.trim())) ?? "";
  const reportDate = parseDate(nameLine) ?? parseDate(rawBlock);
  const dateConf   = reportDate ? 0.9 : 0.2;
  scores.push(dateConf);

  // ── Session ───────────────────────────────────────────────
  // Check the Name line first (most likely to contain session info)
  const session = detectSession(nameLine) ?? detectSession(rawBlock.split("\n").slice(0, 3).join(" "));

  // ── URLs ──────────────────────────────────────────────────
  const links = Array.from(new Set(rawBlock.match(URL_REGEX) ?? []));

  // ── Section parsing ───────────────────────────────────────
  const sections: Record<SectionKey, string[]> = {
    tasks: [], issues: [], supportNeeded: [], supportGiven: [], nextTasks: [], _skip: [],
  };
  let currentSection: SectionKey | null = null;

  for (const line of lines) {
    let sectionMatched = false;

    for (const { key, re } of SECTION_PATTERNS) {
      if (re.test(line)) {
        currentSection = key;
        // Capture inline content after the header colon (e.g. "Task: [CD-AI] Chat bot")
        const afterHeader = line.replace(re, "").trim();
        if (afterHeader && afterHeader !== "N/A" && key !== "_skip") {
          sections[key].push(afterHeader);
        }
        sectionMatched = true;
        break;
      }
    }

    if (!sectionMatched && currentSection && currentSection !== "_skip") {
      const t = line.trim();
      if (t && t !== "N/A") sections[currentSection].push(t);
    }
  }

  // ── Task extraction ───────────────────────────────────────
  // Use explicit task section if found, otherwise scan entire block
  const taskLines = sections.tasks.length > 0 ? sections.tasks : lines;

  const tasks: ExtractedTask[] = [];
  for (const line of taskLines) {
    const task = extractTaskFromLine(line);
    if (task) tasks.push(task);
  }
  scores.push(tasks.length > 0 ? 0.9 : 0.3);

  // ── Other fields ─────────────────────────────────────────
  const issues        = sections.issues.filter((s) => s !== "N/A").join(" ").trim() || undefined;
  const supportNeeded = sections.supportNeeded.filter((s) => s !== "N/A").join(" ").trim() || undefined;
  const supportGiven  = sections.supportGiven.filter((s) => s !== "N/A").join(" ").trim() || undefined;
  const nextTasks     = sections.nextTasks.filter((s) => s !== "N/A").join(" ").trim() || undefined;

  // ── Confidence ────────────────────────────────────────────
  const confidence = Math.round(
    (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
  ) / 100;

  return {
    memberName,
    reportDate,
    session,
    tasks,
    issues,
    supportNeeded,
    supportGiven,
    nextTasks,
    links,
    rawBlock,
    confidence,
  };
}
