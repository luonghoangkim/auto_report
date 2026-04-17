"use client";

import { useMemo, useState } from "react";

type Row = Record<string, unknown>;

interface CollectionTableProps {
  title: string;
  rows: Row[];
  columns: Array<{ key: string; label: string }>;
  defaultCollapsed?: boolean;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function isLikelyDateColumn(key: string): boolean {
  return key.toLowerCase().includes("date") || key.toLowerCase().includes("at");
}

function formatCellByKey(key: string, value: unknown): string {
  if (isLikelyDateColumn(key) && value) {
    const d = new Date(String(value));
    if (!Number.isNaN(d.getTime())) return d.toLocaleString("vi-VN");
  }
  return formatCell(value);
}

function CollectionTable({ title, rows, columns, defaultCollapsed = false }: CollectionTableProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [keyword, setKeyword] = useState("");

  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      columns.some((c) => formatCellByKey(c.key, row[c.key]).toLowerCase().includes(q))
    );
  }, [rows, columns, keyword]);

  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: collapsed ? "none" : "1px solid hsl(220 13% 91%)",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <span>
          {title} ({filteredRows.length}/{rows.length})
        </span>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setCollapsed((v) => !v)}
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
        >
          {collapsed ? "Expand" : "Thu nhỏ"}
        </button>
      </div>

      {!collapsed && (
        <>
          <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid hsl(220 13% 91%)" }}>
            <input
              className="input"
              placeholder={`Filter ${title.toLowerCase()}...`}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ maxWidth: 360 }}
            />
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} style={{ textAlign: "center", color: "hsl(220 9% 46%)" }}>
                      No matching records
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={String(row._id)}>
                      {columns.map((col) => (
                        <td key={col.key}>{formatCellByKey(col.key, row[col.key])}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

interface AdminCollectionsProps {
  users: Row[];
  projects: Row[];
  tasks: Row[];
  dailyReports: Row[];
  parsedReports: Row[];
  reportExports: Row[];
}

export default function AdminCollections(props: AdminCollectionsProps) {
  return (
    <>
      <CollectionTable
        title="Users"
        rows={props.users}
        columns={[
          { key: "_id", label: "_id" },
          { key: "username", label: "Username" },
          { key: "name", label: "Name" },
          { key: "role", label: "Role" },
          { key: "createdAt", label: "Created At" },
        ]}
      />
      <CollectionTable
        title="Projects"
        rows={props.projects}
        columns={[
          { key: "_id", label: "_id" },
          { key: "name", label: "Name" },
          { key: "status", label: "Status" },
          { key: "createdBy", label: "Created By" },
          { key: "createdAt", label: "Created At" },
        ]}
      />
      <CollectionTable
        title="Tasks"
        rows={props.tasks}
        columns={[
          { key: "_id", label: "_id" },
          { key: "title", label: "Title" },
          { key: "picName", label: "PIC" },
          { key: "status", label: "Status" },
          { key: "progress", label: "Progress" },
          { key: "createdAt", label: "Created At" },
        ]}
      />
      <CollectionTable
        title="Daily Reports"
        rows={props.dailyReports}
        columns={[
          { key: "_id", label: "_id" },
          { key: "projectId", label: "Project ID" },
          { key: "createdBy", label: "Created By" },
          { key: "reportDate", label: "Report Date" },
          { key: "createdAt", label: "Created At" },
        ]}
      />
      <CollectionTable
        title="Parsed Reports"
        rows={props.parsedReports}
        columns={[
          { key: "_id", label: "_id" },
          { key: "dailyReportId", label: "Daily Report ID" },
          { key: "aiProvider", label: "Provider" },
          { key: "parseStatus", label: "Status" },
          { key: "memberCount", label: "Members" },
          { key: "createdAt", label: "Created At" },
        ]}
      />
      <CollectionTable
        title="Report Exports"
        rows={props.reportExports}
        columns={[
          { key: "_id", label: "_id" },
          { key: "projectId", label: "Project ID" },
          { key: "type", label: "Type" },
          { key: "fileName", label: "File Name" },
          { key: "createdBy", label: "Created By" },
          { key: "createdAt", label: "Created At" },
        ]}
      />
    </>
  );
}
