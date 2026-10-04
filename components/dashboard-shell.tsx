"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "./app-provider";
import { BrandMark, Icon, type IconName } from "./icon";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { AdminPreview } from "./admin-preview";
import { logout } from "@/lib/auth/session";
import type { MockState, Role } from "@/lib/api/types";
export const screens = [
  "overview",
  "campuses",
  "growth",
  "sparks",
  "retention",
] as const;
export type Screen = (typeof screens)[number];
export const screenName = (screen: string) =>
  screen.charAt(0).toUpperCase() + screen.slice(1);
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    router = useRouter();
  const active = pathname.split("/")[1] || "overview";
  const { session, switchRole, state, setState, theme, toggleTheme } = useApp();
  const [adminOpen, setAdminOpen] = useState(false);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/overview" className="brand">
          <BrandMark />
          <div>
            Mad Monkey<span>ANALYTICS</span>
          </div>
        </Link>
        <div className="workspace-tag">
          <span className="workspace-symbol">M</span>
          <div>
            Mad Monkey AI<small>Internal workspace</small>
          </div>
          <Icon name="chevron" size={14} />
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Main navigation" className="desktop-nav">
          {screens.map((screen) => (
            <Link
              key={screen}
              href={`/${screen}`}
              aria-current={active === screen ? "page" : undefined}
            >
              <Icon name={screen as IconName} />
              <span>{screenName(screen)}</span>
              {active === screen && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Icon name="sparks" size={19} />
            <strong>
              Small sparks.
              <br />
              Stronger communities.
            </strong>
            <p>Understand what keeps your campuses connected.</p>
          </div>
          <div className="sidebar-profile">
            <span className="avatar">MM</span>
            <div>
              Mad Monkey
              <small>
                {session.role === "campus_lead"
                  ? "Campus lead"
                  : session.role === "admin"
                    ? "Administrator"
                    : "Executive view"}
              </small>
            </div>
            <button
              aria-label="Sign out"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>{screenName(active)}</strong>
          </div>
          <div className="header-actions">
            <Badge className="preview-badge">
              <span className="status-dot" />
              Mock data
            </Badge>
            {process.env.NODE_ENV === "development" && (
              <>
                <select
                  className="role-select"
                  aria-label="Preview role"
                  value={session.role}
                  onChange={(e) => {
                    setAdminOpen(false);
                    switchRole(e.target.value as Role);
                  }}
                >
                  <option value="ceo">CEO view</option>
                  <option value="admin">Admin view</option>
                  <option value="campus_lead">Campus lead</option>
                </select>
                <select
                  className="state-select"
                  aria-label="Preview data state"
                  value={state}
                  onChange={(e) => setState(e.target.value as MockState)}
                >
                  <option value="success">Live preview</option>
                  <option value="loading">Loading state</option>
                  <option value="empty">Empty state</option>
                  <option value="error">Error state</option>
                </select>
              </>
            )}
            {session.role === "admin" && (
              <Button
                variant="outline"
                size="sm"
                aria-label="Manage users"
                onClick={() => setAdminOpen(true)}
              >
                <Icon name="users" size={14} />
                <span>Manage users</span>
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              onClick={toggleTheme}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </Button>
            <span className="header-avatar">
              {session.role === "ceo"
                ? "EX"
                : session.role === "admin"
                  ? "AD"
                  : "CL"}
            </span>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {children}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {screens.map((screen) => (
          <Link
            href={`/${screen}`}
            key={screen}
            aria-current={active === screen ? "page" : undefined}
          >
            <Icon name={screen as IconName} />
            <span>{screenName(screen)}</span>
          </Link>
        ))}
      </nav>
      {adminOpen && session.role === "admin" && (
        <AdminPreview onClose={() => setAdminOpen(false)} />
      )}
    </div>
  );
}
