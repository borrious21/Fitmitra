// src/pages/protected/Admin/AdminDashboard/AdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../services/apiClient";
import styles from "./AdminDashboard.module.css";

const GOAL_LABELS = {
  weight_loss:      "Weight Loss",
  muscle_gain:      "Muscle Gain",
  maintain_fitness: "Maintenance",
  endurance:        "Endurance",
  wellness:         "Wellness",
  not_set:          "Not Set",
};
const GOAL_COLORS = {
  weight_loss:      "#ef4444",
  muscle_gain:      "#10b981",
  maintain_fitness: "#3b82f6",
  endurance:        "#f59e0b",
  wellness:         "#8b5cf6",
  not_set:          "#475569",
};

// ─── SVG bar chart ────────────────────────────────────────────────────────────
function BarChart({ data, color = "#FF5C1A", height = 120 }) {
  if (!data?.length) return <div className={styles.chartEmpty}>No data yet</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(4, Math.floor(300 / data.length) - 3);

  return (
    <div className={styles.chartWrap}>
      <svg width="100%" viewBox={`0 0 ${data.length * (barW + 3)} ${height}`}
        preserveAspectRatio="none" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const barH = Math.max(2, (d.value / max) * (height - 20));
          const x    = i * (barW + 3);
          const y    = height - 20 - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH}
                fill="url(#barGrad)" rx="2" className={styles.bar} />
              {d.value > 0 && (
                <text x={x + barW / 2} y={y - 3} textAnchor="middle"
                  fontSize="7" fill={color} opacity="0.8">{d.value}</text>
              )}
            </g>
          );
        })}
      </svg>
      <div className={styles.chartLabels}>
        {data.map((d, i) => (
          <span key={i} className={styles.chartLabel}
            style={{ width: `${100 / data.length}%` }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Donut chart for goal distribution ───────────────────────────────────────
function DonutChart({ data }) {
  if (!data?.length) return <div className={styles.chartEmpty}>No data yet</div>;
  const total  = data.reduce((s, d) => s + d.count, 0);
  const r      = 40;
  const cx     = 60;
  const cy     = 60;
  const circ   = 2 * Math.PI * r;

  let offset = 0;
  const slices = data.map(d => {
    const pct   = d.count / total;
    const dash  = circ * pct;
    const slice = { ...d, dash, offset, pct };
    offset += dash;
    return slice;
  });

  return (
    <div className={styles.donutWrap}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="16" />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={GOAL_COLORS[s.goal] ?? "#475569"} strokeWidth="16"
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="800" fill="#f1f5f9">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#475569">users</text>
      </svg>
      <div className={styles.donutLegend}>
        {slices.map((s, i) => (
          <div key={i} className={styles.donutItem}>
            <span className={styles.donutDot} style={{ background: GOAL_COLORS[s.goal] ?? "#475569" }} />
            <span className={styles.donutLabel}>{GOAL_LABELS[s.goal] ?? s.goal}</span>
            <span className={styles.donutCount}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, loading, onClick }) {
  return (
    <div className={styles.kpiCard} style={{ borderTopColor: color }}
      onClick={onClick} role={onClick ? "button" : undefined}>
      <div className={styles.kpiTop}>
        <span className={styles.kpiIcon}>{icon}</span>
        {loading
          ? <div className={styles.sk} style={{ height: 32, width: 80 }} />
          : <span className={styles.kpiValue}>{value ?? "—"}</span>}
      </div>
      <div className={styles.kpiLabel}>{label}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  );
}

// ─── Nav card ─────────────────────────────────────────────────────────────────
function NavCard({ icon, label, desc, path, color, badge }) {
  const navigate = useNavigate();
  return (
    <div className={styles.navCard} onClick={() => navigate(path)} style={{ "--accent": color }}>
      <div className={styles.navIcon} style={{ background: `${color}18`, color }}>{icon}</div>
      <div className={styles.navBody}>
        <div className={styles.navLabel}>{label}</div>
        <div className={styles.navDesc}>{desc}</div>
      </div>
      {badge != null && <span className={styles.navBadge} style={{ background: `${color}20`, color }}>{badge}</span>}
      <span className={styles.navArrow}>→</span>
    </div>
  );
}

// ─── Top user row ─────────────────────────────────────────────────────────────
function TopUserRow({ user, rank }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className={styles.topRow}>
      <span className={styles.topRank}>#{rank}</span>
      <div className={styles.topAv}>
        {user.avatar_url && !imgErr
          ? <img src={user.avatar_url} alt={user.name} onError={() => setImgErr(true)} />
          : user.name?.charAt(0).toUpperCase()}
      </div>
      <div className={styles.topInfo}>
        <span className={styles.topName}>{user.name}</span>
        <span className={styles.topEmail}>{user.email}</span>
      </div>
      <div className={styles.topStats}>
        {user.total_workouts > 0 && <span className={styles.topStat}>💪 {user.total_workouts}</span>}
        {user.current_streak > 0 && <span className={styles.topStat}>🔥 {user.current_streak}d</span>}
      </div>
    </div>
  );
}

// ─── Recent user row ──────────────────────────────────────────────────────────
function RecentUserRow({ user }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className={styles.topRow}>
      <div className={styles.topAv} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
        {user.avatar_url && !imgErr
          ? <img src={user.avatar_url} alt={user.name} onError={() => setImgErr(true)} />
          : user.name?.charAt(0).toUpperCase()}
      </div>
      <div className={styles.topInfo}>
        <span className={styles.topName}>{user.name}</span>
        <span className={styles.topEmail}>{user.email}</span>
      </div>
      <div className={styles.topStats}>
        <span className={styles.topStat} style={{ color: "#64748b", fontSize: 10 }}>
          {new Date(user.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
        </span>
        {user.is_verified && <span className={styles.topStat} style={{ color: "#4ade80" }}>✓</span>}
      </div>
    </div>
  );
}

// ─── Popular workout row ──────────────────────────────────────────────────────
function WorkoutRow({ workout, rank, max }) {
  const pct = max > 0 ? (workout.times_logged / max) * 100 : 0;
  return (
    <div className={styles.wkRow}>
      <span className={styles.wkRank}>#{rank}</span>
      <div className={styles.wkInfo}>
        <div className={styles.wkName}>{workout.exercise_name}</div>
        <div className={styles.wkBar}>
          <div className={styles.wkBarFill} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className={styles.wkStats}>
        <span className={styles.wkCount}>{workout.times_logged}×</span>
        <span className={styles.wkUsers}>{workout.unique_users} users</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert,   setAlert]   = useState(null);
  const [sync,    setSync]    = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Primary dashboard data
      const res = await apiFetch("/admin/dashboard");
      const d   = res?.data ?? res;
      setData(d);
      setSync(new Date());
    } catch {
      setAlert("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const ov = data?.overview ?? {};

  // User growth chart data
  const growthData = (data?.user_growth ?? []).map(d => ({
    label: d.label?.split(" ")[0] ?? "",   // "Nov", "Dec" etc
    value: Number(d.signups ?? 0),
  }));

  // Popular workouts
  const popularWorkouts = data?.popular_workouts ?? [];
  const maxWorkout      = popularWorkouts[0]?.times_logged ?? 1;

  // Goal distribution
  const goalDist = data?.goal_distribution ?? [];

  return (
    <div className={styles.page}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>🛡️ Admin Dashboard</h1>
          <p className={styles.sub}>
            {sync ? `Synced ${sync.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}` : "Loading…"}
          </p>
        </div>
        <div className={styles.topRight}>
          <button className={styles.btnRefresh} onClick={fetchAll} disabled={loading}>
            {loading ? "⟳" : "↺"} Refresh
          </button>
          <button className={styles.btnBack} onClick={() => navigate("/dashboard")}>← App</button>
        </div>
      </div>

      {alert && <div className={styles.alertBanner}>{alert}</div>}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KpiCard icon="👥" label="Total Users"      value={ov.total_users}     color="#3b82f6" loading={loading}
          sub={ov.new_users_today > 0 ? `+${ov.new_users_today} today` : null}
          onClick={() => navigate("/admin/users")} />
        <KpiCard icon="✅" label="Active Users"     value={ov.active_today}    color="#10b981" loading={loading}
          sub="logged in today" />
        <KpiCard icon="🔒" label="Banned"           value={ov.banned_users}    color="#ef4444" loading={loading} />
        <KpiCard icon="✔️" label="Verified"          value={ov.verified_users}  color="#6366f1" loading={loading} />
        <KpiCard icon="💪" label="Workout Sessions"  value={ov.total_workouts}  color="#f59e0b" loading={loading}
          onClick={() => navigate("/admin/logs")} />
        <KpiCard icon="🍽️" label="Meal Logs"         value={ov.total_meal_logs} color="#FF5C1A" loading={loading} />
        <KpiCard icon="📋" label="Active Plans"      value={ov.active_plans}    color="#8b5cf6" loading={loading}
          onClick={() => navigate("/admin/plans")} />
        <KpiCard icon="📈" label="New This Week"     value={ov.new_users_this_week} color="#06b6d4" loading={loading} />
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>

        {/* User growth */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>📈 User Growth</span>
            <span className={styles.chartSub}>Last 14 days</span>
          </div>
          {loading
            ? <div className={styles.sk} style={{ height: 140 }} />
            : <BarChart data={growthData} color="#3b82f6" height={120} />
          }
        </div>

        {/* Goal distribution donut */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>🎯 User Goals</span>
            <span className={styles.chartSub}>All users</span>
          </div>
          {loading
            ? <div className={styles.sk} style={{ height: 140 }} />
            : <DonutChart data={goalDist} />
          }
        </div>
      </div>

      {/* Popular workouts + recent signups */}
      <div className={styles.midRow}>

        {/* Most popular exercises */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>🔥 Most Popular Exercises</span>
            <span className={styles.panelSub}>Last 30 days</span>
          </div>
          {loading ? (
            <div className={styles.skList}>
              {[1,2,3,4,5].map(i => <div key={i} className={styles.sk} style={{ height: 40 }} />)}
            </div>
          ) : popularWorkouts.length === 0 ? (
            <div className={styles.emptyPanel}>No workout data yet</div>
          ) : (
            popularWorkouts.map((w, i) => (
              <WorkoutRow key={w.exercise_name} workout={w} rank={i + 1} max={maxWorkout} />
            ))
          )}
        </div>

        {/* Recent signups */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>🆕 Recent Signups</span>
            <button className={styles.panelLink} onClick={() => navigate("/admin/users")}>
              View All →
            </button>
          </div>
          {loading ? (
            <div className={styles.skList}>
              {[1,2,3].map(i => <div key={i} className={styles.sk} style={{ height: 48 }} />)}
            </div>
          ) : (data?.recent_users ?? []).length === 0 ? (
            <div className={styles.emptyPanel}>No users yet</div>
          ) : (
            (data?.recent_users ?? []).map((u, i) => <RecentUserRow key={u.id ?? i} user={u} />)
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className={styles.sectionTitle}>⚡ Quick Access</div>
      <div className={styles.navGrid}>
        <NavCard icon="👥" label="Users"         desc="Manage all users"              path="/admin/users"         color="#3b82f6" badge={ov.total_users} />
        <NavCard icon="📊" label="Analytics"     desc="Retention & growth stats"      path="/admin/analytics"     color="#10b981" />
        <NavCard icon="🍽️" label="Meals"         desc="Food database"                 path="/admin/meals"         color="#FF5C1A" />
        <NavCard icon="💪" label="Exercises"     desc="Exercise library"              path="/admin/exercises"     color="#f59e0b" />
        <NavCard icon="📋" label="Plans"         desc="User workout plans"            path="/admin/plans"         color="#8b5cf6" />
        <NavCard icon="📝" label="Logs"          desc="Audit & activity logs"         path="/admin/logs"          color="#64748b" />
        <NavCard icon="🔔" label="Notifications" desc="Send to users"                 path="/admin/notifications" color="#06b6d4" />
        <NavCard icon="⚠️" label="At-Risk"       desc="Users needing attention"       path="/admin/analytics"     color="#ef4444" />
      </div>

      {/* Top active users */}
      <div className={styles.bottomGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>🏆 Top Active Users</span>
            <button className={styles.panelLink} onClick={() => navigate("/admin/users")}>View All →</button>
          </div>
          {loading ? (
            <div className={styles.skList}>
              {[1,2,3].map(i => <div key={i} className={styles.sk} style={{ height: 48 }} />)}
            </div>
          ) : (
            <div className={styles.emptyPanel}>Load from analytics endpoint</div>
          )}
        </div>
      </div>

      <div className={styles.footer}>FitMitra Admin · {new Date().getFullYear()}</div>
    </div>
  );
}