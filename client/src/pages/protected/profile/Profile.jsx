import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { getMyProfile, createProfile, updateProfile, deleteProfile } from "../../../services/profileService";
import { apiFetch } from "../../../services/apiClient";
import Navbar from "../../../components/Navbar/Navbar";
import styles from "./Profile.module.css";
import { 
  ArrowLeft, Camera, User, Target, Dumbbell, Activity, Calendar, 
  Utensils, HeartPulse, ShieldAlert, Award, Flame, Zap, Droplets, 
  Check, X, ActivitySquare, Settings, LogOut
} from "lucide-react";

function calcBMI(h, w) {
  const height = parseFloat(h) / 100;
  const weight = parseFloat(w);
  if (!height || !weight) return null;
  return (weight / (height * height)).toFixed(1);
}

function bmiLabel(bmi) {
  if (bmi < 18.5) return { label: "Underweight", color: "#00C8E0" };
  if (bmi < 25) return { label: "Normal", color: "#CCFF00" };
  if (bmi < 30) return { label: "Overweight", color: "#FF5C1A" };
  return { label: "Obese", color: "#FF4D6D" };
}

const FMT_ACTIVITY = { sedentary: "Sedentary", lightly_active: "Light Active", moderately_active: "Moderate", very_active: "Very Active" };
const FMT_GOAL = { weight_loss: "Weight Loss", maintain_fitness: "Maintain", muscle_gain: "Muscle Gain", endurance: "Endurance", wellness: "Wellness" };
const FMT_DIET = { veg: "Vegetarian", non_veg: "Non-Veg", eggetarian: "Eggetarian" };
const FMT_COND = { high_bp: "High BP", diabetes: "Diabetes", pcod: "PCOD/PCOS", thyroid: "Thyroid", injuries: "Injuries" };
const LEVEL_LABELS = { 1: "🌱 Rookie", 2: "🏃 Mover", 3: "💪 Grinder", 4: "🔥 Crusher", 5: "⚡ Athlete", 6: "🥈 Contender", 7: "🥇 Champion", 8: "🏆 Elite", 9: "💎 Legend", 10: "🚀 GOAT" };

function mapConditionsFromApi(mc = {}) {
  const result = [];
  if (mc.high_blood_pressure) result.push("high_bp");
  if (mc.diabetes) result.push("diabetes");
  if (mc.pcod) result.push("pcod");
  if (mc.thyroid) result.push("thyroid");
  if (mc.injuries) result.push("injuries");
  return result.length > 0 ? result : ["none"];
}

function mapConditionsToApi(arr = []) {
  const isNone = arr.includes("none");
  return {
    high_blood_pressure: !isNone && arr.includes("high_bp"),
    diabetes: !isNone && arr.includes("diabetes"),
    pcod: !isNone && arr.includes("pcod"),
    thyroid: !isNone && arr.includes("thyroid"),
    injuries: !isNone && arr.includes("injuries"),
  };
}

function apiToForm(d) {
  return {
    age: d.age ? String(d.age) : "",
    gender: d.gender ?? "",
    height_cm: d.height_cm ? String(d.height_cm) : "",
    weight_kg: d.weight_kg ? String(d.weight_kg) : "",
    activity_level: d.activity_level ?? "",
    goal: d.goal ?? "",
    diet_type: d.diet_type ?? "",
    medical_conditions: mapConditionsFromApi(d.medical_conditions),
    plan_duration: d.plan_duration ? String(d.plan_duration) : "4",
    target_kcal: d.target_kcal ? String(d.target_kcal) : "",
  };
}

function Section({ children, delay = 0 }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.06 });
      if (ref.current) obs.observe(ref.current);
      return () => obs.disconnect();
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);
  return <div ref={ref} className={`${styles.section}${vis ? " " + styles.vis : ""}`}>{children}</div>;
}

