/** Shared types for the AI abstraction layer */

export interface ExtractedTask {
  title: string;
  moduleTag?: string;
  projectTag?: string;
  progress?: number;       // 0–100
  subtasks?: string[];
  links?: string[];
  confidence: number;      // 0–1
}

export interface MemberReport {
  memberName: string;
  reportDate?: string;     // ISO date string or "unknown"
  session?: string;        // morning | afternoon | full-day
  tasks: ExtractedTask[];
  issues?: string;
  supportNeeded?: string;
  supportGiven?: string;
  nextTasks?: string;
  links?: string[];
  rawBlock: string;        // original text slice – stored forever for audit
  confidence: number;      // 0–1 overall
}

export interface ParsedReportsOutput {
  members: MemberReport[];
  parseDate: string;       // ISO timestamp of when parsing ran
  provider: string;        // which AI provider was used
}

export interface NormalizedTask {
  title: string;
  picName: string;
  progress: number;
  tags: string[];
  links: string[];
  status: "todo" | "doing" | "review" | "done";
}

export interface ReportData {
  project: { name: string; description?: string };
  tasks: NormalizedTask[];
  issues: string[];
  support: string[];
  nextTasks: string[];
  dateRange: { from: string; to: string };
  members: string[];
}

/** The interface every AI provider must implement */
export interface AIProvider {
  name: string;
  parseDailyReports(rawText: string): Promise<ParsedReportsOutput>;
  normalizeTasks(parsed: ParsedReportsOutput): Promise<NormalizedTask[]>;
  generateWeeklyReport(data: ReportData, template?: string): Promise<string>;
  generateMonthlyReport(data: ReportData): Promise<string>;
  generateProjectReport(data: ReportData): Promise<string>;
}
