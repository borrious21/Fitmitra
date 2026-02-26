// src/pages/Plans/Plans.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../../services/apiClient";
import styles from "./Plans.module.css";

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_KEYS  = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const todayIdx  = new Date().getDay();

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

// ─────────────────────────────────────────────────────────────────────────────
// SHAPE NORMALIZERS
//
// SHAPE A — plan.generator.js (PlanService):
//   Array: [ { week, focus, is_deload, workouts: [ { split, variation, exercises[], muscle_groups[], estimated_kcal_burned } ] } ]
//   plans.workout_plan = Shape A array
//   plans.meal_plan    = Array: [ { week, meals: [ { day, breakfast, lunch, dinner, snack } ] } ]
//   plans.metadata     = profile_snapshot: { fitnessLevel, dietType, duration, goals, ... }
//
// SHAPE B — workout.generator.js (WorkoutService):
//   Object: { weekly_plan: { monday: [...] }, daily_exercises: { monday: [...] }, meta: {} }
// ─────────────────────────────────────────────────────────────────────────────

function isShapeA(wp) {
  return Array.isArray(wp);
}

function isShapeB(wp) {
  return wp && typeof wp === "object" && !Array.isArray(wp) && wp.weekly_plan;
}

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
      name:             ex.name,
      sets:             ex.sets,
      reps:             ex.reps,
      weight_kg:        ex.weight_kg ?? 0,
      est_kcal:         ex.estimated_kcal ?? ex.est_kcal ?? 0,
      muscles:          ex.muscles ?? muscleGroups.filter(g => !/^rest/i.test(g)),
      progression_note: ex.progression_note ?? null,
      duration_sec:     ex.duration_sec ?? null,
      duration_min:     ex.duration_min ?? null,
      deload:           ex.is_deload ?? isDeload,
      tier:             ex.tier ?? meta.rotation_tier ?? "A",
    }));

    const splitName = muscleGroups.filter(g => !/^rest/i.test(g)).join(" + ");
    const kcal = exercises.reduce((s, e) => s + (e.est_kcal || 0), 0);

    return {
      split:                 splitName,
      variation:             splitName,
      muscle_groups:         muscleGroups.filter(g => !/^rest/i.test(g)),
      exercises,
      estimated_kcal_burned: kcal,
    };
  }).filter(Boolean);

  return Array.from({ length: durationWeeks }, (_, i) => ({
    week:      i + 1,
    focus:     wp.focus ?? meta.focus ?? "",
    is_deload: i === 3,
    workouts,
  }));
}

function normalizeWorkoutPlan(raw, durationWeeks = 4) {
  if (!raw) return [];
  if (isShapeA(raw)) return raw;
  if (isShapeB(raw)) return shapeBToA(raw, durationWeeks);
  return [];
}

function normalizeMealPlan(raw) {
  if (Array.isArray(raw)) return raw;
  return [];
}

// Spread workouts across week days (Sun=0 … Sat=6)
function assignWorkoutsToDays(workouts = []) {
  const PATTERNS = {
    1: [1],
    2: [1, 4],
    3: [1, 3, 5],
    4: [1, 2, 4, 5],
    5: [1, 2, 3, 4, 5],
    6: [1, 2, 3, 4, 5, 6],
  };
  const count    = Math.min(workouts.length, 6);
  const slots    = PATTERNS[count] ?? PATTERNS[5];
  const assigned = {};
  workouts.forEach((w, i) => { assigned[slots[i]] = w; });
  return assigned;
}

