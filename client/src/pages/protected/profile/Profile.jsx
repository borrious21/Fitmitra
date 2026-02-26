// src/pages/Profile/Profile.jsx
// v2 — adds:
//   • GamificationPanel (XP bar, streak, stats, badges)
//   • ActivePlanCard (goal, duration, macro targets)
//   • Plan Settings form section (plan_duration, target_kcal)
//   • plan_duration + target_kcal sent to save payload
//   • Level badge in heroCard badges row
//   • Streak shown as 4th hero stat

import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import {
  getMyProfile,
  createProfile,
  updateProfile,
  deleteProfile,
} from "../../../services/profileService";
import { apiFetch } from "../../../services/apiClient";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";
import styles from "./Profile.module.css";

// ─── Format helpers ───────────────────────────────────────────────────────────

function calcBMI(h, w) {
  const height = parseFloat(h) / 100;
  const weight = parseFloat(w);
  if (!height || !weight) return null;
  return (weight / (height * height)).toFixed(1);
}

function bmiLabel(bmi) {
  if (bmi < 18.5) return { label: "Underweight", color: "#00C8E0" };
  if (bmi < 25)   return { label: "Normal",       color: "#B8F000" };
  if (bmi < 30)   return { label: "Overweight",   color: "#FF5C1A" };
  return                  { label: "Obese",        color: "#FF4D6D" };
}

const FMT_ACTIVITY = {
  sedentary: "Sedentary", lightly_active: "Lightly Active",
  moderately_active: "Moderately Active", very_active: "Very Active",
};
const FMT_GOAL = {
  weight_loss: "Weight Loss", maintain_fitness: "Maintain Fitness",
  muscle_gain: "Muscle Gain", endurance: "Endurance", wellness: "Wellness",
};
const FMT_DIET = { veg: "Vegetarian", non_veg: "Non-Vegetarian", eggetarian: "Eggetarian" };
const FMT_COND = {
  high_bp: "High BP", diabetes: "Diabetes", pcod: "PCOD/PCOS",
  thyroid: "Thyroid", injuries: "Injuries",
};

const LEVEL_LABELS = {
  1:"🌱 Rookie", 2:"🏃 Mover", 3:"💪 Grinder", 4:"🔥 Crusher",
  5:"⚡ Athlete", 6:"🥈 Contender", 7:"🥇 Champion", 8:"🏆 Elite",
  9:"💎 Legend", 10:"🚀 GOAT",
};

// ─── Condition map helpers ────────────────────────────────────────────────────

function mapConditionsFromApi(mc = {}) {
  const result = [];
  if (mc.high_blood_pressure) result.push("high_bp");
  if (mc.diabetes)            result.push("diabetes");
  if (mc.pcod)                result.push("pcod");
  if (mc.thyroid)             result.push("thyroid");
  if (mc.injuries)            result.push("injuries");
  return result.length > 0 ? result : ["none"];
}

function mapConditionsToApi(arr = []) {
  const isNone = arr.includes("none");
  return {
    high_blood_pressure: !isNone && arr.includes("high_bp"),
    diabetes:            !isNone && arr.includes("diabetes"),
    pcod:                !isNone && arr.includes("pcod"),
    thyroid:             !isNone && arr.includes("thyroid"),
    injuries:            !isNone && arr.includes("injuries"),
  };
}

function apiToForm(d) {
  return {
    age:                d.age            ? String(d.age)       : "",
    gender:             d.gender         ?? "",
    height_cm:          d.height_cm      ? String(d.height_cm) : "",
    weight_kg:          d.weight_kg      ? String(d.weight_kg) : "",
    activity_level:     d.activity_level ?? "",
    goal:               d.goal           ?? "",
    diet_type:          d.diet_type      ?? "",
    medical_conditions: mapConditionsFromApi(d.medical_conditions),
    // v2 plan customisation fields
    plan_duration:      d.plan_duration  ? String(d.plan_duration) : "4",
    target_kcal:        d.target_kcal    ? String(d.target_kcal)   : "",
  };
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ children, delay = 0 }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setVis(true); },
        { threshold: 0.06 }
      );
      if (ref.current) obs.observe(ref.current);
      return () => obs.disconnect();
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div ref={ref} className={`${styles.section}${vis ? " " + styles.vis : ""}`}>
      {children}
    </div>
  );
}

