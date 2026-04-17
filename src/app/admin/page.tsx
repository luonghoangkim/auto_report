import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth/session";
import AdminCollections from "./AdminCollections";

export const dynamic = "force-dynamic";

type AdminListResponse = {
  total: number;
  [key: string]: unknown;
};

async function fetchAdminData<T extends AdminListResponse>(path: string): Promise<T> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const cookie = h.get("cookie") ?? "";

  if (!host) {
    throw new Error("Missing host header");
  }

  const response = await fetch(`${proto}://${host}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: cookie ? { cookie } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  return response.json();
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const [usersRes, projectsRes, tasksRes, dailyReportsRes, parsedReportsRes, reportExportsRes] =
    await Promise.all([
      fetchAdminData<{ users: Array<Record<string, unknown>>; total: number }>("/api/admin/users"),
      fetchAdminData<{ projects: Array<Record<string, unknown>>; total: number }>("/api/admin/projects"),
      fetchAdminData<{ tasks: Array<Record<string, unknown>>; total: number }>("/api/admin/tasks"),
      fetchAdminData<{ dailyReports: Array<Record<string, unknown>>; total: number }>("/api/admin/dailyreports"),
      fetchAdminData<{ parsedReports: Array<Record<string, unknown>>; total: number }>("/api/admin/parsedreports"),
      fetchAdminData<{ reportExports: Array<Record<string, unknown>>; total: number }>("/api/admin/reportexports"),
    ]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div style={{ padding: "2rem" }}>
          <div className="page-header" style={{ marginBottom: "1.5rem" }}>
            <div>
              <h1 className="page-title">Admin Dashboard</h1>
              <p className="page-subtitle">Read-only management view for all collections</p>
            </div>
            <span className="badge badge-review">ADMIN</span>
          </div>
          <AdminCollections
            users={usersRes.users}
            projects={projectsRes.projects}
            tasks={tasksRes.tasks}
            dailyReports={dailyReportsRes.dailyReports}
            parsedReports={parsedReportsRes.parsedReports}
            reportExports={reportExportsRes.reportExports}
          />
        </div>
      </main>
    </div>
  );
}
