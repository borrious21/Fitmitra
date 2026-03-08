// ── src/pages/protected/Admin/Sections/AdminPlans.jsx ─────────
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../../services/apiClient";

const LIMIT = 20;

// ── Helpers ───────────────────────────────────────────────────
const ActionBtn = ({ onClick, color = "orange", children, disabled, small }) => {
  const bg = {
    orange: "linear-gradient(135deg,#FF5C1A,#FF8A3D)",
    red:    "linear-gradient(135deg,#dc2626,#ef4444)",
    yellow: "linear-gradient(135deg,#b45309,#f59e0b)",
    gray:   "rgba(255,255,255,0.07)",
  };
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: small ? "0.3rem 0.65rem" : "0.55rem 1.1rem",
        borderRadius: 8, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "rgba(255,255,255,0.05)" : bg[color],
        color: "#fff", fontSize: small ? "0.65rem" : "0.72rem",
        fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
        opacity: disabled ? 0.45 : hover ? 0.88 : 1,
        transition: "opacity 0.18s, transform 0.18s",
        transform: !disabled && hover ? "translateY(-1px)" : "none",
        boxShadow: !disabled && color !== "gray" && hover ? "0 4px 14px rgba(0,0,0,0.3)" : "none",
        whiteSpace: "nowrap", flexShrink: 0,
      }}
    >{children}</button>
  );
};

const StatusBadge = ({ active }) => (
  <span style={{
    padding: "0.2rem 0.6rem", borderRadius: 6,
    fontSize: "0.6rem", fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase",
    background: active ? "rgba(34,197,94,0.12)"  : "rgba(239,68,68,0.12)",
    color:      active ? "#22c55e"                : "#ef4444",
    whiteSpace: "nowrap",
  }}>{active ? "Active" : "Inactive"}</span>
);

const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} style={{ padding: "0.875rem 1rem" }}>
        <div style={{
          height: 13, borderRadius: 5,
          width: i === 0 ? "72%" : i === 7 ? 90 : "55%",
          backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s ease-in-out infinite",
        }} />
      </td>
    ))}
  </tr>
);

// ── Confirm dialog ────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel, confirmColor = "red", onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161A23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1.75rem", width: 380, maxWidth: "90vw", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{confirmColor === "red" ? "🗑️" : "⚠️"}</div>
        <div style={{ fontSize: "0.92rem", color: "#F0F2F5", fontWeight: 700, marginBottom: "0.5rem" }}>{title}</div>
        <div style={{ fontSize: "0.78rem", color: "#525D72", marginBottom: "1.5rem", lineHeight: 1.55 }}>{message}</div>
        <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center" }}>
          <ActionBtn onClick={onCancel}  color="gray">{confirmColor === "red" ? "Cancel" : "No, keep it"}</ActionBtn>
          <ActionBtn onClick={onConfirm} color={confirmColor}>{confirmLabel}</ActionBtn>
        </div>
      </div>
    </div>
  );
}

