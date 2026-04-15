import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { User } from "@/lib/models/User";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.sub);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const projects = await Project.find({ createdBy: user._id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Project name is required (min 2 chars)" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.sub);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const project = await Project.create({
    name: name.trim(),
    description: description?.trim() ?? "",
    createdBy: user._id,
    members: [user._id],
  });

  return NextResponse.json({ project }, { status: 201 });
}
