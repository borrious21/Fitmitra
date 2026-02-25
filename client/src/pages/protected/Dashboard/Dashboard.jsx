// src/pages/Dashboard/Dashboard.jsx

import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Dashboard.module.css";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";
import { AuthContext } from "../../../context/AuthContext";
import { getMyProfile } from "../../../services/profileService";
import {
  getDashboardNutrition,
  getDashboardWorkout,
  getDashboardMeals,
  getDashboardHealth,
  getDashboardWeekly,
  getDashboardInsights,
  getDashboardStreak,
} from "../../../services/dashboardService";

const GOAL_LABELS = {
  weight_loss:      "Weight Loss",
  maintain_fitness: "Maintain Fitness",
  muscle_gain:      "Muscle Gain",
  endurance:        "Endurance",
  wellness:         "Wellness",
};

const NAV_TABS = [
  { key: "today",    label: "today",    path: "/dashboard" },
  { key: "progress", label: "progress", path: "/progress"  },
  { key: "plans",    label: "plans",    path: "/plans"      },
];

function pct(v, t) { return t ? Math.min(100, Math.round((v / t) * 100)) : 0; }

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

function AnimNum({ value }) {
  const n = useCountUp(typeof value === "number" ? value : 0);
  return <span>{typeof value === "number" ? n : value}</span>;
}

function Section({ children, hidden }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold: 0.08 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
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
  if (avatarUrl) return <img src={avatarUrl} alt="avatar" className={styles.navAvatarImg} />;
  return <div className={styles.navAvatar}>{initials}</div>;
}

function LoadingCard() {
  return (
    <div className={styles.card} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120, opacity: 0.5 }}>
      <span>Loading...</span>
    </div>
  );
}

