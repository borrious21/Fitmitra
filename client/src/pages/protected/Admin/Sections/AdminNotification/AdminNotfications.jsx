// src/pages/protected/Admin/AdminNotifications/AdminNotifications.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../../../../../services/apiClient";
import styles from "./AdminNotifications.module.css";

const LIMIT = 20;

const TYPES   = ["info", "warning", "achievement", "reminder", "system"];
const TARGETS = ["all", "verified", "active"];

const TYPE_META = {
  info:        { color: "#3b82f6", icon: "ℹ️"  },
  warning:     { color: "#f59e0b", icon: "⚠️"  },
  achievement: { color: "#22c55e", icon: "🏆"  },
  reminder:    { color: "#a855f7", icon: "🔔"  },
  system:      { color: "#FF5C1A", icon: "⚙️"  },
};

const TARGET_META = {
  all:      { label: "All Users",      icon: "👥", color: "#FF5C1A" },
  verified: { label: "Verified Users", icon: "✅", color: "#22c55e" },
  active:   { label: "Active (30d)",   icon: "⚡", color: "#f59e0b" },
};

const EMPTY_SEND = { user_id: "", title: "", message: "", notification_type: "info" };
const EMPTY_BC   = { title: "", message: "", notification_type: "system", target: "all" };

// Type badge 
function TypeBadge({ type }) {
  const { color, icon } = TYPE_META[type] ?? { color: "#94a3b8", icon: "📌" };
  return (
    <span className={styles.typeBadge} style={{ background: `${color}1a`, color }}>
      {icon} {type}
    </span>
  );
}

