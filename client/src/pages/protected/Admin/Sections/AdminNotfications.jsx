// ── src/pages/protected/Admin/Sections/AdminNotifications.jsx ─
import { useState, useEffect, useCallback } from "react";
import api from "../../../../services/api";

const TYPES    = ["info", "warning", "achievement", "reminder", "system"];
const TARGETS  = ["all", "verified", "active"];
const TYPE_COLOR = { info: "#3b82f6", warning: "#f59e0b", achievement: "#22c55e", reminder: "#a855f7", system: "#FF5C1A" };

const Btn = ({ onClick, color = "orange", children, disabled }) => {
  const bg = { orange: "#FF5C1A", green: "#22c55e", red: "#ef4444", gray: "rgba(255,255,255,0.08)", blue: "#3b82f6" };
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

const Field = ({ label, value, onChange, type = "text", options, rows }) => (
  <div>
    <label style={{ display: "block", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#525D72", marginBottom: 4 }}>{label}</label>
    {options
      ? <select value={value} onChange={e => onChange(e.target.value)}
          style={{ width: "100%", background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none" }}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      : rows
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none", resize: "vertical" }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)}
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none" }} />
    }
  </div>
);

export default function AdminNotifications({ toast }) {
  const [notifs,  setNotifs]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset,  setOffset]  = useState(0);
  const [filterUid, setFilterUid] = useState("");
  const [filterType, setFilterType] = useState("");

  // Send form
  const [sendForm, setSendForm] = useState({ user_id: "", title: "", message: "", notification_type: "info" });
  const setSend = k => v => setSendForm(f => ({ ...f, [k]: v }));

  // Broadcast form
  const [bcForm, setBcForm] = useState({ title: "", message: "", notification_type: "system", target: "all" });
  const setBc = k => v => setBcForm(f => ({ ...f, [k]: v }));

  const [sending, setSending] = useState(false);
  const LIMIT = 20;

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset });
      if (filterUid)  params.set("user_id", filterUid);
      if (filterType) params.set("type",    filterType);
      const { data } = await api.get(`/admin/notifications?${params}`);
      setNotifs(data.data.notifications);
      setTotal(data.data.total);
    } catch { toast("Failed to load notifications", "error"); }
    finally { setLoading(false); }
  }, [offset, filterUid, filterType]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const handleSend = async () => {
    if (!sendForm.user_id || !sendForm.title || !sendForm.message) {
      toast("user_id, title and message are required", "error"); return;
    }
    setSending(true);
    try {
      await api.post("/admin/notifications/send", sendForm);
      toast("Notification sent!");
      setSendForm({ user_id: "", title: "", message: "", notification_type: "info" });
      fetchNotifs();
    } catch (e) { toast(e?.response?.data?.message ?? "Send failed", "error"); }
    finally { setSending(false); }
  };

  const handleBroadcast = async () => {
    if (!bcForm.title || !bcForm.message) {
      toast("Title and message are required", "error"); return;
    }
    if (!window.confirm(`Broadcast to "${bcForm.target}" users?`)) return;
    setSending(true);
    try {
      const { data } = await api.post("/admin/notifications/broadcast", bcForm);
      toast(`Sent to ${data.data.sent} users`);
      setBcForm({ title: "", message: "", notification_type: "system", target: "all" });
      fetchNotifs();
    } catch (e) { toast(e?.response?.data?.message ?? "Broadcast failed", "error"); }
    finally { setSending(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/notifications/${id}`);
      toast("Notification deleted");
      fetchNotifs();
    } catch { toast("Delete failed", "error"); }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT);

  const cardStyle = { background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.5rem" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Send + Broadcast side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

        {/* Send to user */}
        <div style={cardStyle}>
          <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F0F2F5", marginBottom: "1rem" }}>
            Send to User
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Field label="User ID *"  value={sendForm.user_id} onChange={setSend("user_id")} type="number" />
            <Field label="Title *"    value={sendForm.title}   onChange={setSend("title")} />
            <Field label="Message *"  value={sendForm.message} onChange={setSend("message")} rows={3} />
            <Field label="Type"       value={sendForm.notification_type} onChange={setSend("notification_type")} options={TYPES} />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Btn onClick={handleSend} disabled={sending}>Send Notification</Btn>
          </div>
        </div>

        {/* Broadcast */}
        <div style={cardStyle}>
          <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F0F2F5", marginBottom: "1rem" }}>
            Broadcast
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Field label="Title *"   value={bcForm.title}   onChange={setBc("title")} />
            <Field label="Message *" value={bcForm.message} onChange={setBc("message")} rows={3} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Type"   value={bcForm.notification_type} onChange={setBc("notification_type")} options={TYPES} />
              <Field label="Target" value={bcForm.target}            onChange={setBc("target")}            options={TARGETS} />
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Btn onClick={handleBroadcast} disabled={sending} color="blue">Broadcast</Btn>
          </div>
        </div>
      </div>

      {/* Log */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F0F2F5" }}>
            Notification Log <span style={{ color: "#FF5C1A" }}>({total})</span>
          </h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input value={filterUid} onChange={e => { setFilterUid(e.target.value); setOffset(0); }} placeholder="User ID…"
              style={{ width: 120, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.4rem 0.7rem", color: "#F0F2F5", fontSize: "0.78rem", outline: "none" }} />
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setOffset(0); }}
              style={{ background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.4rem 0.7rem", color: "#F0F2F5", fontSize: "0.78rem", outline: "none" }}>
              <option value="">All Types</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["User ID", "Type", "Title", "Message", "Sent", ""].map(h => (
                  <th key={h} style={{ padding: "0.65rem 0.875rem", textAlign: "left", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} style={{ padding: "0.875rem" }}>
                      <div style={{ height: 14, borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: "shimmer 1.5s infinite" }} />
                    </td></tr>
                  ))
                : notifs.map(n => (
                    <tr key={n.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "0.65rem 0.875rem", fontSize: "0.78rem", color: "#9AA3B4" }}>{n.user_id}</td>
                      <td style={{ padding: "0.65rem 0.875rem" }}>
                        <span style={{ padding: "0.2rem 0.5rem", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: TYPE_COLOR[n.notification_type] ?? "#9AA3B4", background: `${TYPE_COLOR[n.notification_type] ?? "#9AA3B4"}1a` }}>
                          {n.notification_type}
                        </span>
                      </td>
                      <td style={{ padding: "0.65rem 0.875rem", fontSize: "0.82rem", color: "#F0F2F5", fontWeight: 600, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</td>
                      <td style={{ padding: "0.65rem 0.875rem", fontSize: "0.75rem", color: "#9AA3B4", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</td>
                      <td style={{ padding: "0.65rem 0.875rem", fontSize: "0.72rem", color: "#525D72", whiteSpace: "nowrap" }}>{new Date(n.created_at).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "0.65rem 0.875rem" }}>
                        <button onClick={() => handleDelete(n.id)} style={{ padding: "0.25rem 0.55rem", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "0.65rem", fontWeight: 700 }}>Del</button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div style={{ paddingTop: "0.875rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
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