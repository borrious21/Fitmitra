import { useState, useEffect, useRef, useContext } from "react";
import styles from "./Dashboard.module.css";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";
import { AuthContext } from "../../../context/AuthContext";
import { getMyProfile } from "../../../services/profileService";

const GOAL_LABELS = {
  weight_loss:      "Weight Loss",
  maintain_fitness: "Maintain Fitness",
  muscle_gain:      "Muscle Gain",
  endurance:        "Endurance",
  wellness:         "Wellness",
};

const QUICK_ACTIONS = [
  { icon: "⚖️", label: "Log Weight"  },
  { icon: "🩺", label: "Log BP"      },
  { icon: "🍽️", label: "Log Meal"    },
  { icon: "📋", label: "Full Plan"   },
  { icon: "🎯", label: "Update Goal" },
  { icon: "🤖", label: "AI Coach"    },
];

/* ─── Utils ──────────────────────────────────────────────────── */
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

function Section({ children }) {
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
  if (avatarUrl) {
    return <img src={avatarUrl} alt="avatar" className={styles.navAvatarImg} />;
  }
  return <div className={styles.navAvatar}>{initials}</div>;
}

function LoadingCard() {
  return (
    <div className={styles.card} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120, opacity: 0.5 }}>
      <span>Loading...</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Dashboard
