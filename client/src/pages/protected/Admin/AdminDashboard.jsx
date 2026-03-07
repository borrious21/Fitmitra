import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════
   FITMITRA ADMIN DASHBOARD
   All data fetched live from API. No mocks.
   ═══════════════════════════════════════════════════════════ */

const BASE = "/api/admin";

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/* ── icons (inline SVG) ─────────────────────────────────── */
const Icon = {
  dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  meals: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  exercise: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 4v16M18 4v16M6 12h12M3 8h3m12 0h3M3 16h3m12 0h3" />
    </svg>
  ),
  plans: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  logs: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  analytics: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  notifications: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6m4-6v6" /><path d="M9 6V4h6v2" />
    </svg>
  ),
  ban: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  ),
  check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  send: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

/* ── Shared UI primitives ──────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem" }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid rgba(255,92,26,0.15)",
        borderTopColor: "#FF5C1A",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = "#FF5C1A", loading }) {
  return (
    <div style={{
      background: "#12151B", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: "1.25rem 1.5rem", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color, flexShrink: 0,
        }}>
          <div style={{ width: 16, height: 16 }}>{icon}</div>
        </div>
        <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#525D72" }}>{label}</span>
      </div>
      {loading ? (
        <div style={{ height: 32, background: "rgba(255,255,255,0.04)", borderRadius: 6, animation: "shimmer 1.5s ease infinite" }} />
      ) : (
        <>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 900, color, lineHeight: 1 }}>{value ?? "—"}</div>
          {sub && <div style={{ fontSize: "0.7rem", color: "#525D72", marginTop: "0.3rem" }}>{sub}</div>}
        </>
      )}
    </div>
  );
}

function Table({ columns, rows, loading, onAction, emptyMsg = "No data found." }) {
  if (loading) return <Spinner />;
  if (!rows?.length) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#525D72", fontSize: "0.875rem" }}>{emptyMsg}</div>
  );
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} style={{
                textAlign: "left", padding: "0.6rem 1rem",
                fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "#525D72",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                whiteSpace: "nowrap",
              }}>{c.label}</th>
            ))}
            {onAction && <th style={{ padding: "0.6rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: "0.75rem 1rem", color: "#9AA3B4", verticalAlign: "middle" }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
                </td>
              ))}
              {onAction && (
                <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                  {onAction(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ children, color = "#FF5C1A" }) {
  return (
    <span style={{
      fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
      padding: "0.2rem 0.6rem", borderRadius: 999,
      background: `${color}18`, border: `1px solid ${color}35`, color,
    }}>{children}</span>
  );
}

function ActionBtn({ icon, label, onClick, color = "#FF5C1A", danger }) {
  const [hov, setHov] = useState(false);
  const bg = danger ? "rgba(239,68,68,0.08)" : `${color}0F`;
  const bgh = danger ? "rgba(239,68,68,0.18)" : `${color}22`;
  const c = danger ? "#ef4444" : color;
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 30, height: 30, borderRadius: 8,
        background: hov ? bgh : bg,
        border: `1px solid ${c}30`,
        color: c, cursor: "pointer",
        transition: "background 0.18s",
      }}>
      <div style={{ width: 13, height: 13 }}>{icon}</div>
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }} onClick={onClose}>
      <div style={{
        background: "#12151B", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20, padding: "1.75rem", width: "100%", maxWidth: 540,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        animation: "riseIn 0.25s ease",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#F0F2F5", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#9AA3B4", width: 30, height: 30, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 14, height: 14 }}><Icon.close /></div>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {label && <label style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72" }}>{label}</label>}
      <input {...props} style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, padding: "0.65rem 0.875rem",
        color: "#F0F2F5", fontSize: "0.85rem", outline: "none",
        transition: "border-color 0.2s",
        ...props.style,
      }}
        onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
      />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {label && <label style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72" }}>{label}</label>}
      <select {...props} style={{
        background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, padding: "0.65rem 0.875rem",
        color: "#F0F2F5", fontSize: "0.85rem", outline: "none",
        ...props.style,
      }}>
        {children}
      </select>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {label && <label style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72" }}>{label}</label>}
      <textarea {...props} style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, padding: "0.65rem 0.875rem",
        color: "#F0F2F5", fontSize: "0.85rem", outline: "none", resize: "vertical", minHeight: 80,
        ...props.style,
      }}
        onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
      />
    </div>
  );
}

function PrimaryBtn({ children, onClick, loading, style, color }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      padding: "0.75rem 1.5rem", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer",
      fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.9rem", fontWeight: 900,
      letterSpacing: "0.14em", textTransform: "uppercase",
      background: color ?? "linear-gradient(135deg, #FF5C1A, #FF8A3D)",
      color: "#fff", opacity: loading ? 0.6 : 1,
      boxShadow: "0 6px 24px rgba(255,92,26,0.3)",
      transition: "transform 0.15s, box-shadow 0.15s",
      ...style,
    }}
      onMouseEnter={e => { if (!loading) e.target.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.target.style.transform = "translateY(0)"; }}>
      {loading ? "Loading…" : children}
    </button>
  );
}

function SectionCard({ title, badge, children, action }) {
  return (
    <div style={{
      background: "#12151B", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20, overflow: "hidden",
      boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
    }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#FF5C1A,#FF8A3D)" }} />
      </div>
      <div style={{
        padding: "1.125rem 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexWrap: "wrap", gap: "0.5rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.85rem", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "#F0F2F5" }}>{title}</span>
          {badge != null && (
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em", padding: "0.15rem 0.6rem", borderRadius: 999, background: "rgba(255,92,26,0.12)", border: "1px solid rgba(255,92,26,0.25)", color: "#FF8A3D" }}>{badge}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Toast({ msg, type = "success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const color = type === "error" ? "#ef4444" : "#10b981";
  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999,
      background: "#1A1E28", border: `1px solid ${color}40`,
      borderRadius: 12, padding: "0.875rem 1.25rem",
      boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
      color, fontSize: "0.85rem", fontWeight: 600,
      animation: "riseIn 0.25s ease",
    }}>{msg}</div>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION VIEWS
   ══════════════════════════════════════════════════════════ */

