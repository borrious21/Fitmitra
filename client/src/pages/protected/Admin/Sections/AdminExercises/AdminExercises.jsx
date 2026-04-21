// ── src/pages/protected/Admin/Sections/AdminExercises.jsx ─────
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../../../services/apiClient";
import s from "./AdminExercises.module.css";

const LIMIT = 20;

const MUSCLE_GROUPS = [
  "", "chest", "back", "shoulders", "biceps",
  "triceps", "legs", "core", "cardio", "full_body",
];
const MUSCLE_LABELS = {
  chest: "Chest", back: "Back", shoulders: "Shoulders",
  biceps: "Biceps", triceps: "Triceps", legs: "Legs",
  core: "Core", cardio: "Cardio", full_body: "Full Body",
};
const MUSCLE_ICONS = {
  chest: "🫁", back: "🔙", shoulders: "🏋️", biceps: "💪",
  triceps: "💪", legs: "🦵", core: "🎯", cardio: "🏃", full_body: "🧍",
};

const DIFF_CLASS = {
  beginner:     s.diffBeg,
  intermediate: s.diffInt,
  advanced:     s.diffAdv,
};

const EMPTY_FORM = {
  name: "", muscle_group: "chest", difficulty: "beginner",
  equipment: "", contraindications: "",
};

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

const DiffBadge = ({ level }) => (
  <span className={`${s.diffBadge} ${DIFF_CLASS[level] ?? s.diffBeg}`}>
    {level ?? "—"}
  </span>
);

const MuscleBadge = ({ group }) => (
  <span className={s.muscleBadge}>
    {MUSCLE_ICONS[group]} {MUSCLE_LABELS[group] ?? group}
  </span>
);

const SkeletonRow = () => (
  <tr>
    {[70, 50, 42, 45, 55, 48, 80].map((w, i) => (
      <td key={i} className={s.td}>
        <div className={s.skeletonCell} style={{ width: `${w}%` }} />
      </td>
    ))}
  </tr>
);

const Field = ({ label, error, hint, children }) => (
  <div className={s.field}>
    <label className={s.fieldLabel}>{label}</label>
    {children}
    {error && <span className={s.fieldError}>{error}</span>}
    {!error && hint && <span className={s.fieldHint}>{hint}</span>}
  </div>
);

