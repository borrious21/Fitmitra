// src/pages/LogMeal/LogMeal.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../../context/AuthContext";
import { getMyProfile } from "../../../../services/profileService";
import { apiFetch } from "../../../../services/apiClient";
import styles from "./LogMeal.module.css";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_EMOJI = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };

const QUICK_MEALS = {
  veg: [
    { name: "Oats with banana & nuts",   calories: 380, protein_g: 12, carbs_g: 58, fats_g: 10 },
    { name: "Dal rice + sabzi",          calories: 520, protein_g: 18, carbs_g: 82, fats_g:  9 },
    { name: "Paneer paratha with curd",  calories: 420, protein_g: 18, carbs_g: 52, fats_g: 14 },
    { name: "Idli sambar (3 pcs)",       calories: 280, protein_g:  9, carbs_g: 52, fats_g:  4 },
    { name: "Moong dal chilla",          calories: 300, protein_g: 14, carbs_g: 42, fats_g:  6 },
    { name: "Rajma chawal",              calories: 560, protein_g: 22, carbs_g: 90, fats_g:  8 },
    { name: "Palak paneer + roti (2)",   calories: 480, protein_g: 24, carbs_g: 56, fats_g: 16 },
    { name: "Mixed nuts (30g)",          calories: 180, protein_g:  5, carbs_g:  8, fats_g: 14 },
  ],
  non_veg: [
    { name: "Boiled eggs (3) + bread",   calories: 340, protein_g: 24, carbs_g: 32, fats_g: 12 },
    { name: "Chicken curry + rice",      calories: 580, protein_g: 42, carbs_g: 64, fats_g: 14 },
    { name: "Grilled chicken + salad",   calories: 360, protein_g: 48, carbs_g: 12, fats_g:  8 },
    { name: "Fish curry + brown rice",   calories: 500, protein_g: 38, carbs_g: 58, fats_g: 12 },
    { name: "Egg bhurji + paratha",      calories: 420, protein_g: 22, carbs_g: 48, fats_g: 16 },
    { name: "Chicken tikka (100g)",      calories: 180, protein_g: 28, carbs_g:  4, fats_g:  6 },
  ],
};

const EMPTY = {
  meal_type: "breakfast", meal_name: "", calories_consumed: "",
  protein_g: "", carbs_g: "", fats_g: "", notes: "",
};

// ── Mirrors Dashboard's NavAvatar exactly ────────────────────────────────────
function NavAvatar({ avatarUrl, initials }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [avatarUrl]);
  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className={styles.navAvatarImg}
        onError={() => setImgError(true)}
      />
    );
  }
  return <div className={styles.navAvatar}>{initials}</div>;
}