/* ── OVERVIEW DASHBOARD ────────────────────────────────── */
function OverviewSection() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      apiFetch("/dashboard"),
      apiFetch("/analytics/overview"),
      apiFetch("/analytics/top-users"),
      apiFetch("/analytics/at-risk"),
    ]).then(([s, a, t, r]) => {
      if (s.status === "fulfilled") setStats(s.value?.data ?? s.value);
      if (a.status === "fulfilled") setAnalytics(a.value?.data ?? a.value);
      if (t.status === "fulfilled") { const d = t.value?.data ?? t.value; setTopUsers(Array.isArray(d) ? d : []); }
      if (r.status === "fulfilled") { const d = r.value?.data ?? r.value; setAtRisk(Array.isArray(d) ? d : []); }
      setLoading(false);
    });
  }, []);

  const d = stats ?? analytics ?? {};

  const statCards = [
    { label: "Total Users",     value: d.totalUsers      ?? d.total_users,      icon: <Icon.users />,     color: "#FF5C1A", sub: `+${d.newUsersThisWeek ?? d.new_users_this_week ?? 0} this week` },
    { label: "Active Today",    value: d.activeToday     ?? d.active_today,      icon: <Icon.analytics />, color: "#00C8E0", sub: "Unique logins" },
    { label: "Workout Logs",    value: d.workoutLogs     ?? d.workout_logs,      icon: <Icon.exercise />,  color: "#B8F000", sub: "All time" },
    { label: "Meal Logs",       value: d.mealLogs        ?? d.meal_logs,         icon: <Icon.meals />,     color: "#f59e0b", sub: "All time" },
    { label: "Active Plans",    value: d.activePlans     ?? d.active_plans,      icon: <Icon.plans />,     color: "#a855f7", sub: "Running now" },
    { label: "Notifications",   value: d.notifications   ?? d.total_notifications, icon: <Icon.notifications />, color: "#6366f1", sub: "Sent total" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: "1rem" }}>
        {statCards.map(s => <StatCard key={s.label} {...s} loading={loading} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <SectionCard title="🏆 Top Active Users" badge={topUsers.length}>
          <Table
            loading={loading}
            columns={[
              { key: "name",            label: "Name" },
              { key: "email",           label: "Email" },
              { key: "workout_count",   label: "Workouts",  render: v => <Badge color="#B8F000">{v ?? 0}</Badge> },
              { key: "streak",          label: "Streak",    render: v => v ? `🔥 ${v}d` : "—" },
            ]}
            rows={topUsers.slice(0, 6)}
            emptyMsg="No user data available."
          />
        </SectionCard>

        <SectionCard title="⚠️ At-Risk Users" badge={atRisk.length}>
          <Table
            loading={loading}
            columns={[
              { key: "name",            label: "Name" },
              { key: "last_active",     label: "Last Active", render: v => v ? new Date(v).toLocaleDateString() : "—" },
              { key: "risk_reason",     label: "Reason",      render: v => <Badge color="#ef4444">{v ?? "Inactive"}</Badge> },
            ]}
            rows={atRisk.slice(0, 6)}
            emptyMsg="No at-risk users detected."
          />
        </SectionCard>
      </div>
    </div>
  );
}

