// src/pages/protected/Admin/AdminDashboard.jsx
import { useState, Suspense, lazy, useEffect, useRef } from "react";
import { Toast, Spinner } from "./AdminComponents";
import "./AdminDashboard.css";

const IC = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  users:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  meals:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  exercise:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4v16M18 4v16M6 12h12M3 8h3m12 0h3M3 16h3m12 0h3"/></svg>,
  plans:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  logs:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  analytics: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  bell:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

const AdminOverview  = lazy(() => import("./Sections/AdminOverview"));
const AdminUsers     = lazy(() => import("./Sections/AdminUsers"));
// const AdminMeals     = lazy(() => import("./Sections/AdminMeals"));         // TODO
// const AdminExercises = lazy(() => import("./Sections/AdminExercises"));     // TODO
// const AdminPlans     = lazy(() => import("./Sections/AdminPlans"));         // TODO
// const AdminLogs      = lazy(() => import("./Sections/AdminLogs"));          // TODO
// const AdminAnalytics = lazy(() => import("./Sections/AdminAnalytics"));     // TODO
// const AdminNotifications = lazy(() => import("./Sections/AdminNotifications")); // TODO

const ComingSoon = ({ label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: "0.75rem", color: "#525D72" }}>
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
      {label} — Coming Soon
    </span>
  </div>
);

const NAV = [
  { key: "overview",      label: "Dashboard",     icon: IC.dashboard },
  { key: "users",         label: "Users",         icon: IC.users     },
  { key: "meals",         label: "Meals",         icon: IC.meals     },
  { key: "exercises",     label: "Exercises",     icon: IC.exercise  },
  { key: "plans",         label: "Plans",         icon: IC.plans     },
  { key: "logs",          label: "Logs",          icon: IC.logs      },
  { key: "analytics",     label: "Analytics",     icon: IC.analytics },
  { key: "notifications", label: "Notifications", icon: IC.bell      },
];

function initials(name) {
  if (!name) return "AD";
  return name.trim().split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function Toggle({ on, onClick }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      style={{
        position: "relative", width: 36, height: 20,
        background: on ? "#FF5C1A" : "rgba(255,255,255,0.1)",
        borderRadius: 10, border: "none", cursor: "pointer",
        transition: "background 0.25s",
        boxShadow: on ? "0 0 10px rgba(255,92,26,0.4)" : "none",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: 2,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
        transform: on ? "translateX(16px)" : "translateX(0)",
        display: "block",
      }} />
    </button>
  );
}

// ── Settings Row ──────────────────────────────────────────────
function SettingsRow({ icon, iconBg, iconBorder, title, sub, right, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: "0.875rem",
        padding: "0.875rem 1rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        cursor: onClick ? "pointer" : "default",
        background: hover && onClick ? "rgba(255,255,255,0.025)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: iconBg, border: `1px solid ${iconBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1rem", flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#F0F2F5" }}>{title}</div>
        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{sub}</div>
      </div>
      {right}
    </div>
  );
}