function fmt(str = "") {
  return String(str).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Resolve metadata for display ─────────────────────────────────────────────
// Shape A: plans.metadata = profile_snapshot from PlanService.generateAndSave
//   { fitnessLevel: "very_active", dietType: "non_veg", duration: 4, goals: "weight_loss" }
//   NOTE: fitnessLevel IS the activity_level (mapped from profile.activity_level)
//
// Shape B: plans.workout_plan.meta = workout generator meta
//   { intensity: "moderate-to-high", activity_level: "very_active", ... }

function resolveMetadata(plan) {
  const shapeB_meta = plan?.workout_plan?.meta ?? {};

  // Shape B — meta is inside the workout_plan object
  if (shapeB_meta.activity_level || shapeB_meta.intensity) {
    return {
      intensity:      shapeB_meta.intensity      ?? null,
      activity_level: shapeB_meta.activity_level ?? null,
    };
  }

  // Shape A — meta is in plans.metadata (= profile_snapshot)
  // fitnessLevel field holds the activity_level value e.g. "very_active"
  const snapshot = plan?.metadata ?? {};
  return {
    intensity:      null,                            // not stored for Shape A
    activity_level: snapshot.fitnessLevel ?? null,   // e.g. "very_active"
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Plans() {
  const navigate = useNavigate();
  const [plan,       setPlan]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [alert,      setAlert]      = useState(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeDay,  setActiveDay]  = useState(null);

  useEffect(() => { fetchPlan(); }, []);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res  = await apiFetch("/plans/active");
      const data = res?.data ?? res;
      setPlan(data ?? null);
    } catch (err) {
      if (err?.status === 404) setPlan(null);
      else showAlert("error", err?.message ?? "Failed to load plan.");
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      await apiFetch("/plans/generate", { method: "POST" });
      showAlert("success", "New plan generated! 🎯");
      await fetchPlan();
      setActiveWeek(1);
      setActiveDay(null);
    } catch (err) {
      showAlert("error", err?.message ?? "Failed to generate plan. Make sure your profile is complete.");
    } finally {
      setGenerating(false);
    }
  };

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  // ── Normalize ────────────────────────────────────────────────────────────
  const totalWeeks  = plan?.duration_weeks ?? 4;
  const workoutPlan = normalizeWorkoutPlan(plan?.workout_plan, totalWeeks);
  const mealPlan    = normalizeMealPlan(plan?.meal_plan);

  const weekData  = workoutPlan.find(w => w.week === activeWeek) ?? workoutPlan[0] ?? null;
  const weekMeals = mealPlan.find(w => w.week === activeWeek)    ?? mealPlan[0]    ?? null;

  const workouts = weekData?.workouts ?? [];
  const dayMap   = assignWorkoutsToDays(workouts);

  const activeDayWorkout = activeDay != null ? (dayMap[activeDay] ?? null) : null;
  const activeDayMeal    = activeDay != null
    ? (weekMeals?.meals ?? []).find(m => m.day === activeDay) ?? (weekMeals?.meals?.[0] ?? null)
    : null;

  // ── Metadata ─────────────────────────────────────────────────────────────
  const meta          = resolveMetadata(plan);
  const metaIntensity = meta.intensity;
  const metaActivity  = meta.activity_level;

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
      {/* NAV */}
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
      </nav>

      <main className={styles.main}>
        {alert && (
          <div className={alert.type === "success" ? styles.alertSuccess : styles.alertError}>
            {alert.type === "success" ? "✅" : "❌"} {alert.msg}
          </div>
        )}

        {/* HEADER */}
        <Section delay={0}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>📋 Your Plan</h1>
              <p className={styles.sub}>
                {plan
                  ? `Generated ${new Date(plan.generated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${totalWeeks} weeks`
                  : "No active plan yet"}
              </p>
            </div>
            <button className={styles.generateBtn} onClick={generatePlan} disabled={generating}>
              {generating ? "Generating…" : plan ? "🔄 Regenerate" : "✨ Generate Plan"}
            </button>
          </div>
        </Section>

        {/* NO PLAN */}
        {!plan ? (
          <Section delay={60}>
            <div className={styles.emptyCard}>
              <span className={styles.emptyEmoji}>🎯</span>
              <h2>No Active Plan</h2>
              <p>Generate a personalized workout + meal plan based on your profile.</p>
              <button className={styles.generateBtnLg} onClick={generatePlan} disabled={generating}>
                {generating ? "Generating…" : "✨ Generate My Plan"}
              </button>
            </div>
          </Section>
        ) : (
          <>
            {/* PLAN META */}
            <Section delay={60}>
              <div className={styles.metaGrid}>
                {[
                  { icon: "🎯", label: "Goal",      val: fmt(plan.goals ?? "—") },
                  {
                    icon: "⚡", label: "Intensity",
                    // Show "Deload" during deload week; otherwise show intensity (Shape B only)
                    // or fall back to activity level label for Shape A
                    val: weekData?.is_deload
                      ? "Deload"
                      : metaIntensity
                        ? fmt(metaIntensity)
                        : metaActivity
                          ? fmt(metaActivity)
                          : "—"
                  },
                  { icon: "📅", label: "Duration",   val: `${totalWeeks} weeks` },
                  {
                    icon: "🏃", label: "Activity",
                    // Shape A: fitnessLevel = "very_active" → "Very Active"
                    // Shape B: activity_level = "very_active" → "Very Active"
                    val: fmt(metaActivity ?? "—")
                  },
                ].map(m => (
                  <div key={m.label} className={styles.metaCard}>
                    <span className={styles.metaIcon}>{m.icon}</span>
                    <span className={styles.metaVal}>{m.val}</span>
                    <span className={styles.metaLabel}>{m.label}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* WEEK SELECTOR */}
            <Section delay={80}>
              <div className={styles.weekSelector}>
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
                  const wd = workoutPlan.find(x => x.week === w);
                  return (
                    <button
                      key={w}
                      className={[
                        styles.weekTab,
                        activeWeek === w   ? styles.weekTabActive  : "",
                        wd?.is_deload      ? styles.weekTabDeload  : "",
                      ].join(" ")}
                      onClick={() => { setActiveWeek(w); setActiveDay(null); }}
                    >
                      W{w}{wd?.is_deload ? " 🔄" : ""}
                    </button>
                  );
                })}
              </div>
              {weekData?.focus && (
                <p className={styles.weekFocus}>📌 {weekData.focus}</p>
              )}
            </Section>

            {/* WEEKLY SPLIT — 7-day grid */}
            <Section delay={100}>
              <h2 className={styles.sectionTitle}>📅 Weekly Split</h2>
              <div className={styles.weekGrid}>
                {DAY_NAMES.map((day, idx) => {
                  const workout  = dayMap[idx];
                  const isToday  = idx === todayIdx;
                  const isRest   = !workout;
                  const isActive = activeDay === idx;
                  return (
                    <div
                      key={day}
                      className={[
                        styles.weekCard,
                        isToday  ? styles.today     : "",
                        isRest   ? styles.restDay   : "",
                        isActive ? styles.activeDay : "",
                      ].join(" ")}
                      onClick={() => !isRest && setActiveDay(isActive ? null : idx)}
                      style={{ cursor: isRest ? "default" : "pointer" }}
                    >
                      <span className={styles.weekDayLabel}>{day}</span>
                      {isToday && <span className={styles.todayBadge}>Today</span>}
                      <div className={styles.weekGroups}>
                        {workout ? (
                          <>
                            <span className={styles.weekGroup}>{workout.split}</span>
                            {workout.estimated_kcal_burned > 0 && (
                              <span className={styles.weekKcal}>~{workout.estimated_kcal_burned} kcal</span>
                            )}
                          </>
                        ) : (
                          <span className={styles.weekGroup}>Rest</span>
                        )}
                      </div>
                      {workout?.muscle_groups?.length > 0 && (
                        <div className={styles.muscleChips}>
                          {workout.muscle_groups.slice(0, 2).map(m => (
                            <span key={m} className={styles.muscleChip}>{m}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* DAY DETAIL PANEL */}
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
                      <p className={styles.dayPanelSub}>
                        {activeDayWorkout.muscle_groups?.join(" · ")}
                      </p>
                    </div>
                    <button className={styles.closePanelBtn} onClick={() => setActiveDay(null)}>✕</button>
                  </div>

                  {/* EXERCISES */}
                  <div className={styles.exerciseList}>
                    {(activeDayWorkout.exercises ?? []).length === 0 ? (
                      <p className={styles.noExercises}>
                        Exercise details will populate once your first session is logged.
                      </p>
                    ) : (
                      activeDayWorkout.exercises.map((ex, i) => (
                        <div key={i} className={`${styles.exerciseCard} ${ex.deload ? styles.deloadEx : ""}`}>
                          <div className={styles.exHeader}>
                            <span className={styles.exNum}>{i + 1}</span>
                            <span className={styles.exName}>{ex.name}</span>
                            {ex.deload && <span className={styles.deloadBadge}>Deload</span>}
                          </div>
                          <div className={styles.exMeta}>
                            {ex.sets         != null && <span className={styles.exStat}>🔢 {ex.sets} sets</span>}
                            {ex.reps         != null && <span className={styles.exStat}>🔁 {ex.reps} reps</span>}
                            {ex.duration_sec != null && <span className={styles.exStat}>⏱ {ex.duration_sec}s</span>}
                            {ex.duration_min != null && <span className={styles.exStat}>⏱ {ex.duration_min} min</span>}
                            {ex.weight_kg    >  0    && <span className={styles.exStat}>🏋️ {ex.weight_kg} kg</span>}
                            {ex.est_kcal     >  0    && <span className={styles.exStat}>🔥 ~{ex.est_kcal} kcal</span>}
                          </div>
                          {ex.muscles?.length > 0 && (
                            <div className={styles.exMuscles}>
                              {ex.muscles.map(m => (
                                <span key={m} className={styles.muscleChip}>{m}</span>
                              ))}
                            </div>
                          )}
                          {ex.progression_note && (
                            <p className={styles.progressionNote}>📈 {ex.progression_note}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* MEALS FOR THIS DAY */}
                  {activeDayMeal && (
                    <div className={styles.mealPanel}>
                      <h3 className={styles.mealPanelTitle}>🍽️ Today's Meals</h3>
                      <div className={styles.mealGrid}>
                        {[
                          { label: "🌅 Breakfast", val: activeDayMeal.breakfast },
                          { label: "☀️ Lunch",     val: activeDayMeal.lunch     },
                          { label: "🌙 Dinner",    val: activeDayMeal.dinner    },
                          { label: "🥜 Snack",     val: activeDayMeal.snack     },
                        ].filter(m => m.val).map(m => (
                          <div key={m.label} className={styles.mealCard}>
                            <span className={styles.mealLabel}>{m.label}</span>
                            <span className={styles.mealVal}>{m.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* FULL WEEK MEAL PLAN */}
            {!activeDayWorkout && weekMeals?.meals?.length > 0 && (
              <Section delay={160}>
                <h2 className={styles.sectionTitle}>🍽️ Week {activeWeek} Meals</h2>
                <div className={styles.mealWeekGrid}>
                  {weekMeals.meals.map((meal, i) => (
                    <div key={i} className={styles.mealWeekCard}>
                      <div className={styles.mealWeekDay}>Day {meal.day}</div>
                      <div className={styles.mealRow}><span className={styles.mealRowLabel}>Breakfast</span><span>{meal.breakfast}</span></div>
                      <div className={styles.mealRow}><span className={styles.mealRowLabel}>Lunch</span><span>{meal.lunch}</span></div>
                      <div className={styles.mealRow}><span className={styles.mealRowLabel}>Dinner</span><span>{meal.dinner}</span></div>
                      <div className={styles.mealRow}><span className={styles.mealRowLabel}>Snack</span><span>{meal.snack}</span></div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </main>
    </div>
  );
}