// ─── v2: XP Bar ───────────────────────────────────────────────────────────────

function XPBar({ xp = 0, level = {}, streak = {} }) {
  const p     = level.progress_pct ?? 0;
  const label = LEVEL_LABELS[level.current] ?? `Level ${level.current ?? 1}`;
  return (
    <div className={styles.xpBar}>
      <div className={styles.xpBarTop}>
        <span className={styles.xpLevelLabel}>{label}</span>
        <span className={styles.xpPoints}>{(xp ?? 0).toLocaleString()} XP</span>
      </div>
      <div className={styles.xpTrack}>
        <div className={styles.xpFill} style={{ width: `${p}%` }} />
      </div>
      <div className={styles.xpBarBottom}>
        <span>{p}% to level {(level.current ?? 1) + 1}</span>
        {(level.xp_to_next ?? 0) > 0 && <span>{level.xp_to_next} XP to go</span>}
      </div>
    </div>
  );
}

// ─── v2: Gamification panel ───────────────────────────────────────────────────

function GamificationPanel({ data }) {
  if (!data) return null;
  const { xp, level, streak, stats, badges } = data;
  return (
    <div className={styles.gamPanel}>
      <div className={styles.gamTitle}>🎮 Your Progress</div>
      <XPBar xp={xp} level={level} streak={streak} />
      <div className={styles.gamStatsGrid}>
        {[
          { icon: "🏋️", label: "Workouts",  val: stats?.total_completed   ?? 0 },
          { icon: "🔥", label: "Streak",    val: `${streak?.current ?? 0}d` },
          { icon: "🏅", label: "PRs",       val: stats?.total_pbs         ?? 0 },
          { icon: "🔄", label: "Deloads",   val: stats?.deloads_completed ?? 0 },
        ].map(s => (
          <div key={s.label} className={styles.gamStatItem}>
            <span className={styles.gamStatIcon}>{s.icon}</span>
            <span className={styles.gamStatVal}>{s.val}</span>
            <span className={styles.gamStatLabel}>{s.label}</span>
          </div>
        ))}
      </div>
      {badges?.length > 0 && (
        <div className={styles.gamBadges}>
          <div className={styles.gamBadgesTitle}>🏆 Badges Earned</div>
          <div className={styles.gamBadgesList}>
            {badges.map(b => (
              <span key={b.id} className={styles.gamBadge}>{b.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── v2: Active Plan card ─────────────────────────────────────────────────────

function ActivePlanCard({ plan, onNavigate }) {
  if (!plan) return null;
  const macros        = plan.plan_data?.summary?.macro_targets;
  const totalWorkouts = plan.plan_data?.summary?.total_workouts;
  return (
    <div className={styles.activePlanCard}>
      <div className={styles.activePlanHeader}>
        <span className={styles.activePlanTitle}>📋 Active Plan</span>
        <button className={styles.activePlanBtn} onClick={onNavigate} type="button">View →</button>
      </div>
      <div className={styles.activePlanMeta}>
        <span>{FMT_GOAL[plan.goals] ?? plan.goals ?? "—"}</span>
        <span>·</span>
        <span>{plan.duration_weeks ?? 4} weeks</span>
        {totalWorkouts && <><span>·</span><span>{totalWorkouts} sessions</span></>}
      </div>
      {macros && (
        <div className={styles.activePlanMacros}>
          {[
            { label: "kcal",    val: macros.dailyKcal,              color: "#f59e0b" },
            { label: "protein", val: `${macros.proteinTarget}g`,    color: "#ef4444" },
            { label: "carbs",   val: `${macros.carbsTarget}g`,      color: "#3b82f6" },
            { label: "fat",     val: `${macros.fatTarget}g`,        color: "#10b981" },
          ].filter(m => m.val).map(m => (
            <div key={m.label} className={styles.activePlanMacroChip}
              style={{ color: m.color, borderColor: `${m.color}33` }}>
              <span className={styles.activePlanMacroVal}>{m.val}</span>
              <span className={styles.activePlanMacroLabel}>{m.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  age: "", gender: "", height_cm: "", weight_kg: "",
  activity_level: "", goal: "", diet_type: "",
  medical_conditions: ["none"],
  plan_duration: "4", target_kcal: "",
};

// ═════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function Profile() {
  const navigate        = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [profile,         setProfile]         = useState(EMPTY_FORM);
  const [original,        setOriginal]        = useState(EMPTY_FORM);
  const [editMode,        setEditMode]        = useState(false);
  const [isNew,           setIsNew]           = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [errors,          setErrors]          = useState({});
  const [alert,           setAlert]           = useState(null);
  const [avatarUrl,       setAvatarUrl]       = useState(null);
  const [savedAvatarUrl,  setSavedAvatarUrl]  = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [notifs,          setNotifs]          = useState(true);
  const [reminders,       setReminders]       = useState(false);
  // v2
  const [gamification,    setGamification]    = useState(null);
  const [activePlan,      setActivePlan]      = useState(null);

  const fileInputRef = useRef();

  useEffect(() => {
    loadProfile();
    // Gamification and active plan are non-blocking — load in parallel
    apiFetch("/plans/gamification")
      .then(r => setGamification(r?.data ?? r ?? null))
      .catch(() => {});
    apiFetch("/plans/active")
      .then(r => setActivePlan(r?.data ?? r ?? null))
      .catch(() => {});
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res  = await getMyProfile();
      const data = res?.data ?? res;
      const form = apiToForm(data);
      setProfile(form);
      setOriginal(form);
      setAvatarUrl(data.avatar_url ?? null);
      setSavedAvatarUrl(data.avatar_url ?? null);
      setIsNew(false);
    } catch (err) {
      if (err?.status === 404 || err?.code === "PROFILE_NOT_FOUND") {
        setIsNew(true); setEditMode(true);
      } else if (err?.status === 401) {
        logout?.(); navigate("/login");
      } else {
        showAlert("error", err?.message ?? "Could not load profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Avatar upload ─────────────────────────────────────────────────────────

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setAvatarUrl(localPreview);
    setAvatarUploading(true);
    try {
      const fd    = new FormData();
      fd.append("avatar", file);
      const token = localStorage.getItem("token");
      const res   = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message ?? `Upload failed (${res.status})`);
      }
      const json = await res.json();
      const uploadedUrl = json?.data?.avatar_url;
      URL.revokeObjectURL(localPreview);
      setAvatarUrl(uploadedUrl);
      setSavedAvatarUrl(uploadedUrl);
      showAlert("success", "Profile photo updated!");
    } catch (err) {
      showAlert("error", err?.message ?? "Photo upload failed. Please try again.");
      setAvatarUrl(savedAvatarUrl);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Field helpers ─────────────────────────────────────────────────────────

  const setField = (field, value) => {
    setProfile(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  };

  const toggleCondition = (cond) => {
    setProfile(p => {
      let next;
      if (cond === "none") {
        next = ["none"];
      } else {
        const cur = p.medical_conditions.filter(c => c !== "none");
        next = cur.includes(cond) ? cur.filter(c => c !== cond) : [...cur, cond];
        if (next.length === 0) next = ["none"];
      }
      return { ...p, medical_conditions: next };
    });
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = () => {
    const e = {};
    const age = parseInt(profile.age, 10);
    if (!profile.age || isNaN(age) || age < 13 || age > 80)
      e.age = "Age must be 13–80";
    const h = parseInt(profile.height_cm, 10);
    if (!profile.height_cm || isNaN(h) || h < 100 || h > 250)
      e.height_cm = "Height must be 100–250 cm";
    const w = parseFloat(profile.weight_kg);
    if (!profile.weight_kg || isNaN(w) || w < 30 || w > 250)
      e.weight_kg = "Weight must be 30–250 kg";
    if (!profile.gender)         e.gender         = "Required";
    if (!profile.activity_level) e.activity_level = "Required";
    if (!profile.goal)           e.goal           = "Required";
    if (!profile.diet_type)      e.diet_type      = "Required";
    const dur = parseInt(profile.plan_duration, 10);
    if (profile.plan_duration && (isNaN(dur) || dur < 1 || dur > 52))
      e.plan_duration = "Duration must be 1–52 weeks";
    const kcal = parseInt(profile.target_kcal, 10);
    if (profile.target_kcal && (isNaN(kcal) || kcal < 1000 || kcal > 6000))
      e.target_kcal = "Target kcal must be 1000–6000";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) { showAlert("error", "Please fix the highlighted fields."); return; }
    setSaving(true);
    const payload = {
      age:                Number(profile.age),
      gender:             profile.gender,
      height_cm:          Number(profile.height_cm),
      weight_kg:          Number(profile.weight_kg),
      activity_level:     profile.activity_level,
      goal:               profile.goal,
      diet_type:          profile.diet_type,
      medical_conditions: mapConditionsToApi(profile.medical_conditions),
      // v2: plan personalisation fields
      plan_duration: Number(profile.plan_duration) || 4,
      target_kcal:   profile.target_kcal ? Number(profile.target_kcal) : null,
    };
    try {
      if (isNew) { await createProfile(payload); }
      else       { await updateProfile(payload); }
      setOriginal({ ...profile });
      setIsNew(false); setEditMode(false);
      showAlert("success", isNew ? "Profile created successfully!" : "Profile saved!");
    } catch (err) {
      showAlert("error", err?.message ?? "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────

  const handleCancel = () => {
    const changed = JSON.stringify(profile) !== JSON.stringify(original);
    if (changed && !window.confirm("Discard unsaved changes?")) return;
    setProfile({ ...original }); setErrors({}); setEditMode(false);
  };

  // ── Logout / Delete ───────────────────────────────────────────────────────

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    try { logout?.(); } finally { navigate("/login"); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(
      "This will permanently delete your account and ALL data.\n\nThis cannot be undone. Continue?"
    )) return;
    try { await deleteProfile(); logout?.(); navigate("/"); }
    catch (err) { showAlert("error", err?.message ?? "Delete failed. Please try again."); }
  };

  // ── Alert ─────────────────────────────────────────────────────────────────

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4500);
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const bmi        = calcBMI(profile.height_cm, profile.weight_kg);
  const bmiInfo    = bmi ? bmiLabel(parseFloat(bmi)) : null;
  const hasChanges = JSON.stringify(profile) !== JSON.stringify(original);

  const displayName  = user?.name  ?? "User";
  const displayEmail = user?.email ?? "";
  const initials     = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const conditionLabel = (() => {
    const c = profile.medical_conditions;
    if (!c || c.length === 0 || c.includes("none")) return "None";
    return c.map(x => FMT_COND[x] || x).join(", ");
  })();

  if (loading) return (
    <div className={styles.wrapper}>
      <div className={styles.loadingWrap}>
        <div className={styles.loadRing} />
        <span>Loading profile…</span>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className={styles.wrapper}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
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
        <button className={styles.navBackBtn} onClick={() => navigate(-1)} type="button">
          ← Dashboard
        </button>
      </nav>

      <main className={styles.main}>

        {/* ── Alert ───────────────────────────────────────────────────── */}
        {alert && (
          <div className={alert.type === "success" ? styles.alertSuccess : styles.alertError}>
            <span className={styles.alertIcon}>{alert.type === "success" ? "✅" : "❌"}</span>
            <span>{alert.msg}</span>
          </div>
        )}

        {/* ── HERO AVATAR CARD ─────────────────────────────────────────── */}
        <Section delay={0}>
          <div className={styles.heroCard}>
            <div className={styles.heroBg}>
              <div className={styles.heroBgGlow} />
            </div>
            <div className={styles.heroBody}>
              <div className={styles.avatarWrap}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
                  : <div className={styles.avatarFallback}>{initials}</div>
                }
                {avatarUploading && (
                  <div className={styles.avatarUploading}><div className={styles.spinnerRing} /></div>
                )}
                <button
                  className={styles.avatarEditBtn}
                  onClick={() => fileInputRef.current?.click()}
                  title="Change photo" type="button" disabled={avatarUploading}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
                <input
                  ref={fileInputRef} type="file" accept="image/*"
                  className={styles.avatarUploadInput} onChange={handleAvatarChange}
                />
              </div>

              <h1 className={styles.heroName}>
                <span className={styles.heroNameAccent}>{displayName}</span>
              </h1>
              <p className={styles.heroEmail}>{displayEmail}</p>

              <div className={styles.heroBadges}>
                {profile.goal && (
                  <span className={`${styles.heroBadge} ${styles.badgeLime}`}>
                    <span className={styles.badgeDot} />{FMT_GOAL[profile.goal]}
                  </span>
                )}
                {profile.diet_type && (
                  <span className={`${styles.heroBadge} ${styles.badgeCyan}`}>{FMT_DIET[profile.diet_type]}</span>
                )}
                {profile.activity_level && (
                  <span className={`${styles.heroBadge} ${styles.badgeOrange}`}>{FMT_ACTIVITY[profile.activity_level]}</span>
                )}
                {/* v2: level badge */}
                {gamification?.level?.current && (
                  <span className={`${styles.heroBadge} ${styles.badgePurple}`}>
                    {LEVEL_LABELS[gamification.level.current] ?? `Level ${gamification.level.current}`}
                  </span>
                )}
              </div>

              <div className={styles.heroStats}>
                {[
                  { val: profile.weight_kg ? `${profile.weight_kg}kg` : "—", key: "Weight" },
                  { val: profile.height_cm ? `${profile.height_cm}cm` : "—", key: "Height" },
                  {
                    val: bmi && bmiInfo
                      ? <span style={{ color: bmiInfo.color }}>{bmi}</span>
                      : "—",
                    key: "BMI",
                  },
                  // v2: streak as 4th stat
                  {
                    val: gamification?.streak?.current
                      ? <span style={{ color: "#FF5C1A" }}>{gamification.streak.current}d 🔥</span>
                      : "—",
                    key: "Streak",
                  },
                ].map(s => (
                  <div key={s.key} className={styles.heroStat}>
                    <span className={styles.heroStatVal}>{s.val}</span>
                    <span className={styles.heroStatKey}>{s.key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── v2: GAMIFICATION PANEL ───────────────────────────────────── */}
        {!isNew && gamification && (
          <Section delay={40}>
            <GamificationPanel data={gamification} />
          </Section>
        )}

        {/* ── v2: ACTIVE PLAN SUMMARY ──────────────────────────────────── */}
        {!isNew && !editMode && activePlan && (
          <Section delay={50}>
            <ActivePlanCard plan={activePlan} onNavigate={() => navigate("/plans")} />
          </Section>
        )}

        {/* ── VIEW MODE ────────────────────────────────────────────────── */}
        {!editMode && !isNew && (
          <>
            <Section delay={60}>
              <div className={styles.detailsGrid}>

                <div className={styles.detailCard}>
                  <div className={styles.detailCardHeader}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <h3>Personal</h3>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Age</span>
                    <span className={styles.detailValue}>{profile.age} yrs</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Gender</span>
                    <span className={styles.detailValue} style={{ textTransform: "capitalize" }}>{profile.gender}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>BMI</span>
                    <span className={styles.detailValue}>
                      {bmi && bmiInfo ? (
                        <span style={{ color: bmiInfo.color, background: `${bmiInfo.color}18`, padding: "0.15rem 0.625rem", borderRadius: "9999px" }}>
                          {bmi} · {bmiInfo.label}
                        </span>
                      ) : "—"}
                    </span>
                  </div>
                </div>

                <div className={styles.detailCard}>
                  <div className={styles.detailCardHeader}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <h3>Fitness Goals</h3>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Goal</span>
                    <span className={styles.detailValue}>{FMT_GOAL[profile.goal] || "—"}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Activity</span>
                    <span className={styles.detailValue}>{FMT_ACTIVITY[profile.activity_level] || "—"}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Diet</span>
                    <span className={styles.detailValue}>{FMT_DIET[profile.diet_type] || "—"}</span>
                  </div>
                </div>

                <div className={styles.detailCard}>
                  <div className={styles.detailCardHeader}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    <h3>Body Metrics</h3>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Height</span>
                    <span className={styles.detailValue}>{profile.height_cm} cm</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Weight</span>
                    <span className={styles.detailValue}>{profile.weight_kg} kg</span>
                  </div>
                </div>

                <div className={styles.detailCard}>
                  <div className={styles.detailCardHeader}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <h3>Health</h3>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Conditions</span>
                    <span className={styles.detailValue}>{conditionLabel}</span>
                  </div>
                </div>

                {/* v2: Plan Settings card */}
                <div className={styles.detailCard}>
                  <div className={styles.detailCardHeader}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8"  y1="2" x2="8"  y2="6"/>
                      <line x1="3"  y1="10" x2="21" y2="10"/>
                    </svg>
                    <h3>Plan Settings</h3>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Duration</span>
                    <span className={styles.detailValue}>{profile.plan_duration || 4} weeks</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Target kcal</span>
                    <span className={styles.detailValue}>
                      {profile.target_kcal ? `${profile.target_kcal} kcal/day` : "Auto"}
                    </span>
                  </div>
                </div>

              </div>
            </Section>

            <Section delay={120}>
              <button className={styles.btnPrimary} onClick={() => setEditMode(true)} type="button">
                ✏️ Edit Profile
              </button>
            </Section>
          </>
        )}

        {/* ── EDIT / CREATE FORM ────────────────────────────────────────── */}
        {(editMode || isNew) && (
          <Section delay={0}>
            <form onSubmit={handleSave} className={styles.form}>

              {/* Basic Info */}
              <div className={`${styles.formSection} ${styles.accent}`}>
                <div className={styles.formSectionTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Basic Information
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Age<span className={styles.required}>*</span></label>
                    <input type="number" value={profile.age} placeholder="13 – 80"
                      className={`${styles.input}${errors.age ? " " + styles.inputError : ""}`}
                      onChange={e => setField("age", e.target.value)} />
                    {errors.age && <span className={styles.valError}>{errors.age}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Gender<span className={styles.required}>*</span></label>
                    <select value={profile.gender}
                      className={`${styles.input}${errors.gender ? " " + styles.inputError : ""}`}
                      onChange={e => setField("gender", e.target.value)}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <span className={styles.valError}>{errors.gender}</span>}
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Height (cm)<span className={styles.required}>*</span></label>
                    <input type="number" value={profile.height_cm} placeholder="100 – 250"
                      className={`${styles.input}${errors.height_cm ? " " + styles.inputError : ""}`}
                      onChange={e => setField("height_cm", e.target.value)} />
                    {errors.height_cm && <span className={styles.valError}>{errors.height_cm}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Weight (kg)<span className={styles.required}>*</span></label>
                    <input type="number" step="0.1" value={profile.weight_kg} placeholder="30 – 250"
                      className={`${styles.input}${errors.weight_kg ? " " + styles.inputError : ""}`}
                      onChange={e => setField("weight_kg", e.target.value)} />
                    {errors.weight_kg && <span className={styles.valError}>{errors.weight_kg}</span>}
                  </div>
                </div>
              </div>

              {/* Fitness Goals */}
              <div className={`${styles.formSection} ${styles.accent}`}>
                <div className={styles.formSectionTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                  Fitness Goals
                </div>
                <div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
                  <label className={styles.label}>Activity Level<span className={styles.required}>*</span></label>
                  <select value={profile.activity_level}
                    className={`${styles.input}${errors.activity_level ? " " + styles.inputError : ""}`}
                    onChange={e => setField("activity_level", e.target.value)}>
                    <option value="">Select activity level</option>
                    <option value="sedentary">Sedentary (little or no exercise)</option>
                    <option value="lightly_active">Lightly Active (1–3 days/week)</option>
                    <option value="moderately_active">Moderately Active (3–5 days/week)</option>
                    <option value="very_active">Very Active (6–7 days/week)</option>
                  </select>
                  {errors.activity_level && <span className={styles.valError}>{errors.activity_level}</span>}
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Primary Goal<span className={styles.required}>*</span></label>
                    <select value={profile.goal}
                      className={`${styles.input}${errors.goal ? " " + styles.inputError : ""}`}
                      onChange={e => setField("goal", e.target.value)}>
                      <option value="">Select goal</option>
                      <option value="weight_loss">Weight Loss</option>
                      <option value="maintain_fitness">Maintain Fitness</option>
                      <option value="muscle_gain">Muscle Gain</option>
                      <option value="endurance">Endurance</option>
                      <option value="wellness">Wellness</option>
                    </select>
                    {errors.goal && <span className={styles.valError}>{errors.goal}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Diet Type<span className={styles.required}>*</span></label>
                    <select value={profile.diet_type}
                      className={`${styles.input}${errors.diet_type ? " " + styles.inputError : ""}`}
                      onChange={e => setField("diet_type", e.target.value)}>
                      <option value="">Select diet</option>
                      <option value="veg">Vegetarian</option>
                      <option value="non_veg">Non-Vegetarian</option>
                      <option value="eggetarian">Eggetarian</option>
                    </select>
                    {errors.diet_type && <span className={styles.valError}>{errors.diet_type}</span>}
                  </div>
                </div>
              </div>

              {/* v2: Plan Settings */}
              <div className={`${styles.formSection} ${styles.accent}`}>
                <div className={styles.formSectionTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8"  y1="2" x2="8"  y2="6"/>
                    <line x1="3"  y1="10" x2="21" y2="10"/>
                  </svg>
                  Plan Settings
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Plan Duration (weeks)</label>
                    <input type="number" min="1" max="52" value={profile.plan_duration} placeholder="4"
                      className={`${styles.input}${errors.plan_duration ? " " + styles.inputError : ""}`}
                      onChange={e => setField("plan_duration", e.target.value)} />
                    {errors.plan_duration
                      ? <span className={styles.valError}>{errors.plan_duration}</span>
                      : <span className={styles.inputHint}>How many weeks should the generated plan last? Default: 4</span>
                    }
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Daily Calorie Target (kcal)</label>
                    <input type="number" min="1000" max="6000" value={profile.target_kcal}
                      placeholder="Auto (from body weight)"
                      className={`${styles.input}${errors.target_kcal ? " " + styles.inputError : ""}`}
                      onChange={e => setField("target_kcal", e.target.value)} />
                    {errors.target_kcal
                      ? <span className={styles.valError}>{errors.target_kcal}</span>
                      : <span className={styles.inputHint}>Leave blank to auto-calculate from body weight & goal.</span>
                    }
                  </div>
                </div>
              </div>

              {/* Health Conditions */}
              <div className={`${styles.formSection} ${styles.accent}`}>
                <div className={styles.formSectionTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  Health Conditions
                </div>
                <div className={styles.checkboxGrid}>
                  {[
                    { value: "high_bp",  label: "🩺 High Blood Pressure" },
                    { value: "diabetes", label: "💉 Diabetes"            },
                    { value: "pcod",     label: "🔬 PCOD/PCOS"           },
                    { value: "thyroid",  label: "🧪 Thyroid"             },
                    { value: "injuries", label: "🩹 Injuries"            },
                    { value: "none",     label: "✅ None of the above"   },
                  ].map(c => {
                    const checked = profile.medical_conditions.includes(c.value);
                    return (
                      <label key={c.value}
                        className={`${styles.checkCard}${checked ? " " + styles.checked : ""}`}
                        onClick={() => toggleCondition(c.value)}>
                        <div className={styles.checkBox}><span className={styles.checkTick}>✓</span></div>
                        <span className={styles.checkLabel}>{c.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form actions */}
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary}
                  disabled={(!hasChanges && !isNew) || saving}>
                  {saving
                    ? <><div className={styles.spinIcon} /> Saving…</>
                    : <>{isNew ? "🚀 Create Profile" : "💾 Save Changes"}</>
                  }
                </button>
                {!isNew && (
                  <button type="button" className={styles.btnGhost} onClick={handleCancel}>✕ Cancel</button>
                )}
              </div>

            </form>
          </Section>
        )}

        {/* ── SETTINGS ─────────────────────────────────────────────────── */}
        {!isNew && (
          <Section delay={180}>
            <span className={styles.secLabel}>⚙️ Settings</span>
            <div className={styles.settingsCard}>

              <div className={styles.settingsRow} onClick={() => setNotifs(v => !v)}>
                <div className={styles.settingsIcon} style={{ background: "rgba(0,200,224,0.1)", border: "1px solid rgba(0,200,224,0.2)" }}>🔔</div>
                <div className={styles.settingsText}>
                  <span className={styles.settingsTitle}>Push Notifications</span>
                  <span className={styles.settingsSub}>Workout reminders and progress alerts</span>
                </div>
                <button className={`${styles.toggle}${notifs ? " " + styles.on : ""}`} type="button">
                  <span className={styles.toggleThumb} />
                </button>
              </div>

              <div className={styles.settingsRow} style={{ cursor: "default" }}>
                <div className={styles.settingsIcon} style={{ background: "rgba(184,240,0,0.08)", border: "1px solid rgba(184,240,0,0.2)" }}>🌙</div>
                <div className={styles.settingsText}>
                  <span className={styles.settingsTitle}>Dark Mode</span>
                  <span className={styles.settingsSub}>Toggle light / dark theme</span>
                </div>
                <ThemeToggle />
              </div>

              <div className={styles.settingsRow} onClick={() => setReminders(v => !v)}>
                <div className={styles.settingsIcon} style={{ background: "rgba(255,92,26,0.08)", border: "1px solid rgba(255,92,26,0.2)" }}>⏰</div>
                <div className={styles.settingsText}>
                  <span className={styles.settingsTitle}>Daily Reminders</span>
                  <span className={styles.settingsSub}>Morning check-in prompts</span>
                </div>
                <button className={`${styles.toggle}${reminders ? " " + styles.on : ""}`} type="button">
                  <span className={styles.toggleThumb} />
                </button>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsIcon} style={{ background: "rgba(255,92,26,0.08)", border: "1px solid rgba(255,92,26,0.2)" }}>🔒</div>
                <div className={styles.settingsText}>
                  <span className={styles.settingsTitle}>Privacy & Security</span>
                  <span className={styles.settingsSub}>Manage your data and permissions</span>
                </div>
                <span className={styles.settingsChevron}>→</span>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsIcon} style={{ background: "rgba(184,240,0,0.08)", border: "1px solid rgba(184,240,0,0.2)" }}>🔑</div>
                <div className={styles.settingsText}>
                  <span className={styles.settingsTitle}>Change Password</span>
                  <span className={styles.settingsSub}>Update your login credentials</span>
                </div>
                <span className={styles.settingsChevron}>→</span>
              </div>

              <div className={styles.settingsRow}>
                <div className={styles.settingsIcon} style={{ background: "rgba(0,200,224,0.08)", border: "1px solid rgba(0,200,224,0.2)" }}>ℹ️</div>
                <div className={styles.settingsText}>
                  <span className={styles.settingsTitle}>About FitMitra</span>
                  <span className={styles.settingsSub}>Version 2.0 · Made with 🔥</span>
                </div>
                <span className={styles.settingsChevron}>→</span>
              </div>

            </div>
          </Section>
        )}

        {/* ── LOGOUT ───────────────────────────────────────────────────── */}
        {!isNew && (
          <Section delay={240}>
            <div className={styles.logoutCard}>
              <button className={styles.logoutBtn} onClick={handleLogout} type="button">
                <div className={styles.logoutIcon}>🚪</div>
                <div className={styles.logoutText}>
                  <span className={styles.logoutTitle}>Log Out</span>
                  <span className={styles.logoutSub}>Sign out of your FitMitra account</span>
                </div>
                <span style={{ color: "rgba(255,77,109,0.5)", fontSize: "0.75rem" }}>→</span>
              </button>
            </div>
          </Section>
        )}

        {/* ── DANGER ZONE ──────────────────────────────────────────────── */}
        {!isNew && (
          <Section delay={300}>
            <div className={styles.dangerZone}>
              <div className={styles.dangerTitle}>⚠️ Danger Zone</div>
              <p className={styles.dangerDesc}>
                Deleting your account is permanent and cannot be undone.
                All your fitness data, workout history, and progress will be erased forever.
              </p>
              <button className={styles.btnDanger} onClick={handleDeleteAccount} type="button">
                🗑️ Delete My Account
              </button>
            </div>
          </Section>
        )}

      </main>
    </div>
  );
}