import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../../context/AuthContext";
import { getMyProfile } from "../../../../services/profileService";
import { apiFetch } from "../../../../services/apiClient";
import ThemeToggle from "../../../../components/ThemeToggle/ThemeToggle";
import Navbar from "../../../../components/Navbar/Navbar";
import styles from "./plans.module.css";

import { 
  Target, Dumbbell, Calendar, Activity, 
  Flame, Droplet, Coffee, Zap, Moon, 
  RefreshCcw, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Utensils
} from "lucide-react";

const NAV_TABS = [
  { key: "today",    label: "today",    path: "/dashboard" },
  { key: "progress", label: "progress", path: "/progress"  },
  { key: "plans",    label: "plans",    path: "/plans"      },
];

const DAY_NAMES = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const DAY_KEYS  = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const todayIdx  = new Date().getDay();

const PHASE_META = {
  1: { label: "Foundation",  color: "#3b82f6", icon: "🧱" },
  2: { label: "Volume",      color: "#10b981", icon: "📈" },
  3: { label: "Intensity",   color: "#f59e0b", icon: "⚡" },
  4: { label: "Deload",      color: "#6366f1", icon: "🔄" },
};

const LEVEL_LABELS = {
  1: "🌱 Rookie",   2: "🏃 Mover",     3: "💪 Grinder",
  4: "🔥 Crusher",  5: "⚡ Athlete",   6: "🥈 Contender",
  7: "🥇 Champion", 8: "🏆 Elite",     9: "💎 Legend", 10: "🚀 GOAT",
};

function NavAvatar({ avatarUrl, initials }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [avatarUrl]);
  if (avatarUrl && !imgError) {
    return <img src={avatarUrl} alt="avatar" className={styles.navAvatarImg} onError={() => setImgError(true)} />;
  }
  return <div className={styles.navAvatar}>{initials}</div>;
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

function isShapeA(wp) { return Array.isArray(wp); }
function isShapeB(wp) { return wp && typeof wp === "object" && !Array.isArray(wp) && wp.weekly_plan; }

function shapeBToA(wp, durationWeeks = 4) {
  const weeklyPlan = wp.weekly_plan ?? {};
  const dailyEx    = wp.daily_exercises ?? {};
  const meta       = wp.meta ?? {};
  const isDeload   = meta.is_deload_week ?? false;

  const workouts = DAY_KEYS.map(dayKey => {
    const muscleGroups = weeklyPlan[dayKey] ?? [];
    const isRest = !muscleGroups.length || muscleGroups.every(g => /^rest/i.test(g));
    if (isRest) return null;
    const exercises = (dailyEx[dayKey] ?? []).map(ex => ({
      name: ex.name, sets: ex.sets, reps: ex.reps, weight_kg: ex.weight_kg ?? 0,
      est_kcal: ex.estimated_kcal ?? ex.est_kcal ?? 0,
      muscles: ex.muscles ?? muscleGroups.filter(g => !/^rest/i.test(g)),
      progression_note: ex.progression_note ?? null,
      duration_sec: ex.duration_sec ?? null, duration_min: ex.duration_min ?? null,
      deload: ex.is_deload ?? isDeload, tier: ex.tier ?? meta.rotation_tier ?? "A",
    }));
    const splitName = muscleGroups.filter(g => !/^rest/i.test(g)).join(" + ");
    return {
      split: splitName, variation: splitName,
      muscle_groups: muscleGroups.filter(g => !/^rest/i.test(g)),
      exercises, estimated_kcal_burned: exercises.reduce((s, e) => s + (e.est_kcal || 0), 0),
      _dayKey: dayKey,
    };
  }).filter(Boolean);

  return Array.from({ length: durationWeeks }, (_, i) => ({
    week: i + 1, focus: wp.focus ?? meta.focus ?? "", is_deload: i === 3, workouts,
  }));
}

function normalizeWorkoutPlan(raw, durationWeeks = 4) {
  if (!raw) return [];
  if (isShapeA(raw)) return raw;
  if (isShapeB(raw)) return shapeBToA(raw, durationWeeks);
  return [];
}

function normalizeMealPlan(raw) { return Array.isArray(raw) ? raw : []; }

