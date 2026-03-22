// src/pages/protected/Admin/AdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../services/apiClient";
import styles from "./AdminDashboard.module.css";

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, loading }) {
  return (
    <div className={styles.statCard} style={{ borderTopColor: color }}>
      <div className={styles.statTop}>
        <span className={styles.statIcon}>{icon}</span>
        {loading
          ? <div className={styles.skeleton} style={{ height: 32, width: 80 }} />
          : <span className={styles.statValue}>{value ?? "—"}</span>
        }
      </div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

// ─── Nav card — links to sub-pages ───────────────────────────────────────────
function NavCard({ icon, label, desc, path, color, badge }) {
  const navigate = useNavigate();
  return (
    <div className={styles.navCard} onClick={() => navigate(path)} style={{ "--card-accent": color }}>
      <div className={styles.navCardIcon} style={{ background: `${color}1a`, color }}>
        {icon}
      </div>
      <div className={styles.navCardBody}>
        <div className={styles.navCardLabel}>{label}</div>
        <div className={styles.navCardDesc}>{desc}</div>
      </div>
      {badge != null && <span className={styles.navCardBadge} style={{ background: `${color}22`, color }}>{badge}</span>}
      <span className={styles.navCardArrow}>→</span>
    </div>
  );
}

// ─── Top user row ─────────────────────────────────────────────────────────────
function TopUserRow({ user, rank }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className={styles.topUserRow}>
      <span className={styles.topRank}>#{rank}</span>
      <div className={styles.topAvatar}>
        {user.avatar_url && !imgErr
          ? <img src={user.avatar_url} alt={user.name} onError={() => setImgErr(true)} />
          : <span>{user.name?.charAt(0).toUpperCase()}</span>
        }
      </div>
      <div className={styles.topInfo}>
        <span className={styles.topName}>{user.name}</span>
        <span className={styles.topEmail}>{user.email}</span>
      </div>
      <div className={styles.topStats}>
        {user.total_workouts != null && (
          <span className={styles.topStat}>💪 {user.total_workouts}</span>
        )}
        {user.current_streak != null && user.current_streak > 0 && (
          <span className={styles.topStat}>🔥 {user.current_streak}d</span>
        )}
      </div>
    </div>
  );
}

// ─── At-risk user row ─────────────────────────────────────────────────────────
function AtRiskRow({ user }) {
  return (
    <div className={styles.atRiskRow}>
      <div className={styles.atRiskDot} />
      <div className={styles.atRiskInfo}>
        <span className={styles.atRiskName}>{user.name}</span>
        <span className={styles.atRiskReason}>{user.reason ?? `No activity in ${user.days_inactive ?? "?"} days`}</span>
      </div>
      <span className={styles.atRiskBadge}>⚠ At Risk</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats,     setStats]     = useState(null);
  const [overview,  setOverview]  = useState(null);
  const [topUsers,  setTopUsers]  = useState([]);
  const [atRisk,    setAtRisk]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [alert,     setAlert]     = useState(null);
  const [lastSync,  setLastSync]  = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, overviewRes, topRes, atRiskRes] = await Promise.allSettled([
        apiFetch("/admin/dashboard"),
        apiFetch("/admin/analytics/overview"),
        apiFetch("/admin/analytics/top-users"),
        apiFetch("/admin/analytics/at-risk"),
      ]);

      if (statsRes.status    === "fulfilled") setStats(statsRes.value?.data    ?? statsRes.value    ?? null);
      if (overviewRes.status === "fulfilled") setOverview(overviewRes.value?.data ?? overviewRes.value ?? null);
      if (topRes.status      === "fulfilled") {
        const d = topRes.value?.data ?? topRes.value;
        setTopUsers(Array.isArray(d) ? d : d?.users ?? []);
      }
      if (atRiskRes.status   === "fulfilled") {
        const d = atRiskRes.value?.data ?? atRiskRes.value;
        setAtRisk(Array.isArray(d) ? d : d?.users ?? []);
      }

      setLastSync(new Date());
    } catch {
      setAlert("Failed to load some dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derive numbers ─────────────────────────────────────────────────────────
  const s  = stats    ?? {};
  const ov = overview ?? {};

  const totalUsers      = s.total_users      ?? ov.total_users      ?? "—";
  const activeUsers     = s.active_users     ?? ov.active_users     ?? "—";
  const totalWorkouts   = s.total_workouts   ?? ov.total_workouts   ?? "—";
  const totalMealLogs   = s.total_meal_logs  ?? ov.total_meal_logs  ?? "—";
  const newToday        = s.new_today        ?? ov.new_users_today  ?? null;
  const bannedUsers     = s.banned_users     ?? ov.banned_users     ?? null;
  const plansGenerated  = s.plans_generated  ?? ov.total_plans      ?? "—";
  const verifiedUsers   = s.verified_users   ?? ov.verified_users   ?? "—";

  return (
    <div className={styles.wrapper}>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>🛡️ Admin Dashboard</h1>
          <p className={styles.sub}>
            {lastSync
              ? `Last synced ${lastSync.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : "Loading…"}
          </p>
        </div>
        <div className={styles.topBarRight}>
          <button className={styles.refreshBtn} onClick={fetchAll} disabled={loading}>
            {loading ? "⟳" : "↺"} Refresh
          </button>
          <button className={styles.logoutArea} onClick={() => navigate("/dashboard")}>
            ← Back to App
          </button>
        </div>
      </div>

      {alert && (
        <div className={styles.alertBanner}>{alert}</div>
      )}

      {/* ── KPI Stats ──────────────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <StatCard icon="👥" label="Total Users"     value={totalUsers}    sub={newToday != null ? `+${newToday} today` : null} color="#3b82f6" loading={loading} />
        <StatCard icon="✅" label="Active Users"    value={activeUsers}   sub={bannedUsers != null ? `${bannedUsers} banned` : null} color="#10b981" loading={loading} />
        <StatCard icon="✔️" label="Verified"         value={verifiedUsers} color="#6366f1" loading={loading} />
        <StatCard icon="💪" label="Workout Sessions" value={totalWorkouts} color="#f59e0b" loading={loading} />
        <StatCard icon="🍽️" label="Meal Logs"        value={totalMealLogs} color="#FF5C1A" loading={loading} />
        <StatCard icon="📋" label="Plans Generated"  value={plansGenerated} color="#8b5cf6" loading={loading} />
      </div>

      {/* ── Navigation cards ───────────────────────────────────────────────── */}
      <div className={styles.sectionTitle}>⚡ Quick Access</div>
      <div className={styles.navGrid}>
        <NavCard icon="👥" label="User Management"   desc="View, search, ban, delete users"     path="/admin/users"       color="#3b82f6" badge={totalUsers} />
        <NavCard icon="📊" label="Analytics"          desc="Retention, activity, growth stats"   path="/admin/analytics"   color="#10b981" />
        <NavCard icon="🍽️" label="Meal Database"      desc="Manage food items and macros"        path="/admin/meals"       color="#FF5C1A" />
        <NavCard icon="💪" label="Exercise Database"  desc="Add and edit exercise library"       path="/admin/exercises"   color="#f59e0b" />
        <NavCard icon="📋" label="User Plans"         desc="View and manage workout plans"       path="/admin/plans"       color="#8b5cf6" />
        <NavCard icon="📝" label="Logs"               desc="Workout, meal and admin audit logs"  path="/admin/logs"        color="#64748b" />
        <NavCard icon="🔔" label="Notifications"      desc="Send and broadcast notifications"    path="/admin/notifications" color="#06b6d4" />
        <NavCard icon="⚠️" label="At-Risk Users"      desc="Users with no recent activity"       path="/admin/analytics"   color="#ef4444" badge={atRisk.length || null} />
      </div>

      {/* ── Bottom two panels ──────────────────────────────────────────────── */}
      <div className={styles.bottomGrid}>

        {/* Top active users */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>🏆 Top Active Users</span>
            <button className={styles.panelLink} onClick={() => navigate("/admin/users")}>
              View All →
            </button>
          </div>
          {loading ? (
            <div className={styles.skeletonList}>
              {[1,2,3].map(i => <div key={i} className={styles.skeleton} style={{ height: 48 }} />)}
            </div>
          ) : topUsers.length === 0 ? (
            <div className={styles.emptyPanel}>No data yet</div>
          ) : (
            topUsers.slice(0, 5).map((u, i) => <TopUserRow key={u.id ?? i} user={u} rank={i + 1} />)
          )}
        </div>

        {/* At-risk users */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>⚠️ At-Risk Users</span>
            <span className={styles.panelBadge}>{atRisk.length} users</span>
          </div>
          {loading ? (
            <div className={styles.skeletonList}>
              {[1,2,3].map(i => <div key={i} className={styles.skeleton} style={{ height: 48 }} />)}
            </div>
          ) : atRisk.length === 0 ? (
            <div className={styles.emptyPanel}>✅ No at-risk users right now</div>
          ) : (
            atRisk.slice(0, 5).map((u, i) => <AtRiskRow key={u.id ?? i} user={u} />)
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        FitMitra Admin Panel · {new Date().getFullYear()}
      </div>
    </div>
  );
}