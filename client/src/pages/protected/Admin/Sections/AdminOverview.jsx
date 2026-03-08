// ── src/pages/protected/Admin/Sections/AdminOverview.jsx ─────
import { useState, useEffect, useCallback } from "react";
import { apiFetch, extractArray, extractObject } from "../AdminUtils";
import { Spinner, Badge, SectionCard, Table } from "../AdminComponents";

/* ── helpers ─────────────────────────────────────────────── */
function fmt(n) {
  const num = Number(n);
  if (n == null || isNaN(num)) return null;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000)     return (num / 1_000).toFixed(1)     + "K";
  return String(num);
}

/* ── animated count-up ───────────────────────────────────── */
function CountUp({ to, duration = 900 }) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    if (to == null) return;
    const n = Number(to);
    if (isNaN(n)) return;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCur(Math.round(n * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, duration]);
  return <>{fmt(cur)}</>;
}

/* ── sparkline bars ──────────────────────────────────────── */
function SparkBars({ values = [], color = "#FF5C1A" }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 28, marginTop: 4 }}>
      {values.map((v, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: "2px 2px 0 0",
          height: `${Math.max(8, (v / max) * 100)}%`,
          background: i === values.length - 1 ? color : `${color}55`,
          transition: "height 0.6s ease",
        }} />
      ))}
    </div>
  );
}

