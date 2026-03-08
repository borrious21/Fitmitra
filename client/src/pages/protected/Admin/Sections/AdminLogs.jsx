// ── src/pages/protected/Admin/Sections/AdminLogs.jsx ─────────
import { useState, useEffect, useCallback } from "react";
import api from "../../../../services/api";

const Btn = ({ onClick, color = "orange", children, disabled }) => {
  const bg = { orange: "#FF5C1A", red: "#ef4444", gray: "rgba(255,255,255,0.08)" };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "0.45rem 0.9rem", borderRadius: 8, border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? "rgba(255,255,255,0.05)" : bg[color],
      color: "#fff", fontSize: "0.72rem", fontWeight: 700,
      letterSpacing: "0.07em", textTransform: "uppercase",
      opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  );
};

const TAB_CONFIG = {
  workout:  { label: "Workout Logs",  endpoint: "/admin/logs/workout-logs",  dateField: "workout_date" },
  meal:     { label: "Meal Logs",     endpoint: "/admin/logs/meal-logs",      dateField: "log_date"     },
  progress: { label: "Progress Logs", endpoint: "/admin/logs/progress-logs",  dateField: "log_date"     },
  admin:    { label: "Admin Logs",    endpoint: "/admin/logs/admin-logs",     dateField: "created_at"   },
};

const WORKOUT_COLS  = ["User",  "Email",       "Date",      "Exercise",     "Sets", "Reps", "Weight", ""];
const MEAL_COLS     = ["User",  "Email",       "Date",      "Meal",         "Type", "Cals", "Protein", ""];
const PROGRESS_COLS = ["User",  "Date",        "Weight",    "Body Fat",     "Notes", ""];
const ADMIN_COLS    = ["Admin", "Email",       "Action",    "Target User",  "When", ""];

export default function AdminLogs({ toast }) {
  const [tab,     setTab]    = useState("workout");
  const [logs,    setLogs]   = useState([]);
  const [total,   setTotal]  = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset,  setOffset] = useState(0);
  const [userId,  setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const LIMIT = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = TAB_CONFIG[tab];
      const params = new URLSearchParams({ limit: LIMIT, offset });
      if (userId)    params.set("user_id",    userId);
      if (startDate) params.set("start_date", startDate);
      if (endDate)   params.set("end_date",   endDate);
      const { data } = await api.get(`${cfg.endpoint}?${params}`);
      setLogs(data.data.logs);
      setTotal(data.data.total);
    } catch { toast("Failed to load logs", "error"); }
    finally { setLoading(false); }
  }, [tab, offset, userId, startDate, endDate]);

  useEffect(() => { setOffset(0); setLogs([]); }, [tab]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this log entry?")) return;
    const endpoint = tab === "workout" ? `/admin/logs/workout-logs/${id}` : `/admin/logs/meal-logs/${id}`;
    try {
      await api.delete(endpoint);
      toast("Log deleted");
      fetchLogs();
    } catch { toast("Delete failed", "error"); }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT);

  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.45rem 0.75rem", color: "#F0F2F5", fontSize: "0.78rem", outline: "none" };

  const renderRow = (log) => {
    const canDelete = tab === "workout" || tab === "meal";
    const delBtn = canDelete ? (
      <button onClick={() => handleDelete(log.id)} style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "0.68rem", fontWeight: 700 }}>Del</button>
    ) : null;

    const cell = (v) => <td style={{ padding: "0.7rem 1rem", fontSize: "0.78rem", color: "#9AA3B4", whiteSpace: "nowrap" }}>{v ?? "—"}</td>;
    const bold = (v) => <td style={{ padding: "0.7rem 1rem", fontSize: "0.82rem", color: "#F0F2F5", fontWeight: 600, whiteSpace: "nowrap" }}>{v}</td>;
    const action = <td style={{ padding: "0.7rem 1rem" }}>{delBtn}</td>;

    if (tab === "workout") return (
      <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        {bold(log.user_name)}{cell(log.user_email)}{cell(new Date(log.workout_date).toLocaleDateString("en-IN"))}
        {cell(log.exercise_name)}{cell(log.sets)}{cell(log.reps)}{cell(log.weight_kg ? `${log.weight_kg}kg` : "—")}{action}
      </tr>
    );

    if (tab === "meal") return (
      <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        {bold(log.user_name)}{cell(log.user_email)}{cell(new Date(log.log_date).toLocaleDateString("en-IN"))}
        {cell(log.meal_name)}{cell(log.meal_type)}{cell(log.calories_consumed)}{cell(log.protein_g ? `${log.protein_g}g` : "—")}{action}
      </tr>
    );

    if (tab === "progress") return (
      <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        {bold(log.user_name)}{cell(new Date(log.log_date).toLocaleDateString("en-IN"))}
        {cell(log.weight_kg ? `${log.weight_kg}kg` : "—")}{cell(log.body_fat_pct ? `${log.body_fat_pct}%` : "—")}
        {cell(log.notes)}{action}
      </tr>
    );

    // admin logs
    return (
      <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        {bold(log.admin_name)}{cell(log.admin_email)}
        <td style={{ padding: "0.7rem 1rem" }}>
          <span style={{ padding: "0.2rem 0.55rem", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, background: "rgba(255,92,26,0.12)", color: "#FF5C1A", letterSpacing: "0.06em" }}>{log.action}</span>
        </td>
        {cell(log.target_user_id ?? "—")}{cell(new Date(log.created_at).toLocaleString("en-IN"))}{action}
      </tr>
    );
  };

  const cols = { workout: WORKOUT_COLS, meal: MEAL_COLS, progress: PROGRESS_COLS, admin: ADMIN_COLS }[tab];
  const showDateFilters = tab !== "admin";

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {Object.entries(TAB_CONFIG).map(([key, { label }]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "0.5rem 1rem", borderRadius: 8, border: "none", cursor: "pointer",
            background: tab === key ? "rgba(255,92,26,0.15)" : "rgba(255,255,255,0.05)",
            color: tab === key ? "#FF5C1A" : "#9AA3B4",
            fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.8rem", fontWeight: 800,
            letterSpacing: "0.1em", textTransform: "uppercase",
            borderBottom: tab === key ? "2px solid #FF5C1A" : "2px solid transparent",
            transition: "all 0.18s",
          }}>{label}</button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <input value={userId} onChange={e => { setUserId(e.target.value); setOffset(0); }} placeholder="Filter by User ID…" style={{ ...inputStyle, width: 180 }} />
        {showDateFilters && <>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setOffset(0); }} style={inputStyle} />
          <input type="date" value={endDate}   onChange={e => { setEndDate(e.target.value);   setOffset(0); }} style={inputStyle} />
        </>}
        <span style={{ fontSize: "0.72rem", color: "#525D72" }}>{total} records</span>
      </div>

      <div style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {cols.map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={cols.length} style={{ padding: "0.875rem 1rem" }}>
                      <div style={{ height: 16, borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: "shimmer 1.5s infinite" }} />
                    </td></tr>
                  ))
                : logs.map(renderRow)
              }
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", color: "#525D72" }}>Page {page + 1} of {pages}</span>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <Btn onClick={() => setOffset(o => Math.max(0, o - LIMIT))} disabled={page === 0} color="gray">← Prev</Btn>
              <Btn onClick={() => setOffset(o => o + LIMIT)} disabled={page >= pages - 1} color="gray">Next →</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}