export default function LogMeal() {
  const navigate        = useNavigate();
  const { user }        = useContext(AuthContext);
  const [form,    setForm]      = useState(EMPTY);
  const [saving,  setSaving]    = useState(false);
  const [alert,   setAlert]     = useState(null);
  const [errors,  setErrors]    = useState({});
  const [search,  setSearch]    = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);

  const displayName = user?.name ?? "User";
  const initials    = displayName.split(" ").map(n => n[0] ?? "").join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const raw  = await getMyProfile();
        const data = raw?.data ?? raw;
        // Same multi-field resolution as Dashboard
        const resolved =
          data?.avatar_url       ??
          data?.data?.avatar_url ??
          data?.url              ??
          data?.data?.url        ??
          null;
        if (resolved) setAvatarUrl(resolved);
      } catch {}
    };
    fetchProfile();
  }, []);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  };

  const fillFromQuick = (meal) => {
    setForm(f => ({
      ...f,
      meal_name:         meal.name,
      calories_consumed: String(meal.calories),
      protein_g:         String(meal.protein_g),
      carbs_g:           String(meal.carbs_g),
      fats_g:            String(meal.fats_g),
    }));
    setSearch("");
  };

  const validate = () => {
    const e = {};
    if (!form.meal_name.trim()) e.meal_name = "Meal name required";
    if (!form.calories_consumed || isNaN(Number(form.calories_consumed)) || Number(form.calories_consumed) < 0)
      e.calories_consumed = "Valid calories required";
    if (form.protein_g && isNaN(Number(form.protein_g))) e.protein_g = "Must be a number";
    if (form.carbs_g   && isNaN(Number(form.carbs_g)))   e.carbs_g   = "Must be a number";
    if (form.fats_g    && isNaN(Number(form.fats_g)))    e.fats_g    = "Must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await apiFetch("/meals/log", {
        method: "POST",
        body: JSON.stringify({
          mealType: form.meal_type,
          mealName: form.meal_name.trim(),
          calories: Number(form.calories_consumed),
          protein:  Number(form.protein_g || 0),
          carbs:    Number(form.carbs_g   || 0),
          fats:     Number(form.fats_g    || 0),
          notes:    form.notes,
          source:   "custom",
          log_date: new Date().toISOString().split("T")[0],
        }),
      });
      showAlert("success", `${form.meal_name} logged! 🍽️`);
      setForm(EMPTY);
    } catch (err) {
      showAlert("error", err?.message ?? "Failed to log meal.");
    } finally {
      setSaving(false);
    }
  };

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  const allMeals = [...QUICK_MEALS.veg, ...QUICK_MEALS.non_veg];
  const filtered = search.trim()
    ? allMeals.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className={styles.wrapper}>
      <nav className={styles.nav}>
        <a className={styles.navLogo} href="/dashboard">
          <span className={styles.navLogoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </span>
          <span className={styles.navLogoWord}>FIT<span>MITRA</span></span>
        </a>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Dashboard</button>
        <a href="/profile" className={styles.navAvatarLink} title="Edit profile">
          <NavAvatar avatarUrl={avatarUrl} initials={initials} />
        </a>
      </nav>

      <main className={styles.main}>
        {alert && (
          <div className={alert.type === "success" ? styles.alertSuccess : styles.alertError}>
            {alert.type === "success" ? "✅" : "❌"} {alert.msg}
          </div>
        )}

        <div className={styles.header}>
          <h1 className={styles.title}>🍽️ Log a Meal</h1>
          <p className={styles.sub}>Track what you eat to hit your nutrition goals</p>
        </div>

        {/* MEAL TYPE TABS */}
        <div className={styles.mealTabs}>
          {MEAL_TYPES.map(t => (
            <button
              key={t}
              className={`${styles.mealTab} ${form.meal_type === t ? styles.mealTabActive : ""}`}
              onClick={() => set("meal_type", t)}
              type="button"
            >
              {MEAL_EMOJI[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* QUICK SEARCH */}
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search common meals to autofill…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {filtered.length > 0 && (
          <div className={styles.suggestions}>
            {filtered.map(m => (
              <button key={m.name} className={styles.suggestion} onClick={() => fillFromQuick(m)} type="button">
                <span className={styles.suggName}>{m.name}</span>
                <span className={styles.suggMeta}>{m.calories} kcal · P{m.protein_g}g · C{m.carbs_g}g · F{m.fats_g}g</span>
              </button>
            ))}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Meal Name <span className={styles.req}>*</span></label>
            <input
              className={`${styles.input} ${errors.meal_name ? styles.inputErr : ""}`}
              value={form.meal_name}
              onChange={e => set("meal_name", e.target.value)}
              placeholder="e.g. Dal rice + sabzi"
            />
            {errors.meal_name && <span className={styles.errMsg}>{errors.meal_name}</span>}
          </div>

          <div className={styles.macroGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Calories <span className={styles.req}>*</span></label>
              <input
                type="number" min="0"
                className={`${styles.input} ${errors.calories_consumed ? styles.inputErr : ""}`}
                value={form.calories_consumed}
                onChange={e => set("calories_consumed", e.target.value)}
                placeholder="kcal"
              />
              {errors.calories_consumed && <span className={styles.errMsg}>{errors.calories_consumed}</span>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Protein (g)</label>
              <input type="number" min="0" step="0.1"
                className={`${styles.input} ${errors.protein_g ? styles.inputErr : ""}`}
                value={form.protein_g} onChange={e => set("protein_g", e.target.value)} placeholder="0"/>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Carbs (g)</label>
              <input type="number" min="0" step="0.1"
                className={`${styles.input} ${errors.carbs_g ? styles.inputErr : ""}`}
                value={form.carbs_g} onChange={e => set("carbs_g", e.target.value)} placeholder="0"/>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Fats (g)</label>
              <input type="number" min="0" step="0.1"
                className={`${styles.input} ${errors.fats_g ? styles.inputErr : ""}`}
                value={form.fats_g} onChange={e => set("fats_g", e.target.value)} placeholder="0"/>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Notes (optional)</label>
            <input className={styles.input} value={form.notes}
              onChange={e => set("notes", e.target.value)} placeholder="e.g. Home cooked, no oil"/>
          </div>

          {form.calories_consumed && (
            <div className={styles.macroPreview}>
              <div className={styles.macroPreviewItem} style={{ color: "#FF5C1A" }}>
                <span className={styles.macroPreviewVal}>{form.calories_consumed || 0}</span>
                <span className={styles.macroPreviewKey}>kcal</span>
              </div>
              <div className={styles.macroPreviewItem} style={{ color: "#FF5C1A" }}>
                <span className={styles.macroPreviewVal}>{form.protein_g || 0}g</span>
                <span className={styles.macroPreviewKey}>protein</span>
              </div>
              <div className={styles.macroPreviewItem} style={{ color: "#00C8E0" }}>
                <span className={styles.macroPreviewVal}>{form.carbs_g || 0}g</span>
                <span className={styles.macroPreviewKey}>carbs</span>
              </div>
              <div className={styles.macroPreviewItem} style={{ color: "#B8F000" }}>
                <span className={styles.macroPreviewVal}>{form.fats_g || 0}g</span>
                <span className={styles.macroPreviewKey}>fats</span>
              </div>
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? "Logging…" : "✓ Log Meal"}
          </button>
        </form>
      </main>
    </div>
  );
}