// src/pages/protected/Admin/AdminMeals/AdminMeals.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../../../../../services/apiClient";
import styles from "./AdminMeals.module.css";

// Constants 
const LIMIT = 20;

const DIET_META = {
  veg:        { label: "Vegetarian",    icon: "🌿", cls: "dietVeg"  },
  non_veg:    { label: "Non-Veg",       icon: "🍗", cls: "dietMeat" },
  eggetarian: { label: "Eggetarian",    icon: "🥚", cls: "dietEgg"  },
};

// Nepali food tags — special category
const NEPALI_TAGS = [
  "nepali", "dal-bhat", "roti", "tarkari", "momo", "chiura",
  "dhido", "gundruk", "sel-roti", "chhurpi", "kwati",
];

const MACRO_CATEGORIES = [
  { key: "protein",  label: "High Protein", icon: "💪", tag: "high_protein", color: "#ef4444" },
  { key: "carbs",    label: "High Carbs",   icon: "🌾", tag: "high_carb",    color: "#3b82f6" },
  { key: "fat",      label: "High Fat",     icon: "🫒", tag: "high_fat",     color: "#f59e0b" },
  { key: "nepali",   label: "Nepali Food",  icon: "🇳🇵", tag: "nepali",      color: "#10b981" },
  { key: "low_carb", label: "Low Carb",     icon: "🥗", tag: "low_carb",     color: "#8b5cf6" },
  { key: "balanced", label: "Balanced",     icon: "⚖️", tag: "balanced",     color: "#64748b" },
];

const EMPTY_FORM = {
  name: "", calories: "", diet_type: "veg", cuisine: "",
  macros: { protein_g: "", carbs_g: "", fats_g: "", fiber_g: "" },
  tags: [],
  customTag: "",
};

// Small helpers 
function DietChip({ type }) {
  const m = DIET_META[type] ?? { label: type, icon: "🍽️", cls: "dietVeg" };
  return <span className={`${styles.chip} ${styles[m.cls]}`}>{m.icon} {m.label}</span>;
}

function TagChip({ tag }) {
  const isNepali = NEPALI_TAGS.some(t => tag.toLowerCase().includes(t));
  return (
    <span className={`${styles.tag} ${isNepali ? styles.tagNepali : ""}`}>
      {isNepali && "🇳🇵 "}{tag}
    </span>
  );
}

function MacroPill({ label, value, color }) {
  if (value == null) return null;
  return <span className={styles.macroPill} style={{ color, borderColor: `${color}33` }}>{label} {value}g</span>;
}

// Confirm dialog 
function Confirm({ meal, onOk, onCancel }) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
        <div className={styles.confirmEmoji}>🗑️</div>
        <div className={styles.confirmTitle}>Delete Meal?</div>
        <div className={styles.confirmMsg}>
          <strong>"{meal.name}"</strong> will be permanently removed from the database.
        </div>
        <div className={styles.confirmRow}>
          <button className={styles.btnCancel} onClick={onCancel}>Cancel</button>
          <button className={styles.btnDanger} onClick={onOk}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// Meal Form modal 
