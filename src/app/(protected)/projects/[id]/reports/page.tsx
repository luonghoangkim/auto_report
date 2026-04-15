"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/components/layout/Toast";

type ReportType = "weekly" | "monthly" | "project";

interface ExportRecord {
  _id: string;
  type: ReportType;
  fileName: string;
  createdAt: string;
  dateRange: { from: string; to: string };
}

const TYPE_LABELS: Record<ReportType, string> = {
  weekly:  "Weekly Report",
  monthly: "Monthly Report",
  project: "Project Progress Report",
};

export default function ReportsPage() {
  const params    = useParams();
  const projectId = params.id as string;
  const { toast } = useToast();

  const [reportType, setReportType] = useState<ReportType>("weekly");
  const [from, setFrom]             = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);
  const [content, setContent]       = useState("");
  const [exportId, setExportId]     = useState("");
  const [fileName, setFileName]     = useState("");
  const [history, setHistory]       = useState<ExportRecord[]>([]);

  // Fetch export history
  useEffect(() => {
    // We'll skip history for MVP simplicity — can be added via a separate API
  }, [projectId]);

  const generate = async () => {
    if (!from || !to) { toast("error", "Please select date range."); return; }
    setGenerating(true);
    setContent("");
    setExportId("");
    try {
      const res = await fetch(`/api/generate/${reportType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, from, to }),
      });
      const data = await res.json();
      if (!res.ok) { toast("error", data.error ?? "Generation failed."); return; }
      setContent(data.content);
      setExportId(data.exportId);
      setFileName(data.fileName);
      toast("success", "Report generated! Preview below.");
    } catch {
      toast("error", "Network error.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadDocx = () => {
    if (!exportId) return;
    window.location.href = `/api/export?exportId=${exportId}`;
    toast("info", "Downloading DOCX file…");
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
            <span style={{ fontSize: "0.875rem", color: "hsl(220 9% 46%)" }}>Reports</span>
          </div>
          <h1 className="page-title">Generate Reports</h1>
          <p className="page-subtitle">Create weekly, monthly, or project progress reports</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Settings panel */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700 }}>Report Settings</h2>

          {/* Report type */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label className="section-label">Report Type</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(["weekly", "monthly", "project"] as ReportType[]).map((t) => (
                <label
                  key={t}
                  id={`report-type-${t}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.625rem 0.875rem",
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor: reportType === t ? "hsl(221 83% 53%)" : "hsl(220 13% 91%)",
                    background: reportType === t ? "hsl(221 83% 53% / 0.08)" : "white",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={t}
                    checked={reportType === t}
                    onChange={() => setReportType(t)}
                    style={{ accentColor: "hsl(221 83% 53%)" }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{TYPE_LABELS[t]}</div>
                    <div style={{ fontSize: "0.75rem", color: "hsl(220 9% 46%)" }}>
                      {t === "weekly" ? "Last 7 days" : t === "monthly" ? "Last 30 days" : "Full project"}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label className="section-label">Date Range</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "hsl(220 9% 46%)", display: "block", marginBottom: "0.25rem" }}>From</label>
                <input
                  id="report-from-date"
                  type="date"
                  className="input"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "hsl(220 9% 46%)", display: "block", marginBottom: "0.25rem" }}>To</label>
                <input
                  id="report-to-date"
                  type="date"
                  className="input"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            id="generate-report-btn"
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
            onClick={generate}
            disabled={generating}
          >
            {generating ? (
              <><SpinnerIcon /> Generating…</>
            ) : (
              <><ReportIcon /> Generate Report</>
            )}
          </button>
        </div>

        {/* Preview panel */}
        <div>
          {content ? (
            <div className="card animate-fade-in">
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid hsl(220 13% 91%)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{TYPE_LABELS[reportType]}</div>
                  <div style={{ fontSize: "0.8rem", color: "hsl(220 9% 46%)" }}>Preview</div>
                </div>
                <button
                  id="download-docx-btn"
                  className="btn-primary"
                  onClick={downloadDocx}
                  disabled={!exportId}
                >
                  <DownloadIcon />
                  Download DOCX
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "1.5rem",
                  fontFamily: "inherit",
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "hsl(222 47% 11%)",
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                {content}
              </pre>
              <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid hsl(220 13% 91%)", display: "flex", justifyContent: "flex-end" }}>
                <button
                  id="download-docx-bottom-btn"
                  className="btn-primary"
                  onClick={downloadDocx}
                  disabled={!exportId}
                >
                  <DownloadIcon />
                  Download DOCX — {fileName}
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state card" style={{ minHeight: 360 }}>
              <ReportBigIcon />
              <h3>No report generated yet</h3>
              <p>Configure settings and click "Generate Report" to preview your report here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function SpinnerIcon()  { return <svg {...iconProps} style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>; }
function ReportIcon()   { return <svg {...iconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function DownloadIcon() { return <svg {...iconProps}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function ReportBigIcon(){ return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
