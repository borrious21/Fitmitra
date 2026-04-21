// src/pages/protected/Admin/AdminLogs/AdminLogs.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../../../../../services/apiClient";
import styles from "./AdminLogs.module.css";

const LIMIT = 20;

const TABS = {
  workout:  { label: "💪 Workout",  endpoint: "/admin/logs/workout-logs",  canDelete: true  },
  meal:     { label: "🍽️ Meals",    endpoint: "/admin/logs/meal-logs",      canDelete: true  },
  progress: { label: "⚖️ Progress", endpoint: "/admin/logs/progress-logs",  canDelete: false },
  admin:    { label: "🛡️ Admin",    endpoint: "/admin/logs/admin-logs",     canDelete: false },
};

const COLS = {
  workout:  ["User", "Date", "Exercise", "Sets", "Reps", "Weight", "RPE", ""],
  meal:     ["User", "Date", "Meal", "Type", "Calories", "Protein", ""],
  progress: ["User", "Date", "Weight", "Body Fat", "Notes"],
  admin:    ["Admin", "Action", "Target", "Details", "When"],
};

const ACTION_COLORS = {
  DELETE: ["rgba(239,68,68,.12)",  "#ef4444"],
  CREATE: ["rgba(34,197,94,.12)",  "#22c55e"],
  UPDATE: ["rgba(59,130,246,.12)", "#60a5fa"],
  BAN:    ["rgba(245,158,11,.12)", "#fcd34d"],
};

const fmt     = d => { try { return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"2-digit"}); } catch { return "—"; } };
const fmtFull = d => { try { return new Date(d).toLocaleString("en-IN",{dateStyle:"short",timeStyle:"short"}); } catch { return "—"; } };

// Action badge 
function ActionBadge({ action }) {
  const key   = Object.keys(ACTION_COLORS).find(k => action?.includes(k)) ?? "";
  const [bg, fg] = ACTION_COLORS[key] ?? ["rgba(255,92,26,.12)", "#FF5C1A"];
  return <span className={styles.actionBadge} style={{ background: bg, color: fg }}>{action}</span>;
}

//  Meal type chip 
function MealTypeChip({ type }) {
  const colors = { breakfast: "#f59e0b", lunch: "#22c55e", dinner: "#3b82f6", snack: "#a855f7" };
  const color  = colors[type] ?? "#64748b";
  return <span className={styles.mealTypeChip} style={{ color, background: `${color}18`, borderColor: `${color}30` }}>{type}</span>;
}

// Confirm 
function Confirm({ onOk, onCancel }) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
        <div className={styles.confirmEmoji}>⚠️</div>
        <div className={styles.confirmTitle}>Delete Log Entry?</div>
        <div className={styles.confirmMsg}>This log will be permanently removed and cannot be recovered.</div>
        <div className={styles.confirmRow}>
          <button className={styles.btnCancel} onClick={onCancel}>Cancel</button>
          <button className={styles.btnDanger} onClick={onOk}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// Main 
