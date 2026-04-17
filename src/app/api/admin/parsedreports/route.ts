import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ParsedReport } from "@/lib/models/ParsedReport";
import { requireAdminApi } from "@/lib/auth/adminGuard";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  await connectDB();
  const parsedReports = await ParsedReport.find({})
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    parsedReports: parsedReports.map((r) => ({
      _id: r._id.toString(),
      dailyReportId: r.dailyReportId?.toString?.() ?? String(r.dailyReportId),
      aiProvider: r.aiProvider,
      parseStatus: r.parseStatus,
      memberCount: r.memberReports?.length ?? 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    total: parsedReports.length,
  });
}
