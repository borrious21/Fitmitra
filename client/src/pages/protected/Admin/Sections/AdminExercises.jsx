// ── src/pages/protected/Admin/Sections/AdminExercises.jsx ────
import { useState, useEffect, useCallback } from "react";
import api from "../../../../services/api";

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const MUSCLE_GROUPS = ["", "chest", "back", "shoulders", "biceps", "triceps", "legs", "core", "glutes", "full_body"];
const EQUIPMENTS    = ["", "barbell", "dumbbell", "machine", "bodyweight", "cable", "kettlebell", "resistance_band", "other"];

const Btn = ({ onClick, color = "orange", children, disabled }) => {
  const bg = { orange: "#FF5C1A", green: "#22c55e", red: "#ef4444", gray: "rgba(255,255,255,0.08)" };
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

const Field = ({ label, value, onChange, options }) => (
  <div>
    <label style={{ display: "block", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#525D72", marginBottom: 4 }}>{label}</label>
    {options
      ? <select value={value} onChange={e => onChange(e.target.value)}
          style={{ width: "100%", background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none" }}>
          {options.map(o => <option key={o} value={o}>{o || "Any"}</option>)}
        </select>
      : <input value={value} onChange={e => onChange(e.target.value)}
          style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none" }} />
    }
  </div>
);

const EMPTY = { name: "", muscle_group: "", equipment: "", difficulty: "beginner" };

const ExModal = ({ exercise, onClose, onSave }) => {
  const [form, setForm] = useState(exercise
    ? { name: exercise.name, muscle_group: exercise.muscle_group ?? "", equipment: exercise.equipment ?? "", difficulty: exercise.difficulty ?? "beginner" }
    : EMPTY
  );
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#161A23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1.75rem", width: 440, maxWidth: "90vw" }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.1rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: "#F0F2F5", marginBottom: "1.25rem" }}>
          {exercise ? "Edit Exercise" : "Add Exercise"}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <Field label="Name *"       value={form.name}         onChange={set("name")} />
          <Field label="Muscle Group" value={form.muscle_group} onChange={set("muscle_group")} options={MUSCLE_GROUPS} />
          <Field label="Equipment"    value={form.equipment}    onChange={set("equipment")}    options={EQUIPMENTS} />
          <Field label="Difficulty"   value={form.difficulty}   onChange={set("difficulty")}   options={DIFFICULTIES} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
          <Btn onClick={() => form.name && onSave(form)}>Save</Btn>
          <Btn onClick={onClose} color="gray">Cancel</Btn>
        </div>
      </div>
    </div>
  );
};

const DIFF_COLOR = { beginner: "#22c55e", intermediate: "#f59e0b", advanced: "#ef4444" };

export default function AdminExercises({ toast }) {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [muscle,  setMuscle]  = useState("");
  const [equip,   setEquip]   = useState("");
  const [offset,  setOffset]  = useState(0);
  const [modal,   setModal]   = useState(null);
  const LIMIT = 20;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset, search, muscle_group: muscle, equipment: equip });
      const { data } = await api.get(`/admin/exercises?${params}`);
      setItems(data.data.exercises);
      setTotal(data.data.total);
    } catch { toast("Failed to load exercises", "error"); }
    finally { setLoading(false); }
  }, [offset, search, muscle, equip]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async (payload) => {
    try {
      if (modal === "add") await api.post("/admin/exercises", payload);
      else await api.put(`/admin/exercises/${modal.id}`, payload);
      toast(`Exercise ${modal === "add" ? "created" : "updated"}`);
      setModal(null);
      fetch();
    } catch (e) { toast(e?.response?.data?.message ?? "Save failed", "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this exercise?")) return;
    try {
      await api.delete(`/admin/exercises/${id}`);
      toast("Exercise deleted");
      fetch();
    } catch { toast("Delete failed", "error"); }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.4rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#F0F2F5" }}>
          Exercises <span style={{ color: "#FF5C1A" }}>({total})</span>
        </h2>
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setOffset(0); }} placeholder="Search…"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.875rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none", width: 180 }} />
          <select value={muscle} onChange={e => { setMuscle(e.target.value); setOffset(0); }}
            style={{ background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none" }}>
            {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m || "All Muscles"}</option>)}
          </select>
          <select value={equip} onChange={e => { setEquip(e.target.value); setOffset(0); }}
            style={{ background: "#1A1E28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#F0F2F5", fontSize: "0.8rem", outline: "none" }}>
            {EQUIPMENTS.map(e => <option key={e} value={e}>{e || "All Equipment"}</option>)}
          </select>
          <Btn onClick={() => setModal("add")}>+ Add</Btn>
        </div>
      </div>

      <div style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Name", "Muscle Group", "Equipment", "Difficulty", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} style={{ padding: "0.875rem 1rem" }}>
                      <div style={{ height: 16, borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: "shimmer 1.5s infinite" }} />
                    </td></tr>
                  ))
                : items.map(ex => (
                    <tr key={ex.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#F0F2F5", fontWeight: 600 }}>{ex.name}</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "#9AA3B4" }}>{ex.muscle_group ?? "—"}</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "#9AA3B4" }}>{ex.equipment ?? "—"}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ padding: "0.2rem 0.55rem", borderRadius: 6, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: DIFF_COLOR[ex.difficulty] ?? "#9AA3B4", background: `${DIFF_COLOR[ex.difficulty]}1a` }}>
                          {ex.difficulty}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button onClick={() => setModal(ex)} style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: "1px solid rgba(255,92,26,0.3)", background: "transparent", color: "#FF5C1A", cursor: "pointer", fontSize: "0.68rem", fontWeight: 700 }}>Edit</button>
                          <button onClick={() => handleDelete(ex.id)} style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "0.68rem", fontWeight: 700 }}>Del</button>
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
            <span style={{ fontSize: "0.72rem", color: "#525D72" }}>Page {page + 1} of {pages} · {total} exercises</span>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <Btn onClick={() => setOffset(o => Math.max(0, o - LIMIT))} disabled={page === 0} color="gray">← Prev</Btn>
              <Btn onClick={() => setOffset(o => o + LIMIT)} disabled={page >= pages - 1} color="gray">Next →</Btn>
            </div>
          </div>
        )}
      </div>

      {modal !== null && (
        <ExModal exercise={modal === "add" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}