/* ── USERS ─────────────────────────────────────────────── */
function UsersSection({ toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // { type, user }
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/users").then(d => {
      const arr = d?.data ?? d;
      setUsers(Array.isArray(arr) ? arr : []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (path, method = "PATCH", successMsg) => {
    setActing(true);
    try {
      await apiFetch(path, { method });
      toast(successMsg, "success");
      load();
    } catch (e) {
      toast(e.message, "error");
    } finally { setActing(false); setModal(null); }
  };

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
        <button onClick={load} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0 0.875rem", color: "#9AA3B4", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem" }}>
          <div style={{ width: 14, height: 14 }}><Icon.refresh /></div> Refresh
        </button>
      </div>

      <SectionCard title="All Users" badge={filtered.length}>
        <Table
          loading={loading}
          columns={[
            { key: "name",       label: "Name",    render: v => <span style={{ color: "#F0F2F5", fontWeight: 600 }}>{v}</span> },
            { key: "email",      label: "Email" },
            { key: "role",       label: "Role",    render: v => <Badge color={v === "admin" ? "#a855f7" : "#00C8E0"}>{v ?? "user"}</Badge> },
            { key: "status",     label: "Status",  render: v => <Badge color={v === "active" ? "#10b981" : v === "banned" ? "#ef4444" : "#f59e0b"}>{v ?? "active"}</Badge> },
            { key: "is_verified",label: "Verified",render: v => v ? <Badge color="#10b981">✓ Yes</Badge> : <Badge color="#f59e0b">No</Badge> },
            { key: "created_at", label: "Joined",  render: v => v ? new Date(v).toLocaleDateString() : "—" },
          ]}
          rows={filtered}
          onAction={row => (
            <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
              {row.status !== "banned" && (
                <ActionBtn icon={<Icon.ban />} label="Ban" danger onClick={() => setModal({ type: "ban", user: row })} />
              )}
              {row.status === "banned" && (
                <ActionBtn icon={<Icon.check />} label="Activate" color="#10b981" onClick={() => act(`/users/${row.id}/activate`, "PATCH", "User activated")} />
              )}
              {!row.is_verified && (
                <ActionBtn icon={<Icon.check />} label="Verify" color="#10b981" onClick={() => act(`/users/${row.id}/verify`, "PATCH", "User verified")} />
              )}
              <ActionBtn icon={<Icon.trash />} label="Delete" danger onClick={() => setModal({ type: "delete", user: row })} />
            </div>
          )}
          emptyMsg="No users found."
        />
      </SectionCard>

      {modal?.type === "ban" && (
        <Modal title="Ban User" onClose={() => setModal(null)}>
          <p style={{ color: "#9AA3B4", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
            Are you sure you want to ban <strong style={{ color: "#F0F2F5" }}>{modal.user.name}</strong>? They will lose access immediately.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button onClick={() => setModal(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.65rem 1.25rem", color: "#9AA3B4", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cancel</button>
            <PrimaryBtn color="linear-gradient(135deg,#ef4444,#dc2626)" loading={acting} onClick={() => act(`/users/${modal.user.id}/ban`, "PATCH", "User banned")}>Ban User</PrimaryBtn>
          </div>
        </Modal>
      )}
      {modal?.type === "delete" && (
        <Modal title="Delete User" onClose={() => setModal(null)}>
          <p style={{ color: "#9AA3B4", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
            Permanently delete <strong style={{ color: "#F0F2F5" }}>{modal.user.name}</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button onClick={() => setModal(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.65rem 1.25rem", color: "#9AA3B4", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cancel</button>
            <PrimaryBtn color="linear-gradient(135deg,#ef4444,#dc2626)" loading={acting} onClick={() => act(`/users/${modal.user.id}`, "DELETE", "User deleted")}>Delete</PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── MEALS ─────────────────────────────────────────────── */
function MealsSection({ toast }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fats: "", category: "" });
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/meals").then(d => { const a = d?.data ?? d; setMeals(Array.isArray(a) ? a : []); }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ name: "", calories: "", protein: "", carbs: "", fats: "", category: "" }); setModal("create"); };
  const openEdit   = (m) => { setForm({ name: m.name ?? "", calories: m.calories ?? "", protein: m.protein ?? "", carbs: m.carbs ?? "", fats: m.fats ?? "", category: m.category ?? "" }); setModal({ type: "edit", id: m.id }); };

  const save = async () => {
    setActing(true);
    try {
      const body = JSON.stringify(form);
      if (modal === "create") {
        await apiFetch("/meals", { method: "POST", body });
        toast("Meal created", "success");
      } else {
        await apiFetch(`/meals/${modal.id}`, { method: "PUT", body });
        toast("Meal updated", "success");
      }
      load(); setModal(null);
    } catch (e) { toast(e.message, "error"); } finally { setActing(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete this meal?")) return;
    try { await apiFetch(`/meals/${id}`, { method: "DELETE" }); toast("Deleted", "success"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <PrimaryBtn onClick={openCreate}>+ Add Meal</PrimaryBtn>
      </div>
      <SectionCard title="Meals Library" badge={meals.length}>
        <Table loading={loading} rows={meals}
          columns={[
            { key: "name",     label: "Name",     render: v => <span style={{ color: "#F0F2F5", fontWeight: 600 }}>{v}</span> },
            { key: "category", label: "Category", render: v => v ? <Badge color="#f59e0b">{v}</Badge> : "—" },
            { key: "calories", label: "Calories", render: v => <span style={{ color: "#FF5C1A" }}>{v ?? "—"} kcal</span> },
            { key: "protein",  label: "P",        render: v => `${v ?? 0}g` },
            { key: "carbs",    label: "C",        render: v => `${v ?? 0}g` },
            { key: "fats",     label: "F",        render: v => `${v ?? 0}g` },
          ]}
          onAction={row => (
            <div style={{ display: "flex", gap: "0.375rem" }}>
              <ActionBtn icon={<Icon.edit />} label="Edit"   color="#00C8E0" onClick={() => openEdit(row)} />
              <ActionBtn icon={<Icon.trash />} label="Delete" danger onClick={() => del(row.id)} />
            </div>
          )}
          emptyMsg="No meals in database."
        />
      </SectionCard>

      {modal && (
        <Modal title={modal === "create" ? "Add Meal" : "Edit Meal"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Input label="Calories" type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
              <Input label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              <Input label="Protein (g)" type="number" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
              <Input label="Carbs (g)"   type="number" value={form.carbs}   onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
              <Input label="Fats (g)"    type="number" value={form.fats}    onChange={e => setForm(f => ({ ...f, fats: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button onClick={() => setModal(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.65rem 1.25rem", color: "#9AA3B4", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cancel</button>
              <PrimaryBtn loading={acting} onClick={save}>Save</PrimaryBtn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── EXERCISES ─────────────────────────────────────────── */
function ExercisesSection({ toast }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", muscle_group: "", equipment: "", difficulty: "beginner", description: "" });
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/exercises").then(d => { const a = d?.data ?? d; setExercises(Array.isArray(a) ? a : []); }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ name: "", muscle_group: "", equipment: "", difficulty: "beginner", description: "" }); setModal("create"); };
  const openEdit   = (ex) => { setForm({ name: ex.name ?? "", muscle_group: ex.muscle_group ?? "", equipment: ex.equipment ?? "", difficulty: ex.difficulty ?? "beginner", description: ex.description ?? "" }); setModal({ type: "edit", id: ex.id }); };

  const save = async () => {
    setActing(true);
    try {
      const body = JSON.stringify(form);
      if (modal === "create") { await apiFetch("/exercises", { method: "POST", body }); toast("Exercise created", "success"); }
      else { await apiFetch(`/exercises/${modal.id}`, { method: "PUT", body }); toast("Exercise updated", "success"); }
      load(); setModal(null);
    } catch (e) { toast(e.message, "error"); } finally { setActing(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete this exercise?")) return;
    try { await apiFetch(`/exercises/${id}`, { method: "DELETE" }); toast("Deleted", "success"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  const diffColor = { beginner: "#10b981", intermediate: "#f59e0b", advanced: "#ef4444" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <PrimaryBtn onClick={openCreate}>+ Add Exercise</PrimaryBtn>
      </div>
      <SectionCard title="Exercise Library" badge={exercises.length}>
        <Table loading={loading} rows={exercises}
          columns={[
            { key: "name",         label: "Name",         render: v => <span style={{ color: "#F0F2F5", fontWeight: 600 }}>{v}</span> },
            { key: "muscle_group", label: "Muscle Group", render: v => <Badge color="#a855f7">{v ?? "—"}</Badge> },
            { key: "equipment",    label: "Equipment" },
            { key: "difficulty",   label: "Difficulty",   render: v => <Badge color={diffColor[v] ?? "#9AA3B4"}>{v ?? "—"}</Badge> },
          ]}
          onAction={row => (
            <div style={{ display: "flex", gap: "0.375rem" }}>
              <ActionBtn icon={<Icon.edit />} label="Edit" color="#00C8E0" onClick={() => openEdit(row)} />
              <ActionBtn icon={<Icon.trash />} label="Delete" danger onClick={() => del(row.id)} />
            </div>
          )}
          emptyMsg="No exercises in database."
        />
      </SectionCard>

      {modal && (
        <Modal title={modal === "create" ? "Add Exercise" : "Edit Exercise"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Input label="Muscle Group" value={form.muscle_group} onChange={e => setForm(f => ({ ...f, muscle_group: e.target.value }))} />
              <Input label="Equipment" value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} />
              <Select label="Difficulty" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </div>
            <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.65rem 1.25rem", color: "#9AA3B4", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cancel</button>
              <PrimaryBtn loading={acting} onClick={save}>Save</PrimaryBtn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── PLANS ─────────────────────────────────────────────── */
function PlansSection({ toast }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/plans").then(d => { const a = d?.data ?? d; setPlans(Array.isArray(a) ? a : []); }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const deactivate = async (id) => {
    try { await apiFetch(`/plans/${id}/deactivate`, { method: "PATCH" }); toast("Plan deactivated", "success"); load(); }
    catch (e) { toast(e.message, "error"); }
  };
  const del = async (id) => {
    if (!confirm("Delete this plan?")) return;
    try { await apiFetch(`/plans/${id}`, { method: "DELETE" }); toast("Deleted", "success"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <SectionCard title="All Plans" badge={plans.length}>
      <Table loading={loading} rows={plans}
        columns={[
          { key: "name",        label: "Name",    render: v => <span style={{ color: "#F0F2F5", fontWeight: 600 }}>{v}</span> },
          { key: "user_name",   label: "User" },
          { key: "goal",        label: "Goal",    render: v => v ? <Badge color="#a855f7">{v}</Badge> : "—" },
          { key: "is_active",   label: "Status",  render: v => <Badge color={v ? "#10b981" : "#ef4444"}>{v ? "Active" : "Inactive"}</Badge> },
          { key: "created_at",  label: "Created", render: v => v ? new Date(v).toLocaleDateString() : "—" },
        ]}
        onAction={row => (
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {row.is_active && <ActionBtn icon={<Icon.ban />} label="Deactivate" color="#f59e0b" onClick={() => deactivate(row.id)} />}
            <ActionBtn icon={<Icon.trash />} label="Delete" danger onClick={() => del(row.id)} />
          </div>
        )}
        emptyMsg="No plans in database."
      />
    </SectionCard>
  );
}

/* ── LOGS ──────────────────────────────────────────────── */
function LogsSection({ toast }) {
  const [tab, setTab] = useState("workout");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const endpoints = {
    workout:  "/logs/workout-logs",
    meal:     "/logs/meal-logs",
    progress: "/logs/progress-logs",
    admin:    "/logs/admin-logs",
  };

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(endpoints[tab]).then(d => { const a = d?.data ?? d; setData(Array.isArray(a) ? a : []); }).finally(() => setLoading(false));
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    const ep = tab === "workout" ? `/logs/workout-logs/${id}` : `/logs/meal-logs/${id}`;
    try { await apiFetch(ep, { method: "DELETE" }); toast("Deleted", "success"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  const TABS = [
    { key: "workout",  label: "Workout" },
    { key: "meal",     label: "Meal" },
    { key: "progress", label: "Progress" },
    { key: "admin",    label: "Admin" },
  ];

  const columns = {
    workout:  [{ key: "user_name", label: "User" }, { key: "workout_name", label: "Workout" }, { key: "created_at", label: "Date", render: v => v ? new Date(v).toLocaleString() : "—" }],
    meal:     [{ key: "user_name", label: "User" }, { key: "meal_name", label: "Meal" }, { key: "calories", label: "Kcal", render: v => <span style={{ color: "#FF5C1A" }}>{v ?? "—"}</span> }, { key: "created_at", label: "Date", render: v => v ? new Date(v).toLocaleString() : "—" }],
    progress: [{ key: "user_name", label: "User" }, { key: "metric", label: "Metric" }, { key: "value", label: "Value" }, { key: "created_at", label: "Date", render: v => v ? new Date(v).toLocaleString() : "—" }],
    admin:    [{ key: "admin_name", label: "Admin" }, { key: "action", label: "Action" }, { key: "target", label: "Target" }, { key: "created_at", label: "Date", render: v => v ? new Date(v).toLocaleString() : "—" }],
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.375rem", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "0.25rem", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "0.4rem 1rem", borderRadius: 8, border: "none", cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.75rem", fontWeight: 800,
            letterSpacing: "0.1em", textTransform: "uppercase",
            background: tab === t.key ? "linear-gradient(135deg,#FF5C1A,#FF8A3D)" : "transparent",
            color: tab === t.key ? "#fff" : "#9AA3B4",
            transition: "all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      <SectionCard title={`${tab.charAt(0).toUpperCase() + tab.slice(1)} Logs`} badge={data.length}>
        <Table loading={loading} rows={data} columns={columns[tab]}
          onAction={["workout", "meal"].includes(tab) ? row => (
            <ActionBtn icon={<Icon.trash />} label="Delete" danger onClick={() => del(row.id)} />
          ) : null}
          emptyMsg="No logs found."
        />
      </SectionCard>
    </div>
  );
}

/* ── ANALYTICS ─────────────────────────────────────────── */
function AnalyticsSection() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      apiFetch("/analytics/users"),
      apiFetch("/analytics/workouts"),
      apiFetch("/analytics/meals"),
      apiFetch("/analytics/retention"),
    ]).then(([u, w, m, r]) => {
      setData({
        users:     u.status === "fulfilled" ? (u.value?.data ?? u.value) : null,
        workouts:  w.status === "fulfilled" ? (w.value?.data ?? w.value) : null,
        meals:     m.status === "fulfilled" ? (m.value?.data ?? m.value) : null,
        retention: r.status === "fulfilled" ? (r.value?.data ?? r.value) : null,
      });
      setLoading(false);
    });
  }, []);

  const u = data.users     ?? {};
  const w = data.workouts  ?? {};
  const m = data.meals     ?? {};
  const r = data.retention ?? {};

  const cards = [
    { label: "Total Users",          value: u.total_users      ?? u.totalUsers,         color: "#FF5C1A" },
    { label: "Verified Users",       value: u.verified_users   ?? u.verifiedUsers,       color: "#10b981" },
    { label: "Avg Workouts/User",    value: w.avg_per_user     ?? w.avgPerUser,           color: "#B8F000" },
    { label: "Total Workout Logs",   value: w.total_logs       ?? w.totalLogs,            color: "#00C8E0" },
    { label: "Total Meal Logs",      value: m.total_logs       ?? m.totalLogs,            color: "#f59e0b" },
    { label: "Avg Calories/Log",     value: m.avg_calories     ?? m.avgCalories ? `${Math.round(m.avg_calories ?? m.avgCalories)} kcal` : null, color: "#FF5C1A" },
    { label: "7-Day Retention",      value: r.day7             != null ? `${r.day7}%`  : null, color: "#a855f7" },
    { label: "30-Day Retention",     value: r.day30            != null ? `${r.day30}%` : null, color: "#6366f1" },
  ];

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: "1rem" }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "#12151B", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.25rem 1.5rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: c.color }} />
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 900, color: c.color }}>{c.value ?? "—"}</div>
            <div style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#525D72", marginTop: "0.35rem" }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Raw JSON view for any extra fields */}
      {Object.keys(data).length > 0 && (
        <SectionCard title="Raw Analytics Data">
          <div style={{ padding: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {Object.entries(data).map(([key, val]) => val && (
              <div key={key} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1rem" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.625rem" }}>{key}</div>
                <pre style={{ fontSize: "0.72rem", color: "#9AA3B4", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {JSON.stringify(val, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ── NOTIFICATIONS ─────────────────────────────────────── */
function NotificationsSection({ toast }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ user_id: "", title: "", message: "", type: "info" });
  const [bcastForm, setBcastForm] = useState({ title: "", message: "", type: "info" });
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/notifications").then(d => { const a = d?.data ?? d; setNotifs(Array.isArray(a) ? a : []); }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const send = async () => {
    setActing(true);
    try {
      await apiFetch("/notifications/send", { method: "POST", body: JSON.stringify(form) });
      toast("Notification sent", "success"); load(); setModal(null);
    } catch (e) { toast(e.message, "error"); } finally { setActing(false); }
  };

  const broadcast = async () => {
    setActing(true);
    try {
      await apiFetch("/notifications/broadcast", { method: "POST", body: JSON.stringify(bcastForm) });
      toast("Broadcast sent to all users!", "success"); load(); setModal(null);
    } catch (e) { toast(e.message, "error"); } finally { setActing(false); }
  };

  const del = async (id) => {
    try { await apiFetch(`/notifications/${id}`, { method: "DELETE" }); toast("Deleted", "success"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  const typeColor = { info: "#00C8E0", warning: "#f59e0b", success: "#10b981", error: "#ef4444" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
        <PrimaryBtn color="linear-gradient(135deg,#6366f1,#a855f7)" onClick={() => setModal("broadcast")}>📡 Broadcast</PrimaryBtn>
        <PrimaryBtn onClick={() => setModal("send")}>+ Send Notification</PrimaryBtn>
      </div>

      <SectionCard title="Notifications" badge={notifs.length}>
        <Table loading={loading} rows={notifs}
          columns={[
            { key: "title",      label: "Title",   render: v => <span style={{ color: "#F0F2F5", fontWeight: 600 }}>{v}</span> },
            { key: "user_name",  label: "User" },
            { key: "type",       label: "Type",    render: v => <Badge color={typeColor[v] ?? "#9AA3B4"}>{v ?? "info"}</Badge> },
            { key: "message",    label: "Message", render: v => <span style={{ maxWidth: 200, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span> },
            { key: "created_at", label: "Sent",    render: v => v ? new Date(v).toLocaleDateString() : "—" },
          ]}
          onAction={row => <ActionBtn icon={<Icon.trash />} label="Delete" danger onClick={() => del(row.id)} />}
          emptyMsg="No notifications yet."
        />
      </SectionCard>

      {modal === "send" && (
        <Modal title="Send Notification" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <Input label="User ID" value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} placeholder="Leave blank to broadcast" />
            <Input label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea label="Message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
            <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {["info", "warning", "success", "error"].map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.65rem 1.25rem", color: "#9AA3B4", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cancel</button>
              <PrimaryBtn loading={acting} onClick={send}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 14, height: 14 }}><Icon.send /></div>Send</div></PrimaryBtn>
            </div>
          </div>
        </Modal>
      )}

      {modal === "broadcast" && (
        <Modal title="📡 Broadcast to All Users" onClose={() => setModal(null)}>
          <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "0.875rem", fontSize: "0.82rem", color: "#a5b4fc" }}>
            ⚠️ This will send a notification to ALL registered users.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <Input label="Title" value={bcastForm.title} onChange={e => setBcastForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea label="Message" value={bcastForm.message} onChange={e => setBcastForm(f => ({ ...f, message: e.target.value }))} />
            <Select label="Type" value={bcastForm.type} onChange={e => setBcastForm(f => ({ ...f, type: e.target.value }))}>
              {["info", "warning", "success", "error"].map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.65rem 1.25rem", color: "#9AA3B4", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cancel</button>
              <PrimaryBtn color="linear-gradient(135deg,#6366f1,#a855f7)" loading={acting} onClick={broadcast}>Broadcast</PrimaryBtn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [section, setSection] = useState("overview");
  const [toast, setToast] = useState(null);
  const [sideOpen, setSideOpen] = useState(true);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const NAV = [
    { key: "overview",      label: "Dashboard",     icon: <Icon.dashboard /> },
    { key: "users",         label: "Users",         icon: <Icon.users /> },
    { key: "meals",         label: "Meals",         icon: <Icon.meals /> },
    { key: "exercises",     label: "Exercises",     icon: <Icon.exercise /> },
    { key: "plans",         label: "Plans",         icon: <Icon.plans /> },
    { key: "logs",          label: "Logs",          icon: <Icon.logs /> },
    { key: "analytics",     label: "Analytics",     icon: <Icon.analytics /> },
    { key: "notifications", label: "Notifications", icon: <Icon.notifications /> },
  ];

  const content = {
    overview:      <OverviewSection />,
    users:         <UsersSection toast={showToast} />,
    meals:         <MealsSection toast={showToast} />,
    exercises:     <ExercisesSection toast={showToast} />,
    plans:         <PlansSection toast={showToast} />,
    logs:          <LogsSection toast={showToast} />,
    analytics:     <AnalyticsSection />,
    notifications: <NotificationsSection toast={showToast} />,
  };

  const activeNav = NAV.find(n => n.key === section);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Outfit:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body, html { background: #0A0C0F; color: #F0F2F5; font-family: 'Outfit', sans-serif; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes riseIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0A0C0F; }
        ::-webkit-scrollbar-thumb { background: rgba(255,92,26,0.3); border-radius: 2px; }
        input::placeholder { color: #525D72; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#0A0C0F" }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: sideOpen ? 220 : 64, flexShrink: 0,
          background: "#0F1217",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          display: "flex", flexDirection: "column",
          transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
          overflow: "hidden",
          position: "sticky", top: 0, height: "100vh",
        }}>
          {/* Logo */}
          <div style={{
            padding: sideOpen ? "1.375rem 1.25rem 1rem" : "1.375rem 0 1rem",
            display: "flex", alignItems: "center",
            gap: "0.625rem", justifyContent: sideOpen ? "flex-start" : "center",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ width: 28, height: 28, color: "#FF5C1A", filter: "drop-shadow(0 0 6px rgba(255,92,26,0.7))", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
              </svg>
            </div>
            {sideOpen && (
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.25rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5", whiteSpace: "nowrap" }}>
                FIT<span style={{ color: "#FF5C1A" }}>MITRA</span>
              </span>
            )}
          </div>

          {sideOpen && (
            <div style={{ padding: "0.5rem 1.25rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#525D72" }}>Admin Panel</span>
            </div>
          )}

          {/* Nav Items */}
          <nav style={{ flex: 1, padding: "0.75rem 0.625rem", display: "flex", flexDirection: "column", gap: "0.2rem", overflowY: "auto" }}>
            {NAV.map(n => {
              const active = section === n.key;
              return (
                <button key={n.key} onClick={() => setSection(n.key)} style={{
                  display: "flex", alignItems: "center",
                  gap: "0.75rem",
                  padding: sideOpen ? "0.625rem 0.875rem" : "0.625rem",
                  justifyContent: sideOpen ? "flex-start" : "center",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  background: active ? "rgba(255,92,26,0.12)" : "transparent",
                  color: active ? "#FF5C1A" : "#9AA3B4",
                  transition: "all 0.18s",
                  textAlign: "left",
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#F0F2F5"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = active ? "rgba(255,92,26,0.12)" : "transparent"; e.currentTarget.style.color = active ? "#FF5C1A" : "#9AA3B4"; }}>
                  <div style={{ width: 16, height: 16, flexShrink: 0 }}>{n.icon}</div>
                  {sideOpen && (
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{n.label}</span>
                  )}
                  {active && sideOpen && <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#FF5C1A" }} />}
                </button>
              );
            })}
          </nav>

          {/* Collapse toggle */}
          <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={() => setSideOpen(o => !o)} style={{
              width: "100%", padding: "0.5rem", borderRadius: 8, border: "none",
              background: "rgba(255,255,255,0.04)", color: "#525D72", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}>
              <span style={{ fontSize: "0.75rem", transform: sideOpen ? "scaleX(1)" : "scaleX(-1)", display: "inline-block" }}>◀</span>
            </button>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Top bar */}
          <header style={{
            background: "rgba(10,12,15,0.92)", backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            padding: "0.875rem 1.75rem",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
            position: "sticky", top: 0, zIndex: 100,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <div style={{ width: 18, height: 18, color: "#FF5C1A" }}>{activeNav?.icon}</div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#F0F2F5" }}>
                {activeNav?.label}
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#525D72" }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
              </span>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg,#FF5C1A,#FF8A3D)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.6rem", fontWeight: 800, color: "#fff",
                boxShadow: "0 0 12px rgba(255,92,26,0.4)",
              }}>ADM</div>
            </div>
          </header>

          {/* Content */}
          <main style={{ flex: 1, padding: "1.75rem", overflowY: "auto", maxWidth: 1280, width: "100%" }}>
            <div style={{ animation: "riseIn 0.3s ease" }} key={section}>
              {content[section]}
            </div>
          </main>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}