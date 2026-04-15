import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

const MIN_PASSWORD_LEN = 6;
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Body: { username, password, name? }
 *
 * Creates a new user. First registered user gets role=admin.
 * Subsequent users get role=leader by default.
 */
export async function POST(req: NextRequest) {
  try {
    const { username, password, name } = await req.json();

    // Validate
    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LEN) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LEN} characters.` }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      return NextResponse.json({ error: "Username may only contain letters, numbers, underscore, dot, hyphen." }, { status: 400 });
    }

    await connectDB();

    // Check username uniqueness
    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
    }

    // First user becomes admin
    const count = await User.countDocuments();
    const role = count === 0 ? "admin" : "leader";

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      username: username.toLowerCase().trim(),
      passwordHash,
      name: name?.trim() || undefined,
      role,
    });

    return NextResponse.json({
      success: true,
      user: { id: user._id.toString(), username: user.username, name: user.name, role: user.role },
    }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
    }
    console.error("LOGIN ERROR:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
