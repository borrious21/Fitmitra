// src/pages/protected/Admin/AdminLayout.jsx

import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import styles from "./AdminLayout.module.css";

const NAV = [
  { path: "/admin",               label: "Dashboard",     icon: "🛡️", exact: true  },
  { path: "/admin/users",         label: "Users",         icon: "👥"               },
  { path: "/admin/analytics",     label: "Analytics",     icon: "📊"               },
  { path: "/admin/meals",         label: "Meals",         icon: "🍽️"               },
  { path: "/admin/exercises",     label: "Exercises",     icon: "💪"               },
  { path: "/admin/plans",         label: "Plans",         icon: "📋"               },
  { path: "/admin/logs",          label: "Logs",          icon: "📝"               },
  { path: "/admin/notifications", label: "Notifications", icon: "🔔"               }
];

function Avatar({ name, url, size = 34 }) {
  const [err, setErr] = useState(false);
  const initials = name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "AD";
  if (url && !err) {
    return (
      <img src={url} alt={name} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #FF5C1A, #FF8A3D)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 800, color: "#fff",
    }}>
      {initials}
    </div>
  );
}

export default function AdminLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [authUser,  setAuthUser]  = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token") ?? localStorage.getItem("accessToken");
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
      setAuthUser({
        name:       payload.name       ?? payload.username ?? "Admin",
        email:      payload.email      ?? "",
        role:       payload.role       ?? "admin",
        avatar_url: payload.avatar_url ?? null,
      });
    } catch {}
  }, []);

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  };

  return (
    <div className={styles.shell}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={[
        styles.sidebar,
        collapsed   ? styles.collapsed   : "",
        mobileOpen  ? styles.mobileOpen  : "",
      ].join(" ")}>

        {/* Logo */}
        <div className={styles.logo} onClick={() => handleNav("/admin")}>
          <span className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </span>
          {!collapsed && (
            <span className={styles.logoText}>FIT<span>MITRA</span></span>
          )}
        </div>

        {!collapsed && (
          <div className={styles.adminBadge}>Admin Panel</div>
        )}

        {/* Nav items */}
        <nav className={styles.nav}>
          {NAV.map(item => (
            <button
              key={item.path}
              className={[styles.navBtn, isActive(item) ? styles.navBtnActive : ""].join(" ")}
              onClick={() => handleNav(item.path)}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              {isActive(item) && <div className={styles.activeBar} />}
            </button>
          ))}
        </nav>

        {/* Bottom: user info + collapse toggle */}
        <div className={styles.sidebarBottom}>
          {/* Back to app */}
          <button
            className={styles.backBtn}
            onClick={() => navigate("/dashboard")}
            title={collapsed ? "Back to App" : undefined}
          >
            <span className={styles.navIcon}>↩</span>
            {!collapsed && <span className={styles.navLabel}>Back to App</span>}
          </button>

          {/* User info */}
          {authUser && (
            <div className={styles.userInfo} title={collapsed ? authUser.name : undefined}>
              <Avatar name={authUser.name} url={authUser.avatar_url} size={32} />
              {!collapsed && (
                <div className={styles.userMeta}>
                  <span className={styles.userName}>{authUser.name}</span>
                  <span className={styles.userRole}>{authUser.role}</span>
                </div>
              )}
              {!collapsed && (
                <button className={styles.signOutBtn} onClick={handleSignOut} title="Sign out">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Collapse toggle */}
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span style={{ transform: collapsed ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform .25s" }}>
              ◀
            </span>
          </button>
        </div>
      </aside>

      {/* Main content area  */}
      <div className={[styles.main, collapsed ? styles.mainCollapsed : ""].join(" ")}>

        {/* Top bar */}
        <header className={styles.topbar}>
          {/* Mobile hamburger */}
          <button className={styles.hamburger} onClick={() => setMobileOpen(o => !o)}>
            ☰
          </button>
          {/* Current page name */}
          <div className={styles.topbarTitle}>
            {NAV.find(n => isActive(n))?.label ?? "Admin"}
          </div>
          {/* Date */}
          <div className={styles.topbarRight}>
            <span className={styles.topbarDate}>
              {new Date().toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" })}
            </span>
          </div>
        </header>

        {/* Page content — Outlet renders the child route */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}