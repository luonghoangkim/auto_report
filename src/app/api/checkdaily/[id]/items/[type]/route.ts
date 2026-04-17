import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/mongodb";
import { CheckDaily, type CheckDailyItemType } from "@/lib/models/CheckDaily";
import { calculateCheckDailyStreak, CHECK_DAILY_ITEM_TYPES } from "@/lib/checkdaily/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "leader" && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, type } = await params;
  if (!CHECK_DAILY_ITEM_TYPES.includes(type as CheckDailyItemType)) {
    return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
  }

  const body = await req.json();
  const isChecked = Boolean(body.isChecked);
  const note = typeof body.note === "string" ? body.note.trim() : undefined;

  await connectDB();
  const doc = await CheckDaily.findOne({
    _id: id,
    leaderId: session.sub,
  });
  if (!doc) return NextResponse.json({ error: "CheckDaily not found" }, { status: 404 });

  const item = doc.items.find((i) => i.type === type);
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  item.isChecked = isChecked;
  if (note !== undefined) item.note = note;
  item.checkedAt = isChecked ? new Date() : null;

  const completed = doc.items.filter((i) => i.isChecked).length;
  doc.status = completed >= CHECK_DAILY_ITEM_TYPES.length ? "completed" : "in_progress";
  await doc.save();

  const completedDocs = await CheckDaily.find({
    leaderId: session.sub,
    status: "completed",
  })
    .select({ date: 1, _id: 0 })
    .lean();
  const completedDateSet = new Set(completedDocs.map((d) => d.date));
  const streak = calculateCheckDailyStreak(completedDateSet, doc.date, doc.status === "completed");

  return NextResponse.json({
    success: true,
    status: doc.status,
    progress: { completed, total: CHECK_DAILY_ITEM_TYPES.length },
    streak,
  });
}
