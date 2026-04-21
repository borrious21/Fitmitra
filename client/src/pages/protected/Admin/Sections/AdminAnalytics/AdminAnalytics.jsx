// src/pages/protected/Admin/AdminAnalytics/AdminAnalytics.jsx
import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../services/apiClient";
import styles from "./AdminAnalytics.module.css";

const MEAL_COLORS = {
  breakfast: "#f59e0b",
  lunch:     "#22c55e",
  dinner:    "#3b82f6",
  snack:     "#a855f7",
  other:     "#94a3b8",
};

// Sparkline 
function Sparkline({ data, color = "#FF5C1A", height = 36, width = 120 }) {
  if (!data || data.length < 2) return null;
  const vals  = data.map(Number);
  const min   = Math.min(...vals);
  const max   = Math.max(...vals);
  const range = max - min || 1;
  const pts   = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Bar fill ─────────────────────────────────────────────────────────────────
function Bar({ value, max, color = "#FF5C1A" }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={styles.barTrack}>
      <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#FF5C1A", icon, loading }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statGlow} style={{ background: `radial-gradient(circle at 100% 0%, ${color}18 0%, transparent 70%)` }} />
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        {icon && <span className={styles.statIcon}>{icon}</span>}
      </div>
      {loading
        ? <div className={styles.sk} style={{ height: 32, width: "60%" }} />
        : <div className={styles.statValue} style={{ color }}>{value ?? "—"}</div>
      }
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

// ─── Section box ──────────────────────────────────────────────────────────────
function SectionBox({ title, subtitle, children }) {
  return (
    <div className={styles.sectionBox}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        {subtitle && <div className={styles.sectionSub}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h = 14, rows = 5 }) {
  return (
    <div className={styles.skList}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.sk} style={{ height: h }} />
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminAnalytics() {
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
        const [ov, wu, ml, tu, ar, ret] = await Promise.all([
          apiFetch("/admin/analytics/overview"),
          apiFetch("/admin/analytics/workouts"),
          apiFetch("/admin/analytics/meals"),
          apiFetch("/admin/analytics/top-users"),
          apiFetch("/admin/analytics/at-risk"),
          apiFetch("/admin/analytics/retention"),
        ]);

        const unwrap = d => d?.data ?? d;

        setOverview(unwrap(ov));
        setWorkouts(Array.isArray(unwrap(wu)) ? unwrap(wu) : []);
        setMeals(Array.isArray(unwrap(ml)) ? unwrap(ml) : []);
        const tuD = unwrap(tu);
        setTopUsers(tuD?.users ?? (Array.isArray(tuD) ? tuD : []));
        const arD = unwrap(ar);
        setAtRisk(arD?.users ?? (Array.isArray(arD) ? arD : []));
        setRetention(Array.isArray(unwrap(ret)) ? unwrap(ret) : []);
      } catch (err) {
        setError(err?.message ?? "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxWorkouts   = Math.max(...workouts.map(w => Number(w.total_workouts || 0)), 1);
  const maxMeals      = Math.max(...meals.map(m => Number(m.total_logs || 0)), 1);
  const sparkData     = workouts.slice(-14).map(w => Number(w.total_workouts || 0));
  const peakDay       = Math.max(...workouts.map(w => Number(w.total_workouts || 0)), 0);
  const avgDay        = workouts.length
    ? Math.round(workouts.reduce((s, w) => s + Number(w.total_workouts || 0), 0) / workouts.length)
    : 0;

  if (!loading && error) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>📊</div>
        <div className={styles.errorTitle}>Analytics Unavailable</div>
        <div className={styles.errorMsg}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📊 Analytics</h1>
        <p className={styles.pageSub}>Platform health, activity trends and user insights</p>
      </div>

      {/* KPI cards */}
      <div className={styles.kpiGrid}>
        <StatCard loading={loading} label="Total Users"   value={overview?.total_users?.toLocaleString()}        icon="👤" color="#FF5C1A" />
        <StatCard loading={loading} label="Total Workouts" value={overview?.total_workouts?.toLocaleString()}    icon="🏋️" color="#22c55e" />
        <StatCard loading={loading} label="Meals Logged"  value={overview?.total_meals_logged?.toLocaleString()} icon="🍽️" color="#3b82f6" />
        <StatCard loading={loading} label="Active Plans"  value={overview?.active_plans?.toLocaleString()}       icon="📋" color="#a855f7" />
        <StatCard loading={loading} label="Active Today"  value={overview?.active_today?.toLocaleString()}       icon="⚡" color="#f59e0b"
          sub="Users who logged a workout today" />
        <StatCard loading={loading} label="New This Week" value={overview?.new_users_this_week?.toLocaleString()} icon="🆕" color="#22c55e" />
      </div>

      {/* Workout activity */}
      {(loading || workouts.length > 0) && (
        <SectionBox title="💪 Workout Activity" subtitle="Last 30 days — most recent 14 shown">
          {loading ? <Skel /> : (
            <>
              <div className={styles.sparkRow}>
                <div>
                  <div className={styles.sparkLabel}>14-day trend</div>
                  <Sparkline data={sparkData} color="#FF5C1A" />
                </div>
                <div className={styles.sparkStats}>
                  <div className={styles.sparkStat}>
                    <div className={styles.sparkStatLabel}>Peak day</div>
                    <div className={styles.sparkStatVal} style={{ color: "#FF5C1A" }}>{peakDay}</div>
                  </div>
                  <div className={styles.sparkStat}>
                    <div className={styles.sparkStatLabel}>Avg / day</div>
                    <div className={styles.sparkStatVal} style={{ color: "#94a3b8" }}>{avgDay}</div>
                  </div>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.thead}>
                      <th className={styles.th}>Date</th>
                      <th className={styles.th}>Workouts</th>
                      <th className={styles.th}>Unique Users</th>
                      <th className={styles.th}>Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workouts.slice(-14).reverse().map(w => (
                      <tr key={w.day} className={styles.tr}>
                        <td className={styles.td}>
                          {new Date(w.day).toLocaleDateString("en-IN",{weekday:"short",month:"short",day:"numeric"})}
                        </td>
                        <td className={`${styles.td} ${styles.tdAccent}`}>{Number(w.total_workouts).toLocaleString()}</td>
                        <td className={styles.td}>{Number(w.unique_users).toLocaleString()}</td>
                        <td className={`${styles.td} ${styles.tdBar}`}>
                          <Bar value={Number(w.total_workouts)} max={maxWorkouts} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </SectionBox>
      )}

      {/* Meal breakdown */}
      {(loading || meals.length > 0) && (
        <SectionBox title="🍽️ Meal Logs Breakdown" subtitle="Last 30 days by meal type">
          {loading
            ? <div className={styles.mealGrid}>{[1,2,3,4].map(i => <div key={i} className={styles.sk} style={{ height: 90 }} />)}</div>
            : (
              <div className={styles.mealGrid}>
                {meals.map(m => {
                  const color = MEAL_COLORS[m.meal_type] ?? MEAL_COLORS.other;
                  return (
                    <div key={m.meal_type} className={styles.mealCard} style={{ borderColor: `${color}22` }}>
                      <div className={styles.mealCardTop}>
                        <span className={styles.mealType} style={{ color }}>{m.meal_type}</span>
                        <span className={styles.mealCount}>{Number(m.total_logs).toLocaleString()}</span>
                      </div>
                      <Bar value={Number(m.total_logs)} max={maxMeals} color={color} />
                      <div className={styles.mealMacros}>
                        <span>⚡ avg {Math.round(m.avg_calories ?? 0)} kcal</span>
                        <span>💪 {Math.round(m.avg_protein ?? 0)}g protein</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </SectionBox>
      )}

      {/* Top active users */}
      {(loading || topUsers.length > 0) && (
        <SectionBox title="🏆 Top Active Users" subtitle="Ranked by workout count — last 30 days">
          {loading ? <Skel /> : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th className={styles.th}>#</th>
                    <th className={styles.th}>Name</th>
                    <th className={styles.th}>Email</th>
                    <th className={styles.th}>Workouts</th>
                    <th className={styles.th}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((u, i) => {
                    const maxW   = Number(topUsers[0]?.workout_count || 1);
                    const podium = i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "#475569";
                    return (
                      <tr key={u.id} className={styles.tr}>
                        <td className={styles.td}>
                          <span className={styles.rankNum} style={{ color: podium }}>#{i+1}</span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.userCell}>
                            <div className={styles.userAv}>{(u.name ?? "?")[0].toUpperCase()}</div>
                            <span className={styles.userName}>{u.name}</span>
                          </div>
                        </td>
                        <td className={styles.td}>{u.email}</td>
                        <td className={`${styles.td} ${styles.tdAccent}`}>{Number(u.workout_count).toLocaleString()}</td>
                        <td className={`${styles.td} ${styles.tdBar}`}>
                          <Bar value={Number(u.workout_count)} max={maxW} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionBox>
      )}

      {/* At-risk users */}
      {(loading || atRisk.length > 0) && (
        <SectionBox title="⚠️ At-Risk Users" subtitle="Users with flagged medical conditions or BMI outside 18.5–30">
          {loading ? <Skel /> : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th className={styles.th}>Name</th>
                    <th className={styles.th}>Email</th>
                    <th className={styles.th}>Age</th>
                    <th className={styles.th}>Weight</th>
                    <th className={styles.th}>BMI</th>
                    <th className={styles.th}>Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map(u => {
                    const bmi      = u.approx_bmi;
                    const bmiColor = !bmi ? "#475569"
                      : Number(bmi) > 30   ? "#ef4444"
                      : Number(bmi) < 18.5 ? "#f59e0b"
                      : "#22c55e";

                    const flags = (() => {
                      try {
                        const mc = typeof u.medical_conditions === "string"
                          ? JSON.parse(u.medical_conditions) : (u.medical_conditions ?? {});
                        return Object.entries(mc).filter(([,v]) => v === true || v === "true").map(([k]) => k.replace(/_/g," "));
                      } catch { return []; }
                    })();

                    return (
                      <tr key={u.id} className={styles.tr}>
                        <td className={`${styles.td} ${styles.tdBold}`}>{u.name}</td>
                        <td className={styles.td}>{u.email}</td>
                        <td className={styles.td}>{u.age ?? "—"}</td>
                        <td className={styles.td}>{u.weight_kg ? `${u.weight_kg} kg` : "—"}</td>
                        <td className={styles.td}>
                          <span className={styles.bmiVal} style={{ color: bmiColor }}>{bmi ?? "—"}</span>
                        </td>
                        <td className={styles.td}>
                          {flags.length > 0 ? (
                            <div className={styles.flagRow}>
                              {flags.map(f => <span key={f} className={styles.flagTag}>{f}</span>)}
                            </div>
                          ) : <span className={styles.bmiOnly}>BMI only</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionBox>
      )}

      {/* Retention */}
      {(loading || retention.length > 0) && (
        <SectionBox title="📈 User Retention" subtitle="Weekly cohorts — last 90 days">
          {loading ? <Skel /> : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th className={styles.th}>Cohort Week</th>
                    <th className={styles.th}>New Users</th>
                    <th className={styles.th}>Retained (7d)</th>
                    <th className={styles.th}>Retention %</th>
                    <th className={styles.th}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {retention.map(r => {
                    const pct      = r.new_users > 0 ? Math.round((r.retained_last_7d / r.new_users) * 100) : 0;
                    const pctColor = pct >= 50 ? "#22c55e" : pct >= 25 ? "#f59e0b" : "#ef4444";
                    return (
                      <tr key={r.cohort_week} className={styles.tr}>
                        <td className={styles.td}>
                          {new Date(r.cohort_week).toLocaleDateString("en-IN",{month:"short",day:"numeric"})}
                        </td>
                        <td className={`${styles.td} ${styles.tdBold}`}>{Number(r.new_users).toLocaleString()}</td>
                        <td className={styles.td}>{Number(r.retained_last_7d).toLocaleString()}</td>
                        <td className={styles.td}>
                          <span className={styles.pctVal} style={{ color: pctColor }}>{pct}%</span>
                        </td>
                        <td className={`${styles.td} ${styles.tdBar}`}>
                          <Bar value={pct} max={100} color={pctColor} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionBox>
      )}
    </div>
  );
}