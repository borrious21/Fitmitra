// ── src/pages/protected/Admin/Sections/AdminLogs.jsx ──────────
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../../services/apiClient";

const LIMIT = 20;

const TAB_CONFIG = {
  workout:  { label: "Workout Logs",  endpoint: "/admin/logs/workout-logs",  canDelete: true  },
  meal:     { label: "Meal Logs",     endpoint: "/admin/logs/meal-logs",      canDelete: true  },
  progress: { label: "Progress Logs", endpoint: "/admin/logs/progress-logs",  canDelete: false },
  admin:    { label: "Admin Logs",    endpoint: "/admin/logs/admin-logs",     canDelete: false },
};

const COLS = {
  workout:  ["User", "Email", "Date", "Exercise", "Sets", "Reps", "Weight", ""],
  meal:     ["User", "Email", "Date", "Meal", "Type", "Cals", "Protein", ""],
  progress: ["User", "Date", "Weight", "Body Fat", "Notes", ""],
  admin:    ["Admin", "Email", "Action", "Target", "Details", "When"],
};

// ── Helpers ───────────────────────────────────────────────────
const ActionBtn = ({ onClick, color = "orange", children, disabled, small }) => {
  const bg = {
    orange: "linear-gradient(135deg,#FF5C1A,#FF8A3D)",
    red:    "linear-gradient(135deg,#dc2626,#ef4444)",
    gray:   "rgba(255,255,255,0.07)",
  };
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: small ? "0.3rem 0.65rem" : "0.45rem 0.9rem",
        borderRadius: 7, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "rgba(255,255,255,0.05)" : bg[color],
        color: "#fff", fontSize: small ? "0.65rem" : "0.72rem",
        fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
        opacity: disabled ? 0.45 : hover ? 0.88 : 1,
        transition: "opacity 0.18s, transform 0.18s",
        transform: !disabled && hover ? "translateY(-1px)" : "none",
        whiteSpace: "nowrap", flexShrink: 0,
      }}
    >{children}</button>
  );
};

const SkeletonRow = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} style={{ padding: "0.75rem 1rem" }}>
        <div style={{
          height: 13, borderRadius: 5,
          width: i === 0 ? "75%" : i === cols - 1 ? 50 : "60%",
          backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s ease-in-out infinite",
        }} />
      </td>
    ))}
  </tr>
);

// ── Confirm dialog ────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161A23", border: "1px solid rgba(255,77,109,0.25)", borderRadius: 16, padding: "1.75rem", width: 360, maxWidth: "90vw", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⚠️</div>
        <div style={{ fontSize: "0.9rem", color: "#F0F2F5", fontWeight: 600, marginBottom: "0.5rem" }}>Delete this log?</div>
        <div style={{ fontSize: "0.78rem", color: "#525D72", marginBottom: "1.5rem", lineHeight: 1.55 }}>{message}</div>
        <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center" }}>
          <ActionBtn onClick={onCancel}  color="gray">Cancel</ActionBtn>
          <ActionBtn onClick={onConfirm} color="red">Delete</ActionBtn>
        </div>
      </div>
    </div>
  );
}

// ── Cell helpers ──────────────────────────────────────────────
const Td = ({ children, bold, mono, right }) => (
  <td style={{
    padding: "0.75rem 1rem",
    fontSize: bold ? "0.82rem" : "0.76rem",
    color: bold ? "#F0F2F5" : "#9AA3B4",
    fontWeight: bold ? 600 : 400,
    whiteSpace: "nowrap",
    fontFamily: mono ? "monospace" : "inherit",
    textAlign: right ? "right" : "left",
    maxWidth: 220,
    overflow: "hidden", textOverflow: "ellipsis",
  }}>{children ?? "—"}</td>
);

const ActionBadge = ({ action }) => {
  const color = action?.includes("DELETE") ? ["rgba(239,68,68,0.12)", "#ef4444"]
              : action?.includes("CREATE") ? ["rgba(34,197,94,0.12)",  "#22c55e"]
              : action?.includes("UPDATE") ? ["rgba(59,130,246,0.12)", "#60a5fa"]
              : ["rgba(255,92,26,0.12)", "#FF5C1A"];
  return (
    <span style={{
      padding: "0.2rem 0.55rem", borderRadius: 6,
      fontSize: "0.6rem", fontWeight: 700,
      letterSpacing: "0.07em", textTransform: "uppercase",
      background: color[0], color: color[1], whiteSpace: "nowrap",
    }}>{action}</span>
  );
};

const fmt = (dateStr) => {
  if (!dateStr) return "—";
  try { return new Date(dateStr).toLocaleDateString("en-IN"); }
  catch { return "—"; }
};
const fmtFull = (dateStr) => {
  if (!dateStr) return "—";
  try { return new Date(dateStr).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }); }
  catch { return "—"; }
};