function assignWorkoutsToDays(workouts = [], weeklyPlan = {}) {
  const hasRealDayKeys = Object.keys(weeklyPlan).some(k => DAY_KEYS.includes(k));
  if (hasRealDayKeys) {
    const assigned = {};
    DAY_KEYS.forEach((dayKey, idx) => {
      const muscleGroups = weeklyPlan[dayKey] ?? [];
      const isRest = !muscleGroups.length || muscleGroups.every(g => /^rest/i.test(g));
      if (isRest) return;
      const match =
        workouts.find(w => w._dayKey === dayKey) ??
        workouts.find(w => w.muscle_groups?.some(mg => muscleGroups.some(pg => pg.toLowerCase() === mg.toLowerCase()))) ??
        workouts.find(w => muscleGroups.some(pg => w.split?.toLowerCase().includes(pg.toLowerCase())));
      if (match) assigned[idx] = match;
    });
    return assigned;
  }
  const PATTERNS = { 1: [1], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [0, 1, 2, 3, 4, 5] };
  const count = Math.min(workouts.length, 6);
  const slots = PATTERNS[count] ?? PATTERNS[5];
  const assigned = {};
  workouts.forEach((w, i) => { if (slots[i] !== undefined) assigned[slots[i]] = w; });
  return assigned;
}

function fmt(str = "") { return String(str).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }

function resolveMetadata(plan) {
  const shapeB_meta = plan?.workout_plan?.meta ?? {};
  if (shapeB_meta.activity_level || shapeB_meta.intensity) {
    return { intensity: shapeB_meta.intensity ?? null, activity_level: shapeB_meta.activity_level ?? null };
  }
  const snapshot = plan?.metadata ?? {};
  return { intensity: null, activity_level: snapshot.fitnessLevel ?? null };
}

