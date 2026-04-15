import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/mongodb";
import { ReportExport } from "@/lib/models/ReportExport";
import { buildDocx, reportTextToSections } from "@/lib/export/docx";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exportId = new URL(req.url).searchParams.get("exportId");
  if (!exportId) return NextResponse.json({ error: "exportId required" }, { status: 400 });

  await connectDB();
  const record = await ReportExport.findById(exportId).populate("projectId").lean();
  if (!record) return NextResponse.json({ error: "Export not found" }, { status: 404 });

  const project  = record.projectId as any;
  const subtitle = `${format(record.dateRange.from, "dd/MM/yyyy")} – ${format(record.dateRange.to, "dd/MM/yyyy")}`;
  const sections = reportTextToSections(record.content);

  const buffer = await buildDocx(
    `${project.name} — ${record.type.toUpperCase()} REPORT`,
    subtitle,
    sections
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${record.fileName}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
