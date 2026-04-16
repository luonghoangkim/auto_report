import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/mongodb";
import { Task } from "@/lib/models/Task";
import { Project } from "@/lib/models/Project";
import { ReportExport } from "@/lib/models/ReportExport";
import { User } from "@/lib/models/User";
import { DailyReport } from "@/lib/models/DailyReport";
import { ParsedReport } from "@/lib/models/ParsedReport";
import { getAIProvider } from "@/lib/ai";
import type { ReportData } from "@/lib/ai/types";
import { buildLeaderDailyReport } from "@/lib/reports/leaderDailyReport";
import { format } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await params;
  if (!["weekly", "monthly", "project", "leader-daily"].includes(type)) {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  const { projectId, from, to, template } = await req.json();
  if (!projectId || !from || !to) {
    return NextResponse.json({ error: "projectId, from, to are required" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.sub);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const project = await Project.findById(projectId).lean();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const fromDate = new Date(from);
  const toDate   = new Date(to);
  const leaderName = user.name?.trim() || user.username;

  if (type === "leader-daily") {
    const reportDate = new Date(to);
    const dayStart = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate(), 23, 59, 59, 999);

    const dailyReports = await DailyReport.find({
      projectId,
      reportDate: { $gte: dayStart, $lte: dayEnd },
    }).select("_id").lean();

    const parsedReports = await ParsedReport.find({
      dailyReportId: { $in: dailyReports.map((report) => report._id) },
    }).lean();

    const tasks = await Task.find({ projectId }).lean();
    const memberReports = parsedReports.flatMap((report) => report.memberReports ?? []);
    const content = buildLeaderDailyReport({
      leaderName,
      projectName: project.name,
      reportDate,
      memberReports,
      tasks,
    });
    const fileName = `leader-daily-report-${format(reportDate, "yyyy-MM-dd")}.docx`;

    const exported = await ReportExport.create({
      projectId,
      type,
      dateRange: { from: reportDate, to: reportDate },
      content,
      fileName,
      createdBy: user._id,
    });

    return NextResponse.json({ content, exportId: exported._id, fileName });
  }

  const tasks = await Task.find({
    projectId,
    lastUpdatedAt: { $gte: fromDate, $lte: toDate },
  }).lean();

  const members = Array.from(new Set(tasks.map((t) => t.picName)));

  const reportData: ReportData = {
    project:   { name: project.name, description: project.description },
    tasks:     tasks.map((t) => ({
      title:    t.title,
      picName:  t.picName,
      progress: t.progress,
      tags:     t.tags,
      links:    t.links,
      status:   t.status,
    })),
    issues:    [],
    support:   [],
    nextTasks: [],
    dateRange: {
      from: format(fromDate, "dd/MM/yyyy"),
      to:   format(toDate,   "dd/MM/yyyy"),
    },
    members,
  };

  const ai = getAIProvider();
  let content: string;

  if (type === "weekly")       content = await ai.generateWeeklyReport(reportData, template);
  else if (type === "monthly") content = await ai.generateMonthlyReport(reportData);
  else                         content = await ai.generateProjectReport(reportData);

  const fileName = `${type}-report-${format(fromDate, "yyyy-MM-dd")}-to-${format(toDate, "yyyy-MM-dd")}.docx`;

  const exported = await ReportExport.create({
    projectId,
    type,
    dateRange: { from: fromDate, to: toDate },
    content,
    fileName,
    createdBy: user._id,
  });

  return NextResponse.json({ content, exportId: exported._id, fileName });
}
