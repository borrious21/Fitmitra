
import { useState, Suspense, lazy } from "react";
import { Toast, AdminIcons, Spinner } from "./AdminComponents";

const AdminOverview       = lazy(() => import("./Sections/AdminOverview"));
const AdminUsers          = lazy(() => import("./Sections/AdminUsers"));
const AdminMeals          = lazy(() => import("./Sections/AdminMeals"));
const AdminExercises      = lazy(() => import("./Sections/AdminExercises"));
const AdminPlans          = lazy(() => import("./Sections/AdminPlans"));
const AdminLogs           = lazy(() => import("./Sections/AdminLogs"));
const AdminAnalytics      = lazy(() => import("./Sections/AdminAnalytics"));
// const AdminNotifications  = lazy(() => import("./Sections/AdminNotifications"));

const NAV = [
  { key: "overview",      label: "Dashboard",     icon: <AdminIcons.dashboard /> },
  { key: "users",         label: "Users",         icon: <AdminIcons.users /> },
  { key: "meals",         label: "Meals",         icon: <AdminIcons.meals /> },
  { key: "exercises",     label: "Exercises",     icon: <AdminIcons.exercise /> },
  { key: "plans",         label: "Plans",         icon: <AdminIcons.plans /> },
  { key: "logs",          label: "Logs",          icon: <AdminIcons.logs /> },
  { key: "analytics",     label: "Analytics",     icon: <AdminIcons.analytics /> },
  { key: "notifications", label: "Notifications", icon: <AdminIcons.bell /> },
];

export default function AdminDashboard() {
  const [section,  setSection]  = useState("overview");
  const [toast,    setToast]    = useState(null);
  const [sideOpen, setSideOpen] = useState(true);

  const showToast = (msg, type = "success") => setToast({ msg, type });
  const activeNav = NAV.find(n => n.key === section);

  const SectionComponent = {
    overview:      <AdminOverview />,
    users:         <AdminUsers         toast={showToast} />,
    meals:         <AdminMeals         toast={showToast} />,
    exercises:     <AdminExercises     toast={showToast} />,
    plans:         <AdminPlans         toast={showToast} />,
    logs:          <AdminLogs          toast={showToast} />,
    analytics:     <AdminAnalytics />,
    notifications: <AdminNotifications toast={showToast} />,
  }[section];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Outfit:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body, html { background: #0A0C0F; color: #F0F2F5; font-family: 'Outfit', sans-serif; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100% { opacity: .4; } 50% { opacity: .9; } }
        @keyframes riseIn  { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0A0C0F; }
        ::-webkit-scrollbar-thumb { background: rgba(255,92,26,0.3); border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: #525D72; }
        option { background: #1A1E28; color: #F0F2F5; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#0A0C0F" }}>

        <aside style={{
          width: sideOpen ? 220 : 64,
          flexShrink: 0,
          background: "#0F1217",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
          overflow: "hidden",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}>

          <div style={{ padding: sideOpen ? "1.375rem 1.25rem 1rem" : "1.375rem 0 1rem", display: "flex", alignItems: "center", gap: "0.625rem", justifyContent: sideOpen ? "flex-start" : "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ width: 28, height: 28, color: "#FF5C1A", filter: "drop-shadow(0 0 6px rgba(255,92,26,0.7))", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
              </svg>
            </div>
            {sideOpen && (
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.25rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5", whiteSpace: "nowrap" }}>
                FIT<span style={{ color: "#FF5C1A" }}>MITRA</span>
              </span>
            )}
          </div>

          {sideOpen && (
            <div style={{ padding: "0.5rem 1.25rem 0.625rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#525D72" }}>Admin Panel</span>
            </div>
          )}

          <nav style={{ flex: 1, padding: "0.75rem 0.625rem", display: "flex", flexDirection: "column", gap: "0.175rem", overflowY: "auto" }}>
            {NAV.map(n => {
              const active = section === n.key;
              return (
                <button key={n.key} onClick={() => setSection(n.key)}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: sideOpen ? "0.6rem 0.875rem" : "0.6rem", justifyContent: sideOpen ? "flex-start" : "center", borderRadius: 10, border: "none", cursor: "pointer", background: active ? "rgba(255,92,26,0.12)" : "transparent", color: active ? "#FF5C1A" : "#9AA3B4", transition: "all 0.18s", textAlign: "left", position: "relative" }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#F0F2F5"; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = active ? "rgba(255,92,26,0.12)" : "transparent"; e.currentTarget.style.color = active ? "#FF5C1A" : "#9AA3B4"; }}>
                  {active && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, borderRadius: "0 2px 2px 0", background: "#FF5C1A", boxShadow: "0 0 6px #FF5C1A" }} />}
                  <div style={{ width: 16, height: 16, flexShrink: 0 }}>{n.icon}</div>
                  {sideOpen && <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{n.label}</span>}
                </button>
              );
            })}
          </nav>

          <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={() => setSideOpen(o => !o)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.04)", color: "#525D72", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
              <span style={{ fontSize: "0.75rem", transform: sideOpen ? "scaleX(1)" : "scaleX(-1)", display: "inline-block", transition: "transform 0.25s" }}>◀</span>
            </button>
          </div>
        </aside>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          <header style={{ background: "rgba(10,12,15,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0.875rem 1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", position: "sticky", top: 0, zIndex: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 18, height: 18, color: "#FF5C1A" }}>{activeNav?.icon}</div>
              <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#F0F2F5", margin: 0 }}>
                {activeNav?.label}
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#525D72" }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
              </span>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#FF5C1A,#FF8A3D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, color: "#fff", boxShadow: "0 0 12px rgba(255,92,26,0.4)", letterSpacing: "0.05em" }}>ADM</div>
            </div>
          </header>

          <main style={{ flex: 1, padding: "1.75rem", overflowY: "auto", maxWidth: 1320, width: "100%" }}>
            <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}><Spinner /></div>}>
              <div style={{ animation: "riseIn 0.3s ease" }} key={section}>
                {SectionComponent}
              </div>
            </Suspense>
          </main>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}