═══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useContext(AuthContext);

  const [activeTab,  setActiveTab]  = useState("today");
  const [expandedEx, setExpandedEx] = useState(null);

  /* ── API state ────────────────────────────────────────────── */
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // Profile
  const [avatarUrl,   setAvatarUrl]   = useState(null);
  const [goalLabel,   setGoalLabel]   = useState("—");
  const [weight,      setWeight]      = useState(null);

  // Today's nutrition
  const [nutrition,   setNutrition]   = useState(null);
  // Today's workout
  const [workout,     setWorkout]     = useState(null);
  // Meals
  const [meals,       setMeals]       = useState([]);
  // Health snapshot
  const [health,      setHealth]      = useState(null);
  // Weekly progress
  const [weekly,      setWeekly]      = useState(null);
  // AI insights
  const [insights,    setInsights]    = useState([]);
  // Streak
  const [streak,      setStreak]      = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled([
          getMyProfile(),
          fetchTodayNutrition(),
          fetchTodayWorkout(),
          fetchTodayMeals(),
          fetchHealthSnapshot(),
          fetchWeeklyProgress(),
          fetchAIInsights(),
          fetchStreak(),
        ]);

        if (cancelled) return;

        // Profile
        if (results[0].status === "fulfilled") {
          const data = results[0].value?.data ?? results[0].value;
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
          if (data?.goal)       setGoalLabel(GOAL_LABELS[data.goal] ?? data.goal);
          if (data?.weight_kg)  setWeight({ current: data.weight_kg, change: data.weight_change_this_week ?? null });
        }

        // Nutrition
        if (results[1].status === "fulfilled") {
          setNutrition(results[1].value?.data ?? results[1].value ?? null);
        }

        // Workout
        if (results[2].status === "fulfilled") {
          setWorkout(results[2].value?.data ?? results[2].value ?? null);
        }

        // Meals
        if (results[3].status === "fulfilled") {
          const data = results[3].value?.data ?? results[3].value;
          setMeals(Array.isArray(data) ? data : []);
        }

        // Health
        if (results[4].status === "fulfilled") {
          setHealth(results[4].value?.data ?? results[4].value ?? null);
        }

        // Weekly
        if (results[5].status === "fulfilled") {
          setWeekly(results[5].value?.data ?? results[5].value ?? null);
        }

        // AI Insights
        if (results[6].status === "fulfilled") {
          const data = results[6].value?.data ?? results[6].value;
          setInsights(Array.isArray(data) ? data : []);
        }

        // Streak
        if (results[7].status === "fulfilled") {
          const data = results[7].value?.data ?? results[7].value;
          setStreak(data?.streak ?? data ?? 0);
        }

      } catch (err) {
        if (!cancelled) setError("Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  // Display name
  const displayName = user?.name ?? "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const donePct = workout
    ? pct(workout.exercises?.filter(e => e.done).length ?? 0, workout.exercises?.length ?? 1)
    : 0;

  const calPct   = nutrition ? pct(nutrition.calories?.consumed, nutrition.calories?.target) : 0;
  const waterPct = nutrition ? pct(nutrition.water?.consumed, nutrition.water?.target) : 0;
  const waterFilled = Math.round(waterPct / 10);

  return (
    <div className={styles.wrapper}>

      {/* ══ NAV ══════════════════════════════════════════════════ */}
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
          {["today", "progress", "plans"].map(t => (
            <button
              key={t}
              className={`${styles.navTab}${activeTab === t ? " " + styles.active : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
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

      {/* ══ MAIN ═════════════════════════════════════════════════ */}
      <main className={styles.main}>

        {error && (
          <div className={styles.alertBanner} style={{ marginBottom: "1rem" }}>
            <span className={styles.alertIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Welcome ──────────────────────────────────────────── */}
        <Section>
          <div className={styles.welcomeGrid}>
            <div>
              <div className={styles.welcomeBadges}>
                <span className={`${styles.badge} ${styles.badgeLime}`}>
                  <span className={styles.badgeDot} />
                  {goalLabel}
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
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>

            {weight ? (
              <div className={`${styles.card} ${styles.accent} ${styles.weightChip}`}>
                <span className={styles.weightLabel}>Current Weight</span>
                <div className={styles.weightVal}>
                  <AnimNum value={weight.current} /><span>kg</span>
                </div>
                {weight.change !== null && (
                  <span className={styles.weightChange}>
                    {weight.change > 0 ? "+" : ""}{weight.change} kg this week
                  </span>
                )}
              </div>
            ) : loading ? (
              <div className={`${styles.card} ${styles.accent} ${styles.weightChip}`} style={{ opacity: 0.4 }}>
                <span className={styles.weightLabel}>Loading...</span>
              </div>
            ) : null}
          </div>
        </Section>

        {/* ── Two-col: Workout + Nutrition ─────────────────────── */}
        <div className={styles.twoCol}>

          {/* Workout */}
          <Section>
            {loading ? <LoadingCard /> : workout ? (
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

                  <div className={styles.circleWrap}>
                    <svg viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(128,128,128,0.1)" strokeWidth="6" />
                      <circle
                        cx="36" cy="36" r="30" fill="none"
                        stroke="#FF5C1A" strokeWidth="6" strokeLinecap="round"
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
                </div>

                <div className={styles.exerciseList}>
                  {workout.exercises?.map((ex, i) => (
                    <div
                      key={ex.name}
                      className={`${styles.exerciseRow} ${ex.done ? styles.exDone : styles.exPending}`}
                      onClick={() => setExpandedEx(expandedEx === i ? null : i)}
                    >
                      <div className={`${styles.exerciseBullet} ${ex.done ? styles.bulletDone : styles.bulletPending}`}>
                        {ex.done ? "✓" : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className={`${styles.exerciseName}${ex.done ? " " + styles.nameDone : ""}`}>{ex.name}</div>
                        <div className={styles.exerciseReps}>{ex.sets} sets × {ex.reps} reps</div>
                      </div>
                      <span className={styles.chevron}>{expandedEx === i ? "▲" : "▼"}</span>
                    </div>
                  ))}
                </div>

                <button className={styles.primaryBtn}>Continue Workout →</button>
              </div>
            ) : (
              <div className={`${styles.card} ${styles.accent}`} style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
                <span className={styles.secLabel}>💪 Today's Workout</span>
                <p style={{ marginTop: "1rem" }}>No workout scheduled for today.</p>
              </div>
            )}
          </Section>

          {/* Nutrition */}
          <Section>
            {loading ? <LoadingCard /> : nutrition ? (
              <div className={`${styles.card} ${styles.accent}`}>
                <span className={styles.secLabel}>🍽️ Today's Nutrition</span>

                <div className={styles.calRingWrap}>
                  <div className={styles.ringOuter}>
                    <svg viewBox="0 0 90 90">
                      <defs>
                        <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FF5C1A" />
                          <stop offset="100%" stopColor="#FF8A3D" />
                        </linearGradient>
                      </defs>
                      <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(128,128,128,0.1)" strokeWidth="8" />
                      <circle
                        cx="45" cy="45" r="38" fill="none"
                        stroke="url(#calGrad)" strokeWidth="8" strokeLinecap="round"
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
                      <AnimNum value={nutrition.calories?.consumed ?? 0} />
                      <span className={styles.calDenom}> / {nutrition.calories?.target ?? 0}</span>
                    </div>
                    <div className={styles.calLabel}>kcal consumed today</div>
                    <div className={styles.calBar}>
                      <div className={styles.calBarFill} style={{ width: `${calPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className={styles.macros}>
                  <MacroBar label="Protein" value={nutrition.protein?.consumed ?? 0} target={nutrition.protein?.target ?? 0} fillColor="linear-gradient(90deg,#FF5C1A,#FF8A3D)" />
                  <MacroBar label="Carbs"   value={nutrition.carbs?.consumed ?? 0}   target={nutrition.carbs?.target ?? 0}   fillColor="linear-gradient(90deg,#00C8E0,#0090FF)" />
                  <MacroBar label="Fats"    value={nutrition.fats?.consumed ?? 0}    target={nutrition.fats?.target ?? 0}    fillColor="linear-gradient(90deg,#B8F000,#80D400)" />
                </div>

                <div className={styles.waterBox}>
                  <div className={styles.waterHead}>
                    <span className={styles.waterLabel}>💧 Water Intake</span>
                    <span className={styles.waterVal}>{nutrition.water?.consumed ?? 0}L / {nutrition.water?.target ?? 0}L</span>
                  </div>
                  <div className={styles.waterDots}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`${styles.waterDot} ${i < waterFilled ? styles.waterFilled : styles.waterEmpty}`} />
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <button className={styles.ghostBtn}>+ Log Meal</button>
                </div>
              </div>
            ) : (
              <div className={`${styles.card} ${styles.accent}`} style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
                <span className={styles.secLabel}>🍽️ Today's Nutrition</span>
                <p style={{ marginTop: "1rem" }}>No nutrition data for today.</p>
              </div>
            )}
          </Section>
        </div>

        {/* ── Meals Today ──────────────────────────────────────── */}
        <Section>
          <span className={styles.secLabel}>Meals Today</span>
          {loading ? (
            <LoadingCard />
          ) : meals.length > 0 ? (
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
            <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>No meals logged today.</p>
          )}
        </Section>

        {/* ── Health Snapshot ───────────────────────────────────── */}
        <Section>
          <span className={styles.secLabel}>🩺 Health Snapshot</span>
          {loading ? (
            <LoadingCard />
          ) : health ? (
            <>
              <div className={styles.healthGrid}>
                {[
                  { icon: "🫀", label: "Blood Pressure", value: health.bp,                   status: health.bpStatus,       color: "#FF5C1A" },
                  { icon: "😴", label: "Sleep",           value: `${health.sleep}h`,           status: health.sleepStatus,    color: "#00C8E0" },
                  { icon: "💓", label: "Heart Rate",      value: `${health.heartRate} bpm`,    status: health.hrStatus,       color: "#FF4D6D" },
                  { icon: "⚡", label: "Recovery",        value: `${health.recovery}%`,         status: health.recoveryStatus, color: "#B8F000" },
                ].map(h => (
                  <div key={h.label} className={styles.healthCard}>
                    <span className={styles.healthIcon}>{h.icon}</span>
                    <span className={styles.healthLabel}>{h.label}</span>
                    <span className={styles.healthVal} style={{ color: h.color }}>{h.value}</span>
                    <span className={styles.healthStatus} style={{ color: h.color, background: `${h.color}18` }}>{h.status}</span>
                  </div>
                ))}
              </div>
              {health.sleep < 7 && (
                <div className={styles.alertBanner}>
                  <span className={styles.alertIcon}>⚠️</span>
                  <span>Low sleep detected. Workout intensity has been adjusted for today.</span>
                </div>
              )}
            </>
          ) : (
            <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>No health data available. Log your vitals to see insights.</p>
          )}
        </Section>

        {/* ── AI Coach ─────────────────────────────────────────── */}
        <Section>
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
            ) : insights.length > 0 ? (
              <div className={styles.insightList}>
                {insights.map((ins, i) => (
                  <div
                    key={i}
                    className={styles.insightRow}
                    style={{ background: `${ins.color}0D`, border: `1px solid ${ins.color}30` }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${ins.color}1A`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${ins.color}0D`; }}
                  >
                    <div className={styles.insightInner}>
                      <span className={styles.insightIcon}>{ins.icon}</span>
                      <span className={styles.insightText}>{ins.text}</span>
                      <button className={styles.whyBtn} style={{ color: ins.color, background: `${ins.color}20` }}>Why? →</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ opacity: 0.5, marginTop: "1rem" }}>No insights available yet. Log your activity to get personalized tips.</p>
            )}
          </div>
        </Section>

        {/* ── Weekly Progress ───────────────────────────────────── */}
        <Section>
          <div className={`${styles.card} ${styles.accent}`}>
            <span className={styles.secLabel}>📈 Weekly Progress</span>
            {loading ? (
              <p style={{ opacity: 0.4, marginTop: "1rem" }}>Loading weekly data...</p>
            ) : weekly ? (
              <>
                <div className={styles.weekStats}>
                  {[
                    { label: "Consistency",       value: weekly.consistency,      sub: weekly.consistencySub,  color: "#FF5C1A" },
                    { label: "Calorie Adherence", value: weekly.calorieAdherence, sub: "avg this week",        color: "#B8F000" },
                    { label: "Weight Lost",       value: weekly.weightLost,       sub: "this week",            color: "#00C8E0" },
                  ].map(s => (
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

                <div>
                  <span className={styles.secLabel}>Calories vs Target</span>
                  <div className={styles.calBars}>
                    {weekly.calories?.map((cal, i) => {
                      const p = cal ? pct(cal, weekly.target?.[i] ?? 2100) : 0;
                      const isToday = i === new Date().getDay() - 1;
                      return (
                        <div key={i} className={styles.calBarCol}>
                          <div className={styles.calBarTrack}>
                            <div
                              className={`${styles.calBarFillWk} ${!cal ? styles.wkEmpty : isToday ? styles.wkHot : styles.wkNormal}`}
                              style={{ height: `${p}%` }}
                            />
                          </div>
                          <span className={styles.calBarDay}>{weekly.days?.[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <p style={{ opacity: 0.5, marginTop: "1rem" }}>No weekly data available yet.</p>
            )}
          </div>
        </Section>

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <Section>
          <span className={styles.secLabel}>Quick Actions</span>
          <div className={styles.actionsGrid}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} className={styles.actionBtn}>
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

/* ═══════════════════════════════════════════════════════════════
   API helpers — wire these to your actual service functions
═══════════════════════════════════════════════════════════════ */
async function fetchTodayNutrition() {
  const { getDashboardNutrition } = await import("../../../services/dashboardService");
  return getDashboardNutrition();
}

async function fetchTodayWorkout() {
  const { getDashboardWorkout } = await import("../../../services/dashboardService");
  return getDashboardWorkout();
}

async function fetchTodayMeals() {
  const { getDashboardMeals } = await import("../../../services/dashboardService");
  return getDashboardMeals();
}

async function fetchHealthSnapshot() {
  const { getDashboardHealth } = await import("../../../services/dashboardService");
  return getDashboardHealth();
}

async function fetchWeeklyProgress() {
  const { getDashboardWeekly } = await import("../../../services/dashboardService");
  return getDashboardWeekly();
}

async function fetchAIInsights() {
  const { getDashboardInsights } = await import("../../../services/dashboardService");
  return getDashboardInsights();
}

async function fetchStreak() {
  const { getDashboardStreak } = await import("../../../services/dashboardService");
  return getDashboardStreak();
}