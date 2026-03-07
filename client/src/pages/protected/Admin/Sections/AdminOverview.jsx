// ── src/pages/protected/Admin/sections/AdminOverview.jsx ─────
import { useState, useEffect, useCallback } from "react";
import { apiFetch, extractArray, extractObject, pick } from "../AdminUtils";
import { Spinner, Badge, SectionCard, Table } from "../AdminComponents";

function fmt(n) {
  if (n === undefined || n === null) return null;
  const num = Number(n);
  if (isNaN(num)) return null;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000)     return (num / 1_000).toFixed(1)     + "K";
  return String(num);
}

function trend(val, positive = true) {
  if (!val || val === 0) return null;
  const up = positive ? val >= 0 : val <= 0;
  return { icon: up ? "▲" : "▼", color: up ? "#10b981" : "#ef4444", val: Math.abs(val) };
}

/* ── animated count-up number ─────────────────────────────── */
function CountUp({ to, duration = 900 }) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    if (to === null || to === undefined) return;
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

/* ── sparkline bar chart (7 values) ──────────────────────── */
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

/* ── ring progress ────────────────────────────────────────── */
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
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - p / 100)}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 4px ${color}88)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════ */
function StatCard({ icon, label, value, sub, delta, color = "#FF5C1A", loading, spark }) {
  const t = delta !== undefined ? trend(delta) : null;
  return (
    <div style={{
      background: "#12151B",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 18,
      padding: "1.375rem 1.5rem",
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.2s, box-shadow 0.2s",
      cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.boxShadow = `0 8px 32px ${color}18`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "none"; }}>

      {/* top accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},${color}44)` }} />

      {/* glow blob */}
      <div style={{ position: "absolute", top: -30, right: -20, width: 90, height: 90, borderRadius: "50%", background: `${color}08`, filter: "blur(20px)", pointerEvents: "none" }} />

      {/* header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
          <div style={{ width: 16, height: 16 }}>{icon}</div>
        </div>
        {t && (
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: t.color, background: `${t.color}12`, border: `1px solid ${t.color}30`, borderRadius: 999, padding: "0.15rem 0.5rem" }}>
            {t.icon} {t.val}%
          </span>
        )}
      </div>

      {/* label */}
      <div style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.5rem" }}>{label}</div>

      {/* value */}
      {loading
        ? <div style={{ height: 36, background: "rgba(255,255,255,0.04)", borderRadius: 6, animation: "shimmer 1.5s ease infinite", marginBottom: "0.375rem" }} />
        : (
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "2.25rem", fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>
            {value !== undefined && value !== null ? <CountUp to={value} /> : <span style={{ color: "rgba(255,255,255,0.15)" }}>—</span>}
          </div>
        )
      }

      {/* sub */}
      {sub && <div style={{ fontSize: "0.68rem", color: "#525D72" }}>{sub}</div>}

      {/* sparkline */}
      {spark && !loading && <SparkBars values={spark} color={color} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   QUICK METRIC ROW  (compact inline stats)
   ═══════════════════════════════════════════════════════════ */
function QuickMetric({ label, value, color = "#FF5C1A", icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}12`, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
        <span style={{ fontSize: "0.85rem" }}>{icon}</span>
      </div>
      <span style={{ fontSize: "0.78rem", color: "#9AA3B4", flex: 1 }}>{label}</span>
      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, color }}>{value ?? "—"}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GOAL DISTRIBUTION CARD
   ═══════════════════════════════════════════════════════════ */
const GOAL_META = {
  weight_loss:     { label: "Weight Loss",     color: "#FF5C1A", emoji: "⚖️" },
  muscle_gain:     { label: "Muscle Gain",     color: "#B8F000", emoji: "💪" },
  maintain_fitness:{ label: "Maintain",         color: "#00C8E0", emoji: "🎯" },
  endurance:       { label: "Endurance",        color: "#a855f7", emoji: "🏃" },
  wellness:        { label: "Wellness",         color: "#f59e0b", emoji: "🧘" },
};

function GoalDistribution({ data }) {
  if (!data || typeof data !== "object") return null;
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  if (!entries.length) return null;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", padding: "1.25rem 1.5rem" }}>
      {entries.map(([key, count]) => {
        const meta = GOAL_META[key] ?? { label: key, color: "#525D72", emoji: "•" };
        const pct  = Math.round((count / total) * 100);
        return (
          <div key={key}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#9AA3B4", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span>{meta.emoji}</span>{meta.label}
              </span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.85rem", fontWeight: 800, color: meta.color }}>{count} <span style={{ color: "#525D72", fontSize: "0.7rem" }}>({pct}%)</span></span>
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

/* ═══════════════════════════════════════════════════════════
   USER GROWTH MINI-CHART  (daily signups last 7 days)
   ═══════════════════════════════════════════════════════════ */
function GrowthChart({ data = [] }) {
  if (!data.length) return <div style={{ padding: "2rem", textAlign: "center", color: "#525D72", fontSize: "0.8rem" }}>No signup data yet.</div>;
  const max = Math.max(...data.map(d => d.count ?? d.value ?? 0), 1);
  return (
    <div style={{ padding: "1.25rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 72 }}>
        {data.map((d, i) => {
          const v   = d.count ?? d.value ?? 0;
          const pct = Math.max(6, (v / max) * 100);
          const isToday = i === data.length - 1;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
              <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                <div style={{
                  width: "100%",
                  height: `${pct}%`,
                  borderRadius: "3px 3px 0 0",
                  background: isToday ? "linear-gradient(180deg,#FF5C1A,#FF8A3D)" : "rgba(255,92,26,0.25)",
                  boxShadow: isToday ? "0 0 8px rgba(255,92,26,0.4)" : "none",
                  transition: "height 0.8s cubic-bezier(.4,0,.2,1)",
                  position: "relative",
                }}
                  title={`${d.label ?? d.date ?? ""}: ${v} signups`}>
                  {v > 0 && isToday && (
                    <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: "0.6rem", fontWeight: 800, color: "#FF5C1A", whiteSpace: "nowrap" }}>{v}</div>
                  )}
                </div>
              </div>
              <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: isToday ? "#FF5C1A" : "#525D72", whiteSpace: "nowrap" }}>
                {d.label ?? (d.date ? new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }) : i)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RETENTION RINGS
   ═══════════════════════════════════════════════════════════ */
function RetentionCard({ retention }) {
  if (!retention) return <div style={{ padding: "2rem", textAlign: "center", color: "#525D72", fontSize: "0.8rem" }}>No retention data.</div>;
  const rings = [
    { label: "Day 1",  pct: retention.day1  ?? retention.d1  ?? null, color: "#FF5C1A" },
    { label: "Day 7",  pct: retention.day7  ?? retention.d7  ?? null, color: "#f59e0b" },
    { label: "Day 30", pct: retention.day30 ?? retention.d30 ?? null, color: "#10b981" },
  ].filter(r => r.pct !== null);

  if (!rings.length) return <div style={{ padding: "2rem", textAlign: "center", color: "#525D72", fontSize: "0.8rem" }}>No retention data.</div>;

  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
      {rings.map(r => (
        <div key={r.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <Ring pct={Number(r.pct)} color={r.color}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.85rem", fontWeight: 900, color: r.color }}>{r.pct}%</span>
          </Ring>
          <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#525D72" }}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN OVERVIEW COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function AdminOverview() {
  const [dash,      setDash]      = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [topUsers,  setTopUsers]  = useState([]);
  const [atRisk,    setAtRisk]    = useState([]);
  const [retention, setRetention] = useState(null);
  const [growth,    setGrowth]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      apiFetch("/dashboard"),                // 0
      apiFetch("/analytics/overview"),       // 1
      apiFetch("/analytics/users"),          // 2
      apiFetch("/analytics/top-users"),      // 3
      apiFetch("/analytics/at-risk"),        // 4
      apiFetch("/analytics/retention"),      // 5
    ]).then(([d, a, u, t, r, ret]) => {
      if (d.status   === "fulfilled") setDash(extractObject(d.value));
      if (a.status   === "fulfilled") setAnalytics(extractObject(a.value));
      if (u.status   === "fulfilled") {
        const obj = extractObject(u.value);
        setUserStats(obj);
        // try to pull daily signup array from user stats
        const g = obj.daily_signups ?? obj.dailySignups ?? obj.signups_by_day ?? obj.growth ?? [];
        if (Array.isArray(g)) setGrowth(g);
      }
      if (t.status   === "fulfilled") setTopUsers(extractArray(t.value, "users"));
      if (r.status   === "fulfilled") setAtRisk(extractArray(r.value, "users"));
      if (ret.status === "fulfilled") setRetention(extractObject(ret.value));
      setLastFetch(new Date());
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  // Merge dash + analytics into one flat object for easy key picking
  const d = { ...(dash ?? {}), ...(analytics ?? {}) };

  const totalUsers   = pick(d.totalUsers,   d.total_users,   d.usersCount,      d.users_count);
  const activeToday  = pick(d.activeToday,  d.active_today,  d.todayActive,     d.today_active);
  const workoutLogs  = pick(d.workoutLogs,  d.workout_logs,  d.totalWorkoutLogs,d.total_workout_logs, d.workout_count);
  const mealLogs     = pick(d.mealLogs,     d.meal_logs,     d.totalMealLogs,   d.total_meal_logs,   d.meal_count);
  const activePlans  = pick(d.activePlans,  d.active_plans,  d.totalPlans,      d.total_plans,       d.plans_count);
  const notifCount   = pick(d.notifications,d.total_notifications, d.notificationCount, d.notification_count);
  const newThisWeek  = pick(d.newUsersThisWeek, d.new_users_this_week, d.new_users, d.weekly_signups);
  const goalDist     = pick(d.goal_distribution, d.goalDistribution, userStats?.goal_distribution, userStats?.goalDistribution);
  const verifiedPct  = (() => {
    const v = pick(userStats?.verified_users, userStats?.verifiedUsers);
    if (v == null || totalUsers == null) return null;
    return Math.round((Number(v) / Number(totalUsers)) * 100);
  })();

  const STAT_CARDS = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: "👥",
      color: "#FF5C1A",
      sub: newThisWeek != null ? `+${newThisWeek} this week` : "Registered members",
      delta: null,
    },
    {
      label: "Active Today",
      value: activeToday,
      icon: "⚡",
      color: "#00C8E0",
      sub: "Unique logins today",
    },
    {
      label: "Workout Logs",
      value: workoutLogs,
      icon: "🏋️",
      color: "#B8F000",
      sub: "All time",
    },
    {
      label: "Meal Logs",
      value: mealLogs,
      icon: "🍽️",
      color: "#f59e0b",
      sub: "All time",
    },
    {
      label: "Active Plans",
      value: activePlans,
      icon: "📋",
      color: "#a855f7",
      sub: "Currently running",
    },
    {
      label: "Notifications",
      value: notifCount,
      icon: "🔔",
      color: "#6366f1",
      sub: "Sent total",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      {/* ── Header row ───────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#F0F2F5", margin: 0, lineHeight: 1 }}>
            Platform Overview
          </h2>
          <p style={{ fontSize: "0.78rem", color: "#525D72", marginTop: "0.3rem" }}>
            Live snapshot — {lastFetch ? `updated ${lastFetch.toLocaleTimeString("en-IN")}` : "loading…"}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,92,26,0.08)", border: "1px solid rgba(255,92,26,0.25)", borderRadius: 10, padding: "0.6rem 1rem", color: "#FF8A3D", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: 700, transition: "background 0.2s", opacity: loading ? 0.6 : 1 }}>
          <span style={{ fontSize: "0.9rem", display: "inline-block", animation: loading ? "spin 0.8s linear infinite" : "none" }}>↻</span>
          Refresh
        </button>
      </div>

      {/* ── 6 stat cards ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "1rem" }}>
        {STAT_CARDS.map(c => (
          <StatCard key={c.label} {...c} loading={loading} />
        ))}
      </div>

      {/* ── Middle row: quick metrics + goal dist + retention ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>

        {/* Quick Metrics */}
        <SectionCard title="📊 Quick Metrics">
          <div style={{ padding: "0.5rem 1.5rem 1rem" }}>
            {loading
              ? <Spinner />
              : <>
                  <QuickMetric label="Verified Users"       value={pick(userStats?.verified_users, userStats?.verifiedUsers) ?? "—"}  color="#10b981" icon="✅" />
                  <QuickMetric label="Verification Rate"    value={verifiedPct != null ? `${verifiedPct}%` : "—"}                      color="#10b981" icon="📈" />
                  <QuickMetric label="Banned Accounts"      value={pick(userStats?.banned_users, userStats?.bannedUsers, d.banned_users) ?? "—"} color="#ef4444" icon="🚫" />
                  <QuickMetric label="Avg Workouts / User"  value={pick(d.avg_workouts_per_user, d.avgWorkoutsPerUser, d.avg_per_user) ?? "—"} color="#B8F000" icon="🏋️" />
                  <QuickMetric label="Plans Generated"      value={pick(d.totalPlans, d.total_plans, d.plans_count) ?? "—"}             color="#a855f7" icon="📋" />
                  <QuickMetric label="New Users This Week"  value={newThisWeek ?? "—"}                                                  color="#FF5C1A" icon="🚀" />
                </>
            }
          </div>
        </SectionCard>

        {/* Goal Distribution */}
        <SectionCard title="🎯 Goal Distribution">
          {loading
            ? <Spinner />
            : goalDist
              ? <GoalDistribution data={goalDist} />
              : <div style={{ padding: "2rem", textAlign: "center", color: "#525D72", fontSize: "0.8rem" }}>No goal data returned by API.</div>
          }
        </SectionCard>

        {/* Retention Rings */}
        <SectionCard title="🔁 User Retention">
          {loading ? <Spinner /> : <RetentionCard retention={retention} />}
        </SectionCard>
      </div>

      {/* ── Bottom row: growth chart + top users + at-risk ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>

        {/* User Growth Chart */}
        <SectionCard title="📅 Daily Signups (Last 7 Days)">
          {loading ? <Spinner /> : <GrowthChart data={growth} />}
        </SectionCard>

        {/* Top Active Users */}
        <SectionCard title="🏆 Top Active Users" badge={topUsers.length}>
          <Table
            loading={loading}
            rows={topUsers.slice(0, 5)}
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
              { key: "workout_count", label: "Workouts", render: v => <Badge color="#B8F000">{v ?? 0}</Badge> },
              { key: "streak",        label: "Streak",   render: v => v ? <span style={{ color: "#FF5C1A", fontWeight: 700, fontSize: "0.8rem" }}>🔥 {v}d</span> : <span style={{ color: "#525D72" }}>—</span> },
            ]}
            emptyMsg="No top-user data from API."
          />
        </SectionCard>

        {/* At-Risk Users */}
        <SectionCard title="⚠️ At-Risk Users" badge={atRisk.length}>
          <Table
            loading={loading}
            rows={atRisk.slice(0, 5)}
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
              { key: "last_active", label: "Last Seen", render: v => v ? <span style={{ color: "#f59e0b", fontSize: "0.75rem" }}>{new Date(v).toLocaleDateString("en-IN")}</span> : "—" },
              { key: "risk_reason", label: "Reason",    render: v => <Badge color="#ef4444">{v ?? "Inactive"}</Badge> },
            ]}
            emptyMsg="No at-risk users detected."
          />
        </SectionCard>
      </div>

    </div>
  );
}