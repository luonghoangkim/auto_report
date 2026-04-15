"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  done: number;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="card animate-fade-in"
      style={{ padding: "1.25rem 1.5rem", flex: 1, minWidth: 160 }}
    >
      <div style={{ fontSize: "0.75rem", color: "hsl(220 9% 46%)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .finally(() => setLoading(false));
  }, []);

  const stats: Stats = {
    total:  projects.length,
    active: projects.filter((p) => p.status === "active").length,
    done:   projects.filter((p) => p.status === "completed").length,
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of all your projects and recent activity</p>
        </div>
        <Link href="/projects" className="btn-primary" id="go-projects-btn">
          <PlusIcon /> New Project
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <StatCard label="Total Projects" value={stats.total} color="hsl(221 83% 53%)" />
        <StatCard label="Active"         value={stats.active} color="hsl(142 71% 45%)" />
        <StatCard label="Completed"      value={stats.done}   color="hsl(199 89% 48%)" />
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid hsl(220 13% 91%)", fontWeight: 600 }}>
          Recent Projects
        </div>

        {loading ? (
          <div style={{ padding: "2rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 56, marginBottom: "0.75rem" }} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <FolderIcon />
            <h3>No projects yet</h3>
            <p>Create your first project to start tracking team reports.</p>
            <Link href="/projects" className="btn-primary" style={{ marginTop: "1rem" }} id="create-first-project-btn">
              Create a project
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 8).map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.description && (
                        <div style={{ fontSize: "0.8rem", color: "hsl(220 9% 46%)", marginTop: 2 }}>
                          {p.description.slice(0, 60)}{p.description.length > 60 ? "…" : ""}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${p.status === "active" ? "doing" : p.status === "completed" ? "done" : "todo"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ color: "hsl(220 9% 46%)", fontSize: "0.85rem" }}>
                      {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <Link
                        href={`/projects/${p._id}`}
                        className="btn-secondary"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                        id={`open-project-${p._id}`}
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function PlusIcon()   { return <svg {...iconProps}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function FolderIcon() { return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
