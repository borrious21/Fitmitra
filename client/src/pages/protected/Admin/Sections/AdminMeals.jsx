// ── src/pages/protected/Admin/Sections/AdminMeals.jsx ─────────
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../../services/apiClient";

const DIET_TYPES = ["", "veg", "non_veg", "eggetarian"];
const DIET_LABELS = { veg: "Veg", non_veg: "Non-Veg", eggetarian: "Eggetarian" };
const DIET_COLORS = {
  veg:        ["rgba(34,197,94,0.12)",   "#22c55e"],
  non_veg:    ["rgba(239,68,68,0.12)",   "#ef4444"],
  eggetarian: ["rgba(234,179,8,0.12)",   "#eab308"],
};
const LIMIT = 20;

// ── Shared helpers ────────────────────────────────────────────
const Badge = ({ children, color }) => {
  const map = {
    green:  ["rgba(34,197,94,0.12)",   "#22c55e"],
    red:    ["rgba(239,68,68,0.12)",   "#ef4444"],
    orange: ["rgba(255,92,26,0.12)",   "#FF5C1A"],
    yellow: ["rgba(234,179,8,0.12)",   "#eab308"],
    gray:   ["rgba(148,163,184,0.12)", "#94a3b8"],
  };
  const [bg, fg] = map[color] ?? map.gray;
  return (
    <span style={{
      padding: "0.2rem 0.6rem", borderRadius: 6,
      fontSize: "0.6rem", fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      background: bg, color: fg, whiteSpace: "nowrap",
    }}>{children}</span>
  );
};

const DietBadge = ({ diet_type }) => {
  const [bg, fg] = DIET_COLORS[diet_type] ?? DIET_COLORS.veg;
  return (
    <span style={{
      padding: "0.2rem 0.6rem", borderRadius: 6,
      fontSize: "0.6rem", fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      background: bg, color: fg, whiteSpace: "nowrap",
    }}>{DIET_LABELS[diet_type] ?? diet_type}</span>
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
          width: i === 0 ? "70%" : i === 6 ? 70 : "55%",
          backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s ease-in-out infinite",
        }} />
      </td>
    ))}
  </tr>
);

// ── Field input ───────────────────────────────────────────────
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
        <div style={{ fontSize: "0.9rem", color: "#F0F2F5", fontWeight: 600, marginBottom: "0.5rem" }}>Delete this meal?</div>
        <div style={{ fontSize: "0.78rem", color: "#525D72", marginBottom: "1.5rem", lineHeight: 1.55 }}>{message}</div>
        <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center" }}>
          <ActionBtn onClick={onCancel} color="gray">Cancel</ActionBtn>
          <ActionBtn onClick={onConfirm} color="red">Delete</ActionBtn>
        </div>
      </div>
    </div>
  );
}

// ── Meal Form (create + edit) ─────────────────────────────────
const EMPTY_FORM = {
  name: "", calories: "", diet_type: "veg", cuisine: "",
  macros: { protein_g: "", carbs_g: "", fats_g: "", fiber_g: "" },
  tags: "",
};

