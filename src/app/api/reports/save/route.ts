import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/mongodb";
import { DailyReport } from "@/lib/models/DailyReport";
import { ParsedReport } from "@/lib/models/ParsedReport";
import { Task } from "@/lib/models/Task";
import { User } from "@/lib/models/User";
import { normalizeAndMergeTasks } from "@/lib/parser/normalizeTask";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rawText, projectId, hash, parsed } = await req.json();

  if (!rawText || !projectId || !hash || !parsed) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.sub);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const guessedDate = parsed.members?.[0]?.reportDate
    ? new Date(parsed.members[0].reportDate)
    : new Date();

  let dailyReport;
  try {
    dailyReport = await DailyReport.create({
      projectId,
      rawText,
      rawHash: hash,
      reportDate: guessedDate,
      createdBy: user._id,
    });
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ error: "Duplicate report batch" }, { status: 409 });
    throw err;
  }

  await ParsedReport.create({
    dailyReportId: dailyReport._id,
    memberReports: parsed.members,
    aiProvider: parsed.provider ?? "deterministic",
    parseStatus: "saved",
  });

  const existingTasks = await Task.find({ projectId }).lean();

  const taskInputs = (parsed.members ?? []).flatMap((member: any) =>
    (member.tasks ?? []).map((t: any) => ({
      title:    t.title,
      picName:  member.memberName,
      progress: t.progress ?? 0,
      tags:     [t.projectTag, t.moduleTag].filter(Boolean),
      links:    t.links ?? [],
      deadline: t.deadline ? new Date(t.deadline) : null,
      bugMetrics: t.bugMetrics,
      reportId: dailyReport._id.toString(),
      date:     guessedDate,
    }))
  );

  const mapped = existingTasks.map((t) => ({
    _id:      t._id.toString(),
    title:    t.title,
    picName:  t.picName,
    progress: t.progress,
    tags:     t.tags,
    links:    t.links,
    deadline: t.deadline ?? null,
    bugMetrics: t.bugMetrics,
    status:   t.status,
  }));

  const { toCreate, toUpdate } = normalizeAndMergeTasks(taskInputs, mapped);

  if (toCreate.length) {
    await Task.insertMany(
      toCreate.map((t) => ({
        projectId,
        title:           t.title,
        picName:         t.picName,
        progress:        t.progress,
        status:          t.status,
        history:         t.history,
        sourceReportIds: t.reportIds,
        links:           t.links,
        tags:            t.tags,
        deadline:        t.deadline ?? null,
        bugMetrics:      t.bugMetrics,
        lastUpdatedAt:   guessedDate,
      }))
    );
  }

  for (const upd of toUpdate) {
    await Task.findByIdAndUpdate(upd.id, {
      $set:  {
        progress: upd.progress,
        status: upd.status,
        lastUpdatedAt: guessedDate,
        links: upd.links,
        tags: upd.tags,
        deadline: upd.deadline ?? null,
        bugMetrics: upd.bugMetrics,
      },
      $push: { history: upd.historyEntry, sourceReportIds: dailyReport._id },
    });
  }

  return NextResponse.json({
    success: true,
    dailyReportId: dailyReport._id,
    created: toCreate.length,
    updated: toUpdate.length,
  });
}
