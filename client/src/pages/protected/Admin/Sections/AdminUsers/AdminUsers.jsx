// src/pages/protected/Admin/AdminUsers.jsx
// Place at: src/pages/protected/Admin/AdminUsers.jsx
// Import CSS as: import styles from "./AdminUsers.module.css"

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../../../../../services/apiClient";
import styles from "./AdminUsers.module.css";

const GOAL_LABELS = {
  weight_loss: "Weight Loss", muscle_gain: "Muscle Gain",
  maintain_fitness: "Maintenance", endurance: "Endurance", wellness: "Wellness",
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Av({ url, name, size = 36 }) {
  const [err, setErr] = useState(false);
  const letter = (name ?? "?").charAt(0).toUpperCase();
  if (url && !err)
    return <img src={url} alt={name} className={styles.avImg} style={{ width: size, height: size }} onError={() => setErr(true)} />;
  return (
    <div className={styles.av} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {letter}
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ active }) {
  return (
    <span className={active ? styles.pillActive : styles.pillBanned}>
      <span className={styles.pillDot} />
      {active ? "Active" : "Banned"}
    </span>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function Confirm({ action, name, onOk, onCancel }) {
  const meta = {
    ban:      { title: "Ban User",       msg: `${name} will lose access. Data is kept.`,              color: "#f59e0b" },
    activate: { title: "Activate",       msg: `${name} will regain full access.`,                     color: "#10b981" },
    verify:   { title: "Verify Email",   msg: `Mark ${name}'s email as verified.`,                    color: "#3b82f6" },
    delete:   { title: "Delete Forever", msg: `All data for ${name} will be permanently removed.`,    color: "#ef4444" },
  }[action] ?? { title: action, msg: "", color: "#64748b" };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
        <div className={styles.confirmTitle} style={{ color: meta.color }}>{meta.title}</div>
        <div className={styles.confirmMsg}>{meta.msg}</div>
        <div className={styles.confirmRow}>
          <button className={styles.btnGhost} onClick={onCancel}>Cancel</button>
          <button className={styles.btnSolid} style={{ background: meta.color }} onClick={onOk}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ─── User detail drawer ───────────────────────────────────────────────────────
function Drawer({ user, onClose, onAction, acting }) {
  if (!user) return null;
  const p  = user.profile          ?? {};
  const ws = user.workout_stats     ?? {};
  const ns = user.nutrition_stats   ?? {};
  const st = user.streak            ?? {};

  const statItems = [
    { label: "Weight",       val: p.weight_kg  ? `${p.weight_kg}kg`   : "—" },
    { label: "Height",       val: p.height_cm  ? `${p.height_cm}cm`   : "—" },
    { label: "Age",          val: p.age        ? `${p.age}yr`         : "—" },
    { label: "Gender",       val: p.gender                            ?? "—" },
    { label: "Goal",         val: GOAL_LABELS[p.goal] ?? p.goal       ?? "—" },
    { label: "Activity",     val: p.activity_level?.replace(/_/g," ") ?? "—" },
    { label: "Diet",         val: p.diet_type?.replace(/_/g," ")      ?? "—" },
    { label: "Sleep goal",   val: p.sleep_goal_hours ? `${p.sleep_goal_hours}h` : "—" },
  ];

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <Av url={user.avatar_url} name={user.name} size={52} />
          <div className={styles.drawerMeta}>
            <div className={styles.drawerName}>{user.name}</div>
            <div className={styles.drawerEmail}>{user.email}</div>
            <div className={styles.drawerPills}>
              <span className={user.role === "admin" ? styles.roleAdmin : styles.roleUser}>{user.role}</span>
              <StatusPill active={user.is_active} />
              {user.is_verified  && <span className={styles.pillVerified}>✓ Verified</span>}
              {user.has_completed_onboarding && <span className={styles.pillOnboard}>✓ Onboarded</span>}
            </div>
          </div>
          <button className={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.drawerScroll}>

          {/* Profile */}
          <Section title="📋 Profile">
            <div className={styles.statGrid}>
              {statItems.map(({ label, val }) => (
                <div key={label} className={styles.statItem}>
                  <span className={styles.statVal}>{val}</span>
                  <span className={styles.statKey}>{label}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Medical */}
          {p.medical_conditions && Object.keys(p.medical_conditions).filter(k => p.medical_conditions[k]).length > 0 && (
            <Section title="⚕️ Medical">
              <div className={styles.tagRow}>
                {Object.entries(p.medical_conditions).filter(([,v]) => v).map(([k]) => (
                  <span key={k} className={styles.tagMed}>{k.replace(/_/g," ")}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Fitness */}
          <Section title="💪 Fitness Stats">
            <div className={styles.statGrid}>
              {[
                { label: "Sessions",    val: ws.total_sessions ?? 0 },
                { label: "Streak",      val: `${st.current ?? 0}d` },
                { label: "Best streak", val: `${st.longest ?? 0}d` },
                { label: "Total WOs",   val: st.total ?? 0 },
                { label: "Avg exertion",val: ws.avg_exertion ? `${ws.avg_exertion}/10` : "—" },
                { label: "Last WO",     val: ws.last_workout ? new Date(ws.last_workout).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "—" },
              ].map(({ label, val }) => (
                <div key={label} className={styles.statItem}>
                  <span className={styles.statVal}>{val}</span>
                  <span className={styles.statKey}>{label}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Nutrition */}
          <Section title="🍽️ Nutrition (7 days)">
            <div className={styles.statGrid}>
              {[
                { label: "Days logged",  val: ns.days_logged ?? 0 },
                { label: "Avg calories", val: ns.avg_daily_calories ? `${ns.avg_daily_calories} kcal` : "—" },
                { label: "Avg protein",  val: ns.avg_daily_protein  ? `${ns.avg_daily_protein}g` : "—" },
              ].map(({ label, val }) => (
                <div key={label} className={styles.statItem}>
                  <span className={styles.statVal}>{val}</span>
                  <span className={styles.statKey}>{label}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Weight trend */}
          {user.weight_logs?.length > 0 && (
            <Section title="⚖️ Weight (30 days)">
              {user.weight_logs.slice(0, 6).map((w, i) => (
                <div key={i} className={styles.logRow}>
                  <span className={styles.logDate}>{new Date(w.logged_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
                  <span className={styles.logVal}>{w.weight_kg} kg</span>
                </div>
              ))}
            </Section>
          )}

          {/* PRs */}
          {user.personal_records?.length > 0 && (
            <Section title="🏅 Personal Records">
              {user.personal_records.map((pr, i) => (
                <div key={i} className={styles.logRow}>
                  <span className={styles.logDate}>{pr.exercise_name}</span>
                  <span className={styles.logVal} style={{ color:"#f59e0b" }}>{pr.best_1rm}kg 1RM</span>
                </div>
              ))}
            </Section>
          )}

          {/* Achievements */}
          {user.achievements?.length > 0 && (
            <Section title="🏆 Achievements">
              <div className={styles.tagRow}>
                {user.achievements.map((a, i) => (
                  <span key={i} className={styles.tagAchieve}>{a.achievement_name}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Active plan */}
          {user.active_plan && (
            <Section title="📋 Active Plan">
              <div className={styles.planRow}>
                <span>{user.active_plan.goals ?? "—"}</span>
                <span className={styles.planMeta}>Week {user.active_plan.mesocycle_week} / {user.active_plan.duration_weeks}</span>
              </div>
            </Section>
          )}

          <div className={styles.joinedLine}>
            Joined {new Date(user.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.drawerActions}>
          {user.is_active
            ? <button className={`${styles.actBtn} ${styles.actBan}`}    onClick={() => onAction("ban",      user.id)} disabled={!!acting}>{acting==="ban"      ? "…" : "🚫 Ban"}</button>
            : <button className={`${styles.actBtn} ${styles.actActivate}`} onClick={() => onAction("activate", user.id)} disabled={!!acting}>{acting==="activate" ? "…" : "✅ Activate"}</button>
          }
          {!user.is_verified &&
            <button className={`${styles.actBtn} ${styles.actVerify}`} onClick={() => onAction("verify", user.id)} disabled={!!acting}>{acting==="verify" ? "…" : "✓ Verify"}</button>
          }
          <button className={`${styles.actBtn} ${styles.actDelete}`} onClick={() => onAction("delete", user.id)} disabled={!!acting}>{acting==="delete" ? "…" : "🗑 Delete"}</button>
        </div>
      </aside>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div className={styles.drawerSection}>
      <div className={styles.drawerSectionTitle}>{title}</div>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [users,      setUsers]     = useState([]);
  const [total,      setTotal]     = useState(0);
  const [loading,    setLoading]   = useState(true);
  const [search,     setSearch]    = useState("");
  const [role,       setRole]      = useState("");
  const [offset,     setOffset]    = useState(0);
  const [drawer,     setDrawer]    = useState(null);
  const [loadingUser,setLoadUser]  = useState(false);
  const [acting,     setActing]    = useState(null);
  const [confirm,    setConfirm]   = useState(null);
  const [alert,      setAlert]     = useState(null);

  const LIMIT = 15;
  const timer = useRef(null);

  const load = useCallback(async (q, r, off) => {
    setLoading(true);
    try {
      const p   = new URLSearchParams({ limit: LIMIT, offset: off, search: q, role: r });
      const res = await apiFetch(`/admin/users?${p}`);
      const d   = res?.data ?? res;
      setUsers(d?.users ?? []);
      setTotal(d?.pagination?.total ?? d?.total ?? 0);
    } catch (e) {
      flash("error", e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(search, role, offset); }, [offset, role]);

  const onSearch = v => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setOffset(0); load(v, role, 0); }, 380);
  };

  const flash = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); };

  const openDrawer = async id => {
    setLoadUser(true);
    try {
      const res = await apiFetch(`/admin/users/${id}`);
      setDrawer(res?.data ?? res);
    } catch { flash("error", "Failed to load user"); }
    finally { setLoadUser(false); }
  };

  const handleAction = (action, userId) => {
    const u = users.find(x => x.id === userId) ?? drawer;
    setConfirm({ action, userId, name: u?.name ?? "this user" });
  };

  const execAction = async () => {
    if (!confirm) return;
    const { action, userId } = confirm;
    setConfirm(null);
    setActing(action);
    const map = {
      ban:      ["PATCH",  `/admin/users/${userId}/ban`],
      activate: ["PATCH",  `/admin/users/${userId}/activate`],
      verify:   ["PATCH",  `/admin/users/${userId}/verify`],
      delete:   ["DELETE", `/admin/users/${userId}`],
    };
    try {
      await apiFetch(map[action][1], { method: map[action][0] });
      flash("success", `User ${action}d successfully`);
      setDrawer(null);
      load(search, role, offset);
    } catch (e) {
      flash("error", e?.message ?? `Failed to ${action}`);
    } finally { setActing(null); }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT) + 1;

  return (
    <div className={styles.page}>

      {/* Alert */}
      {alert && <div className={alert.type === "success" ? styles.alertOk : styles.alertErr}>{alert.msg}</div>}

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>👥 Users</h1>
          <p className={styles.pageSub}>{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIco} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className={styles.searchIn} placeholder="Search name or email…" value={search} onChange={e => onSearch(e.target.value)} />
          {search && <button className={styles.searchClear} onClick={() => onSearch("")}>✕</button>}
        </div>
        <select className={styles.roleSelect} value={role} onChange={e => { setRole(e.target.value); setOffset(0); }}>
          <option value="">All roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              {["User", "Role", "Status", "Goal", "Weight", "Joined", "Actions"].map(h => (
                <th key={h} className={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className={styles.skRow}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className={styles.td}>
                      <div className={styles.sk} style={{ width: j === 0 ? 140 : 60 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className={styles.empty}>No users found</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className={styles.tr} onClick={() => openDrawer(u.id)}>
                  <td className={styles.td}>
                    <div className={styles.userCell}>
                      <Av url={u.avatar_url} name={u.name} size={34} />
                      <div>
                        <div className={styles.uName}>{u.name}</div>
                        <div className={styles.uEmail}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={u.role === "admin" ? styles.roleAdmin : styles.roleUser}>{u.role}</span>
                  </td>
                  <td className={styles.td}><StatusPill active={u.is_active} /></td>
                  <td className={styles.td}>
                    <span className={styles.goal}>{GOAL_LABELS[u.profile?.goal] ?? u.profile?.goal?.replace(/_/g," ") ?? "—"}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.weight}>{u.profile?.weight_kg ? `${u.profile.weight_kg}kg` : "—"}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.date}>{new Date(u.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"2-digit"})}</span>
                  </td>
                  <td className={styles.td} onClick={e => e.stopPropagation()}>
                    <div className={styles.rowBtns}>
                      {u.is_active
                        ? <button className={styles.rBan}      onClick={() => handleAction("ban",      u.id)} title="Ban">🚫</button>
                        : <button className={styles.rActivate} onClick={() => handleAction("activate", u.id)} title="Activate">✅</button>
                      }
                      <button className={styles.rDelete} onClick={() => handleAction("delete", u.id)} title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pgBtn} disabled={offset === 0}         onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>← Prev</button>
          <span className={styles.pgInfo}>Page {page} of {pages}</span>
          <button className={styles.pgBtn} disabled={offset + LIMIT >= total} onClick={() => setOffset(o => o + LIMIT)}>Next →</button>
        </div>
      )}

      {/* Loading spinner over drawer */}
      {loadingUser && (
        <div className={styles.overlay}>
          <div className={styles.spinBox}><div className={styles.spin} /></div>
        </div>
      )}

      {/* Drawer */}
      {drawer && !loadingUser && (
        <Drawer user={drawer} onClose={() => setDrawer(null)} onAction={handleAction} acting={acting} />
      )}

      {/* Confirm */}
      {confirm && <Confirm action={confirm.action} name={confirm.name} onOk={execAction} onCancel={() => setConfirm(null)} />}
    </div>
  );
}