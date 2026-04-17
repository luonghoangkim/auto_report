import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { DailyReport } from "@/lib/models/DailyReport";
import { requireAdminApi } from "@/lib/auth/adminGuard";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  await connectDB();
  const dailyReports = await DailyReport.find({})
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    dailyReports: dailyReports.map((r) => ({
      _id: r._id.toString(),
      projectId: r.projectId?.toString?.() ?? String(r.projectId),
      createdBy: r.createdBy?.toString?.() ?? String(r.createdBy),
      sourceName: r.sourceName ?? "",
      reportDate: r.reportDate ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    total: dailyReports.length,
  });
}