// ── Main component ────────────────────────────────────────────
export default function AdminLogs({ toast }) {
  const [tab,       setTab]       = useState("workout");
  const [logs,      setLogs]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [offset,    setOffset]    = useState(0);

  // filters
  const [userId,    setUserId]    = useState("");
  const [adminId,   setAdminId]   = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");

  // delete confirm
  const [deleting,  setDeleting]  = useState(null); // { id, tab }
  const [busy,      setBusy]      = useState(false);

  // ── Fetch ─────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { endpoint } = TAB_CONFIG[tab];
      const params = new URLSearchParams({ limit: LIMIT, offset });
      if (tab === "admin") {
        if (adminId) params.set("admin_id", adminId);
      } else {
        if (userId)    params.set("user_id",    userId);
        if (startDate && tab !== "progress") params.set("start_date", startDate);
        if (endDate   && tab !== "progress") params.set("end_date",   endDate);
      }
      const payload = await apiFetch(`${endpoint}?${params}`);
      setLogs(payload.logs  ?? []);
      setTotal(payload.total ?? 0);
    } catch (err) {
      toast?.(err?.message ?? "Failed to load logs", "error");
    } finally {
      setLoading(false);
    }
  }, [tab, offset, userId, adminId, startDate, endDate]);

  // Reset page + clear logs when tab changes
  useEffect(() => { setOffset(0); setLogs([]); setUserId(""); setAdminId(""); setStartDate(""); setEndDate(""); }, [tab]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const endpoint = deleting.tab === "workout"
        ? `/admin/logs/workout-logs/${deleting.id}`
        : `/admin/logs/meal-logs/${deleting.id}`;
      await apiFetch(endpoint, { method: "DELETE" });
      toast?.("Log entry deleted", "success");
      setDeleting(null);
      fetchLogs();
    } catch (err) {
      toast?.(err?.message ?? "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const pages   = Math.ceil(total / LIMIT);
  const page    = Math.floor(offset / LIMIT);
  const colDefs = COLS[tab];
  const { canDelete } = TAB_CONFIG[tab];

  // ── Row renderers ─────────────────────────────────────────
  const renderRow = (log) => {
    const delBtn = canDelete ? (
      <td style={{ padding: "0.75rem 1rem" }}>
        <button
          onClick={() => setDeleting({ id: log.id, tab })}
          style={{ padding: "0.28rem 0.6rem", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "0.65rem", fontWeight: 700, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >Del</button>
      </td>
    ) : null;

    const rowStyle = { borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.12s" };
    const hover = {
      onMouseEnter: e => e.currentTarget.style.background = "rgba(255,255,255,0.02)",
      onMouseLeave: e => e.currentTarget.style.background = "transparent",
    };

    if (tab === "workout") return (
      <tr key={log.id} style={rowStyle} {...hover}>
        <Td bold>{log.user_name}</Td>
        <Td>{log.user_email}</Td>
        <Td>{fmt(log.workout_date)}</Td>
        <Td>{log.exercise_name}</Td>
        <Td>{log.sets}</Td>
        <Td>{log.reps}</Td>
        <Td>{log.weight_kg ? `${log.weight_kg} kg` : null}</Td>
        {delBtn}
      </tr>
    );

    if (tab === "meal") return (
      <tr key={log.id} style={rowStyle} {...hover}>
        <Td bold>{log.user_name}</Td>
        <Td>{log.user_email}</Td>
        <Td>{fmt(log.log_date)}</Td>
        <Td>{log.meal_name}</Td>
        <td style={{ padding: "0.75rem 1rem" }}>
          {log.meal_type && (
            <span style={{ padding: "0.18rem 0.5rem", borderRadius: 5, fontSize: "0.6rem", fontWeight: 700, background: "rgba(255,92,26,0.1)", color: "#FF5C1A", textTransform: "capitalize" }}>
              {log.meal_type}
            </span>
          )}
        </td>
        <Td>{log.calories_consumed != null ? `${log.calories_consumed} kcal` : null}</Td>
        <Td>{log.protein_g != null ? `${log.protein_g}g` : null}</Td>
        {delBtn}
      </tr>
    );

    if (tab === "progress") return (
      <tr key={log.id} style={rowStyle} {...hover}>
        <Td bold>{log.user_name}</Td>
        <Td>{fmt(log.log_date)}</Td>
        <Td>{log.weight_kg != null ? `${log.weight_kg} kg` : null}</Td>
        <Td>{log.body_fat_pct != null ? `${log.body_fat_pct}%` : null}</Td>
        <td style={{ padding: "0.75rem 1rem", fontSize: "0.76rem", color: "#9AA3B4", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {log.notes ?? "—"}
        </td>
        {delBtn}
      </tr>
    );

    // admin logs — no delete button
    let details = "—";
    try {
      const p = typeof log.payload === "string" ? JSON.parse(log.payload) : log.payload;
      if (p && Object.keys(p).length) {
        details = Object.entries(p).map(([k, v]) => `${k}: ${v}`).join(" · ");
      }
    } catch {}

    return (
      <tr key={log.id} style={rowStyle} {...hover}>
        <Td bold>{log.admin_name}</Td>
        <Td>{log.admin_email}</Td>
        <td style={{ padding: "0.75rem 1rem" }}>
          <ActionBadge action={log.action} />
        </td>
        <Td>{log.target_user_id != null ? `#${log.target_user_id}` : null}</Td>
        <td style={{ padding: "0.75rem 1rem", fontSize: "0.7rem", color: "#525D72", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {details}
        </td>
        <Td>{fmtFull(log.created_at)}</Td>
      </tr>
    );
  };

  const inputSt = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 9, padding: "0.5rem 0.75rem",
    color: "#F0F2F5", fontSize: "0.78rem", outline: "none",
    fontFamily: "inherit", transition: "border-color 0.2s",
  };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.6rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5", lineHeight: 1 }}>
          Logs{" "}
          {!loading && <span style={{ color: "#FF5C1A" }}>({total.toLocaleString()})</span>}
        </h2>
        <p style={{ fontSize: "0.72rem", color: "#525D72", marginTop: 4 }}>
          Browse workout, meal, progress and admin action history
        </p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "0.3rem", width: "fit-content", border: "1px solid rgba(255,255,255,0.07)" }}>
        {Object.entries(TAB_CONFIG).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "0.45rem 1rem", borderRadius: 9, border: "none", cursor: "pointer",
              background: tab === key ? "rgba(255,92,26,0.15)" : "transparent",
              color: tab === key ? "#FF5C1A" : "#525D72",
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
              borderBottom: tab === key ? "2px solid #FF5C1A" : "2px solid transparent",
              transition: "all 0.18s", whiteSpace: "nowrap",
            }}
          >{label}</button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        {tab === "admin" ? (
          <input
            value={adminId}
            onChange={e => { setAdminId(e.target.value); setOffset(0); }}
            placeholder="Filter by Admin ID…"
            style={{ ...inputSt, width: 180 }}
            onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.4)"}
            onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          />
        ) : (
          <input
            value={userId}
            onChange={e => { setUserId(e.target.value); setOffset(0); }}
            placeholder="Filter by User ID…"
            style={{ ...inputSt, width: 160 }}
            onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.4)"}
            onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          />
        )}

        {/* Date range — workout + meal only */}
        {(tab === "workout" || tab === "meal") && (
          <>
            <input
              type="date" value={startDate}
              onChange={e => { setStartDate(e.target.value); setOffset(0); }}
              style={{ ...inputSt, colorScheme: "dark" }}
              onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.4)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            <span style={{ fontSize: "0.68rem", color: "#525D72" }}>→</span>
            <input
              type="date" value={endDate}
              onChange={e => { setEndDate(e.target.value); setOffset(0); }}
              style={{ ...inputSt, colorScheme: "dark" }}
              onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.4)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </>
        )}

        {/* Refresh */}
        <button
          onClick={fetchLogs}
          title="Refresh"
          style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#525D72", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,92,26,0.4)"; e.currentTarget.style.color = "#FF5C1A"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#525D72"; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>

        {!loading && (
          <span style={{ fontSize: "0.7rem", color: "#525D72", marginLeft: 4 }}>
            {total.toLocaleString()} record{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                {colDefs.map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#525D72", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={colDefs.length} />)
                : logs.length === 0
                  ? (
                    <tr>
                      <td colSpan={colDefs.length} style={{ padding: "3.5rem 1rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.4 }}>📋</div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.9rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#525D72" }}>
                          No logs found
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#525D72", marginTop: "0.4rem" }}>
                          Try adjusting your filters
                        </div>
                      </td>
                    </tr>
                  )
                  : logs.map(renderRow)
              }
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && pages > 1 && (
          <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", color: "#525D72" }}>
              Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()}
            </span>
            <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
              <ActionBtn small color="gray" disabled={page === 0}        onClick={() => setOffset(0)}>«</ActionBtn>
              <ActionBtn small color="gray" disabled={page === 0}        onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>‹ Prev</ActionBtn>
              <span style={{ padding: "0.35rem 0.75rem", borderRadius: 7, background: "rgba(255,92,26,0.12)", color: "#FF5C1A", fontSize: "0.72rem", fontWeight: 700, border: "1px solid rgba(255,92,26,0.25)" }}>
                {page + 1} / {pages}
              </span>
              <ActionBtn small color="gray" disabled={page >= pages - 1} onClick={() => setOffset(o => o + LIMIT)}>Next ›</ActionBtn>
              <ActionBtn small color="gray" disabled={page >= pages - 1} onClick={() => setOffset((pages - 1) * LIMIT)}>»</ActionBtn>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirm ── */}
      {deleting && (
        <ConfirmDialog
          message="This log entry will be permanently removed and cannot be recovered."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
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