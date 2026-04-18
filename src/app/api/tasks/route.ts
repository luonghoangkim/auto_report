import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/mongodb";
import { Task } from "@/lib/models/Task";

const DONE_STATUS = "done";

function normalizeTaskUpdate(input: { progress?: unknown; status?: unknown }) {
  const normalized: { progress?: number; status?: string } = {};
  const hasProgress = typeof input.progress === "number";
  const hasStatus = typeof input.status === "string" && input.status.length > 0;

  if (hasProgress) {
    normalized.progress = Math.max(0, Math.min(100, Math.round(input.progress as number)));
  }
  if (hasStatus) {
    normalized.status = input.status as string;
  }

  if (hasStatus && normalized.status === DONE_STATUS) {
    normalized.progress = 100;
  } else if (hasProgress && normalized.progress === 100) {
    normalized.status = DONE_STATUS;
  } else if (
    hasProgress &&
    typeof normalized.progress === "number" &&
    normalized.progress < 100 &&
    normalized.status === DONE_STATUS
  ) {
    normalized.status = "doing";
  }

  return normalized;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const status    = searchParams.get("status");
  const search    = searchParams.get("search");
  const pic       = searchParams.get("pic");

  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  await connectDB();

  const query: Record<string, unknown> = { projectId };
  if (status && status !== "all") query.status = status;
  if (pic)    query.picName = { $regex: pic, $options: "i" };
  if (search) {
    query.$or = [
      { title:   { $regex: search, $options: "i" } },
      { picName: { $regex: search, $options: "i" } },
      { tags:    { $regex: search, $options: "i" } },
    ];
  }

  const tasks = await Task.find(query).sort({ lastUpdatedAt: -1 }).lean();
  return NextResponse.json({ tasks });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, progress, status, title, picName } = await req.json();
  if (!id) return NextResponse.json({ error: "Task id required" }, { status: 400 });

  await connectDB();
  const update: Record<string, unknown> = { lastUpdatedAt: new Date() };
  const normalized = normalizeTaskUpdate({ progress, status });
  if (typeof normalized.progress === "number") update.progress = normalized.progress;
  if (normalized.status) update.status = normalized.status;
  if (title)   update.title   = title;
  if (picName) update.picName = picName;

  const task = await Task.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  return NextResponse.json({ task });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Task id required" }, { status: 400 });

  await connectDB();
  const deletedTask = await Task.findByIdAndDelete(id).lean();
  if (!deletedTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
