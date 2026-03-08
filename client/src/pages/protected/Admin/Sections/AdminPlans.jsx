// ── src/pages/protected/Admin/Sections/AdminPlans.jsx ────────
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

const Badge = ({ active }) => (
  <span style={{
    padding: "0.2rem 0.55rem", borderRadius: 6, fontSize: "0.65rem", fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase",
    background: active ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
    color: active ? "#22c55e" : "#ef4444",
  }}>{active ? "Active" : "Inactive"}</span>
);

export default function AdminPlans({ toast }) {
  const [plans,    setPlans]   = useState([]);
  const [total,    setTotal]   = useState(0);
  const [loading,  setLoading] = useState(true);
  const [isActive, setIsActive] = useState("");
  const [offset,   setOffset]  = useState(0);
  const LIMIT = 20;

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset });
      if (isActive !== "") params.set("is_active", isActive);
      const { data } = await api.get(`/admin/plans?${params}`);
      setPlans(data.data.plans);
      setTotal(data.data.total);
    } catch { toast("Failed to load plans", "error"); }
    finally { setLoading(false); }
  }, [offset, isActive]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleDeactivate = async (id) => {
    try {
      await api.patch(`/admin/plans/${id}/deactivate`);
      toast("Plan deactivated");
      fetchPlans();
    } catch { toast("Action failed", "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    try {
      await api.delete(`/admin/plans/${id}`);
      toast("Plan deleted");
      fetchPlans();
    } catch { toast("Delete failed", "error"); }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.4rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5" }}>
          Plans <span style={{ color: "#FF5C1A" }}>({total})</span>
        </h2>
        <select value={isActive} onChange={e => { setIsActive(e.target.value); setOffset(0); }}
          style={{ background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none" }}>
          <option value="">All Plans</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      <div style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["User", "Email", "Goal", "Activity", "Duration", "Status", "Generated", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} style={{ padding: "0.875rem 1rem" }}>
                      <div style={{ height: 16, borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: "shimmer 1.5s infinite" }} />
                    </td></tr>
                  ))
                : plans.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#F0F2F5", fontWeight: 600, whiteSpace: "nowrap" }}>{p.user_name}</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#9AA3B4" }}>{p.user_email}</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#9AA3B4" }}>{p.profile_goal ?? "—"}</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#9AA3B4" }}>{p.activity_level ?? "—"}</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#9AA3B4" }}>{p.duration_weeks}w</td>
                      <td style={{ padding: "0.75rem 1rem" }}><Badge active={p.is_active} /></td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", color: "#525D72", whiteSpace: "nowrap" }}>{new Date(p.generated_at).toLocaleDateString("en-IN")}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          {p.is_active && (
                            <button onClick={() => handleDeactivate(p.id)} style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: "1px solid rgba(245,158,11,0.3)", background: "transparent", color: "#f59e0b", cursor: "pointer", fontSize: "0.68rem", fontWeight: 700 }}>
                              Deactivate
                            </button>
                          )}
                          <button onClick={() => handleDelete(p.id)} style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "0.68rem", fontWeight: 700 }}>
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", color: "#525D72" }}>Page {page + 1} of {pages} · {total} plans</span>
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