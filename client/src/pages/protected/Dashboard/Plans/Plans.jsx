import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../../context/AuthContext";
import { getMyProfile } from "../../../../services/profileService";
import { apiFetch } from "../../../../services/apiClient";
import ThemeToggle from "../../../../components/ThemeToggle/ThemeToggle";
import styles from "./plans.module.css";

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

function normalizeMealPlan(raw) {
  return Array.isArray(raw) ? raw : [];
}

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
        workouts.find(w =>
          w.muscle_groups?.some(mg =>
            muscleGroups.some(pg => pg.toLowerCase() === mg.toLowerCase())
          )
        ) ??
        workouts.find(w =>
          muscleGroups.some(pg =>
            w.split?.toLowerCase().includes(pg.toLowerCase())
          )
        );
      if (match) assigned[idx] = match;
    });
    return assigned;
  }

  const PATTERNS = {
    1: [1], 2: [1, 4], 3: [1, 3, 5],
    4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [0, 1, 2, 3, 4, 5],
  };
  const count    = Math.min(workouts.length, 6);
  const slots    = PATTERNS[count] ?? PATTERNS[5];
  const assigned = {};
  workouts.forEach((w, i) => { if (slots[i] !== undefined) assigned[slots[i]] = w; });
  return assigned;
}

function fmt(str = "") {
  return String(str).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function resolveMetadata(plan) {
  const shapeB_meta = plan?.workout_plan?.meta ?? {};
  if (shapeB_meta.activity_level || shapeB_meta.intensity) {
    return { intensity: shapeB_meta.intensity ?? null, activity_level: shapeB_meta.activity_level ?? null };
  }
  const snapshot = plan?.metadata ?? {};
  return { intensity: null, activity_level: snapshot.fitnessLevel ?? null };
}

function XPBar({ xp = 0, level = {}, streak = {} }) {
  const pct   = level.progress_pct ?? 0;
  const label = LEVEL_LABELS[level.current] ?? `Level ${level.current}`;
  return (
    <div className={styles.xpBar}>
      <div className={styles.xpMeta}>
        <span className={styles.xpLevel}>{label}</span>
        <div className={styles.xpRight}>
          {streak.current > 0 && <span className={styles.xpStreak}>🔥 {streak.current} day streak</span>}
          <span className={styles.xpPoints}>{xp.toLocaleString()} XP</span>
        </div>
      </div>
      <div className={styles.xpTrack}>
        <div className={styles.xpFill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.xpFooter}>
        <span>{pct}% to level {(level.current ?? 1) + 1}</span>
        {level.xp_to_next > 0 && <span>{level.xp_to_next} XP to go</span>}
      </div>
    </div>
  );
}

function BadgeList({ badges = [] }) {
  if (!badges.length) return null;
  return (
    <div className={styles.badgeList}>
      {badges.map(b => <span key={b.id} className={styles.badge}>{b.label}</span>)}
    </div>
  );
}

function PhaseBadge({ blockWeek }) {
  const p = PHASE_META[blockWeek] ?? PHASE_META[1];
  return (
    <span className={styles.phaseBadge} style={{ color: p.color, borderColor: `${p.color}44`, background: `${p.color}12` }}>
      {p.icon} {p.label}
    </span>
  );
}

function WarmupBlock({ items = [], type }) {
  if (!items.length) return null;
  const isWarmup = type === "warmup";
  return (
    <div className={isWarmup ? styles.warmupBlock : styles.cooldownBlock}>
      <div className={styles.warmupTitle}>{isWarmup ? "🔥 Warm-Up" : "🧊 Cool-Down"}</div>
      <div className={styles.warmupItems}>
        {items.map((item, i) => (
          <span key={i} className={styles.warmupItem}>
            {item.name}{item.duration_min && ` · ${item.duration_min} min`}
          </span>
        ))}
      </div>
    </div>
  );
}

function NutritionTargets({ targets }) {
  if (!targets?.kcal && !targets?.protein_g) return null;
  return (
    <div className={styles.nutTargets}>
      <div className={styles.nutTargetsTitle}>🎯 Today's Nutrition Targets</div>
      <div className={styles.nutTargetsGrid}>
        {[
          { label: "Calories", val: targets.kcal        ? `${targets.kcal} kcal`    : null, color: "#f59e0b" },
          { label: "Protein",  val: targets.protein_g   ? `${targets.protein_g}g`   : null, color: "#ef4444" },
          { label: "Carbs",    val: targets.carbs_g     ? `${targets.carbs_g}g`     : null, color: "#3b82f6" },
          { label: "Fats",     val: targets.fat_g       ? `${targets.fat_g}g`       : null, color: "#10b981" },
          { label: "Water",    val: targets.hydration_L ? `${targets.hydration_L}L` : null, color: "#06b6d4" },
        ].filter(t => t.val).map(t => (
          <div key={t.label} className={styles.nutTargetChip} style={{ borderColor: `${t.color}44`, color: t.color }}>
            <span className={styles.nutTargetVal}>{t.val}</span>
            <span className={styles.nutTargetLabel}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WellnessCard({ wellness }) {
  if (!wellness) return null;
  return (
    <div className={styles.wellnessCard}>
      <div className={styles.wellnessTitle}>💧 Daily Wellness</div>
      <div className={styles.wellnessRow}>
        <span className={styles.wellnessItem}>💧 {wellness.water_L}L water daily</span>
        {wellness.caffeine_advice && <span className={styles.wellnessItem}>☕ {wellness.caffeine_advice}</span>}
      </div>
      {wellness.electrolyte_sources?.length > 0 && (
        <div className={styles.electroRow}>
          <span className={styles.electroLabel}>⚡ Electrolytes:</span>
          {wellness.electrolyte_sources.map(e => <span key={e} className={styles.electroChip}>{e}</span>)}
        </div>
      )}
    </div>
  );
}

function RecoveryProtocol({ protocol, isDeload }) {
  const [open, setOpen] = useState(false);
  if (!protocol) return null;
  return (
    <div className={styles.recoveryBlock}>
      <button className={styles.recoveryToggle} onClick={() => setOpen(o => !o)}>
        {isDeload ? "🔄 Deload Recovery Protocol" : "🛌 Recovery Protocol"} {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className={styles.recoveryContent}>
          <div className={styles.recoveryRow}><span>😴 Sleep target:</span><strong>{protocol.sleep_hours_target}h</strong></div>
          <div className={styles.recoveryRow}><span>🚶 Rest days:</span><strong>{protocol.rest_day_activity}</strong></div>
          {protocol.sleep_tips?.length > 0 && (
            <div className={styles.recoveryTips}>
              {protocol.sleep_tips.map(tip => <span key={tip} className={styles.recoveryTip}>• {tip}</span>)}
            </div>
          )}
          {protocol.recovery_tools?.length > 0 && (
            <div className={styles.recoveryTools}>
              {protocol.recovery_tools.map(tool => <span key={tool} className={styles.recoveryTool}>{tool}</span>)}
            </div>
          )}
          {protocol.protein_timing && <div className={styles.recoveryProteinNote}>🥩 {protocol.protein_timing}</div>}
        </div>
      )}
    </div>
  );
}

function MissedRecoveryChip({ suggestion, onLog }) {
  if (!suggestion) return null;
  return (
    <div className={styles.missedChip}>
      <span className={styles.missedIcon}>⚠️</span>
      <span className={styles.missedText}>Missed? Try: <em>{suggestion}</em></span>
      {onLog && <button className={styles.missedBtn} onClick={onLog}>Log Makeup</button>}
    </div>
  );
}

function MacroSummaryCard({ macros }) {
  if (!macros) return null;
  return (
    <div className={styles.macroSummary}>
      <div className={styles.macroSummaryTitle}>📊 Weekly Macro Targets</div>
      <div className={styles.macroSummaryGrid}>
        {[
          { label: "Daily kcal", val: macros.dailyKcal,    unit: "kcal", color: "#f59e0b" },
          { label: "Protein",    val: macros.proteinTarget, unit: "g",   color: "#ef4444" },
          { label: "Carbs",      val: macros.carbsTarget,   unit: "g",   color: "#3b82f6" },
          { label: "Fats",       val: macros.fatTarget,     unit: "g",   color: "#10b981" },
        ].filter(m => m.val != null).map(m => (
          <div key={m.label} className={styles.macroSummaryItem}>
            <span className={styles.macroSummaryVal} style={{ color: m.color }}>{m.val}{m.unit}</span>
            <span className={styles.macroSummaryLabel}>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdaptiveBanner({ signal }) {
  if (!signal || signal.signal === "maintain") return null;
  const isIncrease = signal.signal === "increase";
  return (
    <div className={styles.adaptiveBanner} style={{
      background: isIncrease ? "#10b98118" : "#ef444418",
      borderColor: isIncrease ? "#10b98144" : "#ef444444",
    }}>
      <span>{isIncrease ? "🚀" : "😮‍💨"}</span>
      <span className={styles.adaptiveText}>{signal.message}</span>
    </div>
  );
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
  const [adaptSignal,  setAdaptSignal]  = useState(null);
  const [missedInfo,   setMissedInfo]   = useState(null);
  const [avatarUrl,    setAvatarUrl]    = useState(null);

  const displayName = user?.name ?? "User";
  const initials    = displayName.split(" ").map(n => n[0] ?? "").join("").slice(0, 2).toUpperCase();

  useEffect(() => { fetchPlan(); fetchGamification(); fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const raw  = await getMyProfile();
      const data = raw?.data ?? raw;
      const resolved =
        data?.avatar_url       ??
        data?.data?.avatar_url ??
        data?.url              ??
        data?.data?.url        ??
        null;
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
    } finally {
      setLoading(false);
    }
  };

  const fetchGamification = async () => {
    try {
      const res = await apiFetch("/plans/gamification");
      setGamification(res?.data ?? res ?? null);
    } catch {}
  };

  const fetchMissedRecovery = async (split) => {
    try {
      const res = await apiFetch("/plans/missed-workout", {
        method: "POST", body: JSON.stringify({ split }),
      });
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
    } finally {
      setGenerating(false);
    }
  };

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const totalWeeks  = plan?.duration_weeks ?? 4;
  const workoutPlan = normalizeWorkoutPlan(plan?.workout_plan, totalWeeks);
  const mealPlan    = normalizeMealPlan(plan?.meal_plan);
  const weekData    = workoutPlan.find(w => w.week === activeWeek) ?? workoutPlan[0] ?? null;
  const weekMeals   = mealPlan.find(w => w.week === activeWeek)    ?? mealPlan[0]    ?? null;
  const workouts    = weekData?.workouts ?? [];

  const rawWeeklyPlan = isShapeB(plan?.workout_plan) ? (plan.workout_plan.weekly_plan ?? {}) : {};
  const dayMap        = assignWorkoutsToDays(workouts, rawWeeklyPlan);

  const activeDayWorkout = activeDay != null ? (dayMap[activeDay] ?? null) : null;
  const activeDayMeal    = activeDay != null
    ? (weekMeals?.meals ?? []).find(m => m.day === activeDay) ?? (weekMeals?.meals?.[0] ?? null)
    : null;

  const meta          = resolveMetadata(plan);
  const metaIntensity = meta.intensity;
  const metaActivity  = meta.activity_level;
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
        <div className={styles.navTabs}>
          {NAV_TABS.map(t => (
            <button
              key={t.key}
              className={`${styles.navTab}${activeTab === t.key ? " " + styles.navTabActive : ""}`}
              onClick={() => navigate(t.path)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className={styles.navRight}>
          <ThemeToggle />
          <a href="/profile" className={styles.navAvatarLink} title="Edit profile">
            <NavAvatar avatarUrl={avatarUrl} initials={initials} />
          </a>
        </div>
      </nav>

      <main className={styles.main}>
        {alert && (
          <div className={alert.type === "success" ? styles.alertSuccess : styles.alertError}>
            {alert.type === "success" ? "✅" : "❌"} {alert.msg}
          </div>
        )}

        {gamification && (
          <Section delay={0}>
            <XPBar xp={gamification.xp} level={gamification.level} streak={gamification.streak} />
            <BadgeList badges={gamification.badges ?? []} />
          </Section>
        )}

        <AdaptiveBanner signal={adaptSignal} />

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
            <Section delay={60}>
              <div className={styles.metaGrid}>
                {[
                  { icon: "🎯", label: "Goal",      val: fmt(plan.goals ?? "—") },
                  { icon: "⚡", label: "Intensity",
                    val: weekData?.is_deload ? "Deload"
                      : metaIntensity ? fmt(metaIntensity)
                      : metaActivity  ? fmt(metaActivity) : "—" },
                  { icon: "📅", label: "Duration",  val: `${totalWeeks} weeks` },
                  { icon: "🏃", label: "Activity",  val: fmt(metaActivity ?? "—") },
                ].map(m => (
                  <div key={m.label} className={styles.metaCard}>
                    <span className={styles.metaIcon}>{m.icon}</span>
                    <span className={styles.metaVal}>{m.val}</span>
                    <span className={styles.metaLabel}>{m.label}</span>
                  </div>
                ))}
              </div>
              {planSummary?.macro_targets && <MacroSummaryCard macros={planSummary.macro_targets} />}
            </Section>

            <Section delay={80}>
              <div className={styles.weekSelector}>
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
                  const wd = workoutPlan.find(x => x.week === w);
                  const bw = ((w - 1) % 4) + 1;
                  const p  = PHASE_META[bw];
                  return (
                    <button
                      key={w}
                      className={[
                        styles.weekTab,
                        activeWeek === w ? styles.weekTabActive : "",
                        wd?.is_deload   ? styles.weekTabDeload : "",
                      ].join(" ")}
                      style={activeWeek === w ? { borderColor: p.color, color: p.color } : {}}
                      onClick={() => { setActiveWeek(w); setActiveDay(null); }}
                    >
                      W{w} {p.icon}
                    </button>
                  );
                })}
              </div>
              {weekData && (
                <div className={styles.weekFocusRow}>
                  {weekData.focus && <p className={styles.weekFocus}>📌 {weekData.focus}</p>}
                  <PhaseBadge blockWeek={blockWeek} />
                </div>
              )}
            </Section>

            {weekData && (
              <Section delay={90}>
                <div className={styles.wellnessRecoveryRow}>
                  <WellnessCard wellness={plan?.daily_wellness ?? weekData?.daily_wellness ?? null} />
                  <RecoveryProtocol
                    protocol={plan?.recovery_protocol ?? weekData?.recovery_protocol ?? null}
                    isDeload={weekData.is_deload}
                  />
                </div>
              </Section>
            )}

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
                      onClick={() => {
                        if (!isRest) {
                          const nextActive = isActive ? null : idx;
                          setActiveDay(nextActive);
                          if (nextActive !== null && workout?.split && !isActive) {
                            fetchMissedRecovery(workout.split);
                          }
                        }
                      }}
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

                  {missedInfo && <MissedRecoveryChip suggestion={missedInfo.recovery_suggestion} />}
                  <WarmupBlock items={activeDayWorkout.warmup ?? []} type="warmup" />

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
                              {ex.muscles.map(m => <span key={m} className={styles.muscleChip}>{m}</span>)}
                            </div>
                          )}
                          {ex.progression_note && <p className={styles.progressionNote}>📈 {ex.progression_note}</p>}
                        </div>
                      ))
                    )}
                  </div>

                  <WarmupBlock items={activeDayWorkout.cooldown ?? []} type="cooldown" />
                  {activeDayWorkout.recovery_reminder && (
                    <div className={styles.recoveryReminder}>⚠️ {activeDayWorkout.recovery_reminder}</div>
                  )}

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
                      <NutritionTargets targets={activeDayMeal.daily_targets ?? null} />
                    </div>
                  )}
                </div>
              </Section>
            )}

            {!activeDayWorkout && (
  <Section delay={160}>
    <div style={{
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: 16,
      padding: "24px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: 12,
    }}>
      <span style={{ fontSize: 36 }}>🍽️</span>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
        AI Meal Planner
      </div>
      <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, maxWidth: 340 }}>
        Get personalized Nepali meal plans based on your goals, weight, and medical conditions — powered by Groq AI.
      </div>
      <button
        onClick={() => navigate("/meal-plan")}
        style={{
          marginTop: 4,
          padding: "11px 24px",
          background: "linear-gradient(135deg, #FF5C1A, #FF8A3D)",
          border: "none",
          borderRadius: 10,
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Open Meal Planner →
      </button>
    </div>
  </Section>
)}
          </>
        )}
      </main>
    </div>
  );
}