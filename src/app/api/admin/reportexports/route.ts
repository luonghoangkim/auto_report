import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ReportExport } from "@/lib/models/ReportExport";
import { requireAdminApi } from "@/lib/auth/adminGuard";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  await connectDB();
  const reportExports = await ReportExport.find({})
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    reportExports: reportExports.map((r) => ({
      _id: r._id.toString(),
      projectId: r.projectId?.toString?.() ?? String(r.projectId),
      createdBy: r.createdBy?.toString?.() ?? String(r.createdBy),
      type: r.type,
      fileName: r.fileName,
      dateRange: r.dateRange,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    total: reportExports.length,
  });
}
