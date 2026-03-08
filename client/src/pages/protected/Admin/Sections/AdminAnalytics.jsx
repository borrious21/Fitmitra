// ── src/pages/protected/Admin/Sections/AdminAnalytics.jsx ─────
import { useState, useEffect } from "react";
import { apiFetch } from "../../../../services/apiClient";

// ── Tiny primitives ───────────────────────────────────────────
const StatCard = ({ label, value, sub, color = "#FF5C1A", icon, loading }) => (
  <div style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.25rem 1.5rem", position: "relative", overflow: "hidden" }}>
    {/* accent glow */}
    <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at 100% 0%, ${color}18 0%, transparent 70%)`, pointerEvents: "none" }} />
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem" }}>
      <div style={{ fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#525D72" }}>{label}</div>
      {icon && <span style={{ fontSize: "1.1rem", opacity: 0.6 }}>{icon}</span>}
    </div>
    {loading
      ? <div style={{ height: 32, width: "60%", borderRadius: 6, background: "rgba(255,255,255,0.06)", backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.6s ease-in-out infinite" }} />
      : <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "2.1rem", fontWeight: 900, color, lineHeight: 1 }}>{value ?? "—"}</div>
    }
    {sub && <div style={{ fontSize: "0.68rem", color: "#525D72", marginTop: "0.4rem" }}>{sub}</div>}
  </div>
);

const SectionBox = ({ title, children, subtitle }) => (
  <div style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.25rem 1.5rem", marginTop: "1.25rem" }}>
    <div style={{ marginBottom: "1rem" }}>
      <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.95rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F0F2F5", lineHeight: 1 }}>{title}</h3>
      {subtitle && <div style={{ fontSize: "0.68rem", color: "#525D72", marginTop: "0.3rem" }}>{subtitle}</div>}
    </div>
    {children}
  </div>
);

const TH = ({ children }) => (
  <th style={{ padding: "0.6rem 0.875rem", textAlign: "left", fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#525D72", whiteSpace: "nowrap" }}>{children}</th>
);
const TD = ({ children, bold, accent, color, mono }) => (
  <td style={{ padding: "0.6rem 0.875rem", fontSize: mono ? "0.78rem" : "0.78rem", color: color ?? (accent ? "#FF5C1A" : bold ? "#F0F2F5" : "#9AA3B4"), fontWeight: bold || accent ? 600 : 400, whiteSpace: "nowrap", fontFamily: mono ? "monospace" : "inherit" }}>
    {children ?? "—"}
  </td>
);

const Bar = ({ value, max, color = "#FF5C1A", height = 6 }) => {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ height, background: "rgba(255,255,255,0.06)", borderRadius: height, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: height, transition: "width 0.6s ease" }} />
    </div>
  );
};

// Mini sparkline using SVG
const Sparkline = ({ data, color = "#FF5C1A", height = 32, width = 80 }) => {
  if (!data || data.length < 2) return null;
  const vals = data.map(Number);
  const min  = Math.min(...vals);
  const max  = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const MEAL_COLORS = { breakfast: "#f59e0b", lunch: "#22c55e", dinner: "#3b82f6", snack: "#a855f7", other: "#94a3b8" };

const SkeletonBlock = ({ h = 16, w = "100%", mt = 0 }) => (
  <div style={{ height: h, width: w, borderRadius: 6, marginTop: mt, backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.6s ease-in-out infinite" }} />
);

// ── Main Component ────────────────────────────────────────────
export default function AdminAnalytics({ toast }) {
  const [overview,  setOverview]  = useState(null);
  const [workouts,  setWorkouts]  = useState([]);
  const [meals,     setMeals]     = useState([]);
  const [topUsers,  setTopUsers]  = useState([]);
  const [atRisk,    setAtRisk]    = useState([]);
  const [retention, setRetention] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // apiFetch returns json.data ?? json directly
        // Controllers: response(res, 200, true, "msg", data) → apiFetch gives us `data`
        const [ov, wu, ml, tu, ar, ret] = await Promise.all([
          apiFetch("/admin/analytics/overview"),
          apiFetch("/admin/analytics/workouts"),
          apiFetch("/admin/analytics/meals"),
          apiFetch("/admin/analytics/top-users"),
          apiFetch("/admin/analytics/at-risk"),
          apiFetch("/admin/analytics/retention"),
        ]);

        setOverview(ov);
        setWorkouts(Array.isArray(wu) ? wu : []);
        setMeals(Array.isArray(ml) ? ml : []);
        setTopUsers(tu?.users ?? (Array.isArray(tu) ? tu : []));
        setAtRisk(ar?.users   ?? (Array.isArray(ar) ? ar : []));
        setRetention(Array.isArray(ret) ? ret : []);
      } catch (err) {
        console.error("[AdminAnalytics]", err);
        setError(err?.message ?? "Failed to load analytics");
        toast?.(err?.message ?? "Failed to load analytics", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Derived
  const maxWorkouts = Math.max(...workouts.map(w => Number(w.total_workouts || 0)), 1);
  const maxMeals    = Math.max(...meals.map(m => Number(m.total_logs || 0)), 1);
  const workoutSparkData = workouts.slice(-14).map(w => Number(w.total_workouts || 0));

  // ── Error state ───────────────────────────────────────────
  if (!loading && error) return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.5 }}>📊</div>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.5rem" }}>Analytics Unavailable</div>
      <div style={{ fontSize: "0.75rem", color: "#525D72" }}>{error}</div>
    </div>
  );

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.6rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5", lineHeight: 1 }}>
          Analytics
        </h2>
        <p style={{ fontSize: "0.72rem", color: "#525D72", marginTop: 4 }}>
          Platform health, activity trends and user insights
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: "1rem" }}>
        <StatCard loading={loading} label="Total Users"      value={overview?.total_users?.toLocaleString()}         icon="👤" color="#FF5C1A" />
        <StatCard loading={loading} label="Total Workouts"   value={overview?.total_workouts?.toLocaleString()}      icon="🏋️" color="#22c55e" />
        <StatCard loading={loading} label="Meals Logged"     value={overview?.total_meals_logged?.toLocaleString()}  icon="🍽️" color="#3b82f6" />
        <StatCard loading={loading} label="Active Plans"     value={overview?.active_plans?.toLocaleString()}        icon="📋" color="#a855f7" />
        <StatCard loading={loading} label="Active Today"     value={overview?.active_today?.toLocaleString()}        icon="⚡" color="#f59e0b"
          sub="Unique users who logged a workout today" />
        <StatCard loading={loading} label="New This Week"    value={overview?.new_users_this_week?.toLocaleString()} icon="🆕" color="#22c55e" />
      </div>

      {/* ── Workout Activity ── */}
      {(loading || workouts.length > 0) && (
        <SectionBox title="Workout Activity" subtitle="Last 30 days — most recent 14 shown">
          {loading
            ? <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} h={14} />)}
              </div>
            : (
              <div>
                {/* Sparkline header */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1rem", padding: "0.75rem 1rem", background: "rgba(255,92,26,0.06)", borderRadius: 10, border: "1px solid rgba(255,92,26,0.12)" }}>
                  <div>
                    <div style={{ fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#525D72", marginBottom: 4 }}>14-day trend</div>
                    <Sparkline data={workoutSparkData} color="#FF5C1A" width={120} height={36} />
                  </div>
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <div>
                      <div style={{ fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#525D72" }}>Peak day</div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.4rem", fontWeight: 900, color: "#FF5C1A", lineHeight: 1 }}>
                        {Math.max(...workouts.map(w => Number(w.total_workouts || 0)), 0)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#525D72" }}>Avg / day</div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.4rem", fontWeight: 900, color: "#9AA3B4", lineHeight: 1 }}>
                        {workouts.length ? Math.round(workouts.reduce((s, w) => s + Number(w.total_workouts || 0), 0) / workouts.length) : 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <TH>Date</TH><TH>Workouts</TH><TH>Unique Users</TH><TH>Activity</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {workouts.slice(-14).reverse().map(w => (
                        <tr key={w.day} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <TD>{new Date(w.day).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</TD>
                          <TD accent>{Number(w.total_workouts).toLocaleString()}</TD>
                          <TD>{Number(w.unique_users).toLocaleString()}</TD>
                          <td style={{ padding: "0.6rem 0.875rem", width: 180 }}>
                            <Bar value={Number(w.total_workouts)} max={maxWorkouts} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }
        </SectionBox>
      )}

      {/* ── Meal Breakdown ── */}
      {(loading || meals.length > 0) && (
        <SectionBox title="Meal Logs Breakdown" subtitle="Last 30 days by meal type">
          {loading
            ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "0.875rem" }}>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} h={80} />)}
              </div>
            : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "0.875rem" }}>
                {meals.map(m => {
                  const color = MEAL_COLORS[m.meal_type] ?? MEAL_COLORS.other;
                  return (
                    <div key={m.meal_type} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22`, borderRadius: 12, padding: "0.875rem 1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color }}>{m.meal_type}</span>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.3rem", fontWeight: 900, color: "#F0F2F5" }}>
                          {Number(m.total_logs).toLocaleString()}
                        </span>
                      </div>
                      <Bar value={Number(m.total_logs)} max={maxMeals} color={color} height={5} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                        <span style={{ fontSize: "0.65rem", color: "#525D72" }}>⚡ avg {Math.round(m.avg_calories ?? 0)} kcal</span>
                        <span style={{ fontSize: "0.65rem", color: "#525D72" }}>💪 {Math.round(m.avg_protein ?? 0)}g protein</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </SectionBox>
      )}

      {/* ── Top Active Users ── */}
      {(loading || topUsers.length > 0) && (
        <SectionBox title="Top Active Users" subtitle="Ranked by workout count — last 30 days">
          {loading
            ? <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} h={14} />)}
              </div>
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <TH>#</TH><TH>Name</TH><TH>Email</TH><TH>Workouts</TH><TH>Share</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {topUsers.map((u, i) => {
                      const maxW = Number(topUsers[0]?.workout_count || 1);
                      const podium = i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "#525D72";
                      return (
                        <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "0.6rem 0.875rem" }}>
                            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, color: podium }}>#{i + 1}</span>
                          </td>
                          <td style={{ padding: "0.6rem 0.875rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg,#FF5C1A,#FF8A3D)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                                {(u.name ?? "?")[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize: "0.82rem", color: "#F0F2F5", fontWeight: 600 }}>{u.name}</span>
                            </div>
                          </td>
                          <TD>{u.email}</TD>
                          <TD accent>{Number(u.workout_count).toLocaleString()}</TD>
                          <td style={{ padding: "0.6rem 0.875rem", width: 120 }}>
                            <Bar value={Number(u.workout_count)} max={maxW} color="#FF5C1A" height={5} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </SectionBox>
      )}

      {/* ── At-Risk Users ── */}
      {(loading || atRisk.length > 0) && (
        <SectionBox title="At-Risk Users" subtitle="Users with flagged medical conditions or BMI outside 18.5–30">
          {loading
            ? <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} h={14} />)}
              </div>
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <TH>Name</TH><TH>Email</TH><TH>Age</TH><TH>Weight</TH><TH>BMI</TH><TH>Flags</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {atRisk.map(u => {
                      const bmi = u.approx_bmi;
                      const bmiColor = !bmi ? "#525D72"
                        : Number(bmi) > 30  ? "#ef4444"
                        : Number(bmi) < 18.5 ? "#f59e0b"
                        : "#22c55e";

                      const flags = u.medical_conditions
                        ? typeof u.medical_conditions === "string"
                          ? (() => { try { return JSON.parse(u.medical_conditions); } catch { return {}; } })()
                          : u.medical_conditions
                        : {};
                      const flagList = Object.entries(flags)
                        .filter(([, v]) => v === true || v === "true")
                        .map(([k]) => k.replace(/_/g, " "));

                      return (
                        <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <TD bold>{u.name}</TD>
                          <TD>{u.email}</TD>
                          <TD>{u.age ?? "—"}</TD>
                          <TD>{u.weight_kg ? `${u.weight_kg} kg` : null}</TD>
                          <td style={{ padding: "0.6rem 0.875rem" }}>
                            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.1rem", fontWeight: 900, color: bmiColor }}>
                              {bmi ?? "—"}
                            </span>
                          </td>
                          <td style={{ padding: "0.6rem 0.875rem" }}>
                            {flagList.length > 0
                              ? <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                                  {flagList.map(f => (
                                    <span key={f} style={{ padding: "0.15rem 0.45rem", borderRadius: 4, fontSize: "0.58rem", fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444", textTransform: "capitalize", whiteSpace: "nowrap" }}>{f}</span>
                                  ))}
                                </div>
                              : <span style={{ color: "#525D72", fontSize: "0.72rem" }}>BMI only</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </SectionBox>
      )}

      {/* ── Retention ── */}
      {(loading || retention.length > 0) && (
        <SectionBox title="User Retention" subtitle="Weekly cohorts — last 90 days">
          {loading
            ? <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} h={14} />)}
              </div>
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <TH>Cohort Week</TH><TH>New Users</TH><TH>Retained (7d)</TH><TH>Retention %</TH><TH>Trend</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {retention.map(r => {
                      const pct = r.new_users > 0 ? Math.round((r.retained_last_7d / r.new_users) * 100) : 0;
                      const pctColor = pct >= 50 ? "#22c55e" : pct >= 25 ? "#f59e0b" : "#ef4444";
                      return (
                        <tr key={r.cohort_week} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <TD>{new Date(r.cohort_week).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</TD>
                          <TD bold>{Number(r.new_users).toLocaleString()}</TD>
                          <TD>{Number(r.retained_last_7d).toLocaleString()}</TD>
                          <td style={{ padding: "0.6rem 0.875rem" }}>
                            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.1rem", fontWeight: 900, color: pctColor }}>{pct}%</span>
                          </td>
                          <td style={{ padding: "0.6rem 0.875rem", width: 120 }}>
                            <Bar value={pct} max={100} color={pctColor} height={5} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </SectionBox>
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}