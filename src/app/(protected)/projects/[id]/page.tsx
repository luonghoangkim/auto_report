"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/components/layout/Toast";
import type { MemberReport } from "@/lib/ai/types";

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
}

// ─── Parsed Preview Editor ─────────────────────────────────────────────────────

function MemberReportCard({
  report,
  index,
  onChange,
}: {
  report: MemberReport;
  index: number;
  onChange: (idx: number, updated: MemberReport) => void;
}) {
  const confColor =
    report.confidence >= 0.7 ? "hsl(142 71% 45%)" :
    report.confidence >= 0.4 ? "hsl(38 92% 50%)"  :
                                "hsl(0 72% 51%)";

  const update = (key: keyof MemberReport, value: unknown) =>
    onChange(index, { ...report, [key]: value });

  return (
    <div
      className="card animate-fade-in"
      style={{ padding: "1.25rem", marginBottom: "1rem", borderLeft: `3px solid ${confColor}`, animationDelay: `${index * 0.06}s` }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
          Member #{index + 1}
        </h3>
        <span
          style={{ fontSize: "0.75rem", fontWeight: 600, color: confColor }}
          title={`Parsing confidence: ${Math.round(report.confidence * 100)}%`}
        >
          {Math.round(report.confidence * 100)}% confidence
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "hsl(220 9% 46%)", marginBottom: "0.375rem", textTransform: "uppercase" }}>
            Name
          </label>
          <input
            id={`member-name-${index}`}
            className="input"
            value={report.memberName}
            onChange={(e) => update("memberName", e.target.value)}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "hsl(220 9% 46%)", marginBottom: "0.375rem", textTransform: "uppercase" }}>
            Date
          </label>
          <input
            id={`member-date-${index}`}
            className="input"
            type="date"
            value={report.reportDate ?? ""}
            onChange={(e) => update("reportDate", e.target.value)}
          />
        </div>
      </div>

      {/* Tasks */}
      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "hsl(220 9% 46%)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
          Tasks ({report.tasks.length})
        </label>
        {report.tasks.map((task, ti) => (
          <div
            key={ti}
            style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem", padding: "0.5rem 0.75rem", background: "hsl(220 14% 97%)", borderRadius: 6, flexWrap: "wrap" }}
          >
            <input
              id={`task-title-${index}-${ti}`}
              className="input"
              style={{ flex: 2, minWidth: 160, fontSize: "0.85rem" }}
              value={task.title}
              onChange={(e) => {
                const tasks = [...report.tasks];
                tasks[ti] = { ...task, title: e.target.value };
                update("tasks", tasks);
              }}
              placeholder="Task title"
            />
            <input
              id={`task-tag-${index}-${ti}`}
              className="input"
              style={{ width: 120, fontSize: "0.85rem" }}
              value={task.projectTag ?? ""}
              onChange={(e) => {
                const tasks = [...report.tasks];
                tasks[ti] = { ...task, projectTag: e.target.value };
                update("tasks", tasks);
              }}
              placeholder="[TAG]"
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", minWidth: 100 }}>
              <input
                id={`task-progress-${index}-${ti}`}
                type="number"
                min={0} max={100}
                className="input"
                style={{ width: 65, fontSize: "0.85rem" }}
                value={task.progress ?? ""}
                onChange={(e) => {
                  const tasks = [...report.tasks];
                  tasks[ti] = { ...task, progress: parseInt(e.target.value) || 0 };
                  update("tasks", tasks);
                }}
                placeholder="%"
              />
              <span style={{ fontSize: "0.8rem", color: "hsl(220 9% 46%)" }}>%</span>
            </div>
            <input
              id={`task-deadline-${index}-${ti}`}
              type="date"
              className="input"
              style={{ width: 145, fontSize: "0.85rem" }}
              value={task.deadline ?? ""}
              onChange={(e) => {
                const tasks = [...report.tasks];
                tasks[ti] = { ...task, deadline: e.target.value || null };
                update("tasks", tasks);
              }}
            />
            {task.bugMetrics && (
              <span style={{ fontSize: "0.75rem", color: "hsl(220 9% 46%)" }}>
                Bugs {task.bugMetrics.total} · Fixed {task.bugMetrics.fixed} · Open {task.bugMetrics.open}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                const tasks = report.tasks.filter((_, i) => i !== ti);
                update("tasks", tasks);
              }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(0 72% 51%)", padding: "0.25rem" }}
              title="Remove task"
              id={`remove-task-${index}-${ti}`}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update("tasks", [...report.tasks, { title: "", deadline: null, confidence: 0.5 }])}
          style={{ fontSize: "0.8rem", color: "hsl(221 83% 53%)", background: "none", border: "1px dashed hsl(221 83% 70%)", borderRadius: 6, padding: "0.3rem 0.75rem", cursor: "pointer", marginTop: "0.25rem" }}
          id={`add-task-${index}`}
        >
          + Add task
        </button>
      </div>

      {/* Issues / Support */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "hsl(220 9% 46%)", marginBottom: "0.375rem", textTransform: "uppercase" }}>
            Have Trouble
          </label>
          <textarea
            id={`member-trouble-${index}`}
            className="textarea"
            rows={2}
            style={{ fontFamily: "inherit", fontSize: "0.85rem" }}
            value={report.haveTrouble ?? ""}
            onChange={(e) => update("haveTrouble", e.target.value)}
            placeholder="Any blockers or risks?"
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "hsl(220 9% 46%)", marginBottom: "0.375rem", textTransform: "uppercase" }}>
            Next Task
          </label>
          <textarea
            id={`member-next-${index}`}
            className="textarea"
            rows={2}
            style={{ fontFamily: "inherit", fontSize: "0.85rem" }}
            value={report.nextTask ?? ""}
            onChange={(e) => update("nextTask", e.target.value)}
            placeholder="Planned for tomorrow / next week?"
          />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "hsl(220 9% 46%)", marginBottom: "0.375rem", textTransform: "uppercase" }}>
            Supported
          </label>
          <textarea
            id={`member-supported-${index}`}
            className="textarea"
            rows={2}
            style={{ fontFamily: "inherit", fontSize: "0.85rem" }}
            value={report.supported ?? ""}
            onChange={(e) => update("supported", e.target.value)}
            placeholder="Support provided"
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "hsl(220 9% 46%)", marginBottom: "0.375rem", textTransform: "uppercase" }}>
            Need Support
          </label>
          <textarea
            id={`member-need-support-${index}`}
            className="textarea"
            rows={2}
            style={{ fontFamily: "inherit", fontSize: "0.85rem" }}
            value={report.needSupport ?? ""}
            onChange={(e) => update("needSupport", e.target.value)}
            placeholder="Support needed"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params     = useParams();
  const projectId  = params.id as string;
  const { toast }  = useToast();

  const [project, setProject]             = useState<Project | null>(null);
  const [rawText, setRawText]             = useState("");
  const [parsing, setParsing]             = useState(false);
  const [saving, setSaving]               = useState(false);
  const [parsed, setParsed]               = useState<{ members: MemberReport[]; provider: string; parseDate: string } | null>(null);
  const [parsedHash, setParsedHash]       = useState("");
  const [step, setStep]                   = useState<"paste" | "preview">("paste");

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => setProject(d.project));
  }, [projectId]);

  const handleParse = async () => {
    if (!rawText.trim() || rawText.trim().length < 10) {
      toast("error", "Please paste at least one daily report.");
      return;
    }
    setParsing(true);
    try {
      const res  = await fetch("/api/reports/parse", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rawText, projectId }),
      });
      const data = await res.json();
      if (res.status === 409) {
        toast("error", "This report batch has already been imported.");
        return;
      }
      if (!res.ok) {
        toast("error", data.error ?? "Parsing failed.");
        return;
      }
      setParsed(data.parsed);
      setParsedHash(data.hash);
      setStep("preview");
      toast("success", `Parsed ${data.parsed.members?.length ?? 0} member report(s). Review and save below.`);
    } catch {
      toast("error", "Network error. Please try again.");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      const res  = await fetch("/api/reports/save", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rawText, projectId, hash: parsedHash, parsed }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error ?? "Save failed.");
        return;
      }
      toast("success", `Saved! ${data.created} tasks created, ${data.updated} updated.`);
      setRawText("");
      setParsed(null);
      setStep("paste");
    } catch {
      toast("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateMember = (idx: number, updated: MemberReport) => {
    if (!parsed) return;
    const members = [...parsed.members];
    members[idx]  = updated;
    setParsed({ ...parsed, members });
  };

  const SAMPLE = `Name: Hoàng Kim Lương - ${new Date().toISOString().split("T")[0].replace(/-/g, "/")} (Sáng + Chiều)
Tasks:
1. [ CD - UI ] Thiết kế giao diện Tìm kiếm
   - Progress: 80%
   - Deadline: 03/04
2. Support member
   - Description: Hỗ trợ debug UI
3. [ UTE ] App Đại lý
   - Bugs: 3 (Critical: 0 | Major: 2 | Minor: 1)
   - Fixed: 5
   - Open: 4
   - Progress: 60%
   - Deadline: 02/04
Have trouble: Có nguy cơ chậm task Chatbot 1 ngày nếu không clarify thêm scope
Supported: N/A
Need support: N/A
Next task: Continue - [ CD - UI ] Thiết kế giao diện Tìm kiếm
Link:
1. https://leansolutions.vn/Project_Task/5601`;

  return (
    <div style={{ padding: "2rem" }}>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/projects" style={{ color: "hsl(220 9% 46%)", textDecoration: "none", fontSize: "0.875rem" }}>
              Projects
            </Link>
            <span style={{ color: "hsl(220 9% 70%)" }}>›</span>
            <span style={{ fontSize: "0.875rem", color: "hsl(220 9% 46%)" }}>{project?.name ?? "…"}</span>
          </div>
          <h1 className="page-title">{project?.name ?? "Loading…"}</h1>
          {project?.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href={`/projects/${projectId}/tasks`} className="btn-secondary" id="view-tasks-btn">
            View Tasks
          </Link>
          <Link href={`/projects/${projectId}/reports`} className="btn-secondary" id="view-reports-btn">
            Reports
          </Link>
        </div>
      </div>

      {/* Step tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid hsl(220 13% 91%)", paddingBottom: "0" }}>
        {(["paste", "preview"] as const).map((s) => (
          <button
            key={s}
            id={`step-tab-${s}`}
            onClick={() => step === "preview" && s === "paste" && setStep("paste")}
            style={{
              padding: "0.625rem 1.25rem",
              border: "none",
              background: "none",
              cursor: step === "preview" || s === "paste" ? "pointer" : "default",
              fontWeight: 600,
              fontSize: "0.875rem",
              color: step === s ? "hsl(221 83% 53%)" : "hsl(220 9% 46%)",
              borderBottom: step === s ? "2px solid hsl(221 83% 53%)" : "2px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.15s",
              opacity: s === "preview" && !parsed ? 0.4 : 1,
            }}
            disabled={s === "preview" && !parsed}
          >
            {s === "paste" ? "1 · Paste Reports" : "2 · Review & Save"}
          </button>
        ))}
      </div>

      {step === "paste" && (
        <div className="animate-fade-in">
          <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 700 }}>
                  Paste Daily Reports
                </h2>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "hsl(220 9% 46%)" }}>
                  Paste one or many team members' daily reports using the fixed format.
                </p>
              </div>
              <button
                onClick={() => setRawText(SAMPLE)}
                style={{ fontSize: "0.8rem", color: "hsl(221 83% 53%)", background: "none", border: "1px dashed hsl(221 83% 70%)", borderRadius: 6, padding: "0.35rem 0.75rem", cursor: "pointer", whiteSpace: "nowrap" }}
                id="load-sample-btn"
              >
                Load sample
              </button>
            </div>

            <textarea
              id="raw-report-input"
              className="textarea"
              rows={18}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={"Paste fixed-format daily reports here…\n\nRequired structure:\nName: ... - YYYY/MM/DD (Sáng | Chiều | Sáng + Chiều)\nTasks:\n1. ...\n   - Progress: 80%\n   - Deadline: 03/04\nHave trouble: ...\nSupported: ...\nNeed support: ...\nNext task: ...\nLink:\n1. https://..."}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.8rem", color: "hsl(220 9% 60%)" }}>
                {rawText.length > 0 ? `${rawText.length.toLocaleString()} characters` : ""}
              </span>
              <button
                id="parse-btn"
                className="btn-primary"
                onClick={handleParse}
                disabled={parsing || rawText.trim().length < 10}
              >
                {parsing ? (
                  <>
                    <SpinnerIcon />
                    Parsing…
                  </>
                ) : (
                  <>
                    <MagicIcon />
                    Parse Reports
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "preview" && parsed && (
        <div className="animate-fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 700 }}>
                Review Parsed Reports
              </h2>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "hsl(220 9% 46%)" }}>
                {parsed.members.length} member report(s) detected · Provider: {parsed.provider}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-secondary" onClick={() => setStep("paste")} id="back-to-paste-btn">
                ← Back
              </button>
              <button
                id="save-reports-btn"
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <><SpinnerIcon /> Saving…</>
                ) : (
                  <><SaveIcon /> Save to Database</>
                )}
              </button>
            </div>
          </div>

          {parsed.members.map((member, i) => (
            <MemberReportCard key={i} report={member} index={i} onChange={updateMember} />
          ))}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button
              id="save-reports-bottom-btn"
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ padding: "0.75rem 2rem" }}
            >
              {saving ? "Saving…" : "Save All to Database"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function SpinnerIcon() { return <svg {...iconProps} style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>; }
function MagicIcon()   { return <svg {...iconProps}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/></svg>; }
function SaveIcon()    { return <svg {...iconProps}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
