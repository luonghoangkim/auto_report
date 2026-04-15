import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { signToken } from "@/lib/auth/jwt";
import { buildAuthCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      // Constant-time to prevent user enumeration
      await bcrypt.compare(password, "$2b$10$invalidhashpadding000000000000000000000000000000000000");
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const token = await signToken({
      sub:      user._id.toString(),
      username: user.username,
      role:     user.role,
      name:     user.name,
    });

    const res = NextResponse.json({
      success: true,
      user: { id: user._id.toString(), username: user.username, name: user.name, role: user.role },
    });
    res.headers.set("Set-Cookie", buildAuthCookie(token));
    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
