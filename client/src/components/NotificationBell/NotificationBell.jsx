// src/components/NotificationBell/NotificationBell.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../../services/apiClient";
import styles from "./NotificationBell.module.css";

const TYPE_META = {
  info:        { color: "#3b82f6", icon: "ℹ️"  },
  warning:     { color: "#f59e0b", icon: "⚠️"  },
  achievement: { color: "#22c55e", icon: "🏆"  },
  reminder:    { color: "#a855f7", icon: "🔔"  },
  system:      { color: "#FF5C1A", icon: "⚙️"  },
};

const timeAgo = (d) => {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function NotificationBell() {
  const [open,    setOpen]    = useState(false);
  const [notifs,  setNotifs]  = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/notifications/my?limit=20");
      const d   = res?.data ?? res;
      setNotifs(d?.notifications ?? []);
      setUnread(d?.unread_count ?? (d?.notifications ?? []).filter(n => !n.is_read).length);
    } catch { /* silent — bell is non-critical */ }
    finally { setLoading(false); }
  }, []);

  // Load on mount + poll every 2 minutes
  useEffect(() => {
    load();
    const id = setInterval(load, 120_000);
    return () => clearInterval(id);
  }, [load]);

  const markRead = async (id) => {
    try {
      await apiFetch(`/notifications/my/${id}/read`, { method: "PATCH" });
      setNotifs(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/notifications/my/read-all", { method: "PATCH" });
      setNotifs(ns => ns.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {}
  };

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) load(); // refresh on open
  };

  return (
    <div className={styles.wrap} ref={ref}>
      {/* Bell button */}
      <button className={styles.bell} onClick={handleOpen} title="Notifications">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            <span className={styles.dropTitle}>Notifications</span>
            {unread > 0 && (
              <button className={styles.markAllBtn} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className={styles.list}>
            {loading && notifs.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.skItem}>
                  <div className={styles.sk} style={{ width: 24, height: 24, borderRadius: "50%" }} />
                  <div className={styles.skLines}>
                    <div className={styles.sk} style={{ width: "70%", height: 12 }} />
                    <div className={styles.sk} style={{ width: "90%", height: 10 }} />
                  </div>
                </div>
              ))
            ) : notifs.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🔔</div>
                <div className={styles.emptyText}>No notifications yet</div>
              </div>
            ) : (
              notifs.map(n => {
                const meta = TYPE_META[n.notification_type] ?? TYPE_META.info;
                return (
                  <div
                    key={n.id}
                    className={`${styles.item} ${!n.is_read ? styles.itemUnread : ""}`}
                    onClick={() => !n.is_read && markRead(n.id)}
                  >
                    <div className={styles.itemIcon} style={{ background: `${meta.color}18`, color: meta.color }}>
                      {meta.icon}
                    </div>
                    <div className={styles.itemBody}>
                      <div className={styles.itemTitle}>{n.title}</div>
                      <div className={styles.itemMsg}>{n.message}</div>
                      <div className={styles.itemTime}>{timeAgo(n.created_at)}</div>
                    </div>
                    {!n.is_read && <div className={styles.unreadDot} style={{ background: meta.color }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}