/* ── ring ────────────────────────────────────────────────── */
function Ring({ pct = 0, size = 52, stroke = 5, color = "#FF5C1A", children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [p, setP] = useState(0);
  useEffect(() => { const t = setTimeout(() => setP(pct), 80); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ * (1 - p / 100)}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 4px ${color}88)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

/* ── stat card ───────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, color = "#FF5C1A", loading, spark }) {
  return (
    <div style={{
      background: "#12151B", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 18, padding: "1.375rem 1.5rem",
      position: "relative", overflow: "hidden", transition: "border-color 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.boxShadow = `0 8px 32px ${color}18`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "none"; }}>

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},${color}44)` }} />
      <div style={{ position: "absolute", top: -30, right: -20, width: 90, height: 90, borderRadius: "50%", background: `${color}08`, filter: "blur(20px)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0, fontSize: "1rem" }}>
          {icon}
        </div>
      </div>

      <div style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.5rem" }}>{label}</div>

      {loading
        ? <div style={{ height: 36, background: "rgba(255,255,255,0.04)", borderRadius: 6, animation: "shimmer 1.5s ease infinite", marginBottom: "0.375rem" }} />
        : <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "2.25rem", fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>
            {value != null ? <CountUp to={value} /> : <span style={{ color: "rgba(255,255,255,0.15)" }}>—</span>}
          </div>
      }

      {sub && <div style={{ fontSize: "0.68rem", color: "#525D72" }}>{sub}</div>}
      {spark && !loading && <SparkBars values={spark} color={color} />}
    </div>
  );
}

/* ── quick metric row ────────────────────────────────────── */
function QuickMetric({ label, value, color = "#FF5C1A", icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}12`, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0, fontSize: "0.85rem" }}>
        {icon}
      </div>
      <span style={{ fontSize: "0.78rem", color: "#9AA3B4", flex: 1 }}>{label}</span>
      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, color }}>{value ?? "—"}</span>
    </div>
  );
}

/* ── goal distribution ───────────────────────────────────── */
// Backend returns: [{ goal, count }]  — convert to display
const GOAL_META = {
  weight_loss:      { label: "Weight Loss",  color: "#FF5C1A", emoji: "⚖️" },
  muscle_gain:      { label: "Muscle Gain",  color: "#B8F000", emoji: "💪" },
  maintain_fitness: { label: "Maintain",     color: "#00C8E0", emoji: "🎯" },
  endurance:        { label: "Endurance",    color: "#a855f7", emoji: "🏃" },
  wellness:         { label: "Wellness",     color: "#f59e0b", emoji: "🧘" },
};

function GoalDistribution({ rows }) {
  if (!rows?.length) return (
    <div style={{ padding: "2rem", textAlign: "center", color: "#525D72", fontSize: "0.8rem" }}>No goal data yet.</div>
  );
  const total = rows.reduce((s, r) => s + Number(r.count ?? r.user_count ?? 0), 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", padding: "1.25rem 1.5rem" }}>
      {rows.map(r => {
        const key   = r.goal;
        const count = Number(r.count ?? r.user_count ?? 0);
        const meta  = GOAL_META[key] ?? { label: key, color: "#525D72", emoji: "•" };
        const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#9AA3B4", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span>{meta.emoji}</span>{meta.label}
              </span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.85rem", fontWeight: 800, color: meta.color }}>
                {count} <span style={{ color: "#525D72", fontSize: "0.7rem" }}>({pct}%)</span>
              </span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: meta.color, borderRadius: 999, transition: "width 1s cubic-bezier(.4,0,.2,1)", boxShadow: `0 0 6px ${meta.color}66` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── daily signups chart ─────────────────────────────────── */
// Backend returns: [{ day: "2025-01-01T00:00:00Z", count: "3" }]
function GrowthChart({ data = [] }) {
  if (!data.length) return (
    <div style={{ padding: "2rem", textAlign: "center", color: "#525D72", fontSize: "0.8rem" }}>No signup data yet.</div>
  );
  const max = Math.max(...data.map(d => Number(d.count ?? d.value ?? 0)), 1);
  return (
    <div style={{ padding: "1.25rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 72 }}>
        {data.map((d, i) => {
          const v   = Number(d.count ?? d.value ?? 0);
          const pct = Math.max(6, (v / max) * 100);
          const isLast = i === data.length - 1;
          const dayLabel = d.day ?? d.date
            ? new Date(d.day ?? d.date).toLocaleDateString("en-IN", { weekday: "short" })
            : String(i + 1);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
              <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                <div style={{
                  width: "100%", height: `${pct}%`,
                  borderRadius: "3px 3px 0 0",
                  background: isLast ? "linear-gradient(180deg,#FF5C1A,#FF8A3D)" : "rgba(255,92,26,0.25)",
                  boxShadow: isLast ? "0 0 8px rgba(255,92,26,0.4)" : "none",
                  transition: "height 0.8s cubic-bezier(.4,0,.2,1)",
                  position: "relative",
                }}>
                  {v > 0 && isLast && (
                    <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: "0.6rem", fontWeight: 800, color: "#FF5C1A", whiteSpace: "nowrap" }}>{v}</div>
                  )}
                </div>
              </div>
              <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: isLast ? "#FF5C1A" : "#525D72", whiteSpace: "nowrap" }}>
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── retention ───────────────────────────────────────────── */
// Backend returns: [{ cohort_week, new_users, retained_last_7d }]
// Show the most recent 3 cohorts as rings
function RetentionCard({ rows }) {
  const recent = (rows ?? []).slice(0, 3);
  if (!recent.length) return (
    <div style={{ padding: "2rem", textAlign: "center", color: "#525D72", fontSize: "0.8rem" }}>No retention data yet.</div>
  );
  const colors = ["#FF5C1A", "#f59e0b", "#10b981"];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
      {recent.map((r, i) => {
        const pct = r.new_users > 0 ? Math.round((Number(r.retained_last_7d) / Number(r.new_users)) * 100) : 0;
        const label = new Date(r.cohort_week).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        return (
          <div key={r.cohort_week} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <Ring pct={pct} color={colors[i]}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.85rem", fontWeight: 900, color: colors[i] }}>{pct}%</span>
            </Ring>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#525D72" }}>{label}</div>
              <div style={{ fontSize: "0.58rem", color: "#525D72" }}>{r.new_users} users</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── recent users table ──────────────────────────────────── */
function RecentUsers({ rows, loading }) {
  return (
    <Table
      loading={loading}
      rows={rows}
      shimmerRows={5}
      emptyMsg="No recent users."
      columns={[
        {
          key: "name",
          label: "User",
          render: (v, row) => (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ color: "#F0F2F5", fontWeight: 600, fontSize: "0.82rem" }}>{v}</span>
              <span style={{ color: "#525D72", fontSize: "0.68rem" }}>{row.email}</span>
            </div>
          ),
        },
        {
          key: "role",
          label: "Role",
          render: v => <Badge color={v === "admin" ? "orange" : "gray"}>{v}</Badge>,
        },
        {
          key: "is_verified",
          label: "Verified",
          render: v => <Badge color={v ? "green" : "gray"}>{v ? "Yes" : "No"}</Badge>,
        },
        {
          key: "created_at",
          label: "Joined",
          render: v => <span style={{ color: "#525D72", fontSize: "0.72rem" }}>{new Date(v).toLocaleDateString("en-IN")}</span>,
        },
      ]}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function AdminOverview() {
  const [ov,          setOv]          = useState(null);   // overview KPIs
  const [goalDist,    setGoalDist]    = useState([]);      // [{ goal, count }]
  const [dailySignups,setDailySignups]= useState([]);      // [{ day, count }]
  const [recentUsers, setRecentUsers] = useState([]);      // [{ id, name, email, ... }]
  const [topUsers,    setTopUsers]    = useState([]);
  const [atRisk,      setAtRisk]      = useState([]);
  const [retention,   setRetention]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastFetch,   setLastFetch]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      apiFetch("/dashboard"),              // 0 — overview + goal_distribution + daily_signups + recent_users
      apiFetch("/analytics/top-users"),    // 1
      apiFetch("/analytics/at-risk"),      // 2
      apiFetch("/analytics/retention"),    // 3
    ]).then(([dash, top, risk, ret]) => {

      if (dash.status === "fulfilled") {
        // response.data = { overview, goal_distribution, daily_signups, recent_users }
        const d = extractObject(dash.value);
        setOv(d.overview ?? {});
        setGoalDist(Array.isArray(d.goal_distribution) ? d.goal_distribution : []);
        setDailySignups(Array.isArray(d.daily_signups)  ? d.daily_signups   : []);
        setRecentUsers(Array.isArray(d.recent_users)    ? d.recent_users    : []);
      }

      if (top.status  === "fulfilled") setTopUsers(extractArray(top.value,  "users"));
      if (risk.status === "fulfilled") setAtRisk(extractArray(risk.value,   "users"));
      if (ret.status  === "fulfilled") setRetention(extractArray(ret.value) ?? []);

      setLastFetch(new Date());
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  // KPI shorthands — all come from /dashboard → data.overview
  const totalUsers  = ov?.total_users;
  const activeToday = ov?.active_today;
  const workouts    = ov?.total_workouts;
  const meals       = ov?.total_meals_logged;
  const plans       = ov?.active_plans;
  const newWeek     = ov?.new_users_this_week;

  const STAT_CARDS = [
    { label: "Total Users",   value: totalUsers,  icon: "👥", color: "#FF5C1A", sub: newWeek != null ? `+${newWeek} this week` : "Registered members" },
    { label: "Active Today",  value: activeToday, icon: "⚡", color: "#00C8E0", sub: "Unique sessions today" },
    { label: "Workout Logs",  value: workouts,    icon: "🏋️", color: "#B8F000", sub: "All time" },
    { label: "Meal Logs",     value: meals,       icon: "🍽️", color: "#f59e0b", sub: "All time" },
    { label: "Active Plans",  value: plans,       icon: "📋", color: "#a855f7", sub: "Currently running" },
    { label: "New This Week", value: newWeek,     icon: "🚀", color: "#6366f1", sub: "Signups last 7 days" },
  ];

  // Verified count from recent_users is not reliable — derive from goal_dist total if needed
  const goalTotal = goalDist.reduce((s, r) => s + Number(r.count ?? r.user_count ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#F0F2F5", margin: 0, lineHeight: 1 }}>
            Platform Overview
          </h2>
          <p style={{ fontSize: "0.78rem", color: "#525D72", marginTop: "0.3rem" }}>
            Live snapshot — {lastFetch ? `updated ${lastFetch.toLocaleTimeString("en-IN")}` : "loading…"}
          </p>
        </div>
        <button onClick={load} disabled={loading} style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(255,92,26,0.08)", border: "1px solid rgba(255,92,26,0.25)",
          borderRadius: 10, padding: "0.6rem 1rem", color: "#FF8A3D",
          cursor: loading ? "not-allowed" : "pointer", fontSize: "0.78rem",
          fontWeight: 700, transition: "background 0.2s", opacity: loading ? 0.6 : 1,
        }}>
          <span style={{ fontSize: "0.9rem", display: "inline-block", animation: loading ? "spin 0.8s linear infinite" : "none" }}>↻</span>
          Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "1rem" }}>
        {STAT_CARDS.map(c => <StatCard key={c.label} {...c} loading={loading} />)}
      </div>

      {/* Middle row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>

        {/* Quick Metrics */}
        <SectionCard title="📊 Quick Metrics">
          <div style={{ padding: "0.5rem 1.5rem 1rem" }}>
            {loading ? <div style={{ padding: "1rem" }}><Spinner /></div> : <>
              <QuickMetric label="Total Users"      value={totalUsers ?? "—"}  color="#FF5C1A" icon="👥" />
              <QuickMetric label="Active Today"     value={activeToday ?? "—"} color="#00C8E0" icon="⚡" />
              <QuickMetric label="Active Plans"     value={plans ?? "—"}       color="#a855f7" icon="📋" />
              <QuickMetric label="Total Workouts"   value={workouts != null ? Number(workouts).toLocaleString() : "—"} color="#B8F000" icon="🏋️" />
              <QuickMetric label="Total Meals"      value={meals != null ? Number(meals).toLocaleString() : "—"}       color="#f59e0b" icon="🍽️" />
              <QuickMetric label="New This Week"    value={newWeek ?? "—"}     color="#6366f1" icon="🚀" />
            </>}
          </div>
        </SectionCard>

        {/* Goal Distribution */}
        <SectionCard title="🎯 Goal Distribution">
          {loading
            ? <div style={{ padding: "1rem" }}><Spinner /></div>
            : <GoalDistribution rows={goalDist} />
          }
        </SectionCard>

        {/* Retention */}
        <SectionCard title="🔁 Retention (7-day cohorts)">
          {loading
            ? <div style={{ padding: "1rem" }}><Spinner /></div>
            : <RetentionCard rows={retention} />
          }
        </SectionCard>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>

        {/* Daily Signups */}
        <SectionCard title="📅 Daily Signups (Last 14 Days)">
          {loading
            ? <div style={{ padding: "1rem" }}><Spinner /></div>
            : <GrowthChart data={dailySignups} />
          }
        </SectionCard>

        {/* Top Active Users */}
        <SectionCard title="🏆 Top Active Users">
          <Table
            loading={loading}
            rows={topUsers.slice(0, 5)}
            emptyMsg="No workout data yet."
            columns={[
              {
                key: "name",
                label: "User",
                render: (v, row) => (
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ color: "#F0F2F5", fontWeight: 600, fontSize: "0.82rem" }}>{v ?? row.email?.split("@")[0]}</span>
                    <span style={{ color: "#525D72", fontSize: "0.68rem" }}>{row.email}</span>
                  </div>
                ),
              },
              {
                key: "workout_count",
                label: "Workouts",
                render: v => <Badge color="green">{v ?? 0}</Badge>,
              },
            ]}
          />
        </SectionCard>

        {/* At-Risk Users */}
        <SectionCard title="⚠️ At-Risk Users">
          <Table
            loading={loading}
            rows={atRisk.slice(0, 5)}
            emptyMsg="No at-risk users detected."
            columns={[
              {
                key: "name",
                label: "User",
                render: (v, row) => (
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ color: "#F0F2F5", fontWeight: 600, fontSize: "0.82rem" }}>{v ?? row.email?.split("@")[0]}</span>
                    <span style={{ color: "#525D72", fontSize: "0.68rem" }}>{row.email}</span>
                  </div>
                ),
              },
              {
                key: "approx_bmi",
                label: "BMI",
                render: v => {
                  if (v == null) return <span style={{ color: "#525D72" }}>—</span>;
                  const n = Number(v);
                  const c = n > 30 ? "#ef4444" : n < 18.5 ? "#f59e0b" : "#22c55e";
                  return <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, color: c }}>{v}</span>;
                },
              },
              {
                key: "medical_conditions",
                label: "Conditions",
                render: v => {
                  if (!v || typeof v !== "object") return <span style={{ color: "#525D72" }}>—</span>;
                  const flags = Object.entries(v).filter(([, val]) => val === true || val === "true").map(([k]) => k.replace(/_/g, " "));
                  return flags.length ? <Badge color="red">{flags[0]}{flags.length > 1 ? ` +${flags.length - 1}` : ""}</Badge> : <span style={{ color: "#525D72" }}>—</span>;
                },
              },
            ]}
          />
        </SectionCard>
      </div>

      {/* Recent Users */}
      <SectionCard title="🕐 Recent Signups">
        <RecentUsers rows={recentUsers} loading={loading} />
      </SectionCard>

    </div>
  );
}