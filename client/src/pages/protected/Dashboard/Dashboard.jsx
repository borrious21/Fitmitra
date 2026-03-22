import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Dashboard.module.css";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";
import AiCoach from "../../../components/AiCoach/AiCoach";
import SmartRecommendations from "../../../components/Smartrecommendation/Smartrecommendation.jsx";
import HealthInsights from "../../../components/HealthInsights/HealthInsights.jsx";
import NotificationBell from "../../../components/NotificationBell/NotificationBell.jsx";
import { AuthContext } from "../../../context/AuthContext";
import { getMyProfile } from "../../../services/profileService";
import {
  getDashboardNutrition, getDashboardWorkout, getDashboardMeals,
  getDashboardHealth, getDashboardWeekly, getDashboardStreak,
} from "../../../services/dashboardService";
import { apiFetch } from "../../../services/apiClient";
import { buildFitnessData } from "../../../utils/buildFitnessData";

const GOAL_LABELS = {
  weight_loss: "Weight Loss", maintain_fitness: "Maintain Fitness",
  muscle_gain: "Muscle Gain", endurance: "Endurance", wellness: "Wellness",
};

const NAV_TABS = [
  { key: "today",    label: "today",    path: "/dashboard" },
  { key: "progress", label: "progress", path: "/progress"  },
  { key: "plans",    label: "plans",    path: "/plans"      },
];

const PROGRESSION_LABELS = {
  reps_increase:   { label: "📈 +1 Rep",   color: "#10b981" },
  weight_increase: { label: "🏋️ +2.5kg",   color: "#f59e0b" },
  set_increase:    { label: "➕ +1 Set",   color: "#6366f1" },
  deload:          { label: "🔄 Deload",   color: "#64748b" },
  maintain:        { label: "✓ Maintain",  color: "#94a3b8" },
  maintain_hard:   { label: "💪 Hold",     color: "#f97316" },
  at_ceiling:      { label: "🏆 Peak",     color: "#eab308" },
};

const LEVEL_LABELS = {
  1:"🌱 Rookie", 2:"🏃 Mover", 3:"💪 Grinder", 4:"🔥 Crusher",
  5:"⚡ Athlete", 6:"🥈 Contender", 7:"🥇 Champion", 8:"🏆 Elite",
  9:"💎 Legend", 10:"🚀 GOAT",
};

function getMealMeta(meal) {
  const t = (meal.time ?? meal.meal_type ?? "").toLowerCase();
  if (t.includes("breakfast") || t.includes("morning") || meal.emoji === "🌅") return { emoji: "🌅", label: "Breakfast" };
  if (t.includes("lunch")     || t.includes("afternoon")|| meal.emoji === "☀️") return { emoji: "☀️", label: "Lunch" };
  if (t.includes("dinner")    || t.includes("evening")  || meal.emoji === "🌙") return { emoji: "🌙", label: "Dinner" };
  if (t.includes("snack")                                || meal.emoji === "🥜") return { emoji: "🥜", label: "Snack" };
  if (/^\d{1,2}:\d{2}/.test(t)) return { emoji: "🥜", label: "Snack" };
  return { emoji: meal.emoji ?? "🍽️", label: meal.time ?? "Meal" };
}

function fmtMacro(v) {
  const n = Number(v);
  if (!n) return "0";
  return String(Math.round(n * 10) / 10);
}

function pct(v, t) { return t ? Math.min(100, Math.round((v / t) * 100)) : 0; }

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round(from + (1 - Math.pow(1 - p, 3)) * (target - from)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

function AnimNum({ value, decimals = 0 }) {
  const n = useCountUp(typeof value === "number" ? value : 0);
  if (typeof value !== "number") return <span>{value}</span>;
  return <span>{decimals > 0 ? n.toFixed(decimals) : n}</span>;
}

function Section({ children, hidden, delay = 0 }) {
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
  if (hidden) return null;
  return (
    <div ref={ref} className={`${styles.section}${vis ? " " + styles.visible : ""}`}>
      {children}
    </div>
  );
}

function MacroBar({ label, value, target, fillColor }) {
  const p = pct(value, target);
  return (
    <div className={styles.macroRow}>
      <div className={styles.macroHead}>
        <span>{label}</span>
        <span>{value}g <span className={styles.macroDenom}>/ {target}g</span></span>
      </div>
      <div className={styles.macroTrack}>
        <div className={styles.macroFill} style={{ width: `${p}%`, background: fillColor }} />
      </div>
    </div>
  );
}

function NavAvatar({ avatarUrl, initials }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [avatarUrl]);
  if (avatarUrl && !imgError) {
    return <img src={avatarUrl} alt="avatar" className={styles.navAvatarImg} onError={() => setImgError(true)} />;
  }
  return <div className={styles.navAvatar}>{initials}</div>;
}

function LoadingCard({ height = 120 }) {
  return <div className={styles.card} style={{ minHeight: height }}><div className={styles.skeleton} /></div>;
}