//  Broadcast confirm modal 
function BroadcastConfirm({ form, onConfirm, onCancel, sending }) {
  const { color, icon } = TYPE_META[form.notification_type] ?? TYPE_META.system;
  const tgt = TARGET_META[form.target] ?? TARGET_META.all;
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.bcConfirm} onClick={e => e.stopPropagation()}>
        <div className={styles.bcConfirmIcon}>📡</div>
        <h3 className={styles.bcConfirmTitle}>Confirm Broadcast</h3>

        <div className={styles.bcPreview} style={{ borderColor: `${color}22` }}>
          <div className={styles.bcPreviewMeta}>
            <TypeBadge type={form.notification_type} />
            <span className={styles.bcTarget} style={{ color: tgt.color }}>
              {tgt.icon} {tgt.label}
            </span>
          </div>
          <div className={styles.bcPreviewTitle}>{form.title}</div>
          <div className={styles.bcPreviewMsg}>{form.message}</div>
        </div>

        <div className={styles.bcConfirmRow}>
          <button className={styles.btnCancel} onClick={onCancel} disabled={sending}>Cancel</button>
          <button className={styles.btnSend} onClick={onConfirm} disabled={sending}>
            {sending ? <><span className={styles.spinner} /> Sending…</> : "📡 Send Broadcast"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main 
export default function AdminNotifications() {
  const [notifs,       setNotifs]       = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [offset,       setOffset]       = useState(0);
  const [filterUid,    setFilterUid]    = useState("");
  const [filterType,   setFilterType]   = useState("");
  const [sendForm,     setSendForm]     = useState(EMPTY_SEND);
  const [sendErrors,   setSendErrors]   = useState({});
  const [sending,      setSending]      = useState(false);
  const [userSearch,   setUserSearch]   = useState("");
  const [userResults,  setUserResults]  = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searching,    setSearching]    = useState(false);
  const searchRef = useRef(null);
  const [bcForm,       setBcForm]       = useState(EMPTY_BC);
  const [bcErrors,     setBcErrors]     = useState({});
  const [bcConfirm,    setBcConfirm]    = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [alert,        setAlert]        = useState(null);

  const flash = (msg, type = "success") => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000); };

  // User search by name/email 
  const searchUsers = useCallback(async (q) => {
    if (!q.trim()) { setUserResults([]); return; }
    setSearching(true);
    try {
      const res = await apiFetch(`/admin/users?search=${encodeURIComponent(q)}&limit=6`);
      const d   = res?.data ?? res;
      setUserResults(d?.users ?? []);
    } catch { setUserResults([]); }
    finally   { setSearching(false); }
  }, []);

  useEffect(() => {
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => searchUsers(userSearch), 350);
  }, [userSearch, searchUsers]);

  const selectUser = (u) => {
    setSelectedUser(u);
    setSendForm(f => ({ ...f, user_id: u.id }));
    setUserSearch(`${u.name} (${u.email})`);
    setUserResults([]);
    setSendErrors(e => ({ ...e, user_id: "" }));
  };

  const clearUser = () => {
    setSelectedUser(null);
    setSendForm(f => ({ ...f, user_id: "" }));
    setUserSearch("");
    setUserResults([]);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: LIMIT, offset });
      if (filterUid)  p.set("user_id", filterUid);
      if (filterType) p.set("type",    filterType);
      const res = await apiFetch(`/admin/notifications?${p}`);
      const d   = res?.data ?? res;
      setNotifs(d?.notifications ?? []);
      setTotal(d?.pagination?.total ?? d?.total ?? 0);
    } catch (e) {
      flash(e?.message ?? "Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  }, [offset, filterUid, filterType]);

  useEffect(() => { load(); }, [load]);

  // Send to user 
  const setSendField = (k, v) => {
    setSendForm(f => ({ ...f, [k]: v }));
    setSendErrors(e => ({ ...e, [k]: "" }));
  };

  const validateSend = () => {
    const e = {};
    if (!sendForm.user_id)        e.user_id = "Required";
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
      flash("Notification sent successfully");
      setSendForm(EMPTY_SEND);
      setSendErrors({});
      load();
    } catch (e) {
      flash(e?.message ?? "Send failed", "error");
    } finally {
      setSending(false);
    }
  };

  //  Broadcast 
  const setBcField = (k, v) => {
    setBcForm(f => ({ ...f, [k]: v }));
    setBcErrors(e => ({ ...e, [k]: "" }));
  };

  const validateBc = () => {
    const e = {};
    if (!bcForm.title.trim())   e.title   = "Required";
    if (!bcForm.message.trim()) e.message = "Required";
    setBcErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBroadcast = async () => {
    setBroadcasting(true);
    try {
      const res = await apiFetch("/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify(bcForm),
      });
      const d = res?.data ?? res;
      flash(`Sent to ${d?.sent ?? "?"} users`);
      setBcForm(EMPTY_BC);
      setBcErrors({});
      setBcConfirm(false);
      load();
    } catch (e) {
      flash(e?.message ?? "Broadcast failed", "error");
    } finally {
      setBroadcasting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/admin/notifications/${id}`, { method: "DELETE" });
      flash("Notification deleted");
      load();
    } catch (e) {
      flash(e?.message ?? "Delete failed", "error");
    }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT) + 1;

  return (
    <div className={styles.page}>

      {alert && <div className={alert.type === "success" ? styles.alertOk : styles.alertErr}>{alert.msg}</div>}

      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🔔 Notifications</h1>
        <p className={styles.pageSub}>Send targeted messages or broadcast to user groups</p>
      </div>

      {/* Send + Broadcast forms */}
      <div className={styles.formsGrid}>

        {/* Send to user */}
        <div className={`${styles.formCard} ${styles.formCardOrange}`}>
          <h3 className={styles.formCardTitle}>🎯 Send to User</h3>

          <div className={styles.formFields}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Search User *</label>
              <div className={styles.userSearchWrap}>
                <div className={styles.userSearchBox}>
                  <svg className={styles.userSearchIco} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input
                    className={`${styles.userSearchInput} ${sendErrors.user_id ? styles.inputErr : ""}`}
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); if (selectedUser) clearUser(); }}
                    placeholder="Type name or email…"
                  />
                  {searching && <span className={styles.searchSpinner}><span className={styles.spinner} /></span>}
                  {selectedUser && <button className={styles.clearUserBtn} onClick={clearUser} type="button">✕</button>}
                </div>

                {/* Dropdown results */}
                {userResults.length > 0 && (
                  <div className={styles.userDropdown}>
                    {userResults.map(u => (
                      <button key={u.id} className={styles.userDropdownItem} type="button" onClick={() => selectUser(u)}>
                        <div className={styles.userDropAv}>{u.name?.charAt(0).toUpperCase()}</div>
                        <div className={styles.userDropInfo}>
                          <span className={styles.userDropName}>{u.name}</span>
                          <span className={styles.userDropEmail}>{u.email}</span>
                        </div>
                        <span className={styles.userDropRole}>{u.role}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected user chip */}
                {selectedUser && (
                  <div className={styles.selectedUserChip}>
                    <div className={styles.userDropAv} style={{ width: 24, height: 24, fontSize: 10 }}>
                      {selectedUser.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className={styles.selectedUserName}>{selectedUser.name}</span>
                    <span className={styles.selectedUserEmail}>{selectedUser.email}</span>
                    <span className={styles.selectedUserId}>#{selectedUser.id}</span>
                  </div>
                )}
              </div>
              {sendErrors.user_id && <span className={styles.fieldErr}>{sendErrors.user_id}</span>}
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Title *</label>
              <input className={`${styles.formInput} ${sendErrors.title ? styles.inputErr : ""}`}
                value={sendForm.title}
                onChange={e => setSendField("title", e.target.value)}
                placeholder="e.g. Workout reminder" />
              {sendErrors.title && <span className={styles.fieldErr}>{sendErrors.title}</span>}
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Message *</label>
              <textarea className={`${styles.formTextarea} ${sendErrors.message ? styles.inputErr : ""}`}
                value={sendForm.message} rows={3}
                onChange={e => setSendField("message", e.target.value)}
                placeholder="Notification body…" />
              {sendErrors.message && <span className={styles.fieldErr}>{sendErrors.message}</span>}
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Type</label>
              <select className={styles.formSelect} value={sendForm.notification_type}
                onChange={e => setSendField("notification_type", e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].icon} {t}</option>)}
              </select>
            </div>
          </div>

          <button className={styles.btnSendUser} onClick={handleSend} disabled={sending}>
            {sending ? <><span className={styles.spinner} /> Sending…</> : "🎯 Send Notification"}
          </button>
        </div>

        {/* Broadcast */}
        <div className={`${styles.formCard} ${styles.formCardBlue}`}>
          <h3 className={styles.formCardTitle}>📡 Broadcast</h3>

          <div className={styles.formFields}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Title *</label>
              <input className={`${styles.formInput} ${bcErrors.title ? styles.inputErr : ""}`}
                value={bcForm.title}
                onChange={e => setBcField("title", e.target.value)}
                placeholder="e.g. New feature available" />
              {bcErrors.title && <span className={styles.fieldErr}>{bcErrors.title}</span>}
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Message *</label>
              <textarea className={`${styles.formTextarea} ${bcErrors.message ? styles.inputErr : ""}`}
                value={bcForm.message} rows={3}
                onChange={e => setBcField("message", e.target.value)}
                placeholder="Broadcast body…" />
              {bcErrors.message && <span className={styles.fieldErr}>{bcErrors.message}</span>}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Type</label>
                <select className={styles.formSelect} value={bcForm.notification_type}
                  onChange={e => setBcField("notification_type", e.target.value)}>
                  {TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].icon} {t}</option>)}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Target Audience</label>
                <select className={styles.formSelect} value={bcForm.target}
                  onChange={e => setBcField("target", e.target.value)}>
                  {TARGETS.map(t => (
                    <option key={t} value={t}>{TARGET_META[t].icon} {TARGET_META[t].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target preview */}
            <div className={styles.targetPreview}
              style={{ color: TARGET_META[bcForm.target]?.color, background: `${TARGET_META[bcForm.target]?.color}10`, borderColor: `${TARGET_META[bcForm.target]?.color}25` }}>
              {TARGET_META[bcForm.target]?.icon} Sending to: <strong>{TARGET_META[bcForm.target]?.label}</strong>
            </div>
          </div>

          <button className={styles.btnBroadcast}
            onClick={() => validateBc() && setBcConfirm(true)}
            disabled={broadcasting}>
            📡 Broadcast
          </button>
        </div>
      </div>

      {/* Log table */}
      <div className={styles.logCard}>
        <div className={styles.logHeader}>
          <div>
            <h3 className={styles.logTitle}>
              Notification Log
              {!loading && <span className={styles.logCount}> ({total.toLocaleString()})</span>}
            </h3>
            <p className={styles.logSub}>All sent notifications, newest first</p>
          </div>
          <div className={styles.logFilters}>
            <input className={styles.filterInput} value={filterUid}
              onChange={e => { setFilterUid(e.target.value); setOffset(0); }}
              placeholder="User ID…" />
            <select className={styles.filterSelect} value={filterType}
              onChange={e => { setFilterType(e.target.value); setOffset(0); }}>
              <option value="">All Types</option>
              {TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].icon} {t}</option>)}
            </select>
            <button className={styles.refreshBtn} onClick={load} title="Refresh">↺</button>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {["User", "Type", "Title", "Message", "Sent", ""].map(h => (
                  <th key={h} className={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className={styles.skRow}>
                    {[1,2,3,4,5,6].map((_, j) => (
                      <td key={j} className={styles.td}>
                        <div className={styles.sk} style={{ width: j === 0 ? 60 : j === 5 ? 40 : 100 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : notifs.length === 0 ? (
                <tr><td colSpan={6} className={styles.emptyCell}>
                  <div className={styles.emptyIcon}>🔔</div>
                  <div className={styles.emptyTitle}>No notifications</div>
                  <div className={styles.emptySub}>{filterUid || filterType ? "Try adjusting filters" : "Send your first notification above"}</div>
                </td></tr>
              ) : (
                notifs.map(n => (
                  <tr key={n.id} className={styles.tr}>
                    <td className={styles.td}><span className={styles.userId}>#{n.user_id}</span></td>
                    <td className={styles.td}><TypeBadge type={n.notification_type} /></td>
                    <td className={`${styles.td} ${styles.titleCell}`}>{n.title}</td>
                    <td className={`${styles.td} ${styles.msgCell}`}>{n.message}</td>
                    <td className={styles.td}>
                      <span className={styles.dateVal}>
                        {new Date(n.created_at).toLocaleString("en-IN",{dateStyle:"short",timeStyle:"short"})}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <button className={styles.delBtn} onClick={() => handleDelete(n.id)}>Del</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

      {bcConfirm && (
        <BroadcastConfirm form={bcForm} onConfirm={handleBroadcast}
          onCancel={() => setBcConfirm(false)} sending={broadcasting} />
      )}
    </div>
  );
}