function ConfirmDialog({ message, onConfirm, onCancel, busy }) {
  return (
    <div className={`${s.overlay} ${s.overlayHigh}`} onClick={onCancel}>
      <div className={s.confirmBox} onClick={e => e.stopPropagation()}>
        <div className={s.confirmEmoji}>🗑️</div>
        <p className={s.confirmTitle}>Delete this exercise?</p>
        <p className={s.confirmMsg}>{message}</p>
        <div className={s.confirmBtns}>
          <button className={`${s.btn} ${s.btnSecondary}`} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`${s.btn} ${s.btnDangerFull}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? <><span className={s.spinner} /> Deleting…</> : "🗑️ Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExerciseFormModal({ exercise, onClose, onSaved, toast }) {
  const isEdit = !!exercise;

  const [form, setForm] = useState(() => {
    if (!exercise) return EMPTY_FORM;
    const ci = exercise.contraindications;
    return {
      name:              exercise.name          ?? "",
      muscle_group:      exercise.muscle_group  ?? "chest",
      difficulty:        exercise.difficulty    ?? "beginner",
      equipment:         exercise.equipment     ?? "",
      contraindications: Array.isArray(ci)
        ? ci.join(", ")
        : (typeof ci === "string" ? ci : ""),
    };
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name         = "Name is required";
    if (!form.muscle_group) e.muscle_group = "Muscle group is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const ci = form.contraindications.trim()
        ? form.contraindications.split(",").map(x => x.trim()).filter(Boolean)
        : null;

      const payload = {
        name:              form.name.trim(),
        muscle_group:      form.muscle_group,
        difficulty:        form.difficulty,
        equipment:         form.equipment.trim() || null,
        contraindications: ci,
      };

      if (isEdit) {
        await apiFetch(`/admin/exercises/${exercise.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast?.("Exercise updated", "success");
      } else {
        await apiFetch("/admin/exercises", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast?.("Exercise created", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast?.(err?.message ?? "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={`${s.modal} ${s.modalLg}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={s.modalHeader}>
          <div className={s.modalHeaderLeft}>
            <p className={s.modalTitle}>
              {isEdit ? "✏️ Edit Exercise" : "➕ New Exercise"}
            </p>
            <p className={s.modalSub}>
              {isEdit ? `ID: ${exercise.id}` : "Fill in the exercise details below"}
            </p>
          </div>
          <button className={s.modalCloseBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Form body */}
        <div className={s.formBody}>

          {/* Name */}
          <Field label="Exercise Name *" error={errors.name}>
            <input
              className={`${s.fieldInput} ${errors.name ? s.fieldInputError : ""}`}
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g. Barbell Squat"
            />
          </Field>

          {/* Muscle + Difficulty row */}
          <div className={s.formRow}>
            <Field label="Muscle Group *" error={errors.muscle_group}>
              <select
                className={`${s.fieldSelect} ${errors.muscle_group ? s.fieldSelectError : ""}`}
                value={form.muscle_group}
                onChange={e => set("muscle_group", e.target.value)}
              >
                <option value="">Select muscle group</option>
                {MUSCLE_GROUPS.filter(Boolean).map(m => (
                  <option key={m} value={m}>
                    {MUSCLE_ICONS[m]} {MUSCLE_LABELS[m]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Difficulty">
              <select
                className={s.fieldSelect}
                value={form.difficulty}
                onChange={e => set("difficulty", e.target.value)}
              >
                <option value="beginner">🟢 Beginner</option>
                <option value="intermediate">🟡 Intermediate</option>
                <option value="advanced">🔴 Advanced</option>
              </select>
            </Field>
          </div>

          {/* Equipment */}
          <Field
            label="Equipment"
            hint="Optional — e.g. Barbell, Dumbbells, None"
          >
            <input
              className={s.fieldInput}
              value={form.equipment}
              onChange={e => set("equipment", e.target.value)}
              placeholder="e.g. Barbell"
            />
          </Field>

          {/* Contraindications */}
          <Field
            label="Contraindications"
            hint="Comma-separated — e.g. knee injury, lower back pain"
          >
            <input
              className={s.fieldInput}
              value={form.contraindications}
              onChange={e => set("contraindications", e.target.value)}
              placeholder="knee injury, shoulder pain"
            />
          </Field>

          {/* Actions */}
          <div className={s.formFooter}>
            <button className={`${s.btn} ${s.btnSecondary}`} onClick={onClose}>
              Cancel
            </button>
            <button
              className={`${s.btn} ${s.btnOrangeFull}`}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving
                ? <><span className={s.spinner} /> Saving…</>
                : isEdit ? "💾 Save Changes" : "➕ Create Exercise"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseDetailModal({ exercise, onClose, onEdit, onDelete }) {
  if (!exercise) return null;

  const ci = Array.isArray(exercise.contraindications)
    ? exercise.contraindications
    : exercise.contraindications ? [exercise.contraindications] : [];

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={s.modalHeader}>
          <div className={s.modalHeaderLeft}>
            <p className={s.modalTitle}>{exercise.name}</p>
            <div className={s.modalBadges}>
              <DiffBadge level={exercise.difficulty} />
              {exercise.muscle_group && <MuscleBadge group={exercise.muscle_group} />}
              <span className={s.modalSub}>ID: {exercise.id}</span>
            </div>
          </div>
          <button className={s.modalCloseBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={s.modalBody}>

          {/* Stat grid */}
          <div className={s.statGrid}>
            {[
              ["Muscle Group", exercise.muscle_group
                ? `${MUSCLE_ICONS[exercise.muscle_group]} ${MUSCLE_LABELS[exercise.muscle_group]}`
                : "—"],
              ["Difficulty",  exercise.difficulty ?? "—"],
              ["Equipment",   exercise.equipment  ?? "None"],
              ["Added",       exercise.created_at
                ? new Date(exercise.created_at).toLocaleDateString("en-IN")
                : "—"],
            ].map(([label, value]) => (
              <div className={s.statItem} key={label}>
                <div className={s.statLabel}>{label}</div>
                <div className={s.statValue}>{value}</div>
              </div>
            ))}
          </div>

          {/* Contraindications */}
          {ci.length > 0 && (
            <div className={s.ciSection}>
              <div className={s.ciSectionLabel}>⚠️ Contraindications</div>
              <div className={s.ciTagsLarge}>
                {ci.map((c, i) => (
                  <span className={s.ciTagLarge} key={i}>{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={s.modalFooter}>
          <button className={`${s.btn} ${s.btnOrangeFull}`} onClick={onEdit}>
            ✏️ Edit
          </button>
          <button className={`${s.btn} ${s.btnDangerFull}`} onClick={onDelete}>
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

function MobileExerciseCard({ exercise, onView, onEdit, onDelete }) {
  const ci = Array.isArray(exercise.contraindications)
    ? exercise.contraindications
    : exercise.contraindications ? [exercise.contraindications] : [];

  return (
    <div className={s.mobileCard}>
      <div className={s.mobileCardTop}>
        <div className={s.mobileCardLeft}>
          <div className={s.exerciseIcon}>
            {MUSCLE_ICONS[exercise.muscle_group] ?? "🏋️"}
          </div>
          <span className={s.mobileCardName}>{exercise.name}</span>
        </div>
        <DiffBadge level={exercise.difficulty} />
      </div>

      <div className={s.mobileCardBadges}>
        {exercise.muscle_group && <MuscleBadge group={exercise.muscle_group} />}
      </div>

      <div className={s.mobileCardMeta}>
        <div className={s.mobileMetaItem}>
          <span className={s.mobileMetaLabel}>Equipment</span>
          <span className={s.mobileMetaValue}>{exercise.equipment ?? "—"}</span>
        </div>
        <div className={s.mobileMetaItem}>
          <span className={s.mobileMetaLabel}>Added</span>
          <span className={s.mobileMetaValue}>
            {exercise.created_at
              ? new Date(exercise.created_at).toLocaleDateString("en-IN")
              : "—"}
          </span>
        </div>
        {ci.length > 0 && (
          <div className={s.mobileMetaItem} style={{ gridColumn: "1 / -1" }}>
            <span className={s.mobileMetaLabel}>Contraindications</span>
            <div className={s.ciTags} style={{ marginTop: 3 }}>
              {ci.slice(0, 3).map((c, i) => (
                <span className={s.ciTag} key={i}>{c}</span>
              ))}
              {ci.length > 3 && <span className={s.ciMore}>+{ci.length - 3}</span>}
            </div>
          </div>
        )}
      </div>

      <div className={s.mobileCardActions}>
        <button className={`${s.btnSm} ${s.btnView}`}
          onClick={() => onView(exercise)}>View</button>
        <button className={`${s.btnSm} ${s.btnEdit}`}
          onClick={() => onEdit(exercise)}>✏️ Edit</button>
        <button className={`${s.btnSm} ${s.btnDanger}`}
          onClick={() => onDelete(exercise)}>🗑️ Delete</button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function AdminExercises({ toast }) {
  const [exercises,    setExercises]    = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [equipFilter,  setEquipFilter]  = useState("");
  const [offset,       setOffset]       = useState(0);

  const [viewing,  setViewing]  = useState(null);
  const [editing,  setEditing]  = useState(null); // exercise | "new"
  const [deleting, setDeleting] = useState(null);
  const [busy,     setBusy]     = useState(false);

  // ── Fetch ────────────────────────────────────────────────
  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: LIMIT, offset, search,
        muscle_group: muscleFilter,
        equipment:    equipFilter,
      });
      const data = await apiFetch(`/admin/exercises?${params}`);
      setExercises(data.exercises ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      toast?.(err?.message ?? "Failed to load exercises", "error");
    } finally {
      setLoading(false);
    }
  }, [offset, search, muscleFilter, equipFilter]);

  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  const handleSearch = v => { setSearch(v);       setOffset(0); };
  const handleMuscle = v => { setMuscleFilter(v); setOffset(0); };
  const handleEquip  = v => { setEquipFilter(v);  setOffset(0); };

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/exercises/${deleting.id}`, { method: "DELETE" });
      toast?.("Exercise deleted", "success");
      setDeleting(null);
      setViewing(null);
      fetchExercises();
    } catch (err) {
      toast?.(err?.message ?? "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT);

  const equipOptions = [
    "",
    ...Array.from(new Set(exercises.map(e => e.equipment).filter(Boolean))).sort(),
  ];

  return (
    <div className={s.wrap}>

      {/* ── Topbar ── */}
      <div className={s.topbar}>
        <div>
          <h2 className={s.topbarTitle}>
            Exercises{" "}
            {!loading && <span>({total.toLocaleString()})</span>}
          </h2>
          <p className={s.topbarSub}>
            Manage the exercise library — create, edit and delete movements
          </p>
        </div>

        <div className={s.controls}>
          {/* Search */}
          <div className={s.searchWrap}>
            <IconSearch />
            <input
              className={s.searchInput}
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search exercises…"
            />
          </div>

          {/* Muscle filter */}
          <select
            className={s.filterSelect}
            value={muscleFilter}
            onChange={e => handleMuscle(e.target.value)}
          >
            {MUSCLE_GROUPS.map(m => (
              <option key={m} value={m}>
                {m ? `${MUSCLE_ICONS[m]} ${MUSCLE_LABELS[m]}` : "All Muscles"}
              </option>
            ))}
          </select>

          {/* Equipment filter */}
          <select
            className={s.filterSelect}
            value={equipFilter}
            onChange={e => handleEquip(e.target.value)}
          >
            {equipOptions.map(eq => (
              <option key={eq} value={eq}>{eq || "All Equipment"}</option>
            ))}
          </select>

          {/* Refresh */}
          <button className={s.refreshBtn} onClick={fetchExercises} title="Refresh">
            <IconRefresh />
          </button>

          {/* New exercise */}
          <button className={s.btnAdd} onClick={() => setEditing("new")}>
            ＋ New Exercise
          </button>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className={s.tableCard}>

        {/* Desktop table */}
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead className={s.thead}>
              <tr>
                {["Exercise", "Muscle Group", "Difficulty", "Equipment", "Contraindications", "Added", ""].map(h => (
                  <th className={s.th} key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={s.tbody}>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : exercises.length === 0
                  ? (
                    <tr>
                      <td colSpan={7}>
                        <div className={s.empty}>
                          <div className={s.emptyIcon}>🏋️</div>
                          <p className={s.emptyTitle}>No exercises found</p>
                          <p className={s.emptyNote}>
                            {search || muscleFilter || equipFilter
                              ? "Try adjusting your filters"
                              : "Add your first exercise to get started"}
                          </p>
                          {!search && !muscleFilter && !equipFilter && (
                            <button
                              className={s.btnAdd}
                              onClick={() => setEditing("new")}
                            >
                              ＋ Add First Exercise
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                  : exercises.map(ex => {
                    const ci = Array.isArray(ex.contraindications)
                      ? ex.contraindications
                      : ex.contraindications ? [ex.contraindications] : [];

                    return (
                      <tr key={ex.id}>
                        {/* Name */}
                        <td className={s.td}>
                          <div className={s.exerciseCell}>
                            <div className={s.exerciseIcon}>
                              {MUSCLE_ICONS[ex.muscle_group] ?? "🏋️"}
                            </div>
                            <span className={s.exerciseName}>{ex.name}</span>
                          </div>
                        </td>

                        {/* Muscle */}
                        <td className={s.td}>
                          {ex.muscle_group
                            ? <MuscleBadge group={ex.muscle_group} />
                            : <span className={s.cellMuted}>—</span>
                          }
                        </td>

                        {/* Difficulty */}
                        <td className={s.td}>
                          <DiffBadge level={ex.difficulty} />
                        </td>

                        {/* Equipment */}
                        <td className={s.td}>
                          <span className={s.cellSm}>
                            {ex.equipment ?? <span className={s.cellMuted}>—</span>}
                          </span>
                        </td>

                        {/* Contraindications */}
                        <td className={s.td} style={{ maxWidth: 180 }}>
                          {ci.length > 0
                            ? <div className={s.ciTags}>
                                {ci.slice(0, 2).map((c, i) => (
                                  <span className={s.ciTag} key={i}>{c}</span>
                                ))}
                                {ci.length > 2 && (
                                  <span className={s.ciMore}>+{ci.length - 2}</span>
                                )}
                              </div>
                            : <span className={s.cellMuted}>—</span>
                          }
                        </td>

                        {/* Date */}
                        <td className={s.td}>
                          <span className={s.cellMuted} style={{ whiteSpace: "nowrap" }}>
                            {ex.created_at
                              ? new Date(ex.created_at).toLocaleDateString("en-IN")
                              : "—"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className={s.td}>
                          <div className={s.actions}>
                            <button className={`${s.btnSm} ${s.btnView}`}
                              onClick={() => setViewing(ex)}>View</button>
                            <button className={`${s.btnSm} ${s.btnEdit}`}
                              onClick={() => setEditing(ex)}>Edit</button>
                            <button className={`${s.btnSm} ${s.btnDanger}`}
                              onClick={() => setDeleting(ex)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className={s.mobileCards}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
              <div className={s.mobileCard} key={i}>
                <div className={s.skeletonCell} style={{ width: "65%", marginBottom: 8 }} />
                <div className={s.skeletonCell} style={{ width: "45%" }} />
              </div>
            ))
            : exercises.length === 0
              ? (
                <div className={s.empty}>
                  <div className={s.emptyIcon}>🏋️</div>
                  <p className={s.emptyTitle}>No exercises found</p>
                  <p className={s.emptyNote}>
                    {search || muscleFilter || equipFilter
                      ? "Try adjusting filters"
                      : "Add your first exercise"}
                  </p>
                  {!search && !muscleFilter && !equipFilter && (
                    <button className={s.btnAdd} onClick={() => setEditing("new")}>
                      ＋ Add First Exercise
                    </button>
                  )}
                </div>
              )
              : exercises.map(ex => (
                <MobileExerciseCard
                  key={ex.id}
                  exercise={ex}
                  onView={setViewing}
                  onEdit={e => setEditing(e)}
                  onDelete={e => setDeleting(e)}
                />
              ))
          }
        </div>

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className={s.pagination}>
            <span className={s.paginationInfo}>
              Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of{" "}
              {total.toLocaleString()} exercises
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

      {/* ── Modals ── */}
      {viewing && !editing && (
        <ExerciseDetailModal
          exercise={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
          onDelete={() => { setDeleting(viewing); setViewing(null); }}
        />
      )}

      {editing && (
        <ExerciseFormModal
          exercise={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={fetchExercises}
          toast={toast}
        />
      )}

      {deleting && (
        <ConfirmDialog
          message={`"${deleting.name}" will be permanently removed from the exercise library.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}