function EmptyState({ icon, message, actionLabel, onAction }) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>{icon}</span>
      <p className={styles.emptyMsg}>{message}</p>
      {actionLabel && <button className={styles.ghostBtn} onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

function RestDayCard({ mesocycleWeek, missedRecovery }) {
  return (
    <div className={`${styles.card} ${styles.accent}`}>
      <span className={styles.secLabel}>💪 Today's Workout</span>
      {mesocycleWeek && <span className={styles.mesoBadge}>Week {mesocycleWeek} of 4</span>}
      <div className={styles.restDayWrap}>
        <span className={styles.restDayEmoji}>🛌</span>
        <div className={styles.restDayText}>
          <div className={styles.restDayTitle}>Rest Day</div>
          <div className={styles.restDaySub}>Recovery is where gains happen. Stay hydrated, stretch lightly, and let your body rebuild.</div>
        </div>
      </div>
      <div className={styles.restTips}>
        {["💧 Drink at least 2L of water", "🧘 10 min light stretching", "😴 Aim for 8h sleep tonight"].map(tip => (
          <div key={tip} className={styles.restTip}>{tip}</div>
        ))}
      </div>
      {missedRecovery && (
        <div className={styles.missedRecoveryChip}>
          <span>⚡ Missed yesterday? Try: <em>{missedRecovery}</em></span>
        </div>
      )}
    </div>
  );
}

function checkRestDay(workout) {
  if (!workout) return false;
  const hasExercises = Array.isArray(workout.exercises) && workout.exercises.length > 0;
  if (hasExercises) return false;
  if (workout.isRestDay === true || workout.is_rest_day === true) return true;
  const name = (workout.name ?? "").toLowerCase().trim();
  return name === "rest day" || name === "rest" || name === "recovery day";
}

function ProgressionChip({ note }) {
  const info = PROGRESSION_LABELS[note];
  if (!info) return null;
  return (
    <span className={styles.progressionChip} style={{ color: info.color, borderColor: `${info.color}44`, background: `${info.color}12` }}>
      {info.label}
    </span>
  );
}

function PRBanner({ prs }) {
  const recent = prs.filter(pr => (Date.now() - new Date(pr.achieved_at).getTime()) / 86400000 <= 7);
  if (!recent.length) return null;
  return (
    <div className={styles.prBanner}>
      <span className={styles.prBannerIcon}>🏅</span>
      <span className={styles.prBannerText}>
        New PR this week: {recent[0].exercise_name} — {recent[0].best_1rm}kg est. 1RM
        {recent.length > 1 && ` (+${recent.length - 1} more)`}
      </span>
    </div>
  );
}

function VolumeSpark({ delta }) {
  if (delta === null || delta === undefined) return null;
  const up = delta >= 0;
  return <span className={styles.volSpark} style={{ color: up ? "#10b981" : "#ef4444" }}>{up ? "▲" : "▼"} {Math.abs(delta)}%</span>;
}

function ExerciseReps({ ex }) {
  const repsPart = ex.reps != null ? ` × ${ex.reps} reps`
    : ex.duration_min != null ? ` × ${ex.duration_min} min`
    : ex.duration_sec != null ? ` × ${ex.duration_sec}s`
    : ex.duration     != null ? ` × ${ex.duration}`
    : "";
  return (
    <div className={styles.exerciseReps}>
      {ex.sets} sets{repsPart}
      {ex.weight_kg > 0 && ` · ${ex.weight_kg}kg`}
    </div>
  );
}

function XPBar({ xp = 0, level = {}, streak = {} }) {
  const p     = level.progress_pct ?? 0;
  const label = LEVEL_LABELS[level.current] ?? `Level ${level.current ?? 1}`;
  return (
    <div className={styles.xpBarWrap}>
      <div className={styles.xpBarMeta}>
        <span className={styles.xpLabel}>{label}</span>
        <div className={styles.xpRight}>
          {streak?.current > 0 && <span className={styles.xpStreak}>🔥 {streak.current}-day streak</span>}
          <span className={styles.xpPoints}>{(xp ?? 0).toLocaleString()} XP</span>
        </div>
      </div>
      <div className={styles.xpTrack}>
        <div className={styles.xpFill} style={{ width: `${p}%` }} />
        <div className={styles.xpGlow} style={{ left: `${p}%` }} />
      </div>
      <div className={styles.xpFooterRow}>
        <span>{p}% to level {(level.current ?? 1) + 1}</span>
        {level.xp_to_next > 0 && <span>{level.xp_to_next} XP to next level</span>}
      </div>
    </div>
  );
}

function BadgeRow({ badges = [] }) {
  if (!badges.length) return null;
  return (
    <div className={styles.badgeRow}>
      {badges.map(b => <span key={b.id} className={styles.gameBadge}>{b.label}</span>)}
    </div>
  );
}

function AdaptiveBanner({ signal }) {
  if (!signal || signal.signal === "maintain") return null;
  const isUp = signal.signal === "increase";
  return (
    <div className={styles.adaptiveBanner} style={{
      background: isUp ? "#10b98115" : "#ef444415",
      borderColor: isUp ? "#10b98140" : "#ef444440",
    }}>
      <span className={styles.adaptiveIcon}>{isUp ? "🚀" : "😮‍💨"}</span>
      <span className={styles.adaptiveText}>{signal.message}</span>
      <button className={styles.adaptiveCta}>{isUp ? "Level Up Plan" : "Ease Up"}</button>
    </div>
  );
}

function DeloadWellnessCard({ recovery }) {
  if (!recovery) return null;
  return (
    <div className={styles.deloadWellnessCard}>
      <div className={styles.deloadWellnessTitle}>🔄 Deload Week — Recovery Mode</div>
      <div className={styles.deloadWellnessRow}>
        <span>😴 Sleep target: <strong>{recovery.sleep_hours_target}h</strong></span>
        <span>🚶 {recovery.rest_day_activity}</span>
      </div>
      {recovery.recovery_tools?.length > 0 && (
        <div className={styles.deloadTools}>
          {recovery.recovery_tools.map(t => <span key={t} className={styles.deloadTool}>{t}</span>)}
        </div>
      )}
      {recovery.sleep_tips?.length > 0 && (
        <div className={styles.deloadSleepTips}>
          {recovery.sleep_tips.map(tip => <div key={tip} className={styles.deloadTip}>• {tip}</div>)}
        </div>
      )}
    </div>
  );
}

function ProgressMetricsCard({ metrics }) {
  if (!metrics) return null;
  const hasWeight = metrics.weight_change_kg !== undefined;
  const hasPRs    = metrics.strength_prs && Object.keys(metrics.strength_prs).length > 0;
  if (!hasWeight && !hasPRs) return null;
  return (
    <div className={`${styles.card} ${styles.accent}`}>
      <div className={styles.perfHeader}><span className={styles.secLabel}>📊 Progress Metrics</span></div>
      <div className={styles.progMetricsGrid}>
        {hasWeight && (
          <div className={styles.progMetricItem}>
            <span className={styles.progMetricIcon}>⚖️</span>
            <span className={styles.progMetricVal} style={{ color: metrics.weight_change_kg <= 0 ? "#10b981" : "#f59e0b" }}>
              {metrics.weight_change_kg > 0 ? "+" : ""}{metrics.weight_change_kg} kg
            </span>
            <span className={styles.progMetricLabel}>Weight change</span>
            <span className={styles.progMetricTrend}>{metrics.weight_trend}</span>
          </div>
        )}
        {hasPRs && Object.entries(metrics.strength_prs).slice(0, 3).map(([name, kg]) => (
          <div key={name} className={styles.progMetricItem}>
            <span className={styles.progMetricIcon}>🏅</span>
            <span className={styles.progMetricVal} style={{ color: "#f59e0b" }}>{kg} kg</span>
            <span className={styles.progMetricLabel}>{name}</span>
            <span className={styles.progMetricTrend}>Best lift</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WarmupReminder({ warmup = [] }) {
  if (!warmup.length) return null;
  return (
    <div className={styles.warmupReminder}>
      <span className={styles.warmupReminderIcon}>🔥</span>
      <span>Warm-up first: {warmup.map(w => w.name).join(" · ")}</span>
    </div>
  );
}

function MealsCard({ meals, onLogMeal }) {
  const totalCal = meals.reduce((s, m) => s + (Number(m.cal) || 0), 0);
  const totalP   = meals.reduce((s, m) => s + (Number(m.p)   || 0), 0);
  return (
    <div className={`${styles.card} ${styles.accent}`}>
      <div className={styles.mealsSectionHeader}>
        <span className={styles.secLabel}>Meals Today</span>
        <div className={styles.mealsTotals}>
          {totalCal > 0 && <span className={styles.mealsTotalChip}>{totalCal} kcal total</span>}
          {totalP   > 0 && (
            <span className={styles.mealsTotalChip} style={{ color: "#FF8A3D", borderColor: "rgba(255,138,61,0.3)" }}>
              P {fmtMacro(totalP)}g
            </span>
          )}
        </div>
      </div>
      <div className={styles.mealsStack}>
        {meals.map((m, idx) => {
          const meta = getMealMeta(m);
          return (
            <div key={m.id ?? idx} className={styles.mealStackRow}>
              <span className={styles.mealStackEmoji}>{meta.emoji}</span>
              <div className={styles.mealStackBody}>
                <div className={styles.mealStackTop}>
                  <span className={styles.mealStackLabel}>{meta.label}</span>
                  {m.cal > 0 && <span className={styles.mealStackCal}>{m.cal} kcal</span>}
                </div>
                <div className={styles.mealStackName}>{m.name}</div>
                {(m.p > 0 || m.c > 0 || m.f > 0) && (
                  <div className={styles.mealStackMacros}>
                    {m.p > 0 && <span className={styles.mealMacroChip} style={{ color: "#FF5C1A", borderColor: "rgba(255,92,26,0.2)", background: "rgba(255,92,26,0.06)" }}>P {fmtMacro(m.p)}g</span>}
                    {m.c > 0 && <span className={styles.mealMacroChip} style={{ color: "#00C8E0", borderColor: "rgba(0,200,224,0.2)", background: "rgba(0,200,224,0.06)" }}>C {fmtMacro(m.c)}g</span>}
                    {m.f > 0 && <span className={styles.mealMacroChip} style={{ color: "#B8F000", borderColor: "rgba(184,240,0,0.2)", background: "rgba(184,240,0,0.06)" }}>F {fmtMacro(m.f)}g</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button className={styles.ghostBtn} style={{ marginTop: "0.875rem" }} onClick={onLogMeal}>+ Log Meal</button>
    </div>
  );
}

function PerformanceCard({ prs, volumeDelta, dashboard, onViewAll }) {
  const [expanded, setExpanded] = useState(false);
  const filteredVol  = volumeDelta.filter(v => v.delta_pct !== null);
  const visiblePRs   = expanded ? prs         : prs.slice(0, 3);
  const visibleVol   = expanded ? filteredVol : filteredVol.slice(0, 2);
  const totalEntries = prs.length + filteredVol.length;
  const hasMore      = prs.length > 3 || filteredVol.length > 2;
  return (
    <div className={`${styles.card} ${styles.accent}`}>
      <div className={styles.perfHeader}>
        <span className={styles.secLabel}>📊 Performance Snapshot</span>
        <button className={styles.ghostBtnSm} onClick={onViewAll}>Full Progress →</button>
      </div>
      <div className={styles.perfGrid}>
        {visiblePRs.map(pr => (
          <div key={pr.exercise_name} className={styles.prCard}>
            <span className={styles.prIcon}>🏅</span>
            <div className={styles.prExName}>{pr.exercise_name}</div>
            <div className={styles.prStats}>
              <span className={styles.prMain}>{pr.best_1rm}kg</span>
              <span className={styles.prSub}>est. 1RM</span>
            </div>
            <div className={styles.prDate}>
              {new Date(pr.achieved_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
            </div>
          </div>
        ))}
        {visibleVol.map(v => (
          <div key={v.exercise_name} className={styles.volCard}>
            <span className={styles.volIcon}>📈</span>
            <div className={styles.volExName}>{v.exercise_name}</div>
            <div className={styles.volStats}>
              <VolumeSpark delta={v.delta_pct} />
              <span className={styles.volSub}>vs last week</span>
            </div>
            <div className={styles.volVol}>{Math.round(v.this_week_volume)}kg vol.</div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button className={styles.showMoreBtn} onClick={() => setExpanded(e => !e)}>
          {expanded ? "▲ Show Less" : `▼ Show All ${totalEntries} Entries`}
        </button>
      )}
      {dashboard?.strength_improvements?.length > 0 && (
        <div className={styles.strengthBar}>
          <span className={styles.strengthBarLabel}>💪 Strength gains (30d):</span>
          {(expanded ? dashboard.strength_improvements : dashboard.strength_improvements.slice(0, 3)).map(s => (
            <span key={s.exercise_name} className={styles.strengthChip}
              style={{ color: s.improvement_pct >= 0 ? "#10b981" : "#ef4444" }}>
              {s.exercise_name} {s.improvement_pct >= 0 ? "+" : ""}{s.improvement_pct}%
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = NAV_TABS.find(t => t.path === location.pathname)?.key ?? "today";

  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [avatarUrl,       setAvatarUrl]       = useState(null);
  const [goalLabel,       setGoalLabel]       = useState("—");
  const [weight,          setWeight]          = useState(null);
  const [nutrition,       setNutrition]       = useState(null);
  const [workout,         setWorkout]         = useState(null);
  const [meals,           setMeals]           = useState([]);
  const [health,          setHealth]          = useState(null);
  const [weekly,          setWeekly]          = useState(null);
  const [streak,          setStreak]          = useState(0);
  const [prs,             setPRs]             = useState([]);
  const [volumeDelta,     setVolumeDelta]     = useState([]);
  const [dashboard,       setDashboard]       = useState(null);
  const [gamification,    setGamification]    = useState(null);
  const [adaptSignal,     setAdaptSignal]     = useState(null);
  const [progressMetrics, setProgressMetrics] = useState(null);
  const [missedRecovery,  setMissedRecovery]  = useState(null);
  const [activePlan,      setActivePlan]      = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true); setError(null);
      try {
        const results = await Promise.allSettled([
          getMyProfile(),
          getDashboardNutrition(),
          getDashboardWorkout(),
          getDashboardMeals(),
          getDashboardHealth(),
          getDashboardWeekly(),
          getDashboardStreak(),
          apiFetch("/workouts/prs"),
          apiFetch("/workouts/volume"),
          apiFetch("/workouts/dashboard?days=30"),
          apiFetch("/plans/gamification"),
          apiFetch("/plans/active"),
        ]);
        if (cancelled) return;

        if (results[0].status === "fulfilled") {
          const raw  = results[0].value;
          const data = raw?.data ?? raw;
          const resolvedAvatar =
            data?.avatar_url ?? data?.data?.avatar_url ??
            data?.url        ?? data?.data?.url        ?? null;
          if (resolvedAvatar) setAvatarUrl(resolvedAvatar);
          if (data?.goal)      setGoalLabel(GOAL_LABELS[data.goal] ?? data.goal);
          if (data?.weight_kg) setWeight({ current: data.weight_kg, change: data.weight_change_this_week ?? null });
        }

        if (results[1].status === "fulfilled") setNutrition(results[1].value?.data ?? results[1].value ?? null);
        if (results[2].status === "fulfilled") setWorkout(results[2].value?.data ?? results[2].value ?? null);
        if (results[3].status === "fulfilled") {
          const d = results[3].value?.data ?? results[3].value;
          setMeals(Array.isArray(d) ? d : []);
        }
        if (results[4].status === "fulfilled") setHealth(results[4].value?.data ?? results[4].value ?? null);
        if (results[5].status === "fulfilled") setWeekly(results[5].value?.data ?? results[5].value ?? null);
        if (results[6].status === "fulfilled") {
          const d = results[6].value?.data ?? results[6].value;
          setStreak(d?.streak ?? d?.current_streak ?? (typeof d === "number" ? d : 0));
        }
        if (results[7].status === "fulfilled") {
          const d = results[7].value?.data ?? results[7].value;
          setPRs(Array.isArray(d) ? d : []);
        }
        if (results[8].status === "fulfilled") {
          const d = results[8].value?.data ?? results[8].value;
          setVolumeDelta(d?.weekly_delta ?? []);
        }
        if (results[9].status === "fulfilled")  setDashboard(results[9].value?.data   ?? results[9].value   ?? null);
        if (results[10].status === "fulfilled") setGamification(results[10].value?.data ?? results[10].value ?? null);
        if (results[11].status === "fulfilled") setActivePlan(results[11].value?.data   ?? results[11].value ?? null);

        try {
          const sigRes = await apiFetch("/plans/adaptive-difficulty", { method: "POST", body: JSON.stringify({ recent_logs: [] }) });
          if (!cancelled) setAdaptSignal(sigRes?.data ?? sigRes ?? null);
        } catch { }

        try {
          const metRes = await apiFetch("/plans/progress-metrics", { method: "POST", body: JSON.stringify({ weight_logs: [], strength_logs: [], measurements: [] }) });
          if (!cancelled) setProgressMetrics(metRes?.data ?? metRes ?? null);
        } catch { }

      } catch {
        if (!cancelled) setError("Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const fitnessData = !loading
    ? buildFitnessData({ nutrition, workout, health, streak, weight, goalLabel })
    : null;

  const displayName = user?.name ?? "User";
  const initials    = displayName.split(" ").map(n => n[0] ?? "").join("").slice(0, 2).toUpperCase();

  const isRestDay  = checkRestDay(workout);
  const hasWorkout = !!workout && !isRestDay;
  const donePct    = hasWorkout ? pct(workout.exercises?.filter(e => e.done).length ?? 0, workout.exercises?.length ?? 1) : 0;

  const hasNutrition  = !!nutrition && (nutrition.calories?.target ?? 0) > 0;
  const calConsumed   = nutrition?.calories?.consumed ?? 0;
  const calTarget     = nutrition?.calories?.target   ?? 0;
  const calPct        = pct(calConsumed, calTarget);
  const waterConsumed = nutrition?.water?.consumed    ?? 0;
  const waterTarget   = nutrition?.water?.target      ?? 0;
  const waterPct      = hasNutrition ? pct(waterConsumed, waterTarget) : 0;
  const waterFilled   = Math.round(waterPct / 10);

  const hasAnyHealth  = health && (health.bp || health.sleep || health.heartRate || health.recovery);
  const hasWeeklyData = weekly && Array.isArray(weekly.calories) && weekly.calories.some(Boolean);
  const isDeloadWeek  = workout?.is_deload_week ?? false;
  const workoutWarmup = workout?.warmup ?? [];
  const bpLogged      = !!(health?.bp && health.bp !== "—" && health.bp !== "Not logged");

  const QUICK_ACTIONS = [
    { icon: "⚖️", label: "Log Weight",  action: () => navigate("/progress")  },
    { icon: "🩺", label: "Log BP",      action: () => navigate("/progress")  },
    { icon: "🍽️", label: "Log Meal",    action: () => navigate("/log-meal")  },
    { icon: "🥗", label: "Meal Plan",   action: () => navigate("/meal-plan") },
    { icon: "📋", label: "Full Plan",   action: () => navigate("/plans")     },
    { icon: "🎯", label: "Update Goal", action: () => navigate("/profile")   },
    { icon: "💪", label: "Workout",     action: () => navigate("/workout")   },
  ];

  return (
    <div className={styles.wrapper}>
      {/* NAV */}
      <nav className={styles.nav}>
        <a className={styles.navLogo} href="#">
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
        {/* ✅ NotificationBell added here */}
        <div className={styles.navRight}>
          <NotificationBell />
          <ThemeToggle />
          <a href="/profile" className={styles.navAvatarLink} title="Edit profile">
            <NavAvatar avatarUrl={avatarUrl} initials={initials} />
          </a>
        </div>
      </nav>

      {/* MAIN */}
      <main className={styles.main}>
        {error && (
          <div className={styles.alertBanner} style={{ marginBottom: "1rem" }}>
            <span className={styles.alertIcon}>⚠️</span><span>{error}</span>
          </div>
        )}

        {!loading && prs.length > 0 && <PRBanner prs={prs} />}
        {!loading && <AdaptiveBanner signal={adaptSignal} />}

        {/* Welcome + XP */}
        <Section>
          <div className={styles.welcomeGrid}>
            <div>
              <div className={styles.welcomeBadges}>
                <span className={`${styles.badge} ${styles.badgeLime}`}>
                  <span className={styles.badgeDot} />{goalLabel}
                </span>
                {streak > 0 && <span className={`${styles.badge} ${styles.badgeOrange}`}>🔥 {streak} Day Streak</span>}
                {isDeloadWeek && <span className={`${styles.badge} ${styles.badgeSlate}`}>🔄 Deload Week</span>}
                {workout?.mesocycle_week && !isDeloadWeek && (
                  <span className={`${styles.badge} ${styles.badgeBlue}`}>📅 Week {workout.mesocycle_week} of 4</span>
                )}
                {gamification?.level && (
                  <span className={`${styles.badge} ${styles.badgePurple}`}>
                    {LEVEL_LABELS[gamification.level.current] ?? `Level ${gamification.level.current}`}
                  </span>
                )}
              </div>
              <h1 className={styles.welcomeH}>Welcome Back,<br />
                <span className={styles.welcomeAccent}>{displayName}</span>
              </h1>
              <p className={styles.welcomeDate}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            {weight ? (
              <div className={`${styles.card} ${styles.accent} ${styles.weightChip}`}>
                <span className={styles.weightLabel}>Current Weight</span>
                <div className={styles.weightVal}><AnimNum value={weight.current} /><span>kg</span></div>
                {weight.change !== null && (
                  <span className={styles.weightChange}>{weight.change > 0 ? "+" : ""}{weight.change} kg this week</span>
                )}
                {dashboard?.total_volume_kg > 0 && (
                  <div className={styles.weightSubStat}>
                    <span className={styles.weightSubLabel}>Monthly volume</span>
                    <span className={styles.weightSubVal}><AnimNum value={Math.round(dashboard.total_volume_kg)} />kg</span>
                  </div>
                )}
              </div>
            ) : loading ? (
              <div className={`${styles.card} ${styles.accent} ${styles.weightChip}`} style={{ opacity: 0.4 }}>
                <span className={styles.weightLabel}>Loading...</span>
              </div>
            ) : null}
          </div>
          {!loading && gamification && (
            <>
              <XPBar xp={gamification.xp} level={gamification.level} streak={gamification.streak} />
              <BadgeRow badges={gamification.badges ?? []} />
            </>
          )}
        </Section>

        {!loading && isDeloadWeek && activePlan?.recovery_protocol && (
          <Section delay={30}><DeloadWellnessCard recovery={activePlan.recovery_protocol} /></Section>
        )}

        {/* Workout + Nutrition */}
        <div className={styles.twoCol}>
          <Section>
            {loading ? <LoadingCard height={320} /> : isRestDay ? (
              <RestDayCard mesocycleWeek={workout?.mesocycle_week} missedRecovery={missedRecovery} />
            ) : hasWorkout ? (
              <div className={`${styles.card} ${styles.accent}`}>
                <div className={styles.workoutHeader}>
                  <div>
                    <div className={styles.workoutTopRow}>
                      <span className={styles.secLabel}>💪 Today's Workout</span>
                      {isDeloadWeek && <span className={styles.deloadBadge}>🔄 Deload</span>}
                    </div>
                    <div className={styles.workoutTitle}>{workout.name}</div>
                    <div className={styles.workoutMeta}>
                      <span className={styles.metaPill}>⏱ {workout.duration}</span>
                      <span className={styles.metaPill}>📊 {workout.difficulty}</span>
                      {workout.estimated_kcal > 0 && (
                        <span className={`${styles.metaPill} ${styles.metaPillFire}`}>🔥 ~{workout.estimated_kcal} kcal</span>
                      )}
                    </div>
                  </div>
                  {(workout.exercises?.length ?? 0) > 0 && (
                    <div className={styles.circleWrap}>
                      <svg viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(128,128,128,0.1)" strokeWidth="6" />
                        <circle cx="36" cy="36" r="30" fill="none" stroke="#FF5C1A" strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 30}`}
                          strokeDashoffset={`${2 * Math.PI * 30 * (1 - donePct / 100)}`}
                          style={{ transition: "stroke-dashoffset 1s ease", filter: "drop-shadow(0 0 8px rgba(255,92,26,0.5))" }}
                        />
                      </svg>
                      <div className={styles.circleInner}>
                        <span className={styles.circleVal}>{donePct}%</span>
                        <span className={styles.circleKey}>done</span>
                      </div>
                    </div>
                  )}
                </div>
                <WarmupReminder warmup={workoutWarmup} />
                <div className={styles.exerciseList}>
                  {workout.exercises?.slice(0, 5).map((ex, i) => (
                    <div key={ex.name} className={`${styles.exerciseRow} ${ex.done ? styles.exDone : styles.exPending}`}>
                      <div className={`${styles.exerciseBullet} ${ex.done ? styles.bulletDone : styles.bulletPending}`}>
                        {ex.done ? "✓" : i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={`${styles.exerciseName}${ex.done ? " " + styles.nameDone : ""}`}>{ex.name}</div>
                        <ExerciseReps ex={ex} />
                        {ex.progression_note && !ex.done && <ProgressionChip note={ex.progression_note} />}
                      </div>
                      {ex.estimated_kcal > 0 && <span className={styles.exKcal}>~{ex.estimated_kcal} kcal</span>}
                    </div>
                  ))}
                </div>
                <button className={styles.primaryBtn} onClick={() => navigate("/workout")}>Continue Workout →</button>
              </div>
            ) : (
              <div className={`${styles.card} ${styles.accent}`}>
                <span className={styles.secLabel}>💪 Today's Workout</span>
                <EmptyState icon="📋" message="No workout scheduled. Generate a plan to get started."
                  actionLabel="Generate Plan →" onAction={() => navigate("/plans")} />
              </div>
            )}
          </Section>

          <Section>
            {loading ? <LoadingCard height={320} /> : hasNutrition ? (
              <div className={`${styles.card} ${styles.accent}`}>
                <span className={styles.secLabel}>🍽️ Today's Nutrition</span>
                {calConsumed > 0 ? (
                  <>
                    <div className={styles.calRingWrap}>
                      <div className={styles.ringOuter}>
                        <svg viewBox="0 0 90 90">
                          <defs>
                            <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#FF5C1A" /><stop offset="100%" stopColor="#FF8A3D" />
                            </linearGradient>
                          </defs>
                          <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(128,128,128,0.1)" strokeWidth="8" />
                          <circle cx="45" cy="45" r="38" fill="none" stroke="url(#calGrad)" strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 38}`}
                            strokeDashoffset={`${2 * Math.PI * 38 * (1 - calPct / 100)}`}
                            style={{ transition: "stroke-dashoffset 1.2s ease", filter: "drop-shadow(0 0 10px rgba(255,92,26,0.5))" }}
                          />
                        </svg>
                        <div className={styles.ringInner}>
                          <span className={styles.ringPct}>{calPct}%</span>
                          <span className={styles.ringKey}>of goal</span>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className={styles.calNum}><AnimNum value={calConsumed} /><span className={styles.calDenom}> / {calTarget}</span></div>
                        <div className={styles.calLabel}>kcal consumed today</div>
                        <div className={styles.calBar}><div className={styles.calBarFill} style={{ width: `${calPct}%` }} /></div>
                      </div>
                    </div>
                    <div className={styles.macros}>
                      <MacroBar label="Protein" value={nutrition.protein?.consumed ?? 0} target={nutrition.protein?.target ?? 0} fillColor="linear-gradient(90deg,#FF5C1A,#FF8A3D)" />
                      <MacroBar label="Carbs"   value={nutrition.carbs?.consumed   ?? 0} target={nutrition.carbs?.target   ?? 0} fillColor="linear-gradient(90deg,#00C8E0,#0090FF)" />
                      <MacroBar label="Fats"    value={nutrition.fats?.consumed    ?? 0} target={nutrition.fats?.target    ?? 0} fillColor="linear-gradient(90deg,#B8F000,#80D400)" />
                    </div>
                    <div className={styles.waterBox}>
                      <div className={styles.waterHead}>
                        <span className={styles.waterLabel}>💧 Water Intake</span>
                        <span className={styles.waterVal}>{waterConsumed}L / {waterTarget}L</span>
                      </div>
                      <div className={styles.waterDots}>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className={`${styles.waterDot} ${i < waterFilled ? styles.waterFilled : styles.waterEmpty}`} />
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop: "1rem" }}>
                      <button className={styles.ghostBtn} onClick={() => navigate("/log-meal")}>+ Log Meal</button>
                    </div>
                  </>
                ) : (
                  <div className={styles.nutritionUnlogged}>
                    <div className={styles.nutUnloggedHeader}>
                      <span className={styles.nutUnloggedCal}>{calTarget} <span className={styles.nutUnloggedCalUnit}>kcal</span></span>
                      <span className={styles.nutUnloggedCalLabel}>Today's goal · nothing logged yet</span>
                    </div>
                    <div className={styles.nutUnloggedMacros}>
                      {[
                        { label: "Protein", target: nutrition.protein?.target ?? 0, color: "#FF5C1A" },
                        { label: "Carbs",   target: nutrition.carbs?.target   ?? 0, color: "#00C8E0" },
                        { label: "Fats",    target: nutrition.fats?.target    ?? 0, color: "#B8F000" },
                      ].map(m => (
                        <div key={m.label} className={styles.nutUnloggedRow}>
                          <div className={styles.nutUnloggedRowHead}>
                            <span className={styles.nutUnloggedRowLabel}>{m.label}</span>
                            <span className={styles.nutUnloggedRowTarget} style={{ color: m.color }}>
                              0 <span className={styles.nutUnloggedRowDenom}>/ {m.target}g</span>
                            </span>
                          </div>
                          <div className={styles.nutUnloggedTrack}>
                            <div className={styles.nutUnloggedFill} style={{ width: "0%", background: m.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.nutUnloggedWater}>
                      <span>💧</span>
                      <span>Water goal: <strong>{nutrition.water?.target ?? 0}L</strong> today</span>
                    </div>
                    <button className={styles.primaryBtn} style={{ marginTop: "1rem", width: "100%" }} onClick={() => navigate("/log-meal")}>
                      + Log Your First Meal
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={`${styles.card} ${styles.accent}`}>
                <span className={styles.secLabel}>🍽️ Today's Nutrition</span>
                <EmptyState icon="📊" message="Complete your profile to unlock personalised nutrition targets."
                  actionLabel="Set Up Profile →" onAction={() => navigate("/profile")} />
              </div>
            )}
          </Section>
        </div>

        {!loading && <Section delay={40}><ProgressMetricsCard metrics={progressMetrics} /></Section>}

        {!loading && (prs.length > 0 || volumeDelta.length > 0) && (
          <Section delay={50}>
            <PerformanceCard prs={prs} volumeDelta={volumeDelta} dashboard={dashboard} onViewAll={() => navigate("/progress")} />
          </Section>
        )}

        <Section hidden={!loading && meals.length === 0 && !hasNutrition}>
          {loading ? <LoadingCard /> : meals.length > 0 ? (
            <MealsCard meals={meals} onLogMeal={() => navigate("/log-meal")} />
          ) : (
            <div className={`${styles.card} ${styles.accent}`}>
              <span className={styles.secLabel}>Meals Today</span>
              <EmptyState icon="🍽️" message="No meals logged today." actionLabel="+ Log your first meal" onAction={() => navigate("/log-meal")} />
            </div>
          )}
        </Section>

        {/* Health Snapshot */}
        <Section>
          <span className={styles.secLabel}>🩺 Health Snapshot</span>
          {loading ? <LoadingCard /> : hasAnyHealth ? (
            <>
              <div className={styles.healthGrid}>
                {[
                  { icon: "🫀", label: "Blood Pressure", value: bpLogged ? health.bp : "Not logged",                        color: "#FF5C1A" },
                  { icon: "😴", label: "Sleep",          value: health.sleep ? `${health.sleep}h` : "Not logged",            color: "#00C8E0" },
                  { icon: "💓", label: "Heart Rate",     value: health.heartRate ? `${health.heartRate} bpm` : "Not logged", color: "#FF4D6D" },
                  { icon: "⚡", label: "Recovery",       value: health.recovery ? `${health.recovery}%` : "Not logged",     color: "#B8F000" },
                ].map(h => (
                  <div key={h.label} className={styles.healthCard}>
                    <span className={styles.healthIcon}>{h.icon}</span>
                    <span className={styles.healthLabel}>{h.label}</span>
                    <span className={styles.healthVal} style={{ color: h.color }}>{h.value}</span>
                  </div>
                ))}
              </div>
              {!bpLogged && (
                <div className={styles.bpNudge}>
                  <span>🫀 Blood pressure not logged today.</span>
                  <button className={styles.bpNudgeBtn} onClick={() => navigate("/progress")}>Log it on Progress →</button>
                </div>
              )}
              {health.sleep && health.sleep < 7 && (
                <div className={styles.alertBanner} style={{ marginTop: "0.75rem" }}>
                  <span className={styles.alertIcon}>⚠️</span>
                  <span>Low sleep detected. Consider adjusting today's workout intensity.</span>
                </div>
              )}
            </>
          ) : (
            <EmptyState icon="🩺" message="Log your blood pressure, sleep, and heart rate to track your health."
              actionLabel="Log Health Data →" onAction={() => navigate("/progress")} />
          )}
        </Section>

        {!loading && (
          <Section delay={60}>
            <HealthInsights />
          </Section>
        )}

        {!loading && (
          <Section delay={70}>
            <SmartRecommendations />
          </Section>
        )}

        {/* Weekly Progress */}
        <Section>
          <div className={`${styles.card} ${styles.accent}`}>
            <span className={styles.secLabel}>📈 Weekly Progress</span>
            {loading ? <p style={{ opacity: 0.4, marginTop: "1rem" }}>Loading...</p> : weekly ? (
              <>
                <div className={styles.weekStats}>
                  {[
                    { label: "Consistency",       value: weekly.consistency,      sub: weekly.consistencySub, color: "#FF5C1A", valid: !!weekly.consistency },
                    { label: "Calorie Adherence", value: weekly.calorieAdherence, sub: "avg this week",       color: "#B8F000", valid: !!weekly.calorieAdherence && weekly.calorieAdherence !== "—" },
                    { label: "Weight Lost",       value: weekly.weightLost,       sub: "this week",           color: "#00C8E0", valid: !!weekly.weightLost && weekly.weightLost !== "—" },
                    { label: "Volume", value: dashboard?.total_volume_kg ? `${Math.round(dashboard.total_volume_kg / 1000)}t` : null, sub: "this month", color: "#a855f7", valid: !!dashboard?.total_volume_kg },
                  ].filter(s => s.valid).map(s => (
                    <div key={s.label} className={styles.weekStat}>
                      <span className={styles.weekStatVal} style={{ color: s.color, filter: `drop-shadow(0 0 10px ${s.color}66)` }}>{s.value}</span>
                      <span className={styles.weekStatLabel}>{s.label}</span>
                      <span className={styles.weekStatSub}>{s.sub}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.dayTracker}>
                  <span className={styles.secLabel}>Workout Days</span>
                  <div className={styles.dayRow}>
                    {weekly.days?.map((d, i) => (
                      <div key={d} className={styles.dayCol}>
                        <div className={`${styles.dayBox} ${weekly.workouts?.[i] ? styles.dayDone : styles.dayMiss}`}>
                          {weekly.workouts?.[i] ? "✓" : ""}
                        </div>
                        <span className={styles.dayName}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {hasWeeklyData ? (
                  <div>
                    <span className={styles.secLabel}>Calories vs Target</span>
                    <div className={styles.calBars}>
                      {weekly.calories?.map((cal, i) => {
                        const p = cal ? pct(cal, weekly.target?.[i] ?? 2100) : 0;
                        const isToday = i === new Date().getDay() - 1;
                        return (
                          <div key={i} className={styles.calBarCol}>
                            <div className={styles.calBarTrack}>
                              <div className={`${styles.calBarFillWk} ${!cal ? styles.wkEmpty : isToday ? styles.wkHot : styles.wkNormal}`}
                                style={{ height: `${p}%` }} />
                            </div>
                            <span className={styles.calBarDay}>{weekly.days?.[i]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p style={{ opacity: 0.45, fontSize: "0.85rem", marginTop: "0.75rem" }}>
                    Start logging to see your weekly calorie chart here.
                  </p>
                )}
              </>
            ) : (
              <EmptyState icon="📈" message="No weekly data yet. Log workouts and meals to track your week." />
            )}
          </div>
        </Section>

        {/* Quick Actions */}
        <Section>
          <span className={styles.secLabel}>Quick Actions</span>
          <div className={styles.actionsGrid}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} className={styles.actionBtn} onClick={a.action}>
                <span className={styles.actionIcon}>{a.icon}</span>
                <span className={styles.actionLabel}>{a.label}</span>
              </button>
            ))}
          </div>
        </Section>
      </main>

      {!loading && <AiCoach fitnessData={fitnessData} />}
    </div>
  );
}