// ── Admin Settings Panel (slide-over) ────────────────────────
function AdminSettingsPanel({ authUser, onClose }) {
  const name       = authUser?.name        ?? "Admin";
  const email      = authUser?.email       ?? "";
  const role       = authUser?.role        ?? "admin";
  const isVerified = authUser?.is_verified ?? false;
  const avatarUrl  = authUser?.avatar_url  ?? null;

  const [notifs,    setNotifs]    = useState(true);
  const [reminders, setReminders] = useState(false);
  const [darkMode,  setDarkMode]  = useState(true);
  const [tab,       setTab]       = useState("profile");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  };

  const tabs = [
    { key: "profile",  label: "Profile"  },
    { key: "settings", label: "Settings" },
    { key: "security", label: "Security" },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 500, animation: "fadeIn 0.2s ease" }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed", top: 0, right: 0,
          width: 360, height: "100vh",
          background: "#0F1217",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 600,
          display: "flex", flexDirection: "column",
          animation: "slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)",
          overflowY: "auto",
          boxShadow: "-24px 0 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "1.25rem 1.25rem 0", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#0F1217", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: "#F0F2F5" }}>
              Admin Profile
            </span>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#9AA3B4", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#F0F2F5"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#9AA3B4"; }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: "0.25rem", paddingBottom: "0.125rem" }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: "0.55rem 0.5rem", border: "none", background: "transparent", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: tab === t.key ? "#FF5C1A" : "#525D72", borderBottom: tab === t.key ? "2px solid #FF5C1A" : "2px solid transparent", transition: "all 0.2s" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Tab */}
        {tab === "profile" && (
          <div style={{ flex: 1 }}>
            <div style={{ padding: "1.75rem 1.25rem 1.25rem", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(255,92,26,0.04) 0%, transparent 100%)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,92,26,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 1rem", background: avatarUrl ? "transparent" : "linear-gradient(135deg,#FF5C1A,#FF8A3D)", border: "3px solid rgba(255,92,26,0.5)", boxShadow: "0 0 0 4px rgba(255,92,26,0.12), 0 8px 32px rgba(255,92,26,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 900, color: "#fff", overflow: "hidden" }}>
                {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(name)}
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.5rem", fontWeight: 900, color: "#F0F2F5", letterSpacing: "0.04em" }}>{name}</div>
              <div style={{ fontSize: "0.72rem", color: "#525D72", margin: "0.25rem 0 0.75rem" }}>{email}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                <span style={{ padding: "0.22rem 0.75rem", borderRadius: 6, fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", background: "rgba(255,92,26,0.12)", color: "#FF5C1A", border: "1px solid rgba(255,92,26,0.22)" }}>{role}</span>
                {isVerified && <span style={{ padding: "0.22rem 0.75rem", borderRadius: 6, fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>✓ Verified</span>}
              </div>
            </div>
            <div style={{ padding: "0.75rem 0" }}>
              <div style={{ padding: "0.25rem 1rem 0.5rem", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Account</div>
              <SettingsRow icon="👤" iconBg="rgba(255,92,26,0.08)" iconBorder="rgba(255,92,26,0.2)" title="Profile & Settings" sub="Edit profile, goals, health data" right={<span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem" }}>→</span>} onClick={() => { window.location.href = "/profile"; onClose?.(); }} />
              <SettingsRow icon="📊" iconBg="rgba(0,200,224,0.08)" iconBorder="rgba(0,200,224,0.2)" title="View as User" sub="Switch to the user-facing dashboard" right={<span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem" }}>→</span>} onClick={() => { window.location.href = "/dashboard"; onClose?.(); }} />
            </div>
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={handleSignOut} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.07)", color: "#ef4444", cursor: "pointer", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.14)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.07)"}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === "settings" && (
          <div style={{ flex: 1 }}>
            <div style={{ padding: "1rem 0" }}>
              <div style={{ padding: "0.5rem 1rem 0.5rem", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Notifications</div>
              <SettingsRow icon="🔔" iconBg="rgba(0,200,224,0.08)" iconBorder="rgba(0,200,224,0.2)" title="Push Notifications" sub="System alerts and activity updates" right={<Toggle on={notifs} onClick={() => setNotifs(v => !v)} />} onClick={() => setNotifs(v => !v)} />
              <SettingsRow icon="⏰" iconBg="rgba(255,92,26,0.08)" iconBorder="rgba(255,92,26,0.2)" title="Daily Reminders" sub="Morning check-in prompts" right={<Toggle on={reminders} onClick={() => setReminders(v => !v)} />} onClick={() => setReminders(v => !v)} />
              <div style={{ padding: "1rem 1rem 0.5rem", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Appearance</div>
              <SettingsRow icon="🌙" iconBg="rgba(184,240,0,0.06)" iconBorder="rgba(184,240,0,0.18)" title="Dark Mode" sub="Toggle light / dark theme" right={<Toggle on={darkMode} onClick={() => setDarkMode(v => !v)} />} onClick={() => setDarkMode(v => !v)} />
              <div style={{ padding: "1rem 1rem 0.5rem", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Admin</div>
              <SettingsRow icon="📋" iconBg="rgba(168,85,247,0.08)" iconBorder="rgba(168,85,247,0.2)" title="Audit Logs" sub="View admin action history" right={<span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem" }}>→</span>} onClick={() => {}} />
              <SettingsRow icon="⚙️" iconBg="rgba(255,92,26,0.08)" iconBorder="rgba(255,92,26,0.2)" title="System Settings" sub="App configuration & feature flags" right={<span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem" }}>→</span>} onClick={() => {}} />
              <SettingsRow icon="ℹ️" iconBg="rgba(0,200,224,0.08)" iconBorder="rgba(0,200,224,0.2)" title="About FitMitra" sub="Version 2.0 · Admin Build" right={<span style={{ fontSize: "0.65rem", color: "#525D72" }}>v2.0</span>} />
            </div>
          </div>
        )}

        {/* Security Tab */}
        {tab === "security" && (
          <div style={{ flex: 1 }}>
            <div style={{ padding: "1rem 0" }}>
              <div style={{ padding: "0.5rem 1rem 0.5rem", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Authentication</div>
              <SettingsRow icon="🔑" iconBg="rgba(184,240,0,0.06)" iconBorder="rgba(184,240,0,0.18)" title="Change Password" sub="Update your login credentials" right={<span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem" }}>→</span>} onClick={() => { window.location.href = "/profile#security"; onClose?.(); }} />
              <SettingsRow icon="🛡️" iconBg="rgba(0,200,224,0.08)" iconBorder="rgba(0,200,224,0.2)" title="Two-Factor Auth" sub="Add an extra layer of protection" right={<span style={{ padding: "0.15rem 0.5rem", borderRadius: 5, fontSize: "0.55rem", fontWeight: 700, background: "rgba(255,92,26,0.1)", color: "#FF5C1A", border: "1px solid rgba(255,92,26,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Off</span>} onClick={() => {}} />
              <div style={{ padding: "1rem 1rem 0.5rem", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Privacy</div>
              <SettingsRow icon="🔒" iconBg="rgba(255,92,26,0.08)" iconBorder="rgba(255,92,26,0.2)" title="Privacy & Permissions" sub="Manage your data and access" right={<span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem" }}>→</span>} onClick={() => {}} />
              <SettingsRow icon="📱" iconBg="rgba(168,85,247,0.08)" iconBorder="rgba(168,85,247,0.2)" title="Active Sessions" sub="Devices currently logged in" right={<span style={{ fontSize: "0.65rem", color: "#525D72" }}>1 active</span>} onClick={() => {}} />
              <div style={{ margin: "1.5rem 1rem 0" }}>
                <div style={{ borderRadius: 12, border: "1px solid rgba(239,68,68,0.18)", background: "rgba(239,68,68,0.04)", overflow: "hidden" }}>
                  <div style={{ padding: "0.875rem 1rem 0.5rem", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#ef4444" }}>⚠️ Danger Zone</div>
                  <div style={{ padding: "0 1rem 0.75rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.55 }}>Permanently delete your admin account. This cannot be undone.</div>
                  <div style={{ padding: "0 1rem 1rem" }}>
                    <button style={{ width: "100%", padding: "0.625rem 1rem", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.14)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}>🗑️ Delete Admin Account</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}

function TopbarUser() {
  const [authUser, setAuthUser] = useState(null);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") ?? localStorage.getItem("accessToken");
    if (!token) { setLoading(false); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
      setAuthUser({
        name:        payload.name        ?? payload.username ?? null,
        email:       payload.email       ?? null,
        role:        payload.role        ?? "admin",
        is_verified: payload.is_verified ?? payload.verified ?? false,
        avatar_url:  payload.avatar_url  ?? null,
      });
    } catch {}
    setLoading(false);
  }, []);

  return (
    <>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {authUser && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#F0F2F5", whiteSpace: "nowrap", lineHeight: 1.2 }}>{authUser.name ?? "Admin"}</div>
            <div style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FF5C1A" }}>{authUser.role}</div>
          </div>
        )}
        <button onClick={() => setOpen(o => !o)} title="Profile & Settings" style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid", borderColor: open ? "#FF5C1A" : "rgba(255,92,26,0.35)", background: authUser?.avatar_url ? "transparent" : "linear-gradient(135deg,#FF5C1A,#FF8A3D)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, overflow: "hidden", flexShrink: 0, boxShadow: open ? "0 0 0 3px rgba(255,92,26,0.2)" : "0 0 12px rgba(255,92,26,0.3)", transition: "border-color 0.2s, box-shadow 0.2s" }}>
          {loading
            ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
            : authUser?.avatar_url
              ? <img src={authUser.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#fff" }}>{initials(authUser?.name)}</span>
          }
        </button>
      </div>
      {open && <AdminSettingsPanel authUser={authUser} onClose={() => setOpen(false)} />}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes riseIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}

export default function AdminDashboard() {
  const [section,  setSection]  = useState("overview");
  const [toast,    setToast]    = useState(null);
  const [sideOpen, setSideOpen] = useState(true);

  useEffect(() => {
    const id = "fitmitra-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id; link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Outfit:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const activeNav = NAV.find(n => n.key === section);

  const SectionComponent = {
    overview:      <AdminOverview  showToast={showToast} />,
    users:         <AdminUsers     toast={showToast} />,   // ← wired here
    meals:         <ComingSoon label="Meals"         />,
    exercises:     <ComingSoon label="Exercises"     />,
    plans:         <ComingSoon label="Plans"         />,
    logs:          <ComingSoon label="Logs"          />,
    analytics:     <ComingSoon label="Analytics"     />,
    notifications: <ComingSoon label="Notifications" />,
  }[section];

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sideOpen ? "admin-sidebar--open" : "admin-sidebar--collapsed"}`}>
        <div className={`sidebar-logo ${!sideOpen ? "sidebar-logo--collapsed" : ""}`}>
          <div className="sidebar-logo__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </div>
          {sideOpen && <span className="sidebar-logo__wordmark">FIT<span>MITRA</span></span>}
        </div>
        {sideOpen && <div className="sidebar-panel-label">Admin Panel</div>}
        <nav className="sidebar-nav">
          {NAV.map(n => {
            const active = section === n.key;
            return (
              <button key={n.key} onClick={() => setSection(n.key)}
                className={["sidebar-nav__btn", active ? "sidebar-nav__btn--active" : "", !sideOpen ? "sidebar-nav__btn--collapsed" : ""].join(" ")}>
                {active && <div className="sidebar-nav__active-bar" />}
                <div className="sidebar-nav__icon">{n.icon}</div>
                {sideOpen && <span className="sidebar-nav__label">{n.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-toggle">
          <button className="sidebar-toggle__btn" onClick={() => setSideOpen(o => !o)}>
            <span className={`sidebar-toggle__arrow ${!sideOpen ? "sidebar-toggle__arrow--flipped" : ""}`}>◀</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <div className="admin-topbar__icon">{activeNav?.icon}</div>
            <h1 className="admin-topbar__title">{activeNav?.label}</h1>
          </div>
          <div className="admin-topbar__right">
            <span className="admin-topbar__date">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
            </span>
            <TopbarUser />
          </div>
        </header>

        <main className="admin-content">
          <Suspense fallback={<div className="admin-suspense-fallback"><Spinner /></div>}>
            <div className="admin-content__inner" key={section}>
              {SectionComponent}
            </div>
          </Suspense>
        </main>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}