"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/layout/Toast";

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
}

function CreateProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: Project) => void;
}) {
  const [name, setName]         = useState("");
  const [desc, setDesc]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const { toast }               = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { setError("Project name must be at least 2 characters."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create project"); return; }
      toast("success", `Project "${data.project.name}" created!`);
      onCreate(data.project);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", fontWeight: 700 }}>
          New Project
        </h2>
        <form onSubmit={submit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: "0.375rem", fontSize: "0.875rem" }}>
              Project Name *
            </label>
            <input
              id="project-name-input"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign 2024"
              required
            />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: "0.375rem", fontSize: "0.875rem" }}>
              Description (optional)
            </label>
            <textarea
              id="project-desc-input"
              className="textarea"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Brief description of the project"
            />
          </div>

          {error && (
            <div style={{ padding: "0.75rem", background: "hsl(0 72% 51% / 0.1)", border: "1px solid hsl(0 72% 51% / 0.3)", borderRadius: 6, color: "hsl(0 72% 40%)", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} id="cancel-create-project-btn">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading} id="submit-create-project-btn">
              {loading ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]       = useState("");
  const { toast }                 = useToast();

  const load = () => {
    setLoading(true);
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast("success", `Project "${name}" deleted.`);
    } else {
      toast("error", "Failed to delete project.");
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "2rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} id="new-project-btn">
          <PlusIcon /> New Project
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          id="project-search"
          className="input"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card" style={{ padding: "4rem 2rem" }}>
          <FolderIcon />
          <h3>{search ? "No projects match your search" : "No projects yet"}</h3>
          <p>{search ? "Try a different search term." : "Create your first project to get started."}</p>
          {!search && (
            <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={() => setShowModal(true)} id="create-first-project-empty-btn">
              Create a project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {filtered.map((p, i) => (
            <div
              key={p._id}
              className="card animate-fade-in"
              style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem", animationDelay: `${i * 0.05}s` }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>{p.name}</div>
                  <span className={`badge badge-${p.status === "active" ? "doing" : p.status === "completed" ? "done" : "todo"}`}>
                    {p.status}
                  </span>
                </div>
                <button
                  id={`delete-project-${p._id}`}
                  onClick={() => handleDelete(p._id, p.name)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(220 9% 60%)", padding: "0.25rem", borderRadius: 4 }}
                  title="Delete project"
                >
                  <TrashIcon />
                </button>
              </div>

              {p.description && (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "hsl(220 9% 46%)", lineHeight: 1.5 }}>
                  {p.description.slice(0, 100)}{p.description.length > 100 ? "…" : ""}
                </p>
              )}

              <div style={{ fontSize: "0.75rem", color: "hsl(220 9% 60%)" }}>
                Created {new Date(p.createdAt).toLocaleDateString("vi-VN")}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                <Link href={`/projects/${p._id}`} className="btn-primary" style={{ flex: 1, justifyContent: "center" }} id={`open-project-${p._id}`}>
                  Open Project
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={(p) => { setProjects((prev) => [p, ...prev]); setShowModal(false); }}
        />
      )}
    </div>
  );
}

const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function PlusIcon()   { return <svg {...iconProps}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function TrashIcon()  { return <svg {...iconProps}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function FolderIcon() { return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
