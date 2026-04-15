"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router   = useRouter();
  const [form, setForm]     = useState({ username: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.username.trim().length < 3) { setError("Username must be at least 3 characters."); return; }
    if (form.password.length < 6)        { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: form.username.trim(), password: form.password, name: form.name.trim() || undefined }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error ?? "Registration failed."); return; }

      // Auto-login after register
      const loginRes  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: form.username.trim(), password: form.password }),
      });
      if (loginRes.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, hsl(222 47% 8%) 0%, hsl(221 60% 18%) 100%)", padding: "1rem" }}>
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "hsl(221 83% 53% / 0.12)", filter: "blur(80px)", top: "-100px", left: "-100px" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "hsl(199 89% 48% / 0.08)", filter: "blur(80px)", bottom: "-80px", right: "-80px" }} />
      </div>

      <div className="animate-fade-in" style={{ background: "hsl(0 0% 100% / 0.05)", border: "1px solid hsl(0 0% 100% / 0.10)", borderRadius: 16, backdropFilter: "blur(16px)", padding: "3rem 2.5rem", width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>

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
            Create Account
          </h1>
          <p style={{ fontSize: "0.85rem", color: "hsl(220 14% 50%)", margin: 0 }}>
            First registered user becomes admin
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            { id: "register-name",     label: "Display Name (optional)", field: "name",     type: "text",     placeholder: "Nguyen Van A",        auto: "name" },
            { id: "register-username", label: "Username *",               field: "username", type: "text",     placeholder: "yourname",            auto: "username" },
            { id: "register-password", label: "Password *",               field: "password", type: "password", placeholder: "Min. 6 characters",   auto: "new-password" },
          ].map(({ id, label, field, type, placeholder, auto }) => (
            <div key={field} style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "hsl(220 14% 65%)", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
              </label>
              <input
                id={id}
                type={type}
                autoComplete={auto}
                className="input"
                style={{ background: "hsl(0 0% 100% / 0.08)", border: "1px solid hsl(0 0% 100% / 0.15)", color: "white" }}
                placeholder={placeholder}
                value={(form as any)[field]}
                onChange={(e) => update(field, e.target.value)}
                disabled={loading}
              />
            </div>
          ))}

          {error && (
            <div style={{ padding: "0.75rem", background: "hsl(0 72% 51% / 0.15)", border: "1px solid hsl(0 72% 51% / 0.4)", borderRadius: 8, color: "hsl(0 72% 75%)", fontSize: "0.875rem", marginBottom: "1.25rem", textAlign: "center" }}>
              {error}
            </div>
          )}

          <button
            id="register-submit-btn"
            type="submit"
            disabled={loading}
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.875rem", background: "hsl(221 83% 53%)", border: "none", borderRadius: 10, color: "white", fontSize: "0.95rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.2s", boxShadow: "0 4px 16px hsl(221 83% 53% / 0.4)" }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "hsl(220 14% 45%)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "hsl(221 83% 65%)", textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
