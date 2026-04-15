import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/mongodb";
import { DailyReport } from "@/lib/models/DailyReport";
import { getAIProvider } from "@/lib/ai";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rawText, projectId } = await req.json();

  if (!rawText || typeof rawText !== "string" || rawText.trim().length < 10) {
    return NextResponse.json({ error: "rawText is required (min 10 chars)" }, { status: 400 });
  }
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const hash = crypto.createHash("sha256").update(rawText.trim()).digest("hex");
  await connectDB();

  const existing = await DailyReport.findOne({ projectId, rawHash: hash }).lean();
  if (existing) {
    return NextResponse.json(
      { error: "duplicate", message: "This exact report batch has already been imported.", existingId: existing._id },
      { status: 409 }
    );
  }

  const ai = getAIProvider();
  const parsed = await ai.parseDailyReports(rawText);

  return NextResponse.json({ parsed, hash });
}
