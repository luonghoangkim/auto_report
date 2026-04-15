"use client";
import { useState, useCallback, createContext, useContext, useEffect } from "react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastCtx {
  toast: (type: Toast["type"], message: string) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-viewport">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast: t, onClose }: { toast: Toast; onClose: () => void }) {
  const colors: Record<Toast["type"], string> = {
    success: "hsl(142 71% 45%)",
    error:   "hsl(0 72% 51%)",
    info:    "hsl(199 89% 48%)",
  };
  const icons: Record<Toast["type"], string> = {
    success: "✓",
    error:   "✗",
    info:    "ℹ",
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        background: "hsl(222 47% 11%)",
        border: `1px solid ${colors[t.type]}40`,
        borderLeft: `3px solid ${colors[t.type]}`,
        borderRadius: 8,
        padding: "0.875rem 1rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        color: "white",
        fontSize: "0.875rem",
        cursor: "pointer",
        minWidth: 280,
      }}
      onClick={onClose}
    >
      <span
        style={{
          width: 20, height: 20,
          borderRadius: "50%",
          background: `${colors[t.type]}20`,
          color: colors[t.type],
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.75rem", flexShrink: 0,
        }}
      >
        {icons[t.type]}
      </span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
    </div>
  );
}