const EMPTY_FORM = {
  age: "", gender: "", height_cm: "", weight_kg: "",
  activity_level: "", goal: "", diet_type: "",
  medical_conditions: ["none"], plan_duration: "4", target_kcal: "",
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [profile, setProfile] = useState(EMPTY_FORM);
  const [original, setOriginal] = useState(EMPTY_FORM);
  const [editMode, setEditMode] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [savedAvatarUrl, setSavedAvatarUrl] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [gamification, setGamification] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [latestWeight, setLatestWeight] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    loadProfile();
    apiFetch("/plans/gamification").then(r => setGamification(r?.data ?? r ?? null)).catch(() => { });
    apiFetch("/plans/active").then(r => setActivePlan(r?.data ?? r ?? null)).catch(() => { });
    apiFetch("/progress/log")
      .then(res => {
        const logs = res?.data ?? res;
        const arr = Array.isArray(logs) ? logs : [];
        const latest = arr.find(l => l.weight_kg);
        if (latest) setLatestWeight(Number(latest.weight_kg));
      })
      .catch(() => {});
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await getMyProfile();
      const data = res?.data ?? res;
      const form = apiToForm(data);
      setProfile(form); setOriginal(form);
      setAvatarUrl(data.avatar_url ?? null); setSavedAvatarUrl(data.avatar_url ?? null);
      setIsNew(false);
    } catch (err) {
      if (err?.status === 404 || err?.code === "PROFILE_NOT_FOUND") { setIsNew(true); setEditMode(true); } 
      else if (err?.status === 401) { logout?.(); navigate("/login"); } 
      else { showAlert("error", err?.message ?? "Could not load profile."); }
    } finally { setLoading(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setAvatarUrl(localPreview); setAvatarUploading(true);
    try {
      const fd = new FormData(); fd.append("avatar", file);
      const token = localStorage.getItem("token");
      const res = await fetch("https://fitmitra-server.onrender.com/api/profile/avatar", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd, });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const json = await res.json();
      const uploadedUrl = json?.data?.avatar_url ?? json?.data?.url ?? json?.avatar_url ?? json?.url ?? null;
      if (!uploadedUrl) throw new Error("Server did not return a valid avatar URL.");
      URL.revokeObjectURL(localPreview); setAvatarUrl(uploadedUrl); setSavedAvatarUrl(uploadedUrl);
      showAlert("success", "Profile photo updated!");
    } catch (err) {
      showAlert("error", err?.message ?? "Photo upload failed. Please try again.");
      setAvatarUrl(savedAvatarUrl);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const setField = (field, value) => { setProfile(p => ({ ...p, [field]: value })); if (errors[field]) setErrors(e => ({ ...e, [field]: "" })); };

  const toggleCondition = (cond) => {
    setProfile(p => {
      let next;
      if (cond === "none") next = ["none"];
      else {
        const cur = p.medical_conditions.filter(c => c !== "none");
        next = cur.includes(cond) ? cur.filter(c => c !== cond) : [...cur, cond];
        if (next.length === 0) next = ["none"];
      }
      return { ...p, medical_conditions: next };
    });
  };

  const validate = () => {
    const e = {};
    const age = parseInt(profile.age, 10);
    if (!profile.age || isNaN(age) || age < 13 || age > 80) e.age = "13–80";
    const h = parseInt(profile.height_cm, 10);
    if (!profile.height_cm || isNaN(h) || h < 100 || h > 250) e.height_cm = "100–250 cm";
    const w = parseFloat(profile.weight_kg);
    if (!profile.weight_kg || isNaN(w) || w < 30 || w > 250) e.weight_kg = "30–250 kg";
    if (!profile.gender) e.gender = "Required";
    if (!profile.activity_level) e.activity_level = "Required";
    if (!profile.goal) e.goal = "Required";
    if (!profile.diet_type) e.diet_type = "Required";
    const dur = parseInt(profile.plan_duration, 10);
    if (profile.plan_duration && (isNaN(dur) || dur < 1 || dur > 52)) e.plan_duration = "1–52 wks";
    const kcal = parseInt(profile.target_kcal, 10);
    if (profile.target_kcal && (isNaN(kcal) || kcal < 1000 || kcal > 6000)) e.target_kcal = "1000–6000";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) { showAlert("error", "Please fix errors."); return; }
    setSaving(true);
    const payload = {
      age: Number(profile.age), gender: profile.gender, height_cm: Number(profile.height_cm), weight_kg: Number(profile.weight_kg),
      activity_level: profile.activity_level, goal: profile.goal, diet_type: profile.diet_type,
      medical_conditions: mapConditionsToApi(profile.medical_conditions),
      plan_duration: Number(profile.plan_duration) || 4, target_kcal: profile.target_kcal ? Number(profile.target_kcal) : null,
    };
    try {
      if (isNew) await createProfile(payload); else await updateProfile(payload);
      setOriginal({ ...profile }); setIsNew(false); setEditMode(false);
      showAlert("success", isNew ? "Profile created!" : "Profile saved!");
    } catch (err) { showAlert("error", err?.message ?? "Save failed."); } finally { setSaving(false); }
  };

  const handleCancel = () => {
    const changed = JSON.stringify(profile) !== JSON.stringify(original);
    if (changed && !window.confirm("Discard unsaved changes?")) return;
    setProfile({ ...original }); setErrors({}); setEditMode(false);
  };

  const handleLogout = () => { if (window.confirm("Are you sure you want to log out?")) { logout?.(); navigate("/login"); } };
  const handleDeleteAccount = async () => {
    if (!window.confirm("This will permanently delete your account and ALL data.\n\nThis cannot be undone. Continue?")) return;
    try { await deleteProfile(); logout?.(); navigate("/"); } catch (err) { showAlert("error", err?.message ?? "Delete failed."); }
  };

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4500); };
  const displayWeight = latestWeight ?? profile.weight_kg;
  const bmi     = calcBMI(profile.height_cm, displayWeight);
  const bmiInfo = bmi ? bmiLabel(parseFloat(bmi)) : null;

  const displayName  = user?.name ?? "User";
  const displayEmail = user?.email ?? "";
  const initials     = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  if (loading) return (
    <div className={styles.wrapper}>
      <Navbar />
      <div className={styles.loadingWrap}><div className={styles.loadRing} /><span>Loading profile…</span></div>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.main}>
        {alert && <div className={alert.type === "success" ? styles.alertSuccess : styles.alertError}>{alert.msg}</div>}

        <Section delay={0}>
          <div className={styles.heroCard}>
            <div className={styles.heroBg} />
            <div className={styles.avatarSection}>
              <div className={styles.avatarCircle}>
                {avatarUrl ? <img src={avatarUrl} alt="avatar" className={styles.avatarImage} /> : <span className={styles.initials}>{initials}</span>}
                <button className={styles.avatarUpload} onClick={() => fileInputRef.current?.click()} type="button" disabled={avatarUploading}>
                  <Camera size={18} />
                </button>
                <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleAvatarChange} />
              </div>
              {avatarUploading && <div className={styles.uploadOverlay}><span>Uploading…</span></div>}
              <div className={styles.profileHeaderInfo}>
                <h2 className={styles.profileName}>{displayName}</h2>
                <p className={styles.profileEmail}>{displayEmail}</p>
              </div>
            </div>

            <div className={styles.heroBadges}>
              {profile.goal && <span className={`${styles.heroBadge} ${styles.badgeLime}`}><Target size={12}/>{FMT_GOAL[profile.goal]}</span>}
              {profile.diet_type && <span className={`${styles.heroBadge} ${styles.badgeCyan}`}><Utensils size={12}/>{FMT_DIET[profile.diet_type]}</span>}
              {profile.activity_level && <span className={`${styles.heroBadge} ${styles.badgeOrange}`}><ActivitySquare size={12}/>{FMT_ACTIVITY[profile.activity_level]}</span>}
              {gamification?.level?.current && <span className={`${styles.heroBadge} ${styles.badgePurple}`}><Award size={12}/>{LEVEL_LABELS[gamification.level.current] ?? `Level ${gamification.level.current}`}</span>}
            </div>

            <div className={styles.heroStats}>
              {[
                { val: displayWeight ? `${displayWeight}kg` : "—", key: "Weight" },
                { val: profile.height_cm ? `${profile.height_cm}cm` : "—", key: "Height" },
                { val: bmi && bmiInfo ? <span style={{ color: bmiInfo.color }}>{bmi}</span> : "—", key: "BMI" },
                { val: <span style={{ color: "#CCFF00" }}>{gamification?.streak?.current ?? 0}d 🔥</span>, key: "Streak" }
              ].map(s => (
                <div key={s.key} className={styles.heroStat}>
                  <span className={styles.heroStatVal}>{s.val}</span>
                  <span className={styles.heroStatKey}>{s.key}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {!isNew && gamification && !editMode && (
          <Section delay={40}>
            <div className={styles.gamPanel}>
              <div className={styles.xpBarTop}>
                <span className={styles.xpLevelLabel}>{LEVEL_LABELS[gamification.level.current] ?? `Level ${gamification.level.current}`}</span>
                <span className={styles.xpPoints}>{(gamification.xp ?? 0).toLocaleString()} XP</span>
              </div>
              <div className={styles.xpTrack}><div className={styles.xpFill} style={{ width: `${gamification.level.progress_pct ?? 0}%` }} /></div>
              <div className={styles.xpBarBottom}>
                <span>{gamification.level.progress_pct ?? 0}% to level {(gamification.level.current ?? 1) + 1}</span>
                {(gamification.level.xp_to_next ?? 0) > 0 && <span>{gamification.level.xp_to_next} XP to go</span>}
              </div>
              <div className={styles.gamStatsGrid}>
                {[
                  { icon: <Dumbbell size={24} color="#CCFF00"/>, label: "Workouts", val: gamification.stats?.total_completed ?? 0 },
                  { icon: <Flame size={24} color="#FF5C1A"/>, label: "Streak", val: `${gamification.streak?.current ?? 0}d` },
                  { icon: <Award size={24} color="#00C8E0"/>, label: "PRs", val: gamification.stats?.total_pbs ?? 0 },
                  { icon: <Zap size={24} color="#a5b4fc"/>, label: "Deloads", val: gamification.stats?.deloads_completed ?? 0 },
                ].map(s => (
                  <div key={s.label} className={styles.gamStatItem}>
                    <span className={styles.gamStatIcon}>{s.icon}</span>
                    <span className={styles.gamStatVal}>{s.val}</span>
                    <span className={styles.gamStatLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
              {gamification.badges?.length > 0 && (
                <div>
                  <div className={styles.gamBadgesTitle}>🏆 Badges Earned</div>
                  <div className={styles.gamBadgesList}>{gamification.badges.map(b => <span key={b.id} className={styles.gamBadge}>{b.label}</span>)}</div>
                </div>
              )}
            </div>
          </Section>
        )}

        {!isNew && activePlan && !editMode && (
          <Section delay={50}>
            <div className={styles.activePlanCard}>
              <div className={styles.activePlanHeader}>
                <span className={styles.activePlanTitle} style={{ margin:0, color: '#CCFF00', display:'flex', alignItems:'center', gap:'0.5rem'}}><Target size={18}/> Active Plan</span>
                <button className={styles.activePlanBtn} onClick={() => navigate("/plans")} type="button">View →</button>
              </div>
              <div className={styles.activePlanMeta}>
                <span>{FMT_GOAL[activePlan.goals] ?? activePlan.goals ?? "—"}</span><span>·</span><span>{activePlan.duration_weeks ?? 4} weeks</span>
              </div>
              {activePlan.plan_data?.summary?.macro_targets && (
                <div className={styles.activePlanMacros}>
                  {[
                    { label: "kCal", val: activePlan.plan_data.summary.macro_targets.dailyKcal, c: "#f59e0b" },
                    { label: "Protein", val: `${activePlan.plan_data.summary.macro_targets.proteinTarget}g`, c: "#ef4444" },
                    { label: "Carbs", val: `${activePlan.plan_data.summary.macro_targets.carbsTarget}g`, c: "#3b82f6" },
                    { label: "Fat", val: `${activePlan.plan_data.summary.macro_targets.fatTarget}g`, c: "#10b981" },
                  ].map(m => (
                    <div key={m.label} className={styles.activePlanMacroChip} style={{ color: m.c, borderColor: `${m.c}40`, background: `${m.c}10` }}>
                      <span>{m.val}</span><span className={styles.activePlanMacroLabel}>{m.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {!editMode && !isNew && (
          <>
            <Section delay={60}>
              <div className={styles.detailsGrid}>
                {[
                  { title: "Personal", icon: <User size={18}/>, r: [
                    { l: "Age", v: `${profile.age} yrs` }, { l: "Gender", v: profile.gender },
                    { l: "BMI", v: bmi && bmiInfo ? <span className={styles.bmiChip} style={{color:bmiInfo.color, background:`${bmiInfo.color}15`}}>{bmi} · {bmiInfo.label}</span> : "—" }
                  ] },
                  { title: "Fitness Goals", icon: <Target size={18}/>, r: [
                    { l: "Goal", v: FMT_GOAL[profile.goal] || "—" }, { l: "Activity", v: FMT_ACTIVITY[profile.activity_level] || "—" }, { l: "Diet", v: FMT_DIET[profile.diet_type] || "—" }
                  ] },
                  { title: "Body Metrics", icon: <Activity size={18}/>, r: [
                    { l: "Height", v: `${profile.height_cm} cm` },
                    { l: "Weight", v: `${displayWeight} kg` }
                  ] },
                  { title: "Health", icon: <HeartPulse size={18}/>, r: [ { l: "Conditions", v: profile.medical_conditions.includes("none") ? "None" : profile.medical_conditions.map(x=>FMT_COND[x]||x).join(", ") } ] },
                  { title: "Plan Settings", icon: <Settings size={18}/>, r: [ { l: "Duration", v: `${profile.plan_duration || 4} weeks` }, { l: "Target kCal", v: profile.target_kcal ? `${profile.target_kcal} kcal/day` : "Auto" } ] },
                ].map((c, i) => (
                  <div key={i} className={styles.detailCard}>
                    <div className={styles.detailCardHeader}>{c.icon}<h3>{c.title}</h3></div>
                    {c.r.map((r, j) => (
                      <div key={j} className={styles.detailRow}><span className={styles.detailLabel}>{r.l}</span><span className={styles.detailValue} style={{textTransform: r.l === "Gender" ? "capitalize" : "none"}}>{r.v}</span></div>
                    ))}
                  </div>
                ))}
              </div>
            </Section>

            <Section delay={120}>
              <div className={styles.actions}>
                <button type="button" className="btn-secondary" onClick={() => navigate("/dashboard")}><ArrowLeft size={18}/> Back</button>
                <button type="button" className={styles.logoutBtn} onClick={handleLogout}><LogOut size={18}/> Logout</button>
              </div>
            </Section>

            <Section delay={140}>
               <button className="btn-primary" onClick={() => setEditMode(true)} type="button">EDIT PROFILE</button>
            </Section>
          </>
        )}

        {(editMode || isNew) && (
          <Section delay={0}>
            <form onSubmit={handleSave} className={styles.form}>
              <div className={`${styles.formSection} ${styles.accent}`}>
                <div className={styles.formSectionTitle}><User size={18} color="#CCFF00"/> Basic Info</div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Age<span className={styles.required}>*</span></label>
                    <input type="number" value={profile.age} placeholder="13 – 80" className={`${styles.input} ${errors.age ? styles.inputError : ""}`} onChange={e => setField("age", e.target.value)} />
                    {errors.age && <span className={styles.valError}>{errors.age}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Gender<span className={styles.required}>*</span></label>
                    <select value={profile.gender} className={`${styles.input} ${errors.gender ? styles.inputError : ""}`} onChange={e => setField("gender", e.target.value)}>
                      <option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                    </select>
                    {errors.gender && <span className={styles.valError}>{errors.gender}</span>}
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Height (cm)<span className={styles.required}>*</span></label>
                    <input type="number" value={profile.height_cm} placeholder="100 – 250" className={`${styles.input} ${errors.height_cm ? styles.inputError : ""}`} onChange={e => setField("height_cm", e.target.value)} />
                    {errors.height_cm && <span className={styles.valError}>{errors.height_cm}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Weight (kg)<span className={styles.required}>*</span></label>
                    <input type="number" step="0.1" value={profile.weight_kg} placeholder="30 – 250" className={`${styles.input} ${errors.weight_kg ? styles.inputError : ""}`} onChange={e => setField("weight_kg", e.target.value)} />
                    {errors.weight_kg && <span className={styles.valError}>{errors.weight_kg}</span>}
                  </div>
                </div>
              </div>

              <div className={`${styles.formSection} ${styles.accent}`}>
                <div className={styles.formSectionTitle}><Target size={18} color="#CCFF00"/> Fitness Goals</div>
                <div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
                  <label className={styles.label}>Activity Level<span className={styles.required}>*</span></label>
                  <select value={profile.activity_level} className={`${styles.input} ${errors.activity_level ? styles.inputError : ""}`} onChange={e => setField("activity_level", e.target.value)}>
                    <option value="">Select activity level</option>
                    <option value="sedentary">Sedentary (little to no exercise)</option>
                    <option value="lightly_active">Light Active (1–3 days/week)</option>
                    <option value="moderately_active">Moderate (3–5 days/week)</option>
                    <option value="very_active">Very Active (6–7 days/week)</option>
                  </select>
                  {errors.activity_level && <span className={styles.valError}>{errors.activity_level}</span>}
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Primary Goal<span className={styles.required}>*</span></label>
                    <select value={profile.goal} className={`${styles.input} ${errors.goal ? styles.inputError : ""}`} onChange={e => setField("goal", e.target.value)}>
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
                    <select value={profile.diet_type} className={`${styles.input} ${errors.diet_type ? styles.inputError : ""}`} onChange={e => setField("diet_type", e.target.value)}>
                      <option value="">Select diet</option>
                      <option value="veg">Vegetarian</option>
                      <option value="non_veg">Non-Vegetarian</option>
                      <option value="eggetarian">Eggetarian</option>
                    </select>
                    {errors.diet_type && <span className={styles.valError}>{errors.diet_type}</span>}
                  </div>
                </div>
              </div>

              <div className={`${styles.formSection} ${styles.accent}`}>
                <div className={styles.formSectionTitle}><Calendar size={18} color="#CCFF00"/> Plan Settings</div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Plan Duration (weeks)</label>
                    <input type="number" min="1" max="52" value={profile.plan_duration} placeholder="4" className={`${styles.input} ${errors.plan_duration ? styles.inputError : ""}`} onChange={e => setField("plan_duration", e.target.value)} />
                    {errors.plan_duration ? <span className={styles.valError}>{errors.plan_duration}</span> : <span className={styles.inputHint}>Weeks to generate plan. Default: 4</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Target Kcal Override</label>
                    <input type="number" min="1000" max="6000" value={profile.target_kcal} placeholder="Leave blank for auto" className={`${styles.input} ${errors.target_kcal ? styles.inputError : ""}`} onChange={e => setField("target_kcal", e.target.value)} />
                    {errors.target_kcal ? <span className={styles.valError}>{errors.target_kcal}</span> : <span className={styles.inputHint}>Blank = AI calculated</span>}
                  </div>
                </div>
              </div>

              <div className={`${styles.formSection} ${styles.accent}`}>
                <div className={styles.formSectionTitle}><ShieldAlert size={18} color="#CCFF00"/> Medical Conditions</div>
                <div className={styles.checkboxGrid}>
                  {[
                    { id: "none", label: "None" }, { id: "high_bp", label: "High BP" },
                    { id: "diabetes", label: "Diabetes" }, { id: "pcod", label: "PCOD/PCOS" },
                    { id: "thyroid", label: "Thyroid" }, { id: "injuries", label: "Injuries" }
                  ].map(c => {
                    const checked = profile.medical_conditions.includes(c.id);
                    return (
                      <label key={c.id} className={`${styles.checkCard} ${checked ? styles.checked : ""}`}>
                        <div className={styles.checkBox}>{checked && <Check size={12} className={styles.checkTick} />}</div>
                        <span className={styles.checkLabel}>{c.label}</span>
                        <input type="checkbox" className={styles.checkCardInput} checked={checked} onChange={() => toggleCondition(c.id)} />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className="btn-primary" disabled={saving}>
                  <Check size={18} />
                  {saving ? "Saving Changes..." : "Save Profile"}
                </button>
                {!isNew && <button type="button" className="btn-secondary" onClick={handleCancel} disabled={saving}>Cancel</button>}
              </div>

              {!isNew && (
                <div style={{marginTop:'2rem', textAlign:'center'}}>
                   <button type="button" onClick={handleDeleteAccount} style={{background:'transparent', border:'none', color:'#FF4D6D', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:700, cursor:'pointer', letterSpacing:'0.05em'}}>Delete Account</button>
                </div>
              )}
            </form>
          </Section>
        )}
      </main>
    </div>
  );
}