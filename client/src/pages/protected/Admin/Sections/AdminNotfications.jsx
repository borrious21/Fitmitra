// ── src/pages/protected/Admin/Sections/AdminNotifications.jsx ─
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../../services/apiClient";

const TYPES   = ["info", "warning", "achievement", "reminder", "system"];
const TARGETS = ["all", "verified", "active"];

const TYPE_META = {
  info:        { color: "#3b82f6", icon: "ℹ️" },
  warning:     { color: "#f59e0b", icon: "⚠️" },
  achievement: { color: "#22c55e", icon: "🏆" },
  reminder:    { color: "#a855f7", icon: "🔔" },
  system:      { color: "#FF5C1A", icon: "⚙️" },
};

const TARGET_META = {
  all:      { label: "All Users",      icon: "👥", color: "#FF5C1A" },
  verified: { label: "Verified Users", icon: "✅", color: "#22c55e" },
  active:   { label: "Active (30d)",   icon: "⚡", color: "#f59e0b" },
};

const LIMIT = 20;

// ── Shared button ─────────────────────────────────────────────
const ActionBtn = ({ onClick, color = "orange", children, disabled, small, fullWidth }) => {
  const bg = {
    orange: "linear-gradient(135deg,#FF5C1A,#FF8A3D)",
    green:  "linear-gradient(135deg,#16a34a,#22c55e)",
    red:    "linear-gradient(135deg,#dc2626,#ef4444)",
    blue:   "linear-gradient(135deg,#2563eb,#3b82f6)",
    gray:   "rgba(255,255,255,0.07)",
  };
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: small ? "0.35rem 0.7rem" : "0.55rem 1.1rem",
        borderRadius: 8, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "rgba(255,255,255,0.05)" : bg[color],
        color: "#fff", fontSize: small ? "0.68rem" : "0.72rem",
        fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
        opacity: disabled ? 0.45 : hover ? 0.88 : 1,
        transition: "opacity 0.18s, transform 0.18s",
        transform: !disabled && hover ? "translateY(-1px)" : "none",
        whiteSpace: "nowrap", flexShrink: 0,
        width: fullWidth ? "100%" : undefined,
        boxShadow: !disabled && color !== "gray" && hover ? "0 4px 14px rgba(0,0,0,0.3)" : "none",
      }}
    >{children}</button>
  );
};

const TypeBadge = ({ type }) => {
  const { color, icon } = TYPE_META[type] ?? { color: "#94a3b8", icon: "📌" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: "0.2rem 0.55rem", borderRadius: 6,
      fontSize: "0.62rem", fontWeight: 700,
      letterSpacing: "0.07em", textTransform: "uppercase",
      background: `${color}1a`, color, whiteSpace: "nowrap",
    }}>{icon} {type}</span>
  );
};

const SkeletonRow = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} style={{ padding: "0.75rem 0.875rem" }}>
        <div style={{
          height: 13, borderRadius: 5,
          width: i === 0 ? "40%" : i === cols - 1 ? 40 : "65%",
          backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s ease-in-out infinite",
        }} />
      </td>
    ))}
  </tr>
);

