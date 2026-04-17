import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { CheckDaily } from "@/lib/models/CheckDaily";
import { CHECK_DAILY_ITEM_TYPES, getTodayDateKey } from "@/lib/checkdaily/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "leader" && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const leader = await User.findById(session.sub).lean();
  if (!leader) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const date = getTodayDateKey();

  const defaultItems = CHECK_DAILY_ITEM_TYPES.map((type) => ({
    type,
    isChecked: false,
    note: "",
    checkedAt: null,
  }));

  const doc = await CheckDaily.findOneAndUpdate(
    { date, leaderId: leader._id },
    {
      $setOnInsert: {
        date,
        leaderId: leader._id,
        status: "in_progress",
        items: defaultItems,
        logtimeUsers: [],
        plannedTasks: [],
      },
    },
    { new: true, upsert: true }
  ).lean();

  const completed = (doc.items ?? []).filter((i) => i.isChecked).length;
  const total = CHECK_DAILY_ITEM_TYPES.length;
  const status = completed >= total ? "completed" : "in_progress";
  if (doc.status !== status) {
    await CheckDaily.findByIdAndUpdate(doc._id, { $set: { status } });
  }

  return NextResponse.json({
    checkDaily: {
      ...doc,
      _id: doc._id.toString(),
      leaderId: doc.leaderId.toString(),
      status,
      progress: { completed, total },
      items: (doc.items ?? []).map((i) => ({
        ...i,
        checkedAt: i.checkedAt ?? null,
      })),
    },
  });
}