export default function Plans() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useContext(AuthContext);
  const activeTab  = NAV_TABS.find(t => t.path === location.pathname)?.key ?? "plans";

  const [plan,         setPlan]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [generating,   setGenerating]   = useState(false);
  const [alert,        setAlert]        = useState(null);
  const [activeWeek,   setActiveWeek]   = useState(1);
  const [activeDay,    setActiveDay]    = useState(null);
  const [gamification, setGamification] = useState(null);
  const [missedInfo,   setMissedInfo]   = useState(null);
  const [avatarUrl,    setAvatarUrl]    = useState(null);
  const [recExpanded,  setRecExpanded]  = useState(false);

  const displayName = user?.name ?? "User";
  const initials    = displayName.split(" ").map(n => n[0] ?? "").join("").slice(0, 2).toUpperCase();

  useEffect(() => { fetchPlan(); fetchGamification(); fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const raw  = await getMyProfile();
      const data = raw?.data ?? raw;
      const resolved = data?.avatar_url ?? data?.data?.avatar_url ?? data?.url ?? data?.data?.url ?? null;
      if (resolved) setAvatarUrl(resolved);
    } catch {}
  };

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res  = await apiFetch("/plans/active");
      const data = res?.data ?? res;
      setPlan(data ?? null);
    } catch (err) {
      if (err?.status === 404) setPlan(null);
      else showAlert("error", err?.message ?? "Failed to load plan.");
    } finally { setLoading(false); }
  };

  const fetchGamification = async () => {
    try {
      const res = await apiFetch("/plans/gamification");
      setGamification(res?.data ?? res ?? null);
    } catch {}
  };

  const fetchMissedRecovery = async (split) => {
    try {
      const res = await apiFetch("/plans/missed-workout", { method: "POST", body: JSON.stringify({ split }) });
      setMissedInfo(res?.data ?? res ?? null);
    } catch {}
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      await apiFetch("/plans/generate", { method: "POST" });
      showAlert("success", "New plan generated! 🎯");
      await fetchPlan();
      await fetchGamification();
      setActiveWeek(1); setActiveDay(null);
    } catch (err) {
      showAlert("error", err?.message ?? "Failed to generate plan. Make sure your profile is complete.");
    } finally { setGenerating(false); }
  };

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 5000); };

  const totalWeeks  = plan?.duration_weeks ?? 4;
  const workoutPlan = normalizeWorkoutPlan(plan?.workout_plan, totalWeeks);
  const mealPlan    = normalizeMealPlan(plan?.meal_plan);
  const weekData    = workoutPlan.find(w => w.week === activeWeek) ?? workoutPlan[0] ?? null;
  const weekMeals   = mealPlan.find(w => w.week === activeWeek)    ?? mealPlan[0]    ?? null;
  const workouts    = weekData?.workouts ?? [];
  const rawWeeklyPlan = isShapeB(plan?.workout_plan) ? (plan.workout_plan.weekly_plan ?? {}) : {};
  const dayMap        = assignWorkoutsToDays(workouts, rawWeeklyPlan);

  const activeDayWorkout = activeDay != null ? (dayMap[activeDay] ?? null) : null;
  const activeDayMeal    = activeDay != null ? (weekMeals?.meals ?? []).find(m => m.day === activeDay) ?? (weekMeals?.meals?.[0] ?? null) : null;

  const meta          = resolveMetadata(plan);
  const planSummary   = plan?.plan_data?.summary ?? null;
  const blockWeek     = weekData?.block_week ?? (((activeWeek - 1) % 4) + 1);

  if (loading) return (
    <div className={styles.wrapper}>
      <div className={styles.loadWrap}>
        <div className={styles.loadRing} />
        <span>Loading plan…</span>
      </div>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <Navbar />

      <main className={styles.main}>
        {alert && <div className={alert.type === "success" ? styles.alertSuccess : styles.alertError}>{alert.msg}</div>}

        {gamification && (
          <Section delay={0}>
            <div className={styles.xpBar}>
              <div className={styles.xpMeta}>
                <span className={styles.xpLevel}>{LEVEL_LABELS[gamification.level.current] ?? `Level ${gamification.level.current}`}</span>
                <div className={styles.xpRight}>
                  {gamification.streak.current > 0 && <span className={styles.xpStreak}>🔥 {gamification.streak.current} day streak</span>}
                  <span className={styles.xpPoints}>{gamification.xp.toLocaleString()} XP</span>
                </div>
              </div>
              <div className={styles.xpTrack}>
                <div className={styles.xpFill} style={{ width: `${gamification.level.progress_pct ?? 0}%` }} />
              </div>
              <div className={styles.xpFooter}>
                <span>{gamification.level.progress_pct ?? 0}% to level {(gamification.level.current ?? 1) + 1}</span>
                {gamification.level.xp_to_next > 0 && <span>{gamification.level.xp_to_next} XP to go</span>}
              </div>
              {gamification.badges?.length > 0 && (
                <div className={styles.badgeList}>
                  {gamification.badges.map(b => <span key={b.id} className={styles.badge}>{b.label}</span>)}
                </div>
              )}
            </div>
          </Section>
        )}

        <Section delay={0}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Your Plan</h1>
              <p className={styles.sub}>{plan ? `Generated ${new Date(plan.generated_at).toLocaleDateString()} · ${totalWeeks} weeks` : "No active plan yet"}</p>
            </div>
            <button className={styles.generateBtn} onClick={generatePlan} disabled={generating}>
              {generating ? "Generating…" : plan ? "Regenerate Plan" : "Generate Plan"}
            </button>
          </div>
        </Section>

        {!plan ? (
          <Section delay={60}>
            <div className={styles.emptyCard}>
              <span className={styles.emptyEmoji}>🎯</span>
              <h2>No Active Plan</h2>
              <p>Generate a personalized workout and meal plan based on your unique profile metrics and goals.</p>
              <button className={styles.generateBtnLg} onClick={generatePlan} disabled={generating}>
                {generating ? "Generating…" : "Generate My Plan"}
              </button>
            </div>
          </Section>
        ) : (
          <>
            <Section delay={60}>
              <div className={styles.metaGrid}>
                {[
                  { icon: Target,   label: "Goal",      val: fmt(plan.goals ?? "—") },
                  { icon: Activity, label: "Intensity", val: weekData?.is_deload ? "Deload" : meta.intensity ? fmt(meta.intensity) : meta.activity_level ? fmt(meta.activity_level) : "—" },
                  { icon: Calendar, label: "Duration",  val: `${totalWeeks} weeks` },
                  { icon: Dumbbell, label: "Activity",  val: fmt(meta.activity_level ?? "—") },
                ].map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <div key={i} className={styles.metaCard}>
                      <span className={styles.metaIcon}><Icon size={20} /></span>
                      <span className={styles.metaVal}>{m.val}</span>
                      <span className={styles.metaLabel}>{m.label}</span>
                    </div>
                  );
                })}
              </div>
              {planSummary?.macro_targets && (
                <div className={styles.macroSummary}>
                  <span className={styles.macroSummaryTitle}>Weekly Macro Targets</span>
                  <div className={styles.macroSummaryGrid}>
                    {[
                      { label: "Daily kcal", val: planSummary.macro_targets.dailyKcal, unit: "kcal", color: "#f59e0b" },
                      { label: "Protein", val: planSummary.macro_targets.proteinTarget, unit: "g", color: "#ef4444" },
                      { label: "Carbs", val: planSummary.macro_targets.carbsTarget, unit: "g", color: "#3b82f6" },
                      { label: "Fats", val: planSummary.macro_targets.fatTarget, unit: "g", color: "#10b981" },
                    ].map((m, i) => m.val != null && (
                      <div key={i} className={styles.macroSummaryItem}>
                        <span className={styles.macroSummaryVal} style={{ color: m.color }}>{m.val}{m.unit}</span>
                        <span className={styles.macroSummaryLabel}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section delay={80}>
              <div className={styles.weekSelector}>
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
                  const wd = workoutPlan.find(x => x.week === w);
                  const p = PHASE_META[((w - 1) % 4) + 1];
                  return (
                    <button key={w} 
                      className={`${styles.weekTab} ${activeWeek === w ? styles.weekTabActive : ""} ${wd?.is_deload ? styles.weekTabDeload : ""}`}
                      onClick={() => { setActiveWeek(w); setActiveDay(null); }}>
                      <span>W{w}</span><span>{p.icon}</span>
                    </button>
                  );
                })}
              </div>
              {weekData && (
                <div className={styles.weekFocusRow}>
                  <span className={styles.weekFocus}>{weekData.focus && `🎯 ${weekData.focus}`}</span>
                  <span className={styles.phaseBadge} style={{ background: `${PHASE_META[blockWeek].color}20`, color: PHASE_META[blockWeek].color, border: `1px solid ${PHASE_META[blockWeek].color}40` }}>
                    {PHASE_META[blockWeek].icon} {PHASE_META[blockWeek].label} Phase
                  </span>
                </div>
              )}
            </Section>

            {weekData && (
              <Section delay={90}>
                <div className={styles.wellnessRecoveryRow}>
                  {(() => {
                    const wellness = plan?.daily_wellness ?? weekData?.daily_wellness ?? null;
                    if (!wellness) return null;
                    return (
                      <div className={styles.wellnessCard}>
                        <span className={styles.wellnessTitle}><Droplet size={14} /> Daily Wellness</span>
                        <div className={styles.wellnessRow}>
                          <span className={styles.wellnessItem}><Droplet size={14} color="#00C8E0" /> {wellness.water_L}L water daily</span>
                          {wellness.caffeine_advice && <span className={styles.wellnessItem}><Coffee size={14} color="#FF5C1A"/> {wellness.caffeine_advice}</span>}
                        </div>
                        {wellness.electrolyte_sources?.length > 0 && (
                          <div className={styles.electroRow}>
                            <span className={styles.electroLabel}><Zap size={10} /> Electrolytes</span>
                            {wellness.electrolyte_sources.map((e, i) => <span key={i} className={styles.electroChip}>{e}</span>)}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {(() => {
                    const protocol = plan?.recovery_protocol ?? weekData?.recovery_protocol ?? null;
                    if (!protocol) return null;
                    return (
                      <div className={styles.recoveryBlock}>
                        <button className={styles.recoveryToggle} onClick={() => setRecExpanded(!recExpanded)}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {weekData.is_deload ? <RefreshCcw size={16} /> : <Moon size={16} />}
                            {weekData.is_deload ? "Deload Recovery Protocol" : "Recovery Protocol"}
                          </span>
                          {recExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {recExpanded && (
                          <div className={styles.recoveryContent}>
                            <div className={styles.recoveryRow}><span>Sleep Target</span><strong>{protocol.sleep_hours_target}h</strong></div>
                            <div className={styles.recoveryRow}><span>Rest Day Activity</span><strong>{protocol.rest_day_activity}</strong></div>
                            {protocol.sleep_tips?.length > 0 && (
                              <div className={styles.recoveryTips}>
                                {protocol.sleep_tips.map((tip, i) => <span key={i} className={styles.recoveryTip}><CheckCircle2 size={12} color="#10b981"/> {tip}</span>)}
                              </div>
                            )}
                            {protocol.recovery_tools?.length > 0 && (
                              <div className={styles.recoveryTools}>
                                {protocol.recovery_tools.map((tool, i) => <span key={i} className={styles.recoveryTool}>{tool}</span>)}
                              </div>
                            )}
                            {protocol.protein_timing && <div className={styles.recoveryProteinNote}>🥩 {protocol.protein_timing}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </Section>
            )}

            <Section delay={100}>
              <h2 className={styles.sectionTitle}>Weekly Split</h2>
              <div className={styles.weekGrid}>
                {DAY_NAMES.map((day, idx) => {
                  const workout = dayMap[idx];
                  const isToday = idx === todayIdx;
                  const isRest = !workout;
                  const isActive = activeDay === idx;
                  return (
                    <div key={day} 
                      className={`${styles.weekCard} ${isToday ? styles.today : ""} ${isRest ? styles.restDay : ""} ${isActive ? styles.activeDay : ""}`}
                      onClick={() => {
                        if (!isRest) {
                          const nextActive = isActive ? null : idx;
                          setActiveDay(nextActive);
                          if (nextActive !== null && workout?.split && !isActive) fetchMissedRecovery(workout.split);
                        }
                      }}>
                      <span className={styles.weekDayLabel}>{day}</span>
                      {isToday && <span className={styles.todayBadge}>Today</span>}
                      <div className={styles.weekGroups}>
                        {workout ? (
                          <>
                            <span className={styles.weekGroup}>{workout.split}</span>
                            {workout.estimated_kcal_burned > 0 && <span className={styles.weekKcal}>~{workout.estimated_kcal_burned} kcal</span>}
                          </>
                        ) : <span className={styles.weekGroup}>Rest</span>}
                      </div>
                      {workout?.muscle_groups?.length > 0 && (
                        <div className={styles.muscleChips}>
                          {workout.muscle_groups.slice(0, 2).map((m, i) => <span key={i} className={styles.muscleChip}>{m}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            {activeDayWorkout && (
              <Section delay={0}>
                <div className={styles.dayPanel}>
                  <div className={styles.dayPanelHeader}>
                    <div>
                      <h2 className={styles.dayPanelTitle}>
                        {DAY_NAMES[activeDay]} — {activeDayWorkout.split}
                        {activeDayWorkout.variation && activeDayWorkout.variation !== activeDayWorkout.split && (
                          <span className={styles.variationBadge}>{activeDayWorkout.variation}</span>
                        )}
                      </h2>
                      <p className={styles.dayPanelSub}>{activeDayWorkout.muscle_groups?.join(" · ")}</p>
                    </div>
                    <button className={styles.closePanelBtn} onClick={() => setActiveDay(null)}>✕</button>
                  </div>

                  {missedInfo && (
                    <div className={styles.recoveryReminder}>
                      <AlertTriangle size={18} /> Missed? Try: {missedInfo.recovery_suggestion}
                    </div>
                  )}

                  {activeDayWorkout.warmup?.length > 0 && (
                    <div className={styles.warmupBlock}>
                      <span className={styles.warmupTitle} style={{ color: '#FF5C1A' }}><Flame size={14} /> Warm-Up</span>
                      <div className={styles.warmupItems}>
                        {activeDayWorkout.warmup.map((item, i) => (
                          <span key={i} className={styles.warmupItem}>{item.name} {item.duration_min && `· ${item.duration_min} min`}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.exerciseList}>
                    {(activeDayWorkout.exercises ?? []).length === 0 ? (
                      <p className={styles.noExercises}>Exercises will generate based on your log data.</p>
                    ) : (
                      activeDayWorkout.exercises.map((ex, i) => (
                        <div key={i} className={`${styles.exerciseCard} ${ex.deload ? styles.deloadEx : ""}`}>
                          <div className={styles.exHeader}>
                            <span className={styles.exNum}>{i + 1}</span>
                            <span className={styles.exName}>{ex.name}</span>
                            {ex.deload && <span className={styles.deloadBadge}>Deload</span>}
                          </div>
                          <div className={styles.exMeta}>
                            {ex.sets != null && <span className={styles.exStat}>🔢 {ex.sets} sets</span>}
                            {ex.reps != null && <span className={styles.exStat}>🔁 {ex.reps} reps</span>}
                            {ex.duration_sec != null && <span className={styles.exStat}>⏱ {ex.duration_sec}s</span>}
                            {ex.weight_kg > 0 && <span className={styles.exStat}>🏋️ {ex.weight_kg} kg</span>}
                            {ex.est_kcal > 0 && <span className={styles.exStat} style={{color:'#FF5C1A'}}><Flame size={12}/> ~{ex.est_kcal} kcal</span>}
                          </div>
                          {ex.muscles?.length > 0 && (
                            <div className={styles.exMuscles}>
                              {ex.muscles.map((m, idx) => <span key={idx} className={styles.muscleChip}>{m}</span>)}
                            </div>
                          )}
                          {ex.progression_note && <div className={styles.progressionNote}><Flame size={14} /> {ex.progression_note}</div>}
                        </div>
                      ))
                    )}
                  </div>

                  {activeDayWorkout.cooldown?.length > 0 && (
                    <div className={styles.cooldownBlock}>
                      <span className={styles.warmupTitle} style={{ color: '#00C8E0' }}><Droplet size={14} /> Cool-Down</span>
                      <div className={styles.warmupItems}>
                        {activeDayWorkout.cooldown.map((item, i) => (
                          <span key={i} className={styles.warmupItem}>{item.name} {item.duration_min && `· ${item.duration_min} min`}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeDayWorkout.recovery_reminder && (
                    <div className={styles.recoveryReminder}>
                      <AlertTriangle size={18} /> {activeDayWorkout.recovery_reminder}
                    </div>
                  )}

                  {activeDayMeal && (
                    <div className={styles.mealPanel}>
                      <h3 className={styles.mealPanelTitle}>🍽️ Today's Meals</h3>
                      <div className={styles.mealGrid}>
                        {[
                          { label: "Breakfast", val: activeDayMeal.breakfast },
                          { label: "Lunch",     val: activeDayMeal.lunch },
                          { label: "Dinner",    val: activeDayMeal.dinner },
                          { label: "Snack",     val: activeDayMeal.snack },
                        ].filter(m => m.val).map((m, i) => (
                          <div key={i} className={styles.mealCard}>
                            <span className={styles.mealLabel}>{m.label}</span>
                            <span className={styles.mealVal}>{m.val}</span>
                          </div>
                        ))}
                      </div>
                      {activeDayMeal.daily_targets && (
                        <div className={styles.nutTargets}>
                          <span className={styles.nutTargetsTitle}><Target size={14}/> Nutrition Targets</span>
                          <div className={styles.nutTargetsGrid}>
                            {[
                              { label: "kcal", val: activeDayMeal.daily_targets.kcal, c: "#f59e0b" },
                              { label: "Protein", val: activeDayMeal.daily_targets.protein_g ? `${activeDayMeal.daily_targets.protein_g}g` : null, c: "#ef4444" },
                              { label: "Carbs", val: activeDayMeal.daily_targets.carbs_g ? `${activeDayMeal.daily_targets.carbs_g}g` : null, c: "#3b82f6" },
                              { label: "Fats", val: activeDayMeal.daily_targets.fat_g ? `${activeDayMeal.daily_targets.fat_g}g` : null, c: "#10b981" },
                              { label: "Water", val: activeDayMeal.daily_targets.hydration_L ? `${activeDayMeal.daily_targets.hydration_L}L` : null, c: "#06b6d4" },
                            ].filter(t => t.val).map((t, i) => (
                              <div key={i} className={styles.nutTargetChip} style={{ color: t.c, borderColor: `${t.c}40` }}>
                                <span className={styles.nutTargetVal}>{t.val}</span>
                                <span className={styles.nutTargetLabel}>{t.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {!activeDayWorkout && (
              <Section delay={160}>
                <div className={styles.mealPromoCard}>
                  <div className={styles.mealPromoIcon}><Utensils size={32} /></div>
                  <h3 className={styles.mealPromoTitle}>AI Meal Planner</h3>
                  <p className={styles.mealPromoDesc}>Get personalized meal plans based on your goals, weight, and medical conditions — powered by advanced AI.</p>
                  <button className={styles.generateBtn} onClick={() => navigate("/meal-plan")}>Open Meal Planner</button>
                </div>
              </Section>
            )}
          </>
        )}
      </main>
    </div>
  );
}