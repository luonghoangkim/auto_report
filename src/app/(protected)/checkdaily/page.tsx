import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import CheckDailyClient from "./ui/CheckDailyClient";

export default async function CheckDailyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "leader" && session.role !== "admin") redirect("/dashboard");

  return <CheckDailyClient />;
}
