"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/layout/AuthProvider";

interface NavItem {
  href:  string;
  label: string;
  icon:  React.ReactNode;
}

function getNavItems(projectId?: string): NavItem[] {
  const base: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: <HomeIcon /> },
    { href: "/projects",  label: "Projects",  icon: <FolderIcon /> },
  ];

  if (projectId) {
    base.push(
      { href: `/projects/${projectId}`,         label: "Import Reports",   icon: <UploadIcon /> },
      { href: `/projects/${projectId}/tasks`,   label: "Task List",        icon: <CheckIcon /> },
      { href: `/projects/${projectId}/reports`, label: "Generate Reports", icon: <ReportIcon /> }
    );
  }

  return base;
}

export default function Sidebar({ projectId }: { projectId?: string }) {
  const pathname  = usePathname();
  const { user, logout } = useAuth();
  const navItems  = getNavItems(projectId);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "1px solid hsl(0 0% 100% / 0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, hsl(221 83% 53%), hsl(199 89% 48%))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}>AutoReport</div>
            <div style={{ color: "hsl(220 14% 55%)", fontSize: "0.7rem" }}>Team Manager</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "1rem 0.75rem", flex: 1 }}>
        <div className="section-label" style={{ padding: "0 0.5rem", color: "hsl(220 14% 40%)" }}>
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/projects" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                padding: "0.625rem 0.75rem", borderRadius: 8, marginBottom: "0.25rem",
                textDecoration: "none", fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "white" : "hsl(220 14% 62%)",
                background: isActive ? "hsl(221 83% 53% / 0.2)" : "transparent",
                border: isActive ? "1px solid hsl(221 83% 53% / 0.3)" : "1px solid transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "hsl(0 0% 100% / 0.06)"; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      {user && (
        <div style={{ padding: "0.75rem", borderTop: "1px solid hsl(0 0% 100% / 0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "hsl(221 83% 53%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>
              {(user.name ?? user.username).charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "white", fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name ?? user.username}
              </div>
              <div style={{ color: "hsl(220 14% 45%)", fontSize: "0.7rem" }}>
                @{user.username} · {user.role}
              </div>
            </div>
          </div>
          <button
            id="signout-btn"
            onClick={logout}
            style={{ width: "100%", marginTop: "0.35rem", padding: "0.5rem", background: "transparent", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 8, color: "hsl(220 14% 50%)", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", transition: "all 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(0 72% 51% / 0.15)"; (e.currentTarget as HTMLButtonElement).style.color = "hsl(0 72% 65%)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "hsl(220 14% 50%)"; }}
          >
            <LogoutIcon /> Sign out
          </button>
        </div>
      )}
    </aside>
  );
}

const ip = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function HomeIcon()   { return <svg {...ip}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function FolderIcon() { return <svg {...ip}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
function UploadIcon() { return <svg {...ip}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>; }
function CheckIcon()  { return <svg {...ip}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function ReportIcon() { return <svg {...ip}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function LogoutIcon() { return <svg {...ip}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
