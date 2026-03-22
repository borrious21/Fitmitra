// ── src/pages/protected/Admin/Sections/AdminExercises.jsx ─────
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../../../services/apiClient";

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

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const DIFF_COLORS = {
  beginner:     ["rgba(34,197,94,0.12)",   "#22c55e"],
  intermediate: ["rgba(234,179,8,0.12)",   "#eab308"],
  advanced:     ["rgba(239,68,68,0.12)",   "#ef4444"],
};

// ── Shared helpers ────────────────────────────────────────────
const DiffBadge = ({ level }) => {
  const [bg, fg] = DIFF_COLORS[level] ?? DIFF_COLORS.beginner;
  return (
    <span style={{
      padding: "0.2rem 0.6rem", borderRadius: 6,
      fontSize: "0.6rem", fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      background: bg, color: fg, whiteSpace: "nowrap",
    }}>{level ?? "—"}</span>
  );
};

const ActionBtn = ({ onClick, color = "orange", children, disabled, small }) => {
  const bg = {
    orange: "linear-gradient(135deg,#FF5C1A,#FF8A3D)",
    green:  "linear-gradient(135deg,#16a34a,#22c55e)",
    red:    "linear-gradient(135deg,#dc2626,#ef4444)",
    gray:   "rgba(255,255,255,0.07)",
    blue:   "linear-gradient(135deg,#2563eb,#3b82f6)",
  };
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: small ? "0.35rem 0.7rem" : "0.55rem 1.1rem",
        borderRadius: 8, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "rgba(255,255,255,0.05)" : bg[color],
        color: "#fff",
        fontSize: small ? "0.68rem" : "0.72rem",
        fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
        opacity: disabled ? 0.45 : hover ? 0.88 : 1,
        transition: "opacity 0.18s, transform 0.18s",
        transform: !disabled && hover ? "translateY(-1px)" : "none",
        boxShadow: !disabled && color !== "gray" && hover ? "0 4px 16px rgba(255,92,26,0.25)" : "none",
        whiteSpace: "nowrap", flexShrink: 0,
      }}
    >{children}</button>
  );
};

const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} style={{ padding: "0.875rem 1rem" }}>
        <div style={{
          height: 14, borderRadius: 6,
          background: "rgba(255,255,255,0.05)",
          width: i === 0 ? "72%" : i === 6 ? 80 : "55%",
          backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s ease-in-out infinite",
        }} />
      </td>
    ))}
  </tr>
);

