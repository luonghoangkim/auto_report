import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { requireAdminApi } from "@/lib/auth/adminGuard";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  await connectDB();
  const users = await User.find({})
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    users: users.map((u) => ({
      _id: u._id.toString(),
      username: u.username,
      name: u.name ?? "",
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
    total: users.length,
  });
}