export default function AdminLogs() {
  const [tab,       setTab]       = useState("workout");
  const [logs,      setLogs]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [offset,    setOffset]    = useState(0);
  const [userId,    setUserId]    = useState("");
  const [adminId,   setAdminId]   = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [deleting,  setDeleting]  = useState(null);
  const [alert,     setAlert]     = useState(null);

  const flash = (msg, type = "success") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { endpoint } = TABS[tab];
      const p = new URLSearchParams({ limit: LIMIT, offset });
      if (tab === "admin") {
        if (adminId) p.set("admin_id", adminId);
      } else {
        if (userId)    p.set("user_id",    userId);
        if (startDate && tab !== "progress") p.set("start_date", startDate);
        if (endDate   && tab !== "progress") p.set("end_date",   endDate);
      }
      const res = await apiFetch(`${endpoint}?${p}`);
      const d   = res?.data ?? res;
      setLogs(d?.logs  ?? []);
      setTotal(d?.pagination?.total ?? d?.total ?? 0);
    } catch (e) {
      flash(e?.message ?? "Failed to load logs", "error");
    } finally {
      setLoading(false);
    }
  }, [tab, offset, userId, adminId, startDate, endDate]);

  useEffect(() => { setOffset(0); setLogs([]); setUserId(""); setAdminId(""); setStartDate(""); setEndDate(""); }, [tab]);
  useEffect(() => { load(); }, [load]);

  const doDelete = async () => {
    if (!deleting) return;
    try {
      const ep = deleting.tab === "workout"
        ? `/admin/logs/workout-logs/${deleting.id}`
        : `/admin/logs/meal-logs/${deleting.id}`;
      await apiFetch(ep, { method: "DELETE" });
      flash("Log entry deleted");
      setDeleting(null);
      load();
    } catch (e) {
      flash(e?.message ?? "Delete failed", "error");
    }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT) + 1;
  const cols  = COLS[tab];
  const { canDelete } = TABS[tab];

  const renderRow = (log) => {
    const delCell = canDelete ? (
      <td className={styles.td}>
        <button className={styles.delBtn} onClick={() => setDeleting({ id: log.id, tab })}>Del</button>
      </td>
    ) : null;

    if (tab === "workout") return (
      <tr key={log.id} className={styles.tr}>
        <td className={styles.td}>
          <div className={styles.userCell}>
            <div className={styles.userAv}>{log.user_name?.charAt(0).toUpperCase()}</div>
            <div>
              <div className={styles.userName}>{log.user_name}</div>
              <div className={styles.userEmail}>{log.user_email}</div>
            </div>
          </div>
        </td>
        <td className={styles.td}><span className={styles.dateVal}>{fmt(log.workout_date)}</span></td>
        <td className={`${styles.td} ${styles.bold}`}>{log.exercise_name ?? "—"}</td>
        <td className={styles.td}>{log.sets_completed ?? "—"}</td>
        <td className={styles.td}>{log.reps_completed ?? "—"}</td>
        <td className={styles.td}>{log.weight_used ? <span className={styles.accent}>{log.weight_used}kg</span> : "—"}</td>
        <td className={styles.td}>{log.perceived_exertion ? `${log.perceived_exertion}/10` : "—"}</td>
        {delCell}
      </tr>
    );

    if (tab === "meal") return (
      <tr key={log.id} className={styles.tr}>
        <td className={styles.td}>
          <div className={styles.userCell}>
            <div className={styles.userAv}>{log.user_name?.charAt(0).toUpperCase()}</div>
            <div>
              <div className={styles.userName}>{log.user_name}</div>
              <div className={styles.userEmail}>{log.user_email}</div>
            </div>
          </div>
        </td>
        <td className={styles.td}><span className={styles.dateVal}>{fmt(log.log_date)}</span></td>
        <td className={`${styles.td} ${styles.bold}`}>{log.meal_name ?? "—"}</td>
        <td className={styles.td}>{log.meal_type && <MealTypeChip type={log.meal_type} />}</td>
        <td className={styles.td}>{log.calories_consumed != null ? <span className={styles.accent}>{log.calories_consumed} kcal</span> : "—"}</td>
        <td className={styles.td}>{log.protein_g != null ? `${log.protein_g}g` : "—"}</td>
        {delCell}
      </tr>
    );

    if (tab === "progress") return (
      <tr key={log.id} className={styles.tr}>
        <td className={styles.td}>
          <div className={styles.userCell}>
            <div className={styles.userAv}>{log.user_name?.charAt(0).toUpperCase()}</div>
            <span className={styles.userName}>{log.user_name}</span>
          </div>
        </td>
        <td className={styles.td}><span className={styles.dateVal}>{fmt(log.log_date)}</span></td>
        <td className={styles.td}>{log.weight_kg != null ? <span className={styles.accent}>{log.weight_kg}kg</span> : "—"}</td>
        <td className={styles.td}>{log.body_fat_pct != null ? `${log.body_fat_pct}%` : "—"}</td>
        <td className={`${styles.td} ${styles.noteCell}`}>{log.notes ?? "—"}</td>
      </tr>
    );

    let details = "—";
    try {
      const p = typeof log.payload === "string" ? JSON.parse(log.payload) : (log.payload ?? {});
      if (Object.keys(p).length) details = Object.entries(p).map(([k,v]) => `${k}: ${v}`).join(" · ");
    } catch {}

    return (
      <tr key={log.id} className={styles.tr}>
        <td className={styles.td}>
          <div className={styles.userCell}>
            <div className={styles.userAv} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              {log.admin_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={styles.userName}>{log.admin_name}</div>
              <div className={styles.userEmail}>{log.admin_email}</div>
            </div>
          </div>
        </td>
        <td className={styles.td}><ActionBadge action={log.action} /></td>
        <td className={styles.td}>{log.target_user_id != null ? <span className={styles.accent}>#{log.target_user_id}</span> : "—"}</td>
        <td className={`${styles.td} ${styles.noteCell}`}>{details}</td>
        <td className={styles.td}><span className={styles.dateVal}>{fmtFull(log.created_at)}</span></td>
      </tr>
    );
  };

  return (
    <div className={styles.page}>

      {alert && <div className={alert.type === "success" ? styles.alertOk : styles.alertErr}>{alert.msg}</div>}

      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📝 Logs</h1>
        <p className={styles.pageSub}>Workout, meal, progress and admin action history</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabBar}>
        {Object.entries(TABS).map(([key, { label }]) => (
          <button key={key}
            className={`${styles.tabBtn} ${tab === key ? styles.tabActive : ""}`}
            onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {tab === "admin" ? (
          <input className={styles.filterInput} value={adminId}
            onChange={e => { setAdminId(e.target.value); setOffset(0); }}
            placeholder="Filter by Admin ID…" />
        ) : (
          <input className={styles.filterInput} value={userId}
            onChange={e => { setUserId(e.target.value); setOffset(0); }}
            placeholder="Filter by User ID…" />
        )}

        {(tab === "workout" || tab === "meal") && (
          <>
            <input type="date" className={`${styles.filterInput} ${styles.dateInput}`}
              value={startDate} onChange={e => { setStartDate(e.target.value); setOffset(0); }} />
            <span className={styles.dateArrow}>→</span>
            <input type="date" className={`${styles.filterInput} ${styles.dateInput}`}
              value={endDate}   onChange={e => { setEndDate(e.target.value);   setOffset(0); }} />
          </>
        )}

        <button className={styles.refreshBtn} onClick={load} title="Refresh">↺</button>

        {!loading && (
          <span className={styles.totalCount}>{total.toLocaleString()} record{total !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {cols.map(h => <th key={h} className={styles.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className={styles.skRow}>
                    {cols.map((_, j) => (
                      <td key={j} className={styles.td}>
                        <div className={styles.sk} style={{ width: j === 0 ? 140 : 70 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={cols.length} className={styles.emptyCell}>
                  <div className={styles.emptyIcon}>📋</div>
                  <div className={styles.emptyTitle}>No logs found</div>
                  <div className={styles.emptySub}>Try adjusting your filters</div>
                </td></tr>
              ) : (
                logs.map(renderRow)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.pgInfo}>
              Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()}
            </span>
            <div className={styles.pgBtns}>
              <button className={styles.pgBtn} disabled={offset === 0} onClick={() => setOffset(0)}>«</button>
              <button className={styles.pgBtn} disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>‹</button>
              <span className={styles.pgCurrent}>{page} / {pages}</span>
              <button className={styles.pgBtn} disabled={offset + LIMIT >= total} onClick={() => setOffset(o => o + LIMIT)}>›</button>
              <button className={styles.pgBtn} disabled={offset + LIMIT >= total} onClick={() => setOffset((pages - 1) * LIMIT)}>»</button>
            </div>
          </div>
        )}
      </div>

      {deleting && <Confirm onOk={doDelete} onCancel={() => setDeleting(null)} />}
    </div>
  );
}