// ── Field input ───────────────────────────────────────────────
const iStyle = (err) => ({
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.05)",
  border: `1px solid ${err ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
  borderRadius: 8, padding: "0.55rem 0.75rem",
  color: "#F0F2F5", fontSize: "0.8rem", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.2s",
  resize: "vertical",
});

const Field = ({ label, error, hint, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
    <label style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9AA3B4" }}>{label}</label>
    {children}
    {error && <span style={{ fontSize: "0.64rem", color: "#ef4444" }}>{error}</span>}
    {!error && hint && <span style={{ fontSize: "0.64rem", color: "rgba(255,255,255,0.2)" }}>{hint}</span>}
  </div>
);

const SelectField = ({ label, value, onChange, options, renderOption }) => (
  <Field label={label}>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...iStyle(false), background: "#1A1E28", cursor: "pointer" }}>
      {options.map(o => (
        <option key={o} value={o}>{renderOption ? renderOption(o) : o}</option>
      ))}
    </select>
  </Field>
);

// ── Broadcast confirm modal ───────────────────────────────────
function BroadcastConfirm({ form, recipientHint, onConfirm, onCancel, sending }) {
  const { color, icon } = TYPE_META[form.notification_type] ?? TYPE_META.system;
  const tgt = TARGET_META[form.target] ?? TARGET_META.all;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161A23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "1.75rem", width: 420, maxWidth: "90vw" }}>
        <div style={{ fontSize: "2rem", textAlign: "center", marginBottom: "0.75rem" }}>📡</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.1rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5", textAlign: "center", marginBottom: "1.25rem" }}>
          Confirm Broadcast
        </div>

        {/* Preview card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22`, borderRadius: 12, padding: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
            <TypeBadge type={form.notification_type} />
            <span style={{ fontSize: "0.65rem", color: tgt.color, fontWeight: 700 }}>{tgt.icon} {tgt.label}</span>
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#F0F2F5", marginBottom: "0.3rem" }}>{form.title}</div>
          <div style={{ fontSize: "0.75rem", color: "#9AA3B4", lineHeight: 1.5 }}>{form.message}</div>
        </div>

        {recipientHint && (
          <div style={{ fontSize: "0.72rem", color: "#525D72", textAlign: "center", marginBottom: "1.25rem" }}>
            {recipientHint}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center" }}>
          <ActionBtn onClick={onCancel} color="gray" disabled={sending}>Cancel</ActionBtn>
          <ActionBtn onClick={onConfirm} color="blue" disabled={sending}>
            {sending
              ? <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Sending…
                </span>
              : "📡 Send Broadcast"
            }
          </ActionBtn>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
const EMPTY_SEND = { user_id: "", title: "", message: "", notification_type: "info" };
const EMPTY_BC   = { title: "", message: "", notification_type: "system", target: "all" };

export default function AdminNotifications({ toast }) {
  const [notifs,     setNotifs]     = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [offset,     setOffset]     = useState(0);
  const [filterUid,  setFilterUid]  = useState("");
  const [filterType, setFilterType] = useState("");

  // Send form
  const [sendForm,   setSendForm]   = useState(EMPTY_SEND);
  const [sendErrors, setSendErrors] = useState({});
  const [sending,    setSending]    = useState(false);

  // Broadcast form
  const [bcForm,     setBcForm]     = useState(EMPTY_BC);
  const [bcErrors,   setBcErrors]   = useState({});
  const [bcConfirm,  setBcConfirm]  = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  // ── Fetch log ───────────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset });
      if (filterUid)  params.set("user_id", filterUid);
      if (filterType) params.set("type",    filterType);
      const payload = await apiFetch(`/admin/notifications?${params}`);
      setNotifs(payload.notifications ?? []);
      setTotal(payload.total ?? 0);
    } catch (err) {
      toast?.(err?.message ?? "Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  }, [offset, filterUid, filterType]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // ── Send to user ────────────────────────────────────────────
  const validateSend = () => {
    const e = {};
    if (!sendForm.user_id) e.user_id = "Required";
    if (!sendForm.title.trim())   e.title   = "Required";
    if (!sendForm.message.trim()) e.message = "Required";
    setSendErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = async () => {
    if (!validateSend()) return;
    setSending(true);
    try {
      await apiFetch("/admin/notifications/send", {
        method: "POST",
        body: JSON.stringify({ ...sendForm, user_id: Number(sendForm.user_id) }),
      });
      toast?.("Notification sent successfully", "success");
      setSendForm(EMPTY_SEND);
      setSendErrors({});
      fetchNotifs();
    } catch (err) {
      toast?.(err?.message ?? "Send failed", "error");
    } finally {
      setSending(false);
    }
  };

  // ── Broadcast ───────────────────────────────────────────────
  const validateBc = () => {
    const e = {};
    if (!bcForm.title.trim())   e.title   = "Required";
    if (!bcForm.message.trim()) e.message = "Required";
    setBcErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBroadcastClick = () => {
    if (validateBc()) setBcConfirm(true);
  };

  const handleBroadcastConfirm = async () => {
    setBroadcasting(true);
    try {
      const payload = await apiFetch("/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify(bcForm),
      });
      toast?.(`Sent to ${payload.sent ?? "?"} users`, "success");
      setBcForm(EMPTY_BC);
      setBcErrors({});
      setBcConfirm(false);
      fetchNotifs();
    } catch (err) {
      toast?.(err?.message ?? "Broadcast failed", "error");
    } finally {
      setBroadcasting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await apiFetch(`/admin/notifications/${id}`, { method: "DELETE" });
      toast?.("Notification deleted", "success");
      fetchNotifs();
    } catch (err) {
      toast?.(err?.message ?? "Delete failed", "error");
    }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT);

  const card = { background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.5rem" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Header ── */}
      <div>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.6rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5", lineHeight: 1 }}>
          Notifications
        </h2>
        <p style={{ fontSize: "0.72rem", color: "#525D72", marginTop: 4 }}>
          Send targeted notifications or broadcast to user groups
        </p>
      </div>

      {/* ── Send + Broadcast ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.25rem" }}>

        {/* Send to user */}
        <div style={{ ...card, borderTop: "2px solid rgba(255,92,26,0.4)" }}>
          <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F0F2F5", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🎯 Send to User
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <Field label="User ID *" error={sendErrors.user_id}>
              <input
                type="number" min="1" value={sendForm.user_id}
                onChange={e => { setSendForm(f => ({ ...f, user_id: e.target.value })); setSendErrors(e2 => ({ ...e2, user_id: "" })); }}
                placeholder="e.g. 42"
                style={iStyle(sendErrors.user_id)}
                onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
                onBlur={e  => e.target.style.borderColor = sendErrors.user_id ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
              />
            </Field>
            <Field label="Title *" error={sendErrors.title}>
              <input
                value={sendForm.title}
                onChange={e => { setSendForm(f => ({ ...f, title: e.target.value })); setSendErrors(e2 => ({ ...e2, title: "" })); }}
                placeholder="e.g. Workout reminder"
                style={iStyle(sendErrors.title)}
                onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
                onBlur={e  => e.target.style.borderColor = sendErrors.title ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
              />
            </Field>
            <Field label="Message *" error={sendErrors.message}>
              <textarea
                value={sendForm.message}
                onChange={e => { setSendForm(f => ({ ...f, message: e.target.value })); setSendErrors(e2 => ({ ...e2, message: "" })); }}
                rows={3} placeholder="Notification body…"
                style={iStyle(sendErrors.message)}
                onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
                onBlur={e  => e.target.style.borderColor = sendErrors.message ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
              />
            </Field>
            <SelectField
              label="Type"
              value={sendForm.notification_type}
              onChange={v => setSendForm(f => ({ ...f, notification_type: v }))}
              options={TYPES}
              renderOption={t => `${TYPE_META[t].icon} ${t}`}
            />
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <ActionBtn onClick={handleSend} disabled={sending} fullWidth>
              {sending
                ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                    <span style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Sending…
                  </span>
                : "🎯 Send Notification"
              }
            </ActionBtn>
          </div>
        </div>

        {/* Broadcast */}
        <div style={{ ...card, borderTop: "2px solid rgba(59,130,246,0.4)" }}>
          <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F0F2F5", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            📡 Broadcast
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <Field label="Title *" error={bcErrors.title}>
              <input
                value={bcForm.title}
                onChange={e => { setBcForm(f => ({ ...f, title: e.target.value })); setBcErrors(e2 => ({ ...e2, title: "" })); }}
                placeholder="e.g. New feature available"
                style={iStyle(bcErrors.title)}
                onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
                onBlur={e  => e.target.style.borderColor = bcErrors.title ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
              />
            </Field>
            <Field label="Message *" error={bcErrors.message}>
              <textarea
                value={bcForm.message}
                onChange={e => { setBcForm(f => ({ ...f, message: e.target.value })); setBcErrors(e2 => ({ ...e2, message: "" })); }}
                rows={3} placeholder="Broadcast body…"
                style={iStyle(bcErrors.message)}
                onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
                onBlur={e  => e.target.style.borderColor = bcErrors.message ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
              />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <SelectField
                label="Type"
                value={bcForm.notification_type}
                onChange={v => setBcForm(f => ({ ...f, notification_type: v }))}
                options={TYPES}
                renderOption={t => `${TYPE_META[t].icon} ${t}`}
              />
              <SelectField
                label="Target Audience"
                value={bcForm.target}
                onChange={v => setBcForm(f => ({ ...f, target: v }))}
                options={TARGETS}
                renderOption={t => `${TARGET_META[t].icon} ${TARGET_META[t].label}`}
              />
            </div>

            {/* Target preview chip */}
            <div style={{ padding: "0.625rem 0.875rem", borderRadius: 8, background: `${TARGET_META[bcForm.target]?.color ?? "#FF5C1A"}12`, border: `1px solid ${TARGET_META[bcForm.target]?.color ?? "#FF5C1A"}25`, fontSize: "0.7rem", color: TARGET_META[bcForm.target]?.color ?? "#FF5C1A", fontWeight: 600 }}>
              {TARGET_META[bcForm.target]?.icon} Will be sent to: <strong>{TARGET_META[bcForm.target]?.label}</strong>
            </div>
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <ActionBtn color="blue" onClick={handleBroadcastClick} disabled={broadcasting} fullWidth>
              📡 Broadcast
            </ActionBtn>
          </div>
        </div>
      </div>

      {/* ── Notification Log ── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F0F2F5", lineHeight: 1 }}>
              Notification Log{" "}
              {!loading && <span style={{ color: "#FF5C1A" }}>({total.toLocaleString()})</span>}
            </h3>
            <p style={{ fontSize: "0.68rem", color: "#525D72", marginTop: 3 }}>All sent notifications, newest first</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              value={filterUid}
              onChange={e => { setFilterUid(e.target.value); setOffset(0); }}
              placeholder="User ID…"
              style={{ width: 110, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "0.45rem 0.7rem", color: "#F0F2F5", fontSize: "0.78rem", outline: "none", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.4)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setOffset(0); }}
              style={{ background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "0.45rem 0.7rem", color: filterType ? "#F0F2F5" : "#525D72", fontSize: "0.78rem", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              <option value="">All Types</option>
              {TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].icon} {t}</option>)}
            </select>
            <button
              onClick={fetchNotifs}
              title="Refresh"
              style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#525D72", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,92,26,0.4)"; e.currentTarget.style.color = "#FF5C1A"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#525D72"; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                {["User ID", "Type", "Title", "Message", "Sent", ""].map(h => (
                  <th key={h} style={{ padding: "0.7rem 0.875rem", textAlign: "left", fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#525D72", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                : notifs.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "3rem 1rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.4 }}>🔔</div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.9rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#525D72" }}>
                          No notifications found
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#525D72", marginTop: "0.4rem" }}>
                          {filterUid || filterType ? "Try adjusting your filters" : "Send your first notification above"}
                        </div>
                      </td>
                    </tr>
                  )
                  : notifs.map(n => (
                    <tr
                      key={n.id}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "0.7rem 0.875rem", fontSize: "0.76rem", color: "#9AA3B4" }}>#{n.user_id}</td>
                      <td style={{ padding: "0.7rem 0.875rem" }}><TypeBadge type={n.notification_type} /></td>
                      <td style={{ padding: "0.7rem 0.875rem", fontSize: "0.82rem", color: "#F0F2F5", fontWeight: 600, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</td>
                      <td style={{ padding: "0.7rem 0.875rem", fontSize: "0.75rem", color: "#9AA3B4", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</td>
                      <td style={{ padding: "0.7rem 0.875rem", fontSize: "0.7rem", color: "#525D72", whiteSpace: "nowrap" }}>
                        {new Date(n.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td style={{ padding: "0.7rem 0.875rem" }}>
                        <button
                          onClick={() => handleDelete(n.id)}
                          style={{ padding: "0.25rem 0.55rem", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "0.65rem", fontWeight: 700, transition: "background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >Del</button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div style={{ paddingTop: "0.875rem", marginTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
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

      {/* Broadcast confirm modal */}
      {bcConfirm && (
        <BroadcastConfirm
          form={bcForm}
          onConfirm={handleBroadcastConfirm}
          onCancel={() => setBcConfirm(false)}
          sending={broadcasting}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}