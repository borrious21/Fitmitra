// ── src/pages/protected/Admin/Sections/AdminPlans.jsx ─────────
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../../../services/apiClient";
import s from "./AdminPlans.module.css";

const LIMIT = 20;

const IconSearch = () => (
  <svg className={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const StatusBadge = ({ active }) => (
  <span className={`${s.badge} ${active ? s.badgeActive : s.badgeInactive}`}>
    <span className={s.badgeDot} />
    {active ? "Active" : "Inactive"}
  </span>
);

const UserAvatar = ({ name }) => (
  <div className={s.userAvatar}>
    {(name ?? "?")[0].toUpperCase()}
  </div>
);

const SkeletonRow = () => (
  <tr>
    {[72, 55, 50, 45, 35, 40, 50, 90].map((w, i) => (
      <td key={i} className={s.td}>
        <div className={s.skeletonCell} style={{ width: `${w}%` }} />
      </td>
    ))}
  </tr>
);

function ConfirmDialog({ title, message, confirmLabel, variant = "danger", onConfirm, onCancel }) {
  const emoji = variant === "danger" ? "🗑️" : "⏸️";
  const btnClass = variant === "danger" ? s.btnDangerFull : s.btnWarnFull;

  return (
    <div className={s.confirmOverlay} onClick={onCancel}>
      <div className={s.confirmBox} onClick={e => e.stopPropagation()}>
        <div className={s.confirmEmoji}>{emoji}</div>
        <p className={s.confirmTitle}>{title}</p>
        <p className={s.confirmMsg}>{message}</p>
        <div className={s.confirmBtns}>
          <button className={`${s.btn} ${s.btnSecondary}`} onClick={onCancel}>
            Cancel
          </button>
          <button className={`${s.btn} ${btnClass}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanDetailModal({ plan, onClose, onDeactivate, onDelete, busy }) {
  if (!plan) return null;

  const metaRows = [
    ["Email",     plan.user_email],
    ["Goal",      plan.profile_goal?.replace(/_/g, " ") ?? "—"],
    ["Activity",  plan.activity_level?.replace(/_/g, " ") ?? "—"],
    ["Duration",  plan.duration_weeks ? `${plan.duration_weeks} weeks` : "—"],
    ["Diet",      plan.diet_type?.replace(/_/g, " ") ?? "—"],
    ["Generated", plan.generated_at ? new Date(plan.generated_at).toLocaleDateString("en-IN") : "—"],
  ];

  let planContent = null;
  try {
    const raw = plan.plan_data ?? plan.content ?? plan.data;
    if (raw) planContent = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {}

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={s.modalHeader}>
          <div>
            <p className={s.modalTitleName}>{plan.user_name}'s Plan</p>
            <div className={s.modalMeta}>
              <StatusBadge active={plan.is_active} />
              <span className={s.modalPlanId}>ID: {plan.id}</span>
            </div>
          </div>
          <button className={s.modalCloseBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className={s.modalBody}>

          {/* Meta grid */}
          <div className={s.metaGrid}>
            {metaRows.map(([k, v]) => (
              <div className={s.metaItem} key={k}>
                <div className={s.metaLabel}>{k}</div>
                <div className={s.metaValue}>{v}</div>
              </div>
            ))}
            {/* Status full-width */}
            <div className={s.metaItem}>
              <div className={s.metaLabel}>Status</div>
              <StatusBadge active={plan.is_active} />
            </div>
          </div>

          {planContent && (
            <div className={s.contentBlock}>
              <div className={s.contentBlockLabel}>📋 Plan Content</div>
              <pre className={s.contentPre}>
                {JSON.stringify(planContent, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className={s.modalFooter}>
          {plan.is_active && (
            <button
              className={`${s.btn} ${s.btnWarnFull}`}
              onClick={onDeactivate}
              disabled={busy}
            >
              ⏸ Deactivate
            </button>
          )}
          <button
            className={`${s.btn} ${s.btnDangerFull}`}
            onClick={onDelete}
            disabled={busy}
          >
            🗑️ Delete
          </button>
          <button className={`${s.btn} ${s.btnSecondary}`} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function MobilePlanCard({ plan, onView, onDeactivate, onDelete }) {
  return (
    <div className={s.mobileCard}>
      <div className={s.mobileCardTop}>
        <div className={s.mobileCardUser}>
          <UserAvatar name={plan.user_name} />
          <div style={{ minWidth: 0 }}>
            <div className={s.mobileCardUserName}>{plan.user_name}</div>
            <div className={s.mobileCardEmail}>{plan.user_email}</div>
          </div>
        </div>
        <StatusBadge active={plan.is_active} />
      </div>

      <div className={s.mobileCardMeta}>
        <div className={s.mobileMetaItem}>
          <span className={s.mobileMetaLabel}>Goal</span>
          <span className={s.mobileMetaValue}>
            {plan.profile_goal?.replace(/_/g, " ") ?? "—"}
          </span>
        </div>
        <div className={s.mobileMetaItem}>
          <span className={s.mobileMetaLabel}>Activity</span>
          <span className={s.mobileMetaValue}>
            {plan.activity_level?.replace(/_/g, " ") ?? "—"}
          </span>
        </div>
        <div className={s.mobileMetaItem}>
          <span className={s.mobileMetaLabel}>Duration</span>
          <span className={s.mobileMetaValue}>
            {plan.duration_weeks ? `${plan.duration_weeks} weeks` : "—"}
          </span>
        </div>
        <div className={s.mobileMetaItem}>
          <span className={s.mobileMetaLabel}>Generated</span>
          <span className={s.mobileMetaValue}>
            {plan.generated_at ? new Date(plan.generated_at).toLocaleDateString("en-IN") : "—"}
          </span>
        </div>
      </div>

      <div className={s.mobileCardActions}>
        <button className={`${s.btnSm} ${s.btnView}`} onClick={() => onView(plan)}>
          View
        </button>
        {plan.is_active && (
          <button className={`${s.btnSm} ${s.btnWarn}`} onClick={() => onDeactivate(plan)}>
            ⏸ Pause
          </button>
        )}
        <button className={`${s.btnSm} ${s.btnDanger}`} onClick={() => onDelete(plan)}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

export default function AdminPlans({ toast }) {
  const [plans,    setPlans]   = useState([]);
  const [total,    setTotal]   = useState(0);
  const [loading,  setLoading] = useState(true);
  const [isActive, setActive]  = useState("");
  const [offset,   setOffset]  = useState(0);
  const [search,   setSearch]  = useState("");

  const [viewing,  setViewing] = useState(null);
  const [confirm,  setConfirm] = useState(null); 
  const [busy,     setBusy]    = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: LIMIT, offset });
      if (isActive !== "") p.set("is_active", isActive);
      if (search)          p.set("search",    search);
      const data = await apiFetch(`/admin/plans?${p}`);
      setPlans(data.plans ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      toast?.(err?.message ?? "Failed to load plans", "error");
    } finally {
      setLoading(false);
    }
  }, [offset, isActive, search]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleDeactivate = async (plan) => {
    setBusy(true);
    try {
      await apiFetch(`/admin/plans/${plan.id}/deactivate`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
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
    <div className={s.wrap}>

      {/* ── Topbar ── */}
      <div className={s.topbar}>
        <div>
          <h2 className={s.topbarTitle}>
            Plans{" "}
            {!loading && <span>({total.toLocaleString()})</span>}
          </h2>
          <p className={s.topbarSub}>View and manage AI-generated fitness plans</p>
        </div>

        <div className={s.controls}>
          <div className={s.searchWrap}>
            <IconSearch />
            <input
              className={s.searchInput}
              value={search}
              onChange={e => { setSearch(e.target.value); setOffset(0); }}
              placeholder="Search by user…"
            />
          </div>

          <select
            className={s.filterSelect}
            value={isActive}
            onChange={e => { setActive(e.target.value); setOffset(0); }}
          >
            <option value="">All Plans</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
          <button className={s.refreshBtn} onClick={fetchPlans} title="Refresh">
            <IconRefresh />
          </button>
        </div>
      </div>

      <div className={s.tableCard}>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead className={s.thead}>
              <tr>
                {["User", "Email", "Goal", "Activity", "Duration", "Status", "Generated", ""].map(h => (
                  <th className={s.th} key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={s.tbody}>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : plans.length === 0
                  ? (
                    <tr>
                      <td colSpan={8}>
                        <div className={s.empty}>
                          <div className={s.emptyIcon}>📋</div>
                          <p className={s.emptyTitle}>No plans found</p>
                          <p className={s.emptyNote}>
                            {search || isActive
                              ? "Try adjusting your filters"
                              : "Plans appear here once users generate them"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )
                  : plans.map(plan => (
                    <tr key={plan.id}>
                      {/* User */}
                      <td className={s.td}>
                        <div className={s.userCell}>
                          <UserAvatar name={plan.user_name} />
                          <span className={s.userName}>{plan.user_name}</span>
                        </div>
                      </td>

                      <td className={s.td} style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span className={s.cellMuted}>{plan.user_email}</span>
                      </td>

                      <td className={s.td}>
                        <span className={`${s.cellSm} ${s.cellCap}`}>
                          {plan.profile_goal?.replace(/_/g, " ") ?? "—"}
                        </span>
                      </td>

                      <td className={s.td}>
                        <span className={`${s.cellSm} ${s.cellCap}`}>
                          {plan.activity_level?.replace(/_/g, " ") ?? "—"}
                        </span>
                      </td>

                      <td className={s.td}>
                        {plan.duration_weeks
                          ? <span className={s.cellNum}>{plan.duration_weeks}<span className={s.cellMuted} style={{ fontSize: "0.625rem", marginLeft: 2 }}>wk</span></span>
                          : <span className={s.cellMuted}>—</span>
                        }
                      </td>

                      <td className={s.td}><StatusBadge active={plan.is_active} /></td>

                      <td className={s.td}>
                        <span className={s.cellMuted} style={{ whiteSpace: "nowrap" }}>
                          {plan.generated_at
                            ? new Date(plan.generated_at).toLocaleDateString("en-IN")
                            : "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className={s.td}>
                        <div className={s.actions}>
                          <button
                            className={`${s.btnSm} ${s.btnView}`}
                            onClick={() => setViewing(plan)}
                          >View</button>
                          {plan.is_active && (
                            <button
                              className={`${s.btnSm} ${s.btnWarn}`}
                              onClick={() => setConfirm({ type: "deactivate", plan })}
                            >⏸</button>
                          )}
                          <button
                            className={`${s.btnSm} ${s.btnDanger}`}
                            onClick={() => setConfirm({ type: "delete", plan })}
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        <div className={s.mobileCards}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
              <div className={s.mobileCard} key={i}>
                <div className={s.skeletonCell} style={{ width: "60%", marginBottom: 8 }} />
                <div className={s.skeletonCell} style={{ width: "80%" }} />
              </div>
            ))
            : plans.length === 0
              ? (
                <div className={s.empty}>
                  <div className={s.emptyIcon}>📋</div>
                  <p className={s.emptyTitle}>No plans found</p>
                  <p className={s.emptyNote}>
                    {search || isActive ? "Try adjusting filters" : "Plans appear here once generated"}
                  </p>
                </div>
              )
              : plans.map(plan => (
                <MobilePlanCard
                  key={plan.id}
                  plan={plan}
                  onView={setViewing}
                  onDeactivate={p => setConfirm({ type: "deactivate", plan: p })}
                  onDelete={p => setConfirm({ type: "delete", plan: p })}
                />
              ))
          }
        </div>

        {!loading && pages > 1 && (
          <div className={s.pagination}>
            <span className={s.paginationInfo}>
              Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()} plans
            </span>
            <div className={s.paginationBtns}>
              <button className={s.pagBtn} disabled={page === 0}
                onClick={() => setOffset(0)}>«</button>
              <button className={s.pagBtn} disabled={page === 0}
                onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>‹ Prev</button>
              <span className={s.pagCurrent}>{page + 1} / {pages}</span>
              <button className={s.pagBtn} disabled={page >= pages - 1}
                onClick={() => setOffset(o => o + LIMIT)}>Next ›</button>
              <button className={s.pagBtn} disabled={page >= pages - 1}
                onClick={() => setOffset((pages - 1) * LIMIT)}>»</button>
            </div>
          </div>
        )}
      </div>

      {viewing && !confirm && (
        <PlanDetailModal
          plan={viewing}
          onClose={() => setViewing(null)}
          onDeactivate={() => setConfirm({ type: "deactivate", plan: viewing })}
          onDelete={() => setConfirm({ type: "delete", plan: viewing })}
          busy={busy}
        />
      )}

      {confirm?.type === "deactivate" && (
        <ConfirmDialog
          title="Deactivate this plan?"
          message={`${confirm.plan.user_name}'s plan will be marked inactive. They can generate a new one anytime.`}
          confirmLabel="⏸ Deactivate"
          variant="warn"
          onConfirm={() => handleDeactivate(confirm.plan)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm?.type === "delete" && (
        <ConfirmDialog
          title="Delete this plan?"
          message={`${confirm.plan.user_name}'s plan will be permanently removed and cannot be recovered.`}
          confirmLabel="🗑️ Delete"
          variant="danger"
          onConfirm={() => handleDelete(confirm.plan)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}