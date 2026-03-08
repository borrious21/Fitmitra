// ── src/pages/protected/Admin/Sections/AdminUsers.jsx ────────
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../../services/apiClient";


const ROLES  = ["", "user", "admin"];
const LIMIT  = 20;

// ── Tiny helpers ─────────────────────────────────────────────
const Badge = ({ children, color }) => {
  const map = {
    green:  ["rgba(34,197,94,0.12)",   "#22c55e"],
    red:    ["rgba(239,68,68,0.12)",   "#ef4444"],
    orange: ["rgba(255,92,26,0.12)",   "#FF5C1A"],
    gray:   ["rgba(148,163,184,0.12)", "#94a3b8"],
    purple: ["rgba(168,85,247,0.12)",  "#c084fc"],
  };
  const [bg, fg] = map[color] ?? map.gray;
  return (
    <span style={{
      padding: "0.2rem 0.6rem", borderRadius: 6,
      fontSize: "0.6rem", fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      background: bg, color: fg,
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
};

const ActionBtn = ({ onClick, color = "orange", children, disabled, small }) => {
  const bg = {
    orange: "linear-gradient(135deg,#FF5C1A,#FF8A3D)",
    green:  "linear-gradient(135deg,#16a34a,#22c55e)",
    red:    "linear-gradient(135deg,#dc2626,#ef4444)",
    gray:   "rgba(255,255,255,0.07)",
  };
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: small ? "0.35rem 0.7rem" : "0.5rem 1rem",
        borderRadius: 8, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "rgba(255,255,255,0.05)" : bg[color],
        color: "#fff",
        fontSize: small ? "0.68rem" : "0.72rem",
        fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
        opacity: disabled ? 0.45 : hover ? 0.88 : 1,
        transition: "opacity 0.18s, transform 0.18s",
        transform: !disabled && hover ? "translateY(-1px)" : "none",
        boxShadow: !disabled && !["gray"].includes(color) && hover
          ? "0 4px 16px rgba(255,92,26,0.3)" : "none",
        whiteSpace: "nowrap",
      }}
    >{children}</button>
  );
};

// ── Skeleton row ──────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} style={{ padding: "0.875rem 1rem" }}>
        <div style={{
          height: 14, borderRadius: 6,
          background: "rgba(255,255,255,0.05)",
          width: i === 0 ? "80%" : i === 7 ? 60 : "60%",
          animation: "shimmer 1.6s ease-in-out infinite",
          backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)",
          backgroundSize: "200% 100%",
        }} />
      </td>
    ))}
  </tr>
);

// ── Confirm dialog ────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161A23", border: "1px solid rgba(255,77,109,0.25)", borderRadius: 16, padding: "1.75rem", width: 360, maxWidth: "90vw", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⚠️</div>
        <div style={{ fontSize: "0.9rem", color: "#F0F2F5", fontWeight: 600, marginBottom: "0.5rem" }}>Are you sure?</div>
        <div style={{ fontSize: "0.78rem", color: "#525D72", marginBottom: "1.5rem", lineHeight: 1.55 }}>{message}</div>
        <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center" }}>
          <ActionBtn onClick={onCancel}  color="gray">Cancel</ActionBtn>
          <ActionBtn onClick={onConfirm} color="red">Confirm</ActionBtn>
        </div>
      </div>
    </div>
  );
}

