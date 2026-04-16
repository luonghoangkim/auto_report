/**
 * Mock AI provider — returns static fixture data.
 * Use during local development when you don't want to run parsing logic.
 * Set AI_PROVIDER=mock in .env.local to activate.
 */

import type {
  AIProvider,
  MemberReport,
  NormalizedTask,
  ParsedReportsOutput,
  ReportData,
} from "../types";

const MOCK_MEMBER: MemberReport = {
  memberName: "Nguyễn Văn A",
  reportDate: new Date().toISOString().split("T")[0],
  session: "Cả ngày",
  tasks: [
    {
      title: "[Mock] Thiết kế màn hình login",
      projectTag: "[ MOCK - UI ]",
      progress: 80,
      deadline: new Date().toISOString().split("T")[0],
      subtasks: ["Wireframe", "High-fi design"],
      links: [],
      confidence: 1,
    },
    {
      title: "[Mock] Review pull request backend",
      projectTag: "[ MOCK - BE ]",
      progress: 100,
      subtasks: [],
      links: [],
      confidence: 1,
    },
  ],
  haveTrouble: "Server staging tạm thời không kết nối được database",
  needSupport: "Cần DevOps kiểm tra cấu hình",
  supported: undefined,
  nextTask: "Hoàn thiện màn hình dashboard",
  links: [],
  rawBlock: "[mock data]",
  confidence: 1,
};

export class MockProvider implements AIProvider {
  name = "mock";

  async parseDailyReports(_rawText: string): Promise<ParsedReportsOutput> {
    return {
      members: [MOCK_MEMBER],
      parseDate: new Date().toISOString(),
      provider: this.name,
    };
  }

  async normalizeTasks(_parsed: ParsedReportsOutput): Promise<NormalizedTask[]> {
    return [
      { title: "[Mock] Thiết kế màn hình login", picName: "Nguyễn Văn A", progress: 80, tags: ["UI"], links: [], status: "doing" },
      { title: "[Mock] Review pull request backend", picName: "Nguyễn Văn A", progress: 100, tags: ["Backend"], links: [], status: "done" },
    ];
  }

  async generateWeeklyReport(_data: ReportData): Promise<string> {
    return "BÁO CÁO TUẦN (MOCK)\nĐây là dữ liệu mẫu từ mock provider.";
  }

  async generateMonthlyReport(_data: ReportData): Promise<string> {
    return "BÁO CÁO THÁNG (MOCK)\nĐây là dữ liệu mẫu từ mock provider.";
  }

  async generateProjectReport(_data: ReportData): Promise<string> {
    return "BÁO CÁO DỰ ÁN (MOCK)\nĐây là dữ liệu mẫu từ mock provider.";
  }
}
