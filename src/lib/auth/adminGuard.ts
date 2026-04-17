import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function requireAdminApi() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.role !== "admin") {
    return {
      session,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}