// ── Manage Modal ──────────────────────────────────────────────
function ManageModal({ user, onClose, onAction, busy }) {
  const [newPw,    setNewPw]    = useState("");
  const [pwErr,    setPwErr]    = useState("");
  const [confirm,  setConfirm]  = useState(null); // { action, label, extra? }

  if (!user) return null;

  const ask = (action, label, extra) => setConfirm({ action, label, extra });

  const handleConfirm = () => {
    onAction(confirm.action, user.id, confirm.extra); // ← passes newPw for reset
    setConfirm(null);
  };

  const handleReset = () => {
    if (newPw.length < 8) { setPwErr("Minimum 8 characters"); return; }
    ask("reset", `Reset password for ${user.name}?`, newPw); // ← stores password
  };

  const meta = [
    ["Email",      user.email],
    ["Role",       user.role],
    ["Verified",   user.is_verified ? "✓ Yes" : "✗ No"],
    ["Status",     user.is_active   ? "Active" : "Banned"],
    ["Goal",       user.goal            ?? "—"],
    ["Activity",   user.activity_level  ?? "—"],
    ["Diet",       user.diet_type       ?? "—"],
    ["Joined",     new Date(user.created_at).toLocaleDateString("en-IN")],
  ];

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#161A23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: 480, maxWidth: "100%", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>

          {/* Modal header */}
          <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,rgba(255,92,26,0.06) 0%,transparent 100%)" }}>
            <div>
              <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.25rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5" }}>{user.name}</h3>
              <div style={{ fontSize: "0.7rem", color: "#525D72", marginTop: 2 }}>User ID: {user.id}</div>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <Badge color={user.role === "admin" ? "orange" : "gray"}>{user.role}</Badge>
              <Badge color={user.is_active ? "green" : "red"}>{user.is_active ? "Active" : "Banned"}</Badge>
            </div>
          </div>

          <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", maxHeight: "60vh" }}>
            {/* Meta grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {meta.map(([k, v]) => (
                <div key={k} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "0.625rem 0.875rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#525D72", marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: "0.8rem", color: "#F0F2F5", fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Reset password */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#525D72", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.625rem" }}>🔑 Reset Password</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  value={newPw}
                  onChange={e => { setNewPw(e.target.value); setPwErr(""); }}
                  placeholder="New password (min 8 chars)"
                  type="password"
                  style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${pwErr ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "0.55rem 0.875rem", color: "#F0F2F5", fontSize: "0.82rem", outline: "none", fontFamily: "inherit" }}
                />
                <ActionBtn onClick={handleReset} color="orange" disabled={busy}>Set</ActionBtn>
              </div>
              {pwErr && <div style={{ fontSize: "0.68rem", color: "#ef4444", marginTop: 5 }}>{pwErr}</div>}
            </div>

            {/* Action buttons */}
            <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#525D72", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.625rem" }}>⚡ Actions</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {!user.is_verified && (
                <ActionBtn color="green" disabled={busy} onClick={() => ask("verify", `Mark ${user.name} as verified?`)}>✓ Verify</ActionBtn>
              )}
              {user.is_active
                ? <ActionBtn color="red"   disabled={busy} onClick={() => ask("ban",      `Ban ${user.name}? They won't be able to log in.`)}>🚫 Ban</ActionBtn>
                : <ActionBtn color="green" disabled={busy} onClick={() => ask("activate", `Re-activate ${user.name}?`)}>✅ Activate</ActionBtn>
              }
              <ActionBtn color="red"  disabled={busy} onClick={() => ask("delete", `Permanently delete ${user.name}? This cannot be undone.`)}>🗑️ Delete</ActionBtn>
              <ActionBtn color="gray" onClick={onClose}>Close</ActionBtn>
            </div>
          </div>
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          message={confirm.label}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function AdminUsers({ toast }) {
  const [users,    setUsers]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [role,     setRole]     = useState("");
  const [offset,   setOffset]   = useState(0);
  const [selected, setSelected] = useState(null);
  const [busy,     setBusy]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset, search, role });
      // apiFetch returns json.data ?? json — controller sends { data: { users, total } }
      const payload = await apiFetch(`/admin/users?${params}`);
      setUsers(payload.users  ?? []);
      setTotal(payload.total  ?? 0);
    } catch (err) {
      toast?.(err?.message ?? "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [offset, search, role]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset to page 0 when filters change
  const handleSearch = (val) => { setSearch(val); setOffset(0); };
  const handleRole   = (val) => { setRole(val);   setOffset(0); };

  // ── Actions ───────────────────────────────────────────────
  const handleAction = async (action, userId, extra) => {
    setBusy(true);
    try {
      if (action === "ban")      await apiFetch(`/admin/users/${userId}/ban`,            { method: "PATCH", body: JSON.stringify({}) });
      if (action === "activate") await apiFetch(`/admin/users/${userId}/activate`,       { method: "PATCH", body: JSON.stringify({}) });
      if (action === "verify")   await apiFetch(`/admin/users/${userId}/verify`,         { method: "PATCH", body: JSON.stringify({}) });
      if (action === "delete")   await apiFetch(`/admin/users/${userId}`,                { method: "DELETE" });
      if (action === "reset")    await apiFetch(`/admin/users/${userId}/reset-password`, { method: "PATCH", body: JSON.stringify({ newPassword: extra }) });

      const labels = { ban: "banned", activate: "activated", verify: "verified", delete: "deleted", reset: "password reset" };
      toast?.(`User ${labels[action] ?? action} successfully`, "success");
      setSelected(null);
      fetchUsers();
    } catch (err) {
      toast?.(err?.message ?? "Action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset  / LIMIT);

  // ── Render ────────────────────────────────────────────────
  return (
    <div>
      {/* ── Topbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.875rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.6rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5", lineHeight: 1 }}>
            Users{" "}
            {!loading && <span style={{ color: "#FF5C1A" }}>({total.toLocaleString()})</span>}
          </h2>
          <p style={{ fontSize: "0.72rem", color: "#525D72", marginTop: 4 }}>
            Manage accounts, verify identities, reset credentials
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#525D72" strokeWidth="2.5" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search name / email…"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.55rem 0.875rem 0.55rem 2rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none", width: 230, fontFamily: "inherit", transition: "border-color 0.2s" }}
              onFocus={e  => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
              onBlur={e   => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>
          <select
            value={role}
            onChange={e => handleRole(e.target.value)}
            style={{ background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.55rem 0.875rem", color: role ? "#F0F2F5" : "#525D72", fontSize: "0.8rem", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            {ROLES.map(r => <option key={r} value={r}>{r || "All Roles"}</option>)}
          </select>
          <button
            onClick={fetchUsers}
            title="Refresh"
            style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#525D72", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}
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
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                {["Name", "Email", "Role", "Verified", "Status", "Goal", "Joined", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#525D72", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : users.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "3rem 1rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "0.625rem", opacity: 0.4 }}>🔍</div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.875rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#525D72" }}>
                          No users found
                        </div>
                      </td>
                    </tr>
                  )
                  : users.map(u => (
                    <tr
                      key={u.id}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Name + avatar initial */}
                      <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#FF5C1A,#FF8A3D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 900, color: "#fff", flexShrink: 0, boxShadow: "0 2px 8px rgba(255,92,26,0.3)" }}>
                            {(u.name ?? "?")[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: "0.82rem", color: "#F0F2F5", fontWeight: 600 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.77rem", color: "#9AA3B4", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</td>
                      <td style={{ padding: "0.875rem 1rem" }}><Badge color={u.role === "admin" ? "orange" : "gray"}>{u.role}</Badge></td>
                      <td style={{ padding: "0.875rem 1rem" }}><Badge color={u.is_verified ? "green" : "gray"}>{u.is_verified ? "✓ Yes" : "✗ No"}</Badge></td>
                      <td style={{ padding: "0.875rem 1rem" }}><Badge color={u.is_active ? "green" : "red"}>{u.is_active ? "Active" : "Banned"}</Badge></td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.77rem", color: "#9AA3B4", textTransform: "capitalize" }}>{u.goal?.replace(/_/g, " ") ?? "—"}</td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.72rem", color: "#525D72", whiteSpace: "nowrap" }}>{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <ActionBtn small color="orange" onClick={() => setSelected(u)}>Manage</ActionBtn>
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
              Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()} users
            </span>
            <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
              <ActionBtn small color="gray" disabled={page === 0} onClick={() => setOffset(0)}>«</ActionBtn>
              <ActionBtn small color="gray" disabled={page === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>‹ Prev</ActionBtn>
              <span style={{ padding: "0.35rem 0.75rem", borderRadius: 7, background: "rgba(255,92,26,0.12)", color: "#FF5C1A", fontSize: "0.72rem", fontWeight: 700, border: "1px solid rgba(255,92,26,0.25)" }}>
                {page + 1} / {pages}
              </span>
              <ActionBtn small color="gray" disabled={page >= pages - 1} onClick={() => setOffset(o => o + LIMIT)}>Next ›</ActionBtn>
              <ActionBtn small color="gray" disabled={page >= pages - 1} onClick={() => setOffset((pages - 1) * LIMIT)}>»</ActionBtn>
            </div>
          </div>
        )}
      </div>

      {/* ── Manage Modal ── */}
      <ManageModal
        user={selected}
        onClose={() => setSelected(null)}
        onAction={handleAction}
        busy={busy}
      />

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}