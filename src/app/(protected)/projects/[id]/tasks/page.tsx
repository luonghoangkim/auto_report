"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/components/layout/Toast";

interface Task {
  _id: string;
  title: string;
  picName: string;
  progress: number;
  status: "todo" | "doing" | "review" | "done";
  tags: string[];
  lastUpdatedAt: string;
  links: string[];
}

const STATUS_OPTIONS = ["all", "todo", "doing", "review", "done"] as const;

export default function TasksPage() {
  const params    = useParams();
  const projectId = params.id as string;
  const { toast } = useToast();

  const [tasks, setTasks]     = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState<string>("all");
  const [editId, setEditId]   = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editStatus, setEditStatus]     = useState<string>("");

  const fetchTasks = useCallback(() => {
    setLoading(true);
    const params_ = new URLSearchParams({ projectId });
    if (status !== "all") params_.set("status", status);
    if (search) params_.set("search", search);

    fetch(`/api/tasks?${params_}`)
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks ?? []))
      .finally(() => setLoading(false));
  }, [projectId, status, search]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const startEdit = (task: Task) => {
    setEditId(task._id);
    setEditProgress(task.progress);
    setEditStatus(task.status);
  };

  const saveEdit = async (taskId: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, progress: editProgress, status: editStatus }),
      });
      if (!res.ok) { toast("error", "Failed to update task."); return; }
      toast("success", "Task updated.");
      setEditId(null);
      fetchTasks();
    } catch {
      toast("error", "Network error.");
    }
  };

  const grouped = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    if (!acc[t.picName]) acc[t.picName] = [];
    acc[t.picName].push(t);
    return acc;
  }, {});

  const statCounts = {
    todo:   tasks.filter((t) => t.status === "todo").length,
    doing:  tasks.filter((t) => t.status === "doing").length,
    review: tasks.filter((t) => t.status === "review").length,
    done:   tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/projects" style={{ color: "hsl(220 9% 46%)", textDecoration: "none", fontSize: "0.875rem" }}>Projects</Link>
            <span style={{ color: "hsl(220 9% 70%)" }}>›</span>
            <Link href={`/projects/${projectId}`} style={{ color: "hsl(220 9% 46%)", textDecoration: "none", fontSize: "0.875rem" }}>Project</Link>
            <span style={{ color: "hsl(220 9% 70%)" }}>›</span>
            <span style={{ fontSize: "0.875rem", color: "hsl(220 9% 46%)" }}>Tasks</span>
          </div>
          <h1 className="page-title">Task List</h1>
          <p className="page-subtitle">{tasks.length} tasks total</p>
        </div>
        <Link href={`/projects/${projectId}`} className="btn-primary" id="import-more-btn">
          + Import Reports
        </Link>
      </div>

      {/* Status summary chips */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(["todo", "doing", "review", "done"] as const).map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span className={`badge badge-${s}`}>{s}</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{statCounts[s]}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          id="task-search"
          className="input"
          placeholder="Search tasks, PIC, tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              id={`filter-${s}`}
              onClick={() => setStatus(s)}
              style={{
                padding: "0.4rem 0.875rem",
                borderRadius: 6,
                border: "1px solid",
                borderColor: status === s ? "hsl(221 83% 53%)" : "hsl(220 13% 91%)",
                background: status === s ? "hsl(221 83% 53%)" : "white",
                color: status === s ? "white" : "hsl(220 9% 46%)",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div>{[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 180, marginBottom: "1rem" }} />)}</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state card">
          <TaskIcon />
          <h3>No tasks found</h3>
          <p>{search || status !== "all" ? "Try adjusting your filters." : "Import reports to automatically create tasks."}</p>
          {!search && status === "all" && (
            <Link href={`/projects/${projectId}`} className="btn-primary" style={{ marginTop: "1rem" }} id="import-reports-empty-btn">
              Import Reports
            </Link>
          )}
        </div>
      ) : (
        // Group by PIC
        Object.entries(grouped).map(([pic, ptasks]) => (
          <div key={pic} className="card" style={{ marginBottom: "1.25rem" }}>
            <div
              style={{
                padding: "0.875rem 1.25rem",
                borderBottom: "1px solid hsl(220 13% 91%)",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: 32, height: 32,
                  borderRadius: "50%",
                  background: stringToColor(pic),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
                }}
              >
                {pic.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{pic}</div>
                <div style={{ fontSize: "0.75rem", color: "hsl(220 9% 46%)" }}>
                  {ptasks.length} tasks ·{" "}
                  {Math.round(ptasks.reduce((s, t) => s + t.progress, 0) / ptasks.length)}% avg
                </div>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Tags</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ptasks.map((task) => (
                    <tr key={task._id}>
                      <td style={{ fontWeight: 500, maxWidth: 320 }}>
                        {task.title}
                        {task.links.length > 0 && (
                          <div style={{ marginTop: "0.25rem" }}>
                            {task.links.map((l, li) => (
                              <a key={li} href={l} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "hsl(221 83% 53%)", marginRight: "0.5rem" }}>
                                Link {li + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                          {task.tags.map((tag) => (
                            <span key={tag} style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", background: "hsl(220 14% 92%)", borderRadius: 99, fontWeight: 600 }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {editId === task._id ? (
                          <input
                            type="number"
                            min={0} max={100}
                            className="input"
                            style={{ width: 65 }}
                            value={editProgress}
                            onChange={(e) => setEditProgress(parseInt(e.target.value) || 0)}
                            id={`edit-progress-${task._id}`}
                          />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div
                                className="progress-fill"
                                style={{ width: `${task.progress}%`, background: task.progress === 100 ? "hsl(142 71% 45%)" : "hsl(221 83% 53%)" }}
                              />
                            </div>
                            <span style={{ fontSize: "0.8rem", fontWeight: 600, minWidth: 32 }}>
                              {task.progress}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        {editId === task._id ? (
                          <select
                            className="input"
                            style={{ padding: "0.35rem 0.5rem", fontSize: "0.85rem" }}
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            id={`edit-status-${task._id}`}
                          >
                            {["todo", "doing", "review", "done"].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`badge badge-${task.status}`}>{task.status}</span>
                        )}
                      </td>
                      <td style={{ color: "hsl(220 9% 60%)", fontSize: "0.8rem" }}>
                        {new Date(task.lastUpdatedAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td>
                        {editId === task._id ? (
                          <div style={{ display: "flex", gap: "0.375rem" }}>
                            <button className="btn-primary" style={{ padding: "0.3rem 0.625rem", fontSize: "0.8rem" }} onClick={() => saveEdit(task._id)} id={`save-task-${task._id}`}>
                              Save
                            </button>
                            <button className="btn-secondary" style={{ padding: "0.3rem 0.625rem", fontSize: "0.8rem" }} onClick={() => setEditId(null)} id={`cancel-task-${task._id}`}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button className="btn-secondary" style={{ padding: "0.3rem 0.625rem", fontSize: "0.8rem" }} onClick={() => startEdit(task)} id={`edit-task-${task._id}`}>
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h} 55% 45%)`;
}

const iconProps = { width: 48, height: 48, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function TaskIcon() { return <svg {...iconProps}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
