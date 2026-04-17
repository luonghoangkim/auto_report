import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Task } from "@/lib/models/Task";
import { requireAdminApi } from "@/lib/auth/adminGuard";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  await connectDB();
  const tasks = await Task.find({})
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      _id: t._id.toString(),
      projectId: t.projectId?.toString?.() ?? String(t.projectId),
      title: t.title,
      picName: t.picName,
      progress: t.progress,
      status: t.status,
      tags: t.tags ?? [],
      createdAt: t.createdAt,
      lastUpdatedAt: t.lastUpdatedAt,
    })),
    total: tasks.length,
  });
}
