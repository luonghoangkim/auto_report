"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/layout/Toast";

type ItemType = "logtime" | "meeting" | "report" | "task_planning";

interface CheckDailyItem {
  type: ItemType;
  isChecked: boolean;
  checkedAt?: string | null;
}

interface CheckDailyPayload {
  _id: string;
  date: string;
  status: "in_progress" | "completed";
  progress: { completed: number; total: number };
  items: CheckDailyItem[];
}

const ITEM_LABELS: Record<ItemType, string> = {
  logtime: "Check user logtime",
  meeting: "Conduct daily meeting",
  report: "Review daily reports",
  task_planning: "Create tasks for tomorrow",
};

export default function CheckDailyClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CheckDailyPayload | null>(null);
  const { toast } = useToast();

  const itemMap = useMemo(() => {
    const map = new Map<ItemType, CheckDailyItem>();
    for (const item of data?.items ?? []) {
      map.set(item.type, item);
    }
    return map;
  }, [data?.items]);

  async function load() {
    setLoading(true);
    try {
      const todayRes = await fetch("/api/checkdaily/today");
      const todayData = await todayRes.json();
      if (!todayRes.ok) {
        toast("error", todayData.error ?? "Failed to load CheckDaily");
        return;
      }
      setData(todayData.checkDaily);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateItem(type: ItemType, isChecked: boolean) {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/checkdaily/${data._id}/items/${type}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isChecked }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast("error", payload.error ?? "Failed to save");
        return;
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              status: payload.status,
              progress: payload.progress,
              items: prev.items.map((i) =>
                i.type === type
                  ? { ...i, isChecked, checkedAt: isChecked ? new Date().toISOString() : null }
                  : i
              ),
            }
          : prev
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) {
    return (
      <div style={{ padding: "2rem" }}>
        <div className="skeleton" style={{ height: 160 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">CheckDaily</h1>
          <p className="page-subtitle">
            {new Date(data.date).toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
        <span className={`badge badge-${data.status === "completed" ? "done" : "doing"}`}>
          {data.progress.completed}/{data.progress.total} completed
        </span>
      </div>

      <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Daily Checklist</div>
        <div style={{ display: "grid", gap: "0.625rem" }}>
          {(Object.keys(ITEM_LABELS) as ItemType[]).map((type) => (
            <label key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(itemMap.get(type)?.isChecked)}
                onChange={(e) => updateItem(type, e.target.checked)}
                disabled={saving}
              />
              <span style={{ fontSize: "0.95rem" }}>{ITEM_LABELS[type]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
