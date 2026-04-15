"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError("Please enter username and password."); return; }
    setLoading(true);
    setError("");

    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }

      // Redirect to dashboard — server layout will verify cookie
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, hsl(222 47% 8%) 0%, hsl(221 60% 18%) 100%)", padding: "1rem" }}>
      {/* Decorative orbs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "hsl(221 83% 53% / 0.12)", filter: "blur(80px)", top: "-100px", left: "-100px" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "hsl(199 89% 48% / 0.08)", filter: "blur(80px)", bottom: "-80px", right: "-80px" }} />
      </div>

      <div className="animate-fade-in" style={{ background: "hsl(0 0% 100% / 0.05)", border: "1px solid hsl(0 0% 100% / 0.10)", borderRadius: 16, backdropFilter: "blur(16px)", padding: "3rem 2.5rem", width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, hsl(221 83% 53%), hsl(199 89% 48%))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", boxShadow: "0 8px 24px hsl(221 83% 53% / 0.4)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "white", margin: "0 0 0.375rem", letterSpacing: "-0.02em" }}>
            AutoReport
          </h1>
          <p style={{ fontSize: "0.9rem", color: "hsl(220 14% 55%)", margin: 0 }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "hsl(220 14% 65%)", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Username
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              autoFocus
              className="input"
              style={{ background: "hsl(0 0% 100% / 0.08)", border: "1px solid hsl(0 0% 100% / 0.15)", color: "white" }}
              placeholder="your-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "hsl(220 14% 65%)", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="input"
              style={{ background: "hsl(0 0% 100% / 0.08)", border: "1px solid hsl(0 0% 100% / 0.15)", color: "white" }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{ padding: "0.75rem", background: "hsl(0 72% 51% / 0.15)", border: "1px solid hsl(0 72% 51% / 0.4)", borderRadius: 8, color: "hsl(0 72% 75%)", fontSize: "0.875rem", marginBottom: "1.25rem", textAlign: "center" }}>
              {error}
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "0.875rem", background: "hsl(221 83% 53%)", border: "none", borderRadius: 10, color: "white", fontSize: "0.95rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 4px 16px hsl(221 83% 53% / 0.4)" }}
          >
            {loading ? <><SpinnerIcon /> Signing in…</> : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "hsl(220 14% 45%)" }}>
          No account?{" "}
          <Link href="/register" style={{ color: "hsl(221 83% 65%)", textDecoration: "none", fontWeight: 600 }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
    </svg>
  );
}