const Field = ({ label, error, hint, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
    <label style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9AA3B4" }}>
      {label}
    </label>
    {children}
    {error && <span style={{ fontSize: "0.65rem", color: "#ef4444" }}>{error}</span>}
    {!error && hint && <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>{hint}</span>}
  </div>
);

const inputStyle = (err) => ({
  background: "rgba(255,255,255,0.05)",
  border: `1px solid ${err ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
  borderRadius: 8, padding: "0.6rem 0.875rem",
  color: "#F0F2F5", fontSize: "0.82rem", outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  transition: "border-color 0.2s",
});

const selectStyle = () => ({
  background: "#1A1E28",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, padding: "0.6rem 0.875rem",
  color: "#F0F2F5", fontSize: "0.82rem", outline: "none",
  fontFamily: "inherit", width: "100%", cursor: "pointer",
});

// ── Confirm dialog ────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161A23", border: "1px solid rgba(255,77,109,0.25)", borderRadius: 16, padding: "1.75rem", width: 360, maxWidth: "90vw", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🗑️</div>
        <div style={{ fontSize: "0.9rem", color: "#F0F2F5", fontWeight: 600, marginBottom: "0.5rem" }}>Delete this exercise?</div>
        <div style={{ fontSize: "0.78rem", color: "#525D72", marginBottom: "1.5rem", lineHeight: 1.55 }}>{message}</div>
        <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center" }}>
          <ActionBtn onClick={onCancel}  color="gray">Cancel</ActionBtn>
          <ActionBtn onClick={onConfirm} color="red">Delete</ActionBtn>
        </div>
      </div>
    </div>
  );
}

// ── Exercise Form Modal ───────────────────────────────────────
const EMPTY_FORM = {
  name: "", muscle_group: "chest", difficulty: "beginner",
  equipment: "", contraindications: "",
};

function ExerciseFormModal({ exercise, onClose, onSaved, toast }) {
  const isEdit = !!exercise;
  const [form,   setForm]   = useState(() => {
    if (!exercise) return EMPTY_FORM;
    const ci = exercise.contraindications;
    return {
      name:             exercise.name            ?? "",
      muscle_group:     exercise.muscle_group    ?? "chest",
      difficulty:       exercise.difficulty      ?? "beginner",
      equipment:        exercise.equipment       ?? "",
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
    if (!form.name.trim())        e.name         = "Name is required";
    if (!form.muscle_group)       e.muscle_group = "Muscle group is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // Parse contraindications: comma-separated → array, or null
      const ci = form.contraindications.trim()
        ? form.contraindications.split(",").map(s => s.trim()).filter(Boolean)
        : null;

      const payload = {
        name:             form.name.trim(),
        muscle_group:     form.muscle_group,
        difficulty:       form.difficulty,
        equipment:        form.equipment.trim() || null,
        contraindications: ci,
      };

      if (isEdit) {
        await apiFetch(`/admin/exercises/${exercise.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast?.("Exercise updated successfully", "success");
      } else {
        await apiFetch("/admin/exercises", { method: "POST", body: JSON.stringify(payload) });
        toast?.("Exercise created successfully", "success");
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161A23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: 520, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,rgba(255,92,26,0.06) 0%,transparent 100%)", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.25rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5" }}>
              {isEdit ? "✏️ Edit Exercise" : "➕ New Exercise"}
            </h3>
            <div style={{ fontSize: "0.68rem", color: "#525D72", marginTop: 2 }}>
              {isEdit ? `ID: ${exercise.id}` : "Fill in the exercise details below"}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#9AA3B4", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>✕</button>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Name */}
          <Field label="Exercise Name *" error={errors.name}>
            <input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g. Barbell Squat"
              style={inputStyle(errors.name)}
              onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
              onBlur={e  => e.target.style.borderColor = errors.name ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
            />
          </Field>

          {/* Muscle group + Difficulty */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Muscle Group *" error={errors.muscle_group}>
              <select
                value={form.muscle_group}
                onChange={e => set("muscle_group", e.target.value)}
                style={{ ...selectStyle(), border: errors.muscle_group ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)" }}
              >
                <option value="">Select muscle group</option>
                {MUSCLE_GROUPS.filter(Boolean).map(m => (
                  <option key={m} value={m}>{MUSCLE_ICONS[m]} {MUSCLE_LABELS[m]}</option>
                ))}
              </select>
            </Field>
            <Field label="Difficulty">
              <select value={form.difficulty} onChange={e => set("difficulty", e.target.value)} style={selectStyle()}>
                <option value="beginner">🟢 Beginner</option>
                <option value="intermediate">🟡 Intermediate</option>
                <option value="advanced">🔴 Advanced</option>
              </select>
            </Field>
          </div>

          {/* Equipment */}
          <Field label="Equipment" hint="Optional — e.g. Barbell, Dumbbells, None">
            <input
              value={form.equipment}
              onChange={e => set("equipment", e.target.value)}
              placeholder="e.g. Barbell"
              style={inputStyle(false)}
              onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </Field>

          {/* Contraindications */}
          <Field label="Contraindications" hint="Comma-separated conditions to avoid — e.g. knee injury, lower back pain">
            <input
              value={form.contraindications}
              onChange={e => set("contraindications", e.target.value)}
              placeholder="knee injury, shoulder pain"
              style={inputStyle(false)}
              onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </Field>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.25rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <ActionBtn color="gray" onClick={onClose}>Cancel</ActionBtn>
            <ActionBtn color="orange" onClick={handleSubmit} disabled={saving}>
              {saving
                ? <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Saving…
                  </span>
                : isEdit ? "💾 Save Changes" : "➕ Create Exercise"
              }
            </ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Exercise Detail Modal ─────────────────────────────────────
function ExerciseDetailModal({ exercise, onClose, onEdit, onDelete }) {
  if (!exercise) return null;
  const ci = Array.isArray(exercise.contraindications)
    ? exercise.contraindications
    : (exercise.contraindications ? [exercise.contraindications] : []);

  const [diff_bg, diff_fg] = DIFF_COLORS[exercise.difficulty] ?? DIFF_COLORS.beginner;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161A23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: 440, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: "linear-gradient(135deg,rgba(255,92,26,0.06) 0%,transparent 100%)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.4rem", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", color: "#F0F2F5", lineHeight: 1.1 }}>
              {exercise.name}
            </h3>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem", alignItems: "center" }}>
              <DiffBadge level={exercise.difficulty} />
              {exercise.muscle_group && (
                <span style={{ padding: "0.2rem 0.6rem", borderRadius: 6, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(255,92,26,0.1)", color: "#FF5C1A", border: "1px solid rgba(255,92,26,0.2)" }}>
                  {MUSCLE_ICONS[exercise.muscle_group]} {MUSCLE_LABELS[exercise.muscle_group]}
                </span>
              )}
              <span style={{ fontSize: "0.65rem", color: "#525D72" }}>ID: {exercise.id}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#9AA3B4", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0, marginLeft: "0.75rem" }}>✕</button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              { label: "Muscle Group", value: exercise.muscle_group ? `${MUSCLE_ICONS[exercise.muscle_group]} ${MUSCLE_LABELS[exercise.muscle_group]}` : "—", color: "#FF5C1A" },
              { label: "Difficulty",   value: exercise.difficulty ?? "—",  color: diff_fg },
              { label: "Equipment",    value: exercise.equipment   ?? "None", color: "#9AA3B4" },
              { label: "Created",      value: exercise.created_at ? new Date(exercise.created_at).toLocaleDateString("en-IN") : "—", color: "#9AA3B4" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.75rem 0.875rem" }}>
                <div style={{ fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#525D72", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Contraindications */}
          {ci.length > 0 && (
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.5rem" }}>
                ⚠️ Contraindications
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {ci.map((c, i) => (
                  <span key={i} style={{ padding: "0.25rem 0.625rem", borderRadius: 20, fontSize: "0.68rem", fontWeight: 600, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.625rem", paddingTop: "0.25rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <ActionBtn color="orange" onClick={onEdit}   small>✏️ Edit</ActionBtn>
            <ActionBtn color="red"    onClick={onDelete} small>🗑️ Delete</ActionBtn>
            <ActionBtn color="gray"   onClick={onClose}  small>Close</ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function AdminExercises({ toast }) {
  const [exercises,   setExercises]   = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [muscleFilter,setMuscleFilter]= useState("");
  const [equipFilter, setEquipFilter] = useState("");
  const [offset,      setOffset]      = useState(0);

  const [viewing,  setViewing]  = useState(null);
  const [editing,  setEditing]  = useState(null); // exercise | "new"
  const [deleting, setDeleting] = useState(null);
  const [busy,     setBusy]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────
  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: LIMIT, offset, search,
        muscle_group: muscleFilter, equipment: equipFilter,
      });
      const payload = await apiFetch(`/admin/exercises?${params}`);
      setExercises(payload.exercises ?? []);
      setTotal(payload.total ?? 0);
    } catch (err) {
      toast?.(err?.message ?? "Failed to load exercises", "error");
    } finally {
      setLoading(false);
    }
  }, [offset, search, muscleFilter, equipFilter]);

  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  const handleSearch = (val) => { setSearch(val);      setOffset(0); };
  const handleMuscle = (val) => { setMuscleFilter(val); setOffset(0); };
  const handleEquip  = (val) => { setEquipFilter(val);  setOffset(0); };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/exercises/${deleting.id}`, { method: "DELETE" });
      toast?.("Exercise deleted successfully", "success");
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

  // Collect unique equipment values from current data for filter dropdown
  const equipOptions = ["", ...Array.from(new Set(exercises.map(e => e.equipment).filter(Boolean))).sort()];

  return (
    <div>
      {/* ── Topbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.875rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.6rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5", lineHeight: 1 }}>
            Exercises{" "}
            {!loading && <span style={{ color: "#FF5C1A" }}>({total.toLocaleString()})</span>}
          </h2>
          <p style={{ fontSize: "0.72rem", color: "#525D72", marginTop: 4 }}>
            Manage the exercises library — create, edit and delete movements
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
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search exercises…"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.55rem 0.875rem 0.55rem 2rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none", width: 190, fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          {/* Muscle filter */}
          <select
            value={muscleFilter}
            onChange={e => handleMuscle(e.target.value)}
            style={{ background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.55rem 0.875rem", color: muscleFilter ? "#F0F2F5" : "#525D72", fontSize: "0.8rem", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            {MUSCLE_GROUPS.map(m => (
              <option key={m} value={m}>{m ? `${MUSCLE_ICONS[m]} ${MUSCLE_LABELS[m]}` : "All Muscles"}</option>
            ))}
          </select>

          {/* Equipment filter — built from live data */}
          <select
            value={equipFilter}
            onChange={e => handleEquip(e.target.value)}
            style={{ background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.55rem 0.875rem", color: equipFilter ? "#F0F2F5" : "#525D72", fontSize: "0.8rem", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            {equipOptions.map(eq => (
              <option key={eq} value={eq}>{eq || "All Equipment"}</option>
            ))}
          </select>

          {/* Refresh */}
          <button
            onClick={fetchExercises}
            title="Refresh"
            style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#525D72", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,92,26,0.4)"; e.currentTarget.style.color = "#FF5C1A"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#525D72"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>

          {/* New */}
          <ActionBtn color="orange" onClick={() => setEditing("new")}>➕ New Exercise</ActionBtn>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                {["Exercise", "Muscle Group", "Difficulty", "Equipment", "Contraindications", "Added", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#525D72", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : exercises.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "3.5rem 1rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.4 }}>🏋️</div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.9rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.5rem" }}>
                          No exercises found
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#525D72", marginBottom: "1rem" }}>
                          {search || muscleFilter || equipFilter ? "Try adjusting your filters" : "Add your first exercise to get started"}
                        </div>
                        {!search && !muscleFilter && !equipFilter && (
                          <ActionBtn color="orange" onClick={() => setEditing("new")} small>➕ Add First Exercise</ActionBtn>
                        )}
                      </td>
                    </tr>
                  )
                  : exercises.map(ex => {
                    const ci = Array.isArray(ex.contraindications)
                      ? ex.contraindications
                      : (ex.contraindications ? [ex.contraindications] : []);
                    return (
                      <tr
                        key={ex.id}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.12s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {/* Name */}
                        <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,92,26,0.1)", border: "1px solid rgba(255,92,26,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", flexShrink: 0 }}>
                              {MUSCLE_ICONS[ex.muscle_group] ?? "🏋️"}
                            </div>
                            <span style={{ fontSize: "0.82rem", color: "#F0F2F5", fontWeight: 600 }}>{ex.name}</span>
                          </div>
                        </td>

                        {/* Muscle group */}
                        <td style={{ padding: "0.875rem 1rem" }}>
                          {ex.muscle_group
                            ? <span style={{ fontSize: "0.77rem", color: "#FF5C1A", fontWeight: 600, textTransform: "capitalize" }}>
                                {MUSCLE_LABELS[ex.muscle_group] ?? ex.muscle_group}
                              </span>
                            : <span style={{ color: "#525D72" }}>—</span>
                          }
                        </td>

                        {/* Difficulty */}
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <DiffBadge level={ex.difficulty} />
                        </td>

                        {/* Equipment */}
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.77rem", color: "#9AA3B4" }}>
                          {ex.equipment ?? <span style={{ color: "#525D72" }}>—</span>}
                        </td>

                        {/* Contraindications */}
                        <td style={{ padding: "0.875rem 1rem", maxWidth: 180 }}>
                          {ci.length > 0
                            ? <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                {ci.slice(0, 2).map((c, i) => (
                                  <span key={i} style={{ padding: "0.1rem 0.4rem", borderRadius: 4, fontSize: "0.58rem", fontWeight: 600, background: "rgba(239,68,68,0.08)", color: "#ef4444", whiteSpace: "nowrap" }}>{c}</span>
                                ))}
                                {ci.length > 2 && <span style={{ fontSize: "0.58rem", color: "#525D72" }}>+{ci.length - 2}</span>}
                              </div>
                            : <span style={{ color: "#525D72", fontSize: "0.72rem" }}>—</span>
                          }
                        </td>

                        {/* Date */}
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.72rem", color: "#525D72", whiteSpace: "nowrap" }}>
                          {ex.created_at ? new Date(ex.created_at).toLocaleDateString("en-IN") : "—"}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <div style={{ display: "flex", gap: "0.375rem" }}>
                            <ActionBtn small color="gray"   onClick={() => setViewing(ex)}>View</ActionBtn>
                            <ActionBtn small color="orange" onClick={() => setEditing(ex)}>Edit</ActionBtn>
                            <ActionBtn small color="red"    onClick={() => setDeleting(ex)}>Del</ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && pages > 1 && (
          <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", color: "#525D72" }}>
              Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()} exercises
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
          message={`"${deleting.name}" will be permanently removed from the exercises library.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
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