function MealFormModal({ meal, onClose, onSaved, toast }) {
  const isEdit = !!meal;
  const [form,   setForm]   = useState(() => {
    if (!meal) return EMPTY_FORM;
    return {
      name:      meal.name      ?? "",
      calories:  meal.calories  != null ? String(meal.calories) : "",
      diet_type: meal.diet_type ?? "veg",
      cuisine:   meal.cuisine   ?? "",
      macros: {
        protein_g: meal.macros?.protein_g != null ? String(meal.macros.protein_g) : "",
        carbs_g:   meal.macros?.carbs_g   != null ? String(meal.macros.carbs_g)   : "",
        fats_g:    meal.macros?.fats_g    != null ? String(meal.macros.fats_g)    : "",
        fiber_g:   meal.macros?.fiber_g   != null ? String(meal.macros.fiber_g)   : "",
      },
      tags: Array.isArray(meal.tags) ? meal.tags.join(", ") : (meal.tags ?? ""),
    };
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  };
  const setMacro = (key, val) => {
    setForm(f => ({ ...f, macros: { ...f.macros, [key]: val } }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                                    e.name     = "Name is required";
    if (form.calories === "" || isNaN(Number(form.calories))) e.calories = "Valid calories required";
    if (Number(form.calories) < 0)                            e.calories = "Must be ≥ 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // Build macros — only send fields that are filled in
      const macros = {};
      for (const [k, v] of Object.entries(form.macros)) {
        if (v !== "") macros[k] = Number(v);
      }
      // Build tags array from comma-separated string
      const tags = form.tags.trim()
        ? form.tags.split(",").map(t => t.trim()).filter(Boolean)
        : null;

      const payload = {
        name:      form.name.trim(),
        calories:  Number(form.calories),
        diet_type: form.diet_type,
        cuisine:   form.cuisine.trim() || null,
        macros,
        tags,
      };

      if (isEdit) {
        await apiFetch(`/admin/meals/${meal.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast?.("Meal updated successfully", "success");
      } else {
        await apiFetch("/admin/meals", { method: "POST", body: JSON.stringify(payload) });
        toast?.("Meal created successfully", "success");
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
      <div onClick={e => e.stopPropagation()} style={{ background: "#161A23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: 540, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#161A23", zIndex: 10, background: "linear-gradient(135deg,rgba(255,92,26,0.06) 0%,#161A23 60%)" }}>
          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.25rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5" }}>
              {isEdit ? "✏️ Edit Meal" : "➕ New Meal"}
            </h3>
            <div style={{ fontSize: "0.68rem", color: "#525D72", marginTop: 2 }}>
              {isEdit ? `ID: ${meal.id}` : "Fill in the meal details below"}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#9AA3B4", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>✕</button>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Name + Calories */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Meal Name *" error={errors.name}>
              <input
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="e.g. Paneer Tikka"
                style={inputStyle(errors.name)}
                onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
                onBlur={e  => e.target.style.borderColor = errors.name ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
              />
            </Field>
            <Field label="Calories *" error={errors.calories}>
              <input
                type="number" min="0"
                value={form.calories}
                onChange={e => set("calories", e.target.value)}
                placeholder="e.g. 350"
                style={inputStyle(errors.calories)}
                onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
                onBlur={e  => e.target.style.borderColor = errors.calories ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}
              />
            </Field>
          </div>

          {/* Diet type + Cuisine */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Diet Type">
              <select value={form.diet_type} onChange={e => set("diet_type", e.target.value)} style={selectStyle()}>
                <option value="veg">🌿 Vegetarian</option>
                <option value="non_veg">🍗 Non-Vegetarian</option>
                <option value="eggetarian">🥚 Eggetarian</option>
              </select>
            </Field>
            <Field label="Cuisine" hint="Optional — e.g. Indian, Italian">
              <input
                value={form.cuisine}
                onChange={e => set("cuisine", e.target.value)}
                placeholder="e.g. Indian"
                style={inputStyle(false)}
                onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
                onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </Field>
          </div>

          {/* Macros */}
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.75rem" }}>
              📊 Macros (grams) — optional
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
              {[
                { key: "protein_g", label: "Protein",  color: "#ef4444" },
                { key: "carbs_g",   label: "Carbs",    color: "#3b82f6" },
                { key: "fats_g",    label: "Fats",     color: "#f59e0b" },
                { key: "fiber_g",   label: "Fiber",    color: "#10b981" },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color }}>
                    {label}
                  </label>
                  <input
                    type="number" min="0" step="0.1"
                    value={form.macros[key]}
                    onChange={e => setMacro(key, e.target.value)}
                    placeholder="0"
                    style={{ ...inputStyle(false), padding: "0.5rem 0.625rem" }}
                    onFocus={e => e.target.style.borderColor = color}
                    onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <Field label="Tags" hint="Comma-separated — e.g. high-protein, breakfast, low-carb">
            <input
              value={form.tags}
              onChange={e => set("tags", e.target.value)}
              placeholder="high-protein, lunch, gluten-free"
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
                : isEdit ? "💾 Save Changes" : "➕ Create Meal"
              }
            </ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Meal Detail Modal ─────────────────────────────────────────
function MealDetailModal({ meal, onClose, onEdit, onDelete }) {
  if (!meal) return null;
  const macros = meal.macros ?? {};
  const tags   = Array.isArray(meal.tags) ? meal.tags : [];

  const macroRows = [
    { label: "Protein",  key: "protein_g", color: "#ef4444", icon: "💪" },
    { label: "Carbs",    key: "carbs_g",   color: "#3b82f6", icon: "🌾" },
    { label: "Fats",     key: "fats_g",    color: "#f59e0b", icon: "🫒" },
    { label: "Fiber",    key: "fiber_g",   color: "#10b981", icon: "🌿" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161A23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: 460, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: "linear-gradient(135deg,rgba(255,92,26,0.06) 0%,transparent 100%)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.4rem", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", color: "#F0F2F5", lineHeight: 1.1 }}>{meal.name}</h3>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem", alignItems: "center" }}>
              <DietBadge diet_type={meal.diet_type} />
              {meal.cuisine && <Badge color="gray">{meal.cuisine}</Badge>}
              <span style={{ fontSize: "0.65rem", color: "#525D72" }}>ID: {meal.id}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#9AA3B4", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0, marginLeft: "0.75rem" }}>✕</button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Calories hero */}
          <div style={{ background: "rgba(255,92,26,0.08)", border: "1px solid rgba(255,92,26,0.2)", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "2rem" }}>🔥</span>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "2rem", fontWeight: 900, color: "#FF5C1A", lineHeight: 1 }}>{meal.calories}</div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#525D72" }}>Calories</div>
            </div>
          </div>

          {/* Macros grid */}
          {Object.values(macros).some(v => v != null) && (
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.625rem" }}>Macros per serving</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.625rem" }}>
                {macroRows.map(({ label, key, color, icon }) => (
                  macros[key] != null && (
                    <div key={key} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22`, borderRadius: 10, padding: "0.625rem", textAlign: "center" }}>
                      <div style={{ fontSize: "1.1rem", marginBottom: "0.2rem" }}>{icon}</div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.1rem", fontWeight: 900, color, lineHeight: 1 }}>{macros[key]}g</div>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#525D72", marginTop: 2 }}>{label}</div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.5rem" }}>Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {tags.map(t => (
                  <span key={t} style={{ padding: "0.2rem 0.625rem", borderRadius: 20, fontSize: "0.68rem", fontWeight: 600, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9AA3B4" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.625rem", paddingTop: "0.25rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <ActionBtn color="orange" onClick={onEdit} small>✏️ Edit</ActionBtn>
            <ActionBtn color="red"    onClick={onDelete} small>🗑️ Delete</ActionBtn>
            <ActionBtn color="gray"   onClick={onClose} small>Close</ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function AdminMeals({ toast }) {
  const [meals,     setMeals]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [dietFilter,setDietFilter]= useState("");
  const [offset,    setOffset]    = useState(0);

  // modal states
  const [viewing,   setViewing]   = useState(null); // meal object → detail modal
  const [editing,   setEditing]   = useState(null); // meal object | "new" → form modal
  const [deleting,  setDeleting]  = useState(null); // meal object → confirm dialog
  const [busy,      setBusy]      = useState(false);

  // ── Fetch ─────────────────────────────────────────────────
  const fetchMeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset, search, diet_type: dietFilter });
      const payload = await apiFetch(`/admin/meals?${params}`);
      setMeals(payload.meals ?? []);
      setTotal(payload.total ?? 0);
    } catch (err) {
      toast?.(err?.message ?? "Failed to load meals", "error");
    } finally {
      setLoading(false);
    }
  }, [offset, search, dietFilter]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const handleSearch = (val) => { setSearch(val);    setOffset(0); };
  const handleDiet   = (val) => { setDietFilter(val); setOffset(0); };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/meals/${deleting.id}`, { method: "DELETE" });
      toast?.("Meal deleted successfully", "success");
      setDeleting(null);
      setViewing(null);
      fetchMeals();
    } catch (err) {
      toast?.(err?.message ?? "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT);

  // ── Render ────────────────────────────────────────────────
  return (
    <div>
      {/* ── Topbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.875rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.6rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5", lineHeight: 1 }}>
            Meals{" "}
            {!loading && <span style={{ color: "#FF5C1A" }}>({total.toLocaleString()})</span>}
          </h2>
          <p style={{ fontSize: "0.72rem", color: "#525D72", marginTop: 4 }}>
            Create, edit and manage the meals database
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
              placeholder="Search meals…"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.55rem 0.875rem 0.55rem 2rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none", width: 200, fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "rgba(255,92,26,0.5)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          {/* Diet filter */}
          <select
            value={dietFilter}
            onChange={e => handleDiet(e.target.value)}
            style={{ background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.55rem 0.875rem", color: dietFilter ? "#F0F2F5" : "#525D72", fontSize: "0.8rem", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            {DIET_TYPES.map(d => <option key={d} value={d}>{d ? DIET_LABELS[d] : "All Diets"}</option>)}
          </select>

          {/* Refresh */}
          <button
            onClick={fetchMeals}
            title="Refresh"
            style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#525D72", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,92,26,0.4)"; e.currentTarget.style.color = "#FF5C1A"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#525D72"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>

          {/* New meal */}
          <ActionBtn color="orange" onClick={() => setEditing("new")}>
            ➕ New Meal
          </ActionBtn>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                {["Name", "Diet", "Cuisine", "Calories", "Macros", "Tags", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#525D72", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : meals.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "3.5rem 1rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.4 }}>🍽️</div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.9rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.5rem" }}>No meals found</div>
                        <div style={{ fontSize: "0.72rem", color: "#525D72", marginBottom: "1rem" }}>
                          {search || dietFilter ? "Try adjusting your filters" : "Add your first meal to get started"}
                        </div>
                        {!search && !dietFilter && (
                          <ActionBtn color="orange" onClick={() => setEditing("new")} small>➕ Add First Meal</ActionBtn>
                        )}
                      </td>
                    </tr>
                  )
                  : meals.map(m => {
                    const macros = m.macros ?? {};
                    const tags   = Array.isArray(m.tags) ? m.tags : [];
                    return (
                      <tr
                        key={m.id}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.12s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {/* Name */}
                        <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,92,26,0.12)", border: "1px solid rgba(255,92,26,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>
                              {m.diet_type === "veg" ? "🌿" : m.diet_type === "eggetarian" ? "🥚" : "🍗"}
                            </div>
                            <span style={{ fontSize: "0.82rem", color: "#F0F2F5", fontWeight: 600 }}>{m.name}</span>
                          </div>
                        </td>

                        {/* Diet */}
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <DietBadge diet_type={m.diet_type} />
                        </td>

                        {/* Cuisine */}
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.77rem", color: "#9AA3B4" }}>
                          {m.cuisine ?? <span style={{ color: "#525D72" }}>—</span>}
                        </td>

                        {/* Calories */}
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, color: "#FF5C1A" }}>{m.calories}</span>
                          <span style={{ fontSize: "0.6rem", color: "#525D72", marginLeft: 2 }}>kcal</span>
                        </td>

                        {/* Macros inline */}
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "nowrap" }}>
                            {[
                              { key: "protein_g", label: "P", color: "#ef4444" },
                              { key: "carbs_g",   label: "C", color: "#3b82f6" },
                              { key: "fats_g",    label: "F", color: "#f59e0b" },
                            ].map(({ key, label, color }) => (
                              macros[key] != null && (
                                <span key={key} style={{ fontSize: "0.65rem", fontWeight: 700, color, whiteSpace: "nowrap" }}>
                                  {label}: {macros[key]}g
                                </span>
                              )
                            ))}
                            {!macros.protein_g && !macros.carbs_g && !macros.fats_g && (
                              <span style={{ color: "#525D72", fontSize: "0.72rem" }}>—</span>
                            )}
                          </div>
                        </td>

                        {/* Tags */}
                        <td style={{ padding: "0.875rem 1rem", maxWidth: 160 }}>
                          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                            {tags.slice(0, 2).map(t => (
                              <span key={t} style={{ padding: "0.1rem 0.4rem", borderRadius: 4, fontSize: "0.58rem", fontWeight: 600, background: "rgba(255,255,255,0.06)", color: "#9AA3B4", whiteSpace: "nowrap" }}>{t}</span>
                            ))}
                            {tags.length > 2 && (
                              <span style={{ fontSize: "0.58rem", color: "#525D72" }}>+{tags.length - 2}</span>
                            )}
                            {tags.length === 0 && <span style={{ color: "#525D72", fontSize: "0.72rem" }}>—</span>}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <div style={{ display: "flex", gap: "0.375rem" }}>
                            <ActionBtn small color="gray" onClick={() => setViewing(m)}>View</ActionBtn>
                            <ActionBtn small color="orange" onClick={() => setEditing(m)}>Edit</ActionBtn>
                            <ActionBtn small color="red"    onClick={() => setDeleting(m)}>Del</ActionBtn>
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
              Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()} meals
            </span>
            <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
              <ActionBtn small color="gray" disabled={page === 0}          onClick={() => setOffset(0)}>«</ActionBtn>
              <ActionBtn small color="gray" disabled={page === 0}          onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>‹ Prev</ActionBtn>
              <span style={{ padding: "0.35rem 0.75rem", borderRadius: 7, background: "rgba(255,92,26,0.12)", color: "#FF5C1A", fontSize: "0.72rem", fontWeight: 700, border: "1px solid rgba(255,92,26,0.25)" }}>
                {page + 1} / {pages}
              </span>
              <ActionBtn small color="gray" disabled={page >= pages - 1}   onClick={() => setOffset(o => o + LIMIT)}>Next ›</ActionBtn>
              <ActionBtn small color="gray" disabled={page >= pages - 1}   onClick={() => setOffset((pages - 1) * LIMIT)}>»</ActionBtn>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {viewing && !editing && (
        <MealDetailModal
          meal={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
          onDelete={() => { setDeleting(viewing); setViewing(null); }}
        />
      )}

      {editing && (
        <MealFormModal
          meal={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={fetchMeals}
          toast={toast}
        />
      )}

      {deleting && (
        <ConfirmDialog
          message={`"${deleting.name}" will be permanently removed from the database.`}
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