function MealForm({ meal, onClose, onSaved }) {
  const isEdit = !!meal;
  const [form,   setForm]   = useState(() => {
    if (!meal) return EMPTY_FORM;
    const existingTags = Array.isArray(meal.tags) ? meal.tags : (meal.tags ? [meal.tags] : []);
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
      tags:      existingTags,
      customTag: "",
    };
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [alert,  setAlert]  = useState(null);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };
  const setMacro = (k, v) => setForm(f => ({ ...f, macros: { ...f.macros, [k]: v } }));

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const addCustomTag = () => {
    const t = form.customTag.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t], customTag: "" }));
    } else {
      setForm(f => ({ ...f, customTag: "" }));
    }
  };

  const removeTag = (tag) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())                                    e.name     = "Name is required";
    if (form.calories === "" || isNaN(Number(form.calories))) e.calories = "Valid calories required";
    if (Number(form.calories) < 0)                            e.calories = "Must be ≥ 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const macros = {};
      for (const [k, v] of Object.entries(form.macros)) {
        if (v !== "") macros[k] = Number(v);
      }
      const payload = {
        name:      form.name.trim(),
        calories:  Number(form.calories),
        diet_type: form.diet_type,
        cuisine:   form.cuisine.trim() || null,
        macros,
        tags:      form.tags.length ? form.tags : null,
      };
      if (isEdit) {
        await apiFetch(`/admin/meals/${meal.id}`, { method: "PUT",  body: JSON.stringify(payload) });
      } else {
        await apiFetch("/admin/meals",             { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved(`Meal ${isEdit ? "updated" : "created"} successfully`);
      onClose();
    } catch (e) {
      setAlert(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{isEdit ? "✏️ Edit Meal" : "➕ New Meal"}</h3>
            <p className={styles.modalSub}>{isEdit ? `ID: ${meal.id}` : "Add a new food item to the database"}</p>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {alert && <div className={styles.formAlert}>{alert}</div>}

          {/* Name + Calories */}
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Meal Name *</label>
              <input className={`${styles.formInput} ${errors.name ? styles.inputErr : ""}`}
                value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="e.g. Dal Bhat, Momo, Paneer Tikka" />
              {errors.name && <span className={styles.fieldErr}>{errors.name}</span>}
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Calories *</label>
              <input className={`${styles.formInput} ${errors.calories ? styles.inputErr : ""}`}
                type="number" min="0" value={form.calories}
                onChange={e => set("calories", e.target.value)} placeholder="e.g. 350" />
              {errors.calories && <span className={styles.fieldErr}>{errors.calories}</span>}
            </div>
          </div>

          {/* Diet + Cuisine */}
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Diet Type</label>
              <select className={styles.formSelect} value={form.diet_type}
                onChange={e => set("diet_type", e.target.value)}>
                <option value="veg">🌿 Vegetarian</option>
                <option value="non_veg">🍗 Non-Vegetarian</option>
                <option value="eggetarian">🥚 Eggetarian</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Cuisine</label>
              <input className={styles.formInput} value={form.cuisine}
                onChange={e => set("cuisine", e.target.value)}
                placeholder="e.g. Nepali, Indian, Continental" />
            </div>
          </div>

          {/* Macros */}
          <div className={styles.formSection}>
            <label className={styles.formSectionLabel}>📊 Macros (grams) — optional</label>
            <div className={styles.macroGrid}>
              {[
                { k: "protein_g", label: "Protein", color: "#ef4444" },
                { k: "carbs_g",   label: "Carbs",   color: "#3b82f6" },
                { k: "fats_g",    label: "Fats",     color: "#f59e0b" },
                { k: "fiber_g",   label: "Fiber",    color: "#10b981" },
              ].map(({ k, label, color }) => (
                <div key={k} className={styles.macroField}>
                  <label className={styles.macroLabel} style={{ color }}>{label}</label>
                  <input className={styles.macroInput} type="number" min="0" step="0.1"
                    value={form.macros[k]} onChange={e => setMacro(k, e.target.value)}
                    placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          {/* Category tags */}
          <div className={styles.formSection}>
            <label className={styles.formSectionLabel}>🏷️ Categories</label>
            <div className={styles.tagPicker}>
              {MACRO_CATEGORIES.map(({ tag, label, icon, color }) => (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.tagPickerBtn} ${form.tags.includes(tag) ? styles.tagPickerActive : ""}`}
                  style={form.tags.includes(tag) ? { borderColor: color, color, background: `${color}15` } : {}}
                  onClick={() => toggleTag(tag)}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Nepali food tags */}
            <div className={styles.nepaliSection}>
              <span className={styles.nepaliLabel}>🇳🇵 Nepali Foods</span>
              <div className={styles.tagPicker}>
                {NEPALI_TAGS.map(tag => (
                  <button key={tag} type="button"
                    className={`${styles.tagPickerBtn} ${form.tags.includes(tag) ? styles.tagPickerNepali : ""}`}
                    onClick={() => toggleTag(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom tag */}
            <div className={styles.customTagRow}>
              <input className={styles.customTagInput} value={form.customTag}
                onChange={e => setForm(f => ({ ...f, customTag: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addCustomTag()}
                placeholder="Add custom tag…" />
              <button className={styles.customTagBtn} onClick={addCustomTag} type="button">+ Add</button>
            </div>

            {/* Selected tags */}
            {form.tags.length > 0 && (
              <div className={styles.selectedTags}>
                {form.tags.map(tag => (
                  <span key={tag} className={`${styles.selectedTag} ${NEPALI_TAGS.includes(tag) ? styles.selectedTagNepali : ""}`}>
                    {NEPALI_TAGS.includes(tag) && "🇳🇵 "}{tag}
                    <button className={styles.removeTag} onClick={() => removeTag(tag)}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={submit} disabled={saving}>
            {saving
              ? <><span className={styles.spinner} /> Saving…</>
              : isEdit ? "💾 Save Changes" : "➕ Create Meal"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// Meal detail drawer 
function MealDrawer({ meal, onClose, onEdit, onDelete }) {
  if (!meal) return null;
  const macros = meal.macros ?? {};
  const tags   = Array.isArray(meal.tags) ? meal.tags : [];
  const isNepali = tags.some(t => NEPALI_TAGS.some(n => t.toLowerCase().includes(n)));

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <div className={styles.drawerIcon}>
            {DIET_META[meal.diet_type]?.icon ?? "🍽️"}
          </div>
          <div className={styles.drawerMeta}>
            <div className={styles.drawerName}>
              {meal.name}
              {isNepali && <span className={styles.nepaliFlag}>🇳🇵</span>}
            </div>
            <div className={styles.drawerPills}>
              <DietChip type={meal.diet_type} />
              {meal.cuisine && <span className={styles.chipGray}>{meal.cuisine}</span>}
              <span className={styles.chipGray}>ID: {meal.id}</span>
            </div>
          </div>
          <button className={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.drawerScroll}>

          {/* Calorie hero */}
          <div className={styles.calHero}>
            <span className={styles.calNum}>{meal.calories}</span>
            <span className={styles.calUnit}>kcal</span>
            <span className={styles.calLabel}>per serving</span>
          </div>

          {/* Macros */}
          {(macros.protein_g != null || macros.carbs_g != null || macros.fats_g != null || macros.fiber_g != null) && (
            <div className={styles.drawerSection}>
              <div className={styles.drawerSectionTitle}>📊 Macros</div>
              <div className={styles.macroBarGrid}>
                {[
                  { label: "Protein", val: macros.protein_g, color: "#ef4444", icon: "💪" },
                  { label: "Carbs",   val: macros.carbs_g,   color: "#3b82f6", icon: "🌾" },
                  { label: "Fats",    val: macros.fats_g,    color: "#f59e0b", icon: "🫒" },
                  { label: "Fiber",   val: macros.fiber_g,   color: "#10b981", icon: "🌿" },
                ].filter(m => m.val != null).map(({ label, val, color, icon }) => (
                  <div key={label} className={styles.macroBarItem}>
                    <div className={styles.macroBarTop}>
                      <span>{icon} {label}</span>
                      <span style={{ color, fontWeight: 700 }}>{val}g</span>
                    </div>
                    <div className={styles.macroBarTrack}>
                      <div className={styles.macroBarFill}
                        style={{ width: `${Math.min(100, (val / 100) * 100)}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className={styles.drawerSection}>
              <div className={styles.drawerSectionTitle}>🏷️ Tags & Categories</div>
              <div className={styles.tagRow}>
                {tags.map(tag => <TagChip key={tag} tag={tag} />)}
              </div>
            </div>
          )}

          {/* Category highlight */}
          <div className={styles.drawerSection}>
            <div className={styles.drawerSectionTitle}>📂 Categories</div>
            <div className={styles.categoryGrid}>
              {MACRO_CATEGORIES.filter(c => tags.includes(c.tag)).map(c => (
                <div key={c.key} className={styles.categoryChip} style={{ borderColor: `${c.color}33`, color: c.color }}>
                  {c.icon} {c.label}
                </div>
              ))}
              {isNepali && (
                <div className={styles.categoryChip} style={{ borderColor: "#10b98133", color: "#10b981" }}>
                  🇳🇵 Nepali Food
                </div>
              )}
              {MACRO_CATEGORIES.filter(c => tags.includes(c.tag)).length === 0 && !isNepali && (
                <span className={styles.noCategory}>No categories assigned</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.drawerActions}>
          <button className={styles.btnEdit}   onClick={onEdit}>✏️ Edit</button>
          <button className={styles.btnDelete} onClick={onDelete}>🗑 Delete</button>
        </div>
      </aside>
    </>
  );
}

// Main page 
export default function AdminMeals() {
  const [meals,      setMeals]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [dietFilter, setDietFilter] = useState("");
  const [tagFilter,  setTagFilter]  = useState("");
  const [offset,     setOffset]     = useState(0);
  const [drawer,     setDrawer]     = useState(null);
  const [formMeal,   setFormMeal]   = useState(undefined); 
  const [deleting,   setDeleting]   = useState(null);
  const [alert,      setAlert]      = useState(null);

  const timer = useRef(null);

  const flash = (msg, type = "success") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p   = new URLSearchParams({ limit: LIMIT, offset, search, diet_type: dietFilter });
      if (tagFilter) p.set("tag", tagFilter);
      const res = await apiFetch(`/admin/meals?${p}`);
      const d   = res?.data ?? res;
      setMeals(d?.meals ?? d?.data ?? []);
      setTotal(d?.total ?? d?.pagination?.total ?? 0);
    } catch (e) {
      flash(e?.message ?? "Failed to load meals", "error");
    } finally {
      setLoading(false);
    }
  }, [offset, search, dietFilter, tagFilter]);

  useEffect(() => { load(); }, [load]);

  const onSearch = v => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOffset(0), 380);
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await apiFetch(`/admin/meals/${deleting.id}`, { method: "DELETE" });
      flash("Meal deleted successfully");
      setDeleting(null);
      setDrawer(null);
      load();
    } catch (e) {
      flash(e?.message ?? "Delete failed", "error");
    }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT) + 1;

  return (
    <div className={styles.page}>

      {alert && (
        <div className={alert.type === "success" ? styles.alertOk : styles.alertErr}>
          {alert.msg}
        </div>
      )}

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>🍽️ Food Database</h1>
          <p className={styles.pageSub}>{total.toLocaleString()} meals · Create, edit and categorize food</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setFormMeal(null)}>
          ➕ New Meal
        </button>
      </div>

      {/* Category quick-filter */}
      <div className={styles.catFilters}>
        <button
          className={`${styles.catBtn} ${tagFilter === "" ? styles.catBtnActive : ""}`}
          onClick={() => { setTagFilter(""); setOffset(0); }}
        >All</button>
        {MACRO_CATEGORIES.map(c => (
          <button
            key={c.key}
            className={`${styles.catBtn} ${tagFilter === c.tag ? styles.catBtnActive : ""}`}
            style={tagFilter === c.tag ? { borderColor: c.color, color: c.color, background: `${c.color}15` } : {}}
            onClick={() => { setTagFilter(tagFilter === c.tag ? "" : c.tag); setOffset(0); }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Search + Diet filter */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIco} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className={styles.searchIn} placeholder="Search meals…" value={search}
            onChange={e => onSearch(e.target.value)} />
          {search && <button className={styles.clearBtn} onClick={() => onSearch("")}>✕</button>}
        </div>
        <select className={styles.filterSelect} value={dietFilter}
          onChange={e => { setDietFilter(e.target.value); setOffset(0); }}>
          <option value="">All diets</option>
          <option value="veg">🌿 Vegetarian</option>
          <option value="non_veg">🍗 Non-Veg</option>
          <option value="eggetarian">🥚 Eggetarian</option>
        </select>
        <button className={styles.refreshBtn} onClick={load} title="Refresh">↺</button>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              {["Meal", "Diet", "Cuisine", "Calories", "Macros", "Tags", "Actions"].map(h => (
                <th key={h} className={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className={styles.skRow}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className={styles.td}>
                      <div className={styles.sk} style={{ width: j === 0 ? 160 : 70 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : meals.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  <div className={styles.emptyIcon}>🍽️</div>
                  <div className={styles.emptyTitle}>No meals found</div>
                  <div className={styles.emptySub}>{search || dietFilter || tagFilter ? "Try adjusting filters" : "Add your first meal"}</div>
                  {!search && !dietFilter && !tagFilter && (
                    <button className={styles.btnPrimary} onClick={() => setFormMeal(null)} style={{ marginTop: 12 }}>
                      ➕ Add First Meal
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              meals.map(m => {
                const mac  = m.macros ?? {};
                const tags = Array.isArray(m.tags) ? m.tags : [];
                const isNepali = tags.some(t => NEPALI_TAGS.some(n => t.toLowerCase().includes(n)));
                return (
                  <tr key={m.id} className={styles.tr} onClick={() => setDrawer(m)}>
                    <td className={styles.td}>
                      <div className={styles.mealCell}>
                        <div className={styles.mealIcon}>
                          {DIET_META[m.diet_type]?.icon ?? "🍽️"}
                          {isNepali && <span className={styles.nepaliDot}>🇳🇵</span>}
                        </div>
                        <div>
                          <div className={styles.mealName}>{m.name}</div>
                          <div className={styles.mealId}>#{m.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}><DietChip type={m.diet_type} /></td>
                    <td className={styles.td}><span className={styles.cuisine}>{m.cuisine ?? "—"}</span></td>
                    <td className={styles.td}>
                      <span className={styles.calNum2}>{m.calories}</span>
                      <span className={styles.calUnitSm}>kcal</span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.macroPills}>
                        <MacroPill label="P" value={mac.protein_g} color="#ef4444" />
                        <MacroPill label="C" value={mac.carbs_g}   color="#3b82f6" />
                        <MacroPill label="F" value={mac.fats_g}    color="#f59e0b" />
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.tagRow}>
                        {tags.slice(0, 2).map(t => <TagChip key={t} tag={t} />)}
                        {tags.length > 2 && <span className={styles.moreTags}>+{tags.length - 2}</span>}
                        {tags.length === 0 && <span className={styles.noTags}>—</span>}
                      </div>
                    </td>
                    <td className={styles.td} onClick={e => e.stopPropagation()}>
                      <div className={styles.rowBtns}>
                        <button className={styles.rEdit}   onClick={() => { setFormMeal(m); setDrawer(null); }}>✏️</button>
                        <button className={styles.rDelete} onClick={() => setDeleting(m)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pgInfo}>Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</span>
          <div className={styles.pgBtns}>
            <button className={styles.pgBtn} disabled={offset === 0} onClick={() => setOffset(0)}>«</button>
            <button className={styles.pgBtn} disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>‹</button>
            <span className={styles.pgCurrent}>{page} / {pages}</span>
            <button className={styles.pgBtn} disabled={offset + LIMIT >= total} onClick={() => setOffset(o => o + LIMIT)}>›</button>
            <button className={styles.pgBtn} disabled={offset + LIMIT >= total} onClick={() => setOffset((pages - 1) * LIMIT)}>»</button>
          </div>
        </div>
      )}

      {/* Drawer */}
      {drawer && formMeal === undefined && (
        <MealDrawer
          meal={drawer}
          onClose={() => setDrawer(null)}
          onEdit={() => { setFormMeal(drawer); setDrawer(null); }}
          onDelete={() => { setDeleting(drawer); setDrawer(null); }}
        />
      )}

      {/* Form modal */}
      {formMeal !== undefined && (
        <MealForm
          meal={formMeal}
          onClose={() => setFormMeal(undefined)}
          onSaved={msg => { flash(msg); load(); }}
        />
      )}

      {/* Delete confirm */}
      {deleting && <Confirm meal={deleting} onOk={doDelete} onCancel={() => setDeleting(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}