function EmptyState({ icon, message, actionLabel, onAction }) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>{icon}</span>
      <p className={styles.emptyMsg}>{message}</p>
      {actionLabel && (
        <button className={styles.ghostBtn} onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}

function RestDayCard() {
  return (
    <div className={`${styles.card} ${styles.accent}`}>
      <span className={styles.secLabel}>💪 Today's Workout</span>
      <div className={styles.restDayWrap}>
        <span className={styles.restDayEmoji}>🛌</span>
        <div className={styles.restDayText}>
          <div className={styles.restDayTitle}>Rest Day</div>
          <div className={styles.restDaySub}>
            Recovery is where gains happen. Stay hydrated, stretch lightly, and let your body rebuild.
          </div>
        </div>
      </div>
      <div className={styles.restTips}>
        {["💧 Drink at least 2L of water", "🧘 10 min light stretching", "😴 Aim for 8h sleep tonight"].map(tip => (
          <div key={tip} className={styles.restTip}>{tip}</div>
        ))}
      </div>
    </div>
  );
}

function checkRestDay(workout) {
  if (!workout) return false;
  if (workout.isRestDay === true) return true;
  const name = (workout.name ?? "").toLowerCase();
  return name === "rest day" || name === "rest" || name === "recovery day";
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = NAV_TABS.find(t => t.path === location.pathname)?.key ?? "today";

  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [goalLabel, setGoalLabel] = useState("—");
  const [weight,    setWeight]    = useState(null);
  const [nutrition, setNutrition] = useState(null);
  const [workout,   setWorkout]   = useState(null);
  const [meals,     setMeals]     = useState([]);
  const [health,    setHealth]    = useState(null);
  const [weekly,    setWeekly]    = useState(null);
  const [insights,  setInsights]  = useState([]);
  const [streak,    setStreak]    = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled([
          getMyProfile(),
          getDashboardNutrition(),
          getDashboardWorkout(),
          getDashboardMeals(),
          getDashboardHealth(),
          getDashboardWeekly(),
          getDashboardInsights(),
          getDashboardStreak(),
        ]);
        if (cancelled) return;

        if (results[0].status === "fulfilled") {
          const data = results[0].value?.data ?? results[0].value;
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
          if (data?.goal)       setGoalLabel(GOAL_LABELS[data.goal] ?? data.goal);
          if (data?.weight_kg)  setWeight({ current: data.weight_kg, change: data.weight_change_this_week ?? null });
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
          setInsights(Array.isArray(d) ? d : []);
        }
        if (results[7].status === "fulfilled") {
          const d = results[7].value?.data ?? results[7].value;
          setStreak(d?.streak ?? d?.current_streak ?? (typeof d === "number" ? d : 0));
        }
      } catch {
        if (!cancelled) setError("Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const displayName = user?.name ?? "User";
  const initials = displayName.split(" ").map(n => n[0] ?? "").join("").slice(0, 2).toUpperCase();

  const isRestDay  = checkRestDay(workout);
  const hasWorkout = !!workout && !isRestDay;
  const donePct    = hasWorkout ? pct(workout.exercises?.filter(e => e.done).length ?? 0, workout.exercises?.length ?? 1) : 0;

  const hasNutrition  = !!nutrition && (nutrition.calories?.target ?? 0) > 0;
  const calConsumed   = nutrition?.calories?.consumed ?? 0;
  const calTarget     = nutrition?.calories?.target   ?? 0;
  const calPct        = pct(calConsumed, calTarget);
  const waterConsumed = nutrition?.water?.consumed ?? 0;
  const waterTarget   = nutrition?.water?.target   ?? 0;
  const waterPct      = hasNutrition ? pct(waterConsumed, waterTarget) : 0;
  const waterFilled   = Math.round(waterPct / 10);

  const hasAnyHealth  = health && (health.bp || health.sleep || health.heartRate || health.recovery);
  const hasWeeklyData = weekly && Array.isArray(weekly.calories) && weekly.calories.some(Boolean);

  const QUICK_ACTIONS = [
    { icon: "⚖️", label: "Log Weight",  action: () => navigate("/progress") },
    { icon: "🩺", label: "Log BP",      action: () => navigate("/progress") },
    { icon: "🍽️", label: "Log Meal",    action: () => navigate("/log-meal") },
    { icon: "📋", label: "Full Plan",   action: () => navigate("/plan")     },
    { icon: "🎯", label: "Update Goal", action: () => navigate("/profile")  },
    { icon: "💪", label: "Workout",     action: () => navigate("/workout")  },
  ];

  return (
    <div className={styles.wrapper}>
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
              className={`${styles.navTab}${activeTab === t.key ? " " + styles.active : ""}`}
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
        {error && (
          <div className={styles.alertBanner} style={{ marginBottom: "1rem" }}>
            <span className={styles.alertIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <Section>
          <div className={styles.welcomeGrid}>
            <div>
              <div className={styles.welcomeBadges}>
                <span className={`${styles.badge} ${styles.badgeLime}`}>
                  <span className={styles.badgeDot} />{goalLabel}
                </span>
                {streak > 0 && (
                  <span className={`${styles.badge} ${styles.badgeOrange}`}>
                    🔥 {streak} Day Streak
                  </span>
                )}
              </div>
              <h1 className={styles.welcomeH}>
                Welcome Back,<br />
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
              </div>
            ) : loading ? (
              <div className={`${styles.card} ${styles.accent} ${styles.weightChip}`} style={{ opacity: 0.4 }}>
                <span className={styles.weightLabel}>Loading...</span>
              </div>
            ) : null}
          </div>
        </Section>

        <div className={styles.twoCol}>

          <Section>
            {loading ? <LoadingCard /> : isRestDay ? (
              <RestDayCard />
            ) : hasWorkout ? (
              <div className={`${styles.card} ${styles.accent}`}>
                <div className={styles.workoutHeader}>
                  <div>
                    <span className={styles.secLabel}>💪 Today's Workout</span>
                    <div className={styles.workoutTitle}>{workout.name}</div>
                    <div className={styles.workoutMeta}>
                      <span className={styles.metaPill}>⏱ {workout.duration}</span>
                      <span className={styles.metaPill}>📊 {workout.difficulty}</span>
                    </div>
                  </div>
                  {(workout.exercises?.length ?? 0) > 0 && (
                    <div className={styles.circleWrap}>
                      <svg viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(128,128,128,0.1)" strokeWidth="6" />
                        <circle cx="36" cy="36" r="30" fill="none" stroke="#FF5C1A" strokeWidth="6" strokeLinecap="round"
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
                <div className={styles.exerciseList}>
                  {workout.exercises?.slice(0, 5).map((ex, i) => (
                    <div key={ex.name} className={`${styles.exerciseRow} ${ex.done ? styles.exDone : styles.exPending}`}>
                      <div className={`${styles.exerciseBullet} ${ex.done ? styles.bulletDone : styles.bulletPending}`}>
                        {ex.done ? "✓" : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className={`${styles.exerciseName}${ex.done ? " " + styles.nameDone : ""}`}>{ex.name}</div>
                        <div className={styles.exerciseReps}>{ex.sets} sets × {ex.reps} reps</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className={styles.primaryBtn} onClick={() => navigate("/workout")}>
                  Continue Workout →
                </button>
              </div>
            ) : (
              <div className={`${styles.card} ${styles.accent}`}>
                <span className={styles.secLabel}>💪 Today's Workout</span>
                <EmptyState
                  icon="📋"
                  message="No workout scheduled for today. Generate a plan to get started."
                  actionLabel="Generate Plan →"
                  onAction={() => navigate("/plan")}
                />
              </div>
            )}
          </Section>

          <Section>
            {loading ? <LoadingCard /> : hasNutrition ? (
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
                          <circle cx="45" cy="45" r="38" fill="none" stroke="url(#calGrad)" strokeWidth="8" strokeLinecap="round"
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
                        <div className={styles.calNum}>
                          <AnimNum value={calConsumed} />
                          <span className={styles.calDenom}> / {calTarget}</span>
                        </div>
                        <div className={styles.calLabel}>kcal consumed today</div>
                        <div className={styles.calBar}>
                          <div className={styles.calBarFill} style={{ width: `${calPct}%` }} />
                        </div>
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

                    <button
                      className={styles.primaryBtn}
                      style={{ marginTop: "1rem", width: "100%" }}
                      onClick={() => navigate("/log-meal")}
                    >
                      + Log Your First Meal
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={`${styles.card} ${styles.accent}`}>
                <span className={styles.secLabel}>🍽️ Today's Nutrition</span>
                <EmptyState
                  icon="📊"
                  message="Complete your profile to unlock personalised nutrition targets."
                  actionLabel="Set Up Profile →"
                  onAction={() => navigate("/profile")}
                />
              </div>
            )}
          </Section>
        </div>

        <Section hidden={!loading && meals.length === 0 && !hasNutrition}>
          <span className={styles.secLabel}>Meals Today</span>
          {loading ? <LoadingCard /> : meals.length > 0 ? (
            <div className={styles.mealsGrid}>
              {meals.map((m, idx) => (
                <div key={m.time ?? idx} className={styles.mealCell}>
                  <span className={styles.mealTime}>{m.time}</span>
                  <span className={styles.mealEmoji}>{m.emoji ?? "🍽️"}</span>
                  <div className={styles.mealName}>{m.name}</div>
                  <div className={styles.mealMacro}>{m.cal} kcal · P{m.p}g · C{m.c}g · F{m.f}g</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🍽️"
              message="No meals logged today."
              actionLabel="+ Log your first meal"
              onAction={() => navigate("/log-meal")}
            />
          )}
        </Section>

        <Section>
          <span className={styles.secLabel}>🩺 Health Snapshot</span>
          {loading ? <LoadingCard /> : hasAnyHealth ? (
            <>
              <div className={styles.healthGrid}>
                {[
                  { icon: "🫀", label: "Blood Pressure", value: health.bp        && health.bp        !== "—" ? health.bp                  : "Not logged", status: health.bpStatus       && health.bpStatus       !== "—" ? health.bpStatus       : null, color: "#FF5C1A" },
                  { icon: "😴", label: "Sleep",           value: health.sleep                                  ? `${health.sleep}h`        : "Not logged", status: health.sleepStatus    && health.sleepStatus    !== "—" ? health.sleepStatus    : null, color: "#00C8E0" },
                  { icon: "💓", label: "Heart Rate",      value: health.heartRate                              ? `${health.heartRate} bpm` : "Not logged", status: health.hrStatus       && health.hrStatus       !== "—" ? health.hrStatus       : null, color: "#FF4D6D" },
                  { icon: "⚡", label: "Recovery",        value: health.recovery                               ? `${health.recovery}%`    : "Not logged", status: health.recoveryStatus && health.recoveryStatus !== "—" ? health.recoveryStatus : null, color: "#B8F000" },
                ].map(h => (
                  <div key={h.label} className={styles.healthCard}>
                    <span className={styles.healthIcon}>{h.icon}</span>
                    <span className={styles.healthLabel}>{h.label}</span>
                    <span className={styles.healthVal} style={{ color: h.color }}>{h.value}</span>
                    {h.status && (
                      <span className={styles.healthStatus} style={{ color: h.color, background: `${h.color}18` }}>{h.status}</span>
                    )}
                  </div>
                ))}
              </div>
              {health.sleep && health.sleep < 7 && (
                <div className={styles.alertBanner}>
                  <span className={styles.alertIcon}>⚠️</span>
                  <span>Low sleep detected. Consider adjusting today's workout intensity.</span>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon="🩺"
              message="Log your blood pressure, sleep, and heart rate to track your health."
              actionLabel="Log Health Data →"
              onAction={() => navigate("/progress")}
            />
          )}
        </Section>

        <Section hidden={!loading && insights.length === 0}>
          <div className={`${styles.card} ${styles.accent}`}>
            <div className={styles.aiHeader}>
              <div className={styles.aiIconWrap}>🧠</div>
              <div>
                <span className={styles.aiTitle}>Today's AI Insights</span>
                <span className={styles.aiSub}>Personalized for your patterns</span>
              </div>
              <span className={styles.aiBadge}>AI Powered</span>
            </div>
            {loading ? (
              <p style={{ opacity: 0.4, marginTop: "1rem" }}>Loading insights...</p>
            ) : (
              <div className={styles.insightList}>
                {insights.map((ins, i) => (
                  <div key={i} className={styles.insightRow}
                    style={{ background: `${ins.color}0D`, border: `1px solid ${ins.color}30` }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${ins.color}1A`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${ins.color}0D`; }}>
                    <div className={styles.insightInner}>
                      <span className={styles.insightIcon}>{ins.icon}</span>
                      <span className={styles.insightText}>{ins.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        <Section>
          <div className={`${styles.card} ${styles.accent}`}>
            <span className={styles.secLabel}>📈 Weekly Progress</span>
            {loading ? <p style={{ opacity: 0.4, marginTop: "1rem" }}>Loading...</p> : weekly ? (
              <>
                <div className={styles.weekStats}>
                  {[
                    { label: "Consistency",       value: weekly.consistency,      sub: weekly.consistencySub, color: "#FF5C1A", valid: !!weekly.consistency },
                    { label: "Calorie Adherence", value: weekly.calorieAdherence, sub: "avg this week",       color: "#B8F000", valid: !!weekly.calorieAdherence && weekly.calorieAdherence !== "—" },
                    { label: "Weight Lost",       value: weekly.weightLost,       sub: "this week",           color: "#00C8E0", valid: !!weekly.weightLost       && weekly.weightLost       !== "—" },
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
              <EmptyState
                icon="📈"
                message="No weekly data yet. Log workouts and meals to track your week."
              />
            )}
          </div>
        </Section>

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
    </div>
  );
}