// ── Plan Detail Modal ─────────────────────────────────────────
function PlanDetailModal({ plan, onClose, onDeactivate, onDelete, busy }) {
  if (!plan) return null;

  const metaRows = [
    ["User",          plan.user_name],
    ["Email",         plan.user_email],
    ["Goal",          plan.profile_goal?.replace(/_/g, " ") ?? "—"],
    ["Activity",      plan.activity_level?.replace(/_/g, " ") ?? "—"],
    ["Duration",      plan.duration_weeks ? `${plan.duration_weeks} weeks` : "—"],
    ["Diet Type",     plan.diet_type?.replace(/_/g, " ") ?? "—"],
    ["Generated",     plan.generated_at ? new Date(plan.generated_at).toLocaleDateString("en-IN") : "—"],
    ["Status",        null], // rendered separately
  ];

  // Try to surface plan content if present
  let planContent = null;
  try {
    const raw = plan.plan_data ?? plan.content ?? plan.data;
    if (raw) planContent = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {}

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161A23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: 500, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: "linear-gradient(135deg,rgba(255,92,26,0.06) 0%,transparent 100%)" }}>
          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.3rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5", lineHeight: 1 }}>
              {plan.user_name}'s Plan
            </h3>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem" }}>
              <StatusBadge active={plan.is_active} />
              <span style={{ fontSize: "0.65rem", color: "#525D72" }}>Plan ID: {plan.id}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#9AA3B4", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0, marginLeft: "0.75rem" }}>✕</button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Meta grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {metaRows.filter(([, v]) => v !== null).map(([k, v]) => (
              <div key={k} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.625rem 0.875rem" }}>
                <div style={{ fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#525D72", marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: "0.8rem", color: "#F0F2F5", fontWeight: 500, textTransform: "capitalize" }}>{v}</div>
              </div>
            ))}
            {/* Status cell */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.625rem 0.875rem" }}>
              <div style={{ fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#525D72", marginBottom: 3 }}>Status</div>
              <StatusBadge active={plan.is_active} />
            </div>
          </div>

          {/* Plan content preview */}
          {planContent && (
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.625rem" }}>📋 Plan Content</div>
              <pre style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "0.875rem", fontSize: "0.68rem", color: "#9AA3B4", overflow: "auto", maxHeight: 200, lineHeight: 1.6, fontFamily: "monospace", margin: 0 }}>
                {JSON.stringify(planContent, null, 2)}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", paddingTop: "0.25rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            {plan.is_active && (
              <ActionBtn color="yellow" onClick={onDeactivate} disabled={busy} small>⏸ Deactivate</ActionBtn>
            )}
            <ActionBtn color="red"  onClick={onDelete}     disabled={busy} small>🗑️ Delete</ActionBtn>
            <ActionBtn color="gray" onClick={onClose}                       small>Close</ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function AdminPlans({ toast }) {
  const [plans,    setPlans]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [isActive, setIsActive] = useState("");
  const [offset,   setOffset]   = useState(0);
  const [search,   setSearch]   = useState("");

  const [viewing,  setViewing]  = useState(null);
  const [confirm,  setConfirm]  = useState(null); // { type: "deactivate"|"delete", plan }
  const [busy,     setBusy]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset });
      if (isActive !== "") params.set("is_active", isActive);
      if (search)          params.set("search",    search);
      const payload = await apiFetch(`/admin/plans?${params}`);
      setPlans(payload.plans ?? []);
      setTotal(payload.total ?? 0);
    } catch (err) {
      toast?.(err?.message ?? "Failed to load plans", "error");
    } finally {
      setLoading(false);
    }
  }, [offset, isActive, search]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  // ── Actions ───────────────────────────────────────────────
  const handleDeactivate = async (plan) => {
    setBusy(true);
    try {
      await apiFetch(`/admin/plans/${plan.id}/deactivate`, { method: "PATCH", body: JSON.stringify({}) });
      toast?.("Plan deactivated", "success");
      setConfirm(null);
      setViewing(null);
      fetchPlans();
    } catch (err) {
      toast?.(err?.message ?? "Action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (plan) => {
    setBusy(true);
    try {
      await apiFetch(`/admin/plans/${plan.id}`, { method: "DELETE" });
      toast?.("Plan deleted", "success");
      setConfirm(null);
      setViewing(null);
      fetchPlans();
    } catch (err) {
      toast?.(err?.message ?? "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT);

  return (
    <div>
      {/* ── Topbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.875rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.6rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5", lineHeight: 1 }}>
            Plans{" "}
            {!loading && <span style={{ color: "#FF5C1A" }}>({total.toLocaleString()})</span>}
          </h2>
          <p style={{ fontSize: "0.72rem", color: "#525D72", marginTop: 4 }}>
            View and manage AI-generated fitness plans
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#525D72" strokeWidth="2.5" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setOffset(0); }}
              placeholder="Search by user…"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.55rem 0.875rem 0.55rem 2rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none", width: 190, fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          {/* Status filter */}
          <select
            value={isActive}
            onChange={e => { setIsActive(e.target.value); setOffset(0); }}
            style={{ background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.55rem 0.875rem", color: isActive ? "#F0F2F5" : "#525D72", fontSize: "0.8rem", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            <option value="">All Plans</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

          {/* Refresh */}
          <button
            onClick={fetchPlans}
            title="Refresh"
            style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#525D72", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,92,26,0.4)"; e.currentTarget.style.color = "#FF5C1A"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#525D72"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                {["User", "Email", "Goal", "Activity", "Duration", "Status", "Generated", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#525D72", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : plans.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "3.5rem 1rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.4 }}>📋</div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.9rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#525D72" }}>
                          No plans found
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#525D72", marginTop: "0.4rem" }}>
                          {search || isActive ? "Try adjusting your filters" : "Plans will appear here once users generate them"}
                        </div>
                      </td>
                    </tr>
                  )
                  : plans.map(p => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* User with avatar initial */}
                      <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#FF5C1A,#FF8A3D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                            {(p.user_name ?? "?")[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: "0.82rem", color: "#F0F2F5", fontWeight: 600 }}>{p.user_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.76rem", color: "#9AA3B4", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.user_email}</td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.76rem", color: "#9AA3B4", textTransform: "capitalize" }}>
                        {p.profile_goal?.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.76rem", color: "#9AA3B4", textTransform: "capitalize" }}>
                        {p.activity_level?.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        {p.duration_weeks
                          ? <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, color: "#FF5C1A" }}>{p.duration_weeks}<span style={{ fontSize: "0.62rem", color: "#525D72", fontFamily: "inherit", fontWeight: 400 }}> wk</span></span>
                          : <span style={{ color: "#525D72" }}>—</span>
                        }
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <StatusBadge active={p.is_active} />
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.72rem", color: "#525D72", whiteSpace: "nowrap" }}>
                        {p.generated_at ? new Date(p.generated_at).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          <ActionBtn small color="gray"   onClick={() => setViewing(p)}>View</ActionBtn>
                          {p.is_active && (
                            <ActionBtn small color="yellow" onClick={() => setConfirm({ type: "deactivate", plan: p })}>Pause</ActionBtn>
                          )}
                          <ActionBtn small color="red"    onClick={() => setConfirm({ type: "delete", plan: p })}>Del</ActionBtn>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && pages > 1 && (
          <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", color: "#525D72" }}>
              Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()} plans
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

      {/* ── Plan detail modal ── */}
      {viewing && !confirm && (
        <PlanDetailModal
          plan={viewing}
          onClose={() => setViewing(null)}
          onDeactivate={() => setConfirm({ type: "deactivate", plan: viewing })}
          onDelete={() => setConfirm({ type: "delete", plan: viewing })}
          busy={busy}
        />
      )}

      {/* ── Confirm dialogs ── */}
      {confirm?.type === "deactivate" && (
        <ConfirmDialog
          title="Deactivate this plan?"
          message={`${confirm.plan.user_name}'s plan will be marked inactive. The user can generate a new plan.`}
          confirmLabel="⏸ Deactivate"
          confirmColor="yellow"
          onConfirm={() => handleDeactivate(confirm.plan)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm?.type === "delete" && (
        <ConfirmDialog
          title="Delete this plan?"
          message={`${confirm.plan.user_name}'s plan will be permanently removed and cannot be recovered.`}
          confirmLabel="🗑️ Delete"
          confirmColor="red"
          onConfirm={() => handleDelete(confirm.plan)}
          onCancel={() => setConfirm(null)}
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