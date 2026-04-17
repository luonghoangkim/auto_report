import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { requireAdminApi } from "@/lib/auth/adminGuard";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  await connectDB();
  const projects = await Project.find({})
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    projects: projects.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      description: p.description ?? "",
      status: p.status,
      createdBy: p.createdBy?.toString?.() ?? String(p.createdBy),
      membersCount: p.members?.length ?? 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    total: projects.length,
  });
}
