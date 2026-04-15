import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { User } from "@/lib/models/User";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const project = await Project.findById(id).lean();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ project });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const user = await User.findById(session.sub);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const project = await Project.findOneAndUpdate(
    { _id: id, createdBy: user._id },
    { $set: { name: body.name, description: body.description, status: body.status } },
    { new: true }
  ).lean();

  if (!project) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const user = await User.findById(session.sub);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const result = await Project.findOneAndDelete({ _id: id, createdBy: user._id });
  if (!result) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

  return NextResponse.json({ success: true });
}
