// ── src/pages/protected/Admin/Sections/AdminMeals.jsx ────────
import { useState, useEffect, useCallback } from "react";
import api from "../../../../services/api";

const DIET_TYPES = ["", "veg", "non-veg", "vegan", "keto", "paleo"];

const Btn = ({ onClick, color = "orange", children, disabled, type = "button" }) => {
  const bg = { orange: "#FF5C1A", green: "#22c55e", red: "#ef4444", gray: "rgba(255,255,255,0.08)" };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      padding: "0.45rem 0.9rem", borderRadius: 8, border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? "rgba(255,255,255,0.05)" : bg[color],
      color: "#fff", fontSize: "0.72rem", fontWeight: 700,
      letterSpacing: "0.07em", textTransform: "uppercase",
      opacity: disabled ? 0.5 : 1, transition: "opacity 0.2s",
    }}>{children}</button>
  );
};

const Field = ({ label, value, onChange, type = "text", options }) => (
  <div>
    <label style={{ display: "block", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#525D72", marginBottom: 4 }}>{label}</label>
    {options
      ? <select value={value} onChange={e => onChange(e.target.value)}
          style={{ width: "100%", background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none" }}>
          {options.map(o => <option key={o} value={o}>{o || "Select…"}</option>)}
        </select>
      : <input type={type} value={value} onChange={e => onChange(e.target.value)}
          style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none" }} />
    }
  </div>
);

const EMPTY_FORM = { name: "", calories: "", cuisine: "", diet_type: "veg", protein_g: "", carbs_g: "", fats_g: "", fiber_g: "" };

const MealModal = ({ meal, onClose, onSave }) => {
  const [form, setForm] = useState(meal
    ? { name: meal.name, calories: meal.calories, cuisine: meal.cuisine ?? "", diet_type: meal.diet_type,
        protein_g: meal.macros?.protein_g ?? "", carbs_g: meal.macros?.carbs_g ?? "",
        fats_g: meal.macros?.fats_g ?? "", fiber_g: meal.macros?.fiber_g ?? "" }
    : EMPTY_FORM
  );

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name || !form.calories) return;
    onSave({
      name: form.name, calories: Number(form.calories),
      cuisine: form.cuisine || null, diet_type: form.diet_type,
      macros: {
        protein_g: Number(form.protein_g) || 0,
        carbs_g:   Number(form.carbs_g)   || 0,
        fats_g:    Number(form.fats_g)    || 0,
        fiber_g:   Number(form.fiber_g)   || 0,
      },
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#161A23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1.75rem", width: 480, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.1rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: "#F0F2F5", marginBottom: "1.25rem" }}>
          {meal ? "Edit Meal" : "Add Meal"}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <Field label="Name *"     value={form.name}     onChange={set("name")} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <Field label="Calories *" value={form.calories} onChange={set("calories")} type="number" />
            <Field label="Cuisine"    value={form.cuisine}  onChange={set("cuisine")} />
          </div>
          <Field label="Diet Type" value={form.diet_type} onChange={set("diet_type")} options={DIET_TYPES.filter(Boolean)} />
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.875rem" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.75rem" }}>Macros (g)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <Field label="Protein"  value={form.protein_g} onChange={set("protein_g")} type="number" />
              <Field label="Carbs"    value={form.carbs_g}   onChange={set("carbs_g")}   type="number" />
              <Field label="Fats"     value={form.fats_g}    onChange={set("fats_g")}    type="number" />
              <Field label="Fiber"    value={form.fiber_g}   onChange={set("fiber_g")}   type="number" />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
          <Btn onClick={submit}>Save</Btn>
          <Btn onClick={onClose} color="gray">Cancel</Btn>
        </div>
      </div>
    </div>
  );
};

export default function AdminMeals({ toast }) {
  const [meals,    setMeals]   = useState([]);
  const [total,    setTotal]   = useState(0);
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState("");
  const [dietType, setDietType] = useState("");
  const [offset,   setOffset]  = useState(0);
  const [modal,    setModal]   = useState(null); // null | "add" | meal object
  const LIMIT = 20;

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset, search, diet_type: dietType });
      const { data } = await api.get(`/admin/meals?${params}`);
      setMeals(data.data.meals);
      setTotal(data.data.total);
    } catch { toast("Failed to load meals", "error"); }
    finally { setLoading(false); }
  }, [offset, search, dietType]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const handleSave = async (payload) => {
    try {
      if (modal === "add") {
        await api.post("/admin/meals", payload);
        toast("Meal created successfully");
      } else {
        await api.put(`/admin/meals/${modal.id}`, payload);
        toast("Meal updated successfully");
      }
      setModal(null);
      fetchMeals();
    } catch (e) { toast(e?.response?.data?.message ?? "Save failed", "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this meal?")) return;
    try {
      await api.delete(`/admin/meals/${id}`);
      toast("Meal deleted");
      fetchMeals();
    } catch { toast("Delete failed", "error"); }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.4rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5" }}>
          Meals <span style={{ color: "#FF5C1A" }}>({total})</span>
        </h2>
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setOffset(0); }}
            placeholder="Search meals…"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.875rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none", width: 200 }} />
          <select value={dietType} onChange={e => { setDietType(e.target.value); setOffset(0); }}
            style={{ background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none" }}>
            {DIET_TYPES.map(d => <option key={d} value={d}>{d || "All Diets"}</option>)}
          </select>
          <Btn onClick={() => setModal("add")}>+ Add Meal</Btn>
        </div>
      </div>

      <div style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Name", "Calories", "Diet", "Cuisine", "Protein", "Carbs", "Fats", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} style={{ padding: "0.875rem 1rem" }}>
                      <div style={{ height: 16, borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: "shimmer 1.5s infinite" }} />
                    </td></tr>
                  ))
                : meals.map(m => (
                    <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#F0F2F5", fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#FF5C1A", fontWeight: 700 }}>{m.calories} kcal</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "#9AA3B4" }}>{m.diet_type}</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "#9AA3B4" }}>{m.cuisine ?? "—"}</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "#9AA3B4" }}>{m.macros?.protein_g ?? 0}g</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "#9AA3B4" }}>{m.macros?.carbs_g ?? 0}g</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "#9AA3B4" }}>{m.macros?.fats_g ?? 0}g</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button onClick={() => setModal(m)} style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: "1px solid rgba(255,92,26,0.3)", background: "transparent", color: "#FF5C1A", cursor: "pointer", fontSize: "0.68rem", fontWeight: 700 }}>Edit</button>
                          <button onClick={() => handleDelete(m.id)} style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "0.68rem", fontWeight: 700 }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", color: "#525D72" }}>Page {page + 1} of {pages} · {total} meals</span>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <Btn onClick={() => setOffset(o => Math.max(0, o - LIMIT))} disabled={page === 0} color="gray">← Prev</Btn>
              <Btn onClick={() => setOffset(o => o + LIMIT)} disabled={page >= pages - 1} color="gray">Next →</Btn>
            </div>
          </div>
        )}
      </div>

      {modal !== null && (
        <MealModal meal={modal === "add" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}