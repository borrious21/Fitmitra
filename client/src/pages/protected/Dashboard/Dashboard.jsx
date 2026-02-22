import { useState, useEffect, useRef } from "react";
import styles from "./Dashboard.module.css";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";
// import { AuthContext } from "../../../context/AuthContext";

/* ─── Mock Data ─────────────────────────────────────────────── */
const USER = { name: "Parikshit", goal: "Fat Loss", avatar: "PK" };

const TODAY = {
  calories: { consumed: 1640, target: 2100 },
  protein:  { consumed: 98,   target: 140 },
  carbs:    { consumed: 180,  target: 220 },
  fats:     { consumed: 45,   target: 65 },
  water:    { consumed: 1.8,  target: 2.5 },
  streak:   12,
  weight:   { current: 78.4, change: -0.6 },
};

const WORKOUT = {
  name: "Upper Body Hypertrophy",
  duration: "45 min",
  difficulty: "Moderate",
  exercises: [
    { name: "Bench Press",      sets: 4, reps: "8–10",  done: true  },
    { name: "Incline DB Press", sets: 3, reps: "10–12", done: true  },
    { name: "Cable Flyes",      sets: 3, reps: "12–15", done: true  },
    { name: "Shoulder Press",   sets: 4, reps: "8–10",  done: false },
    { name: "Lateral Raises",   sets: 3, reps: "15–20", done: false },
  ],
};

const MEALS = [
  { time: "Breakfast", emoji: "🥣", name: "Oats + Whey Protein Bowl", cal: 420, p: 32, c: 55, f: 8  },
  { time: "Lunch",     emoji: "🍗", name: "Grilled Chicken + Rice",    cal: 580, p: 46, c: 62, f: 12 },
  { time: "Snack",     emoji: "🥜", name: "Peanut Butter Toast",       cal: 310, p: 12, c: 38, f: 14 },
  { time: "Dinner",    emoji: "🐟", name: "Salmon + Veggies",          cal: 330, p: 8,  c: 25, f: 11 },
];

const HEALTH = {
  bp: "118/76", bpStatus: "Normal",
  sleep: 6.5,   sleepStatus: "Low",
  heartRate: 68, hrStatus: "Resting",
  recovery: 74,  recoveryStatus: "Good",
};

const WEEKLY = {
  days:     ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  calories: [2050, 1980, 2110, 1870, 1640, 0, 0],
  target:   [2100, 2100, 2100, 2100, 2100, 2100, 2100],
  workouts: [true, true, false, true, true, false, false],
};

const AI_INSIGHTS = [
  { icon: "⚡", text: "You're 42g short on protein today. Add a whey shake or cottage cheese.", color: "#FF5C1A" },
  { icon: "📈", text: "Workout consistency improved 25% vs last week. Keep it up!",             color: "#B8F000" },
  { icon: "😴", text: "Sleep was 6.5h last night. Consider reducing today's workout intensity.", color: "#00C8E0" },
];

const QUICK_ACTIONS = [
  { icon: "⚖️", label: "Log Weight"  },
  { icon: "🩺", label: "Log BP"      },
  { icon: "🍽️", label: "Log Meal"    },
  { icon: "📋", label: "Full Plan"   },
  { icon: "🎯", label: "Update Goal" },
  { icon: "🤖", label: "AI Coach"    },
];

/* ─── Utils ─────────────────────────────────────────────────── */
function pct(v, t) { return Math.min(100, Math.round((v / t) * 100)); }

/* ─── useCountUp ─────────────────────────────────────────────── */
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

/* ─── Section reveal on scroll ──────────────────────────────── */
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

/* ─── MacroBar ───────────────────────────────────────────────── */
function MacroBar({ label, value, target, fillColor }) {
  const p = pct(value, target);
  return (
    <div className={styles.macroRow}>
      <div className={styles.macroHead}>
        <span>{label}</span>
        <span>
          {value}g{" "}
          <span className={styles.macroDenom}>/ {target}g</span>
        </span>
      </div>
      <div className={styles.macroTrack}>
        <div className={styles.macroFill} style={{ width: `${p}%`, background: fillColor }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Dashboard
═══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  // const { user } = useContext(AuthContext);
  const user = USER;

  const [activeTab, setActiveTab]   = useState("today");
  const [expandedEx, setExpandedEx] = useState(null);

  const donePct    = pct(WORKOUT.exercises.filter(e => e.done).length, WORKOUT.exercises.length);
  const calPct     = pct(TODAY.calories.consumed, TODAY.calories.target);
  const waterPct   = pct(TODAY.water.consumed, TODAY.water.target);
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
          <span className={styles.navLogoWord}>
            FIT<span>MITRA</span>
          </span>
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
          <div className={styles.navAvatar}>{user?.avatar ?? "U"}</div>
        </div>
      </nav>

      {/* ══ MAIN ═════════════════════════════════════════════════ */}
      <main className={styles.main}>

        {/* ── Welcome ──────────────────────────────────────────── */}
        <Section>
          <div className={styles.welcomeGrid}>
            <div>
              <div className={styles.welcomeBadges}>
                <span className={`${styles.badge} ${styles.badgeLime}`}>
                  <span className={styles.badgeDot} />
                  {user?.goal}
                </span>
                <span className={`${styles.badge} ${styles.badgeOrange}`}>
                  🔥 {TODAY.streak} Day Streak
                </span>
              </div>
              <h1 className={styles.welcomeH}>
                Welcome Back,<br />
                <span className={styles.welcomeAccent}>{user?.name}</span>
              </h1>
              <p className={styles.welcomeDate}>
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>

            <div className={`${styles.card} ${styles.accent} ${styles.weightChip}`}>
              <span className={styles.weightLabel}>Current Weight</span>
              <div className={styles.weightVal}>
                <AnimNum value={TODAY.weight.current} /><span>kg</span>
              </div>
              <span className={styles.weightChange}>
                {TODAY.weight.change > 0 ? "+" : ""}{TODAY.weight.change} kg this week
              </span>
            </div>
          </div>
        </Section>

        {/* ── Two-col: Workout + Nutrition ─────────────────────── */}
        <div className={styles.twoCol}>

          {/* Workout */}
          <Section>
            <div className={`${styles.card} ${styles.accent}`}>
              <div className={styles.workoutHeader}>
                <div>
                  <span className={styles.secLabel}>💪 Today's Workout</span>
                  <div className={styles.workoutTitle}>{WORKOUT.name}</div>
                  <div className={styles.workoutMeta}>
                    <span className={styles.metaPill}>⏱ {WORKOUT.duration}</span>
                    <span className={styles.metaPill}>📊 {WORKOUT.difficulty}</span>
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
                {WORKOUT.exercises.map((ex, i) => (
                  <div
                    key={ex.name}
                    className={`${styles.exerciseRow} ${ex.done ? styles.exDone : styles.exPending}`}
                    onClick={() => setExpandedEx(expandedEx === i ? null : i)}
                  >
                    <div className={`${styles.exerciseBullet} ${ex.done ? styles.bulletDone : styles.bulletPending}`}>
                      {ex.done ? "✓" : i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className={`${styles.exerciseName}${ex.done ? " " + styles.nameDone : ""}`}>
                        {ex.name}
                      </div>
                      <div className={styles.exerciseReps}>{ex.sets} sets × {ex.reps} reps</div>
                    </div>
                    <span className={styles.chevron}>{expandedEx === i ? "▲" : "▼"}</span>
                  </div>
                ))}
              </div>

              <button className={styles.primaryBtn}>Continue Workout →</button>
            </div>
          </Section>

          {/* Nutrition */}
          <Section>
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
                    <AnimNum value={TODAY.calories.consumed} />
                    <span className={styles.calDenom}> / {TODAY.calories.target}</span>
                  </div>
                  <div className={styles.calLabel}>kcal consumed today</div>
                  <div className={styles.calBar}>
                    <div className={styles.calBarFill} style={{ width: `${calPct}%` }} />
                  </div>
                </div>
              </div>

              <div className={styles.macros}>
                <MacroBar label="Protein" value={TODAY.protein.consumed} target={TODAY.protein.target} fillColor="linear-gradient(90deg,#FF5C1A,#FF8A3D)" />
                <MacroBar label="Carbs"   value={TODAY.carbs.consumed}   target={TODAY.carbs.target}   fillColor="linear-gradient(90deg,#00C8E0,#0090FF)" />
                <MacroBar label="Fats"    value={TODAY.fats.consumed}    target={TODAY.fats.target}    fillColor="linear-gradient(90deg,#B8F000,#80D400)" />
              </div>

              <div className={styles.waterBox}>
                <div className={styles.waterHead}>
                  <span className={styles.waterLabel}>💧 Water Intake</span>
                  <span className={styles.waterVal}>{TODAY.water.consumed}L / {TODAY.water.target}L</span>
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
          </Section>
        </div>

        {/* ── Meals Today ──────────────────────────────────────── */}
        <Section>
          <span className={styles.secLabel}>Meals Today</span>
          <div className={styles.mealsGrid}>
            {MEALS.map(m => (
              <div key={m.time} className={styles.mealCell}>
                <span className={styles.mealTime}>{m.time}</span>
                <span className={styles.mealEmoji}>{m.emoji}</span>
                <div className={styles.mealName}>{m.name}</div>
                <div className={styles.mealMacro}>{m.cal} kcal · P{m.p}g · C{m.c}g · F{m.f}g</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Health Snapshot ───────────────────────────────────── */}
        <Section>
          <span className={styles.secLabel}>🩺 Health Snapshot</span>
          <div className={styles.healthGrid}>
            {[
              { icon: "🫀", label: "Blood Pressure", value: HEALTH.bp,                 status: HEALTH.bpStatus,       color: "#FF5C1A" },
              { icon: "😴", label: "Sleep",           value: `${HEALTH.sleep}h`,        status: HEALTH.sleepStatus,    color: "#00C8E0" },
              { icon: "💓", label: "Heart Rate",      value: `${HEALTH.heartRate} bpm`, status: HEALTH.hrStatus,       color: "#FF4D6D" },
              { icon: "⚡", label: "Recovery",        value: `${HEALTH.recovery}%`,     status: HEALTH.recoveryStatus, color: "#B8F000" },
            ].map(h => (
              <div key={h.label} className={styles.healthCard}>
                <span className={styles.healthIcon}>{h.icon}</span>
                <span className={styles.healthLabel}>{h.label}</span>
                <span className={styles.healthVal} style={{ color: h.color }}>{h.value}</span>
                <span className={styles.healthStatus} style={{ color: h.color, background: `${h.color}18` }}>
                  {h.status}
                </span>
              </div>
            ))}
          </div>

          {HEALTH.sleep < 7 && (
            <div className={styles.alertBanner}>
              <span className={styles.alertIcon}>⚠️</span>
              <span>Low sleep detected. Workout intensity has been adjusted for today.</span>
            </div>
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

            <div className={styles.insightList}>
              {AI_INSIGHTS.map((ins, i) => (
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
                    <button className={styles.whyBtn} style={{ color: ins.color, background: `${ins.color}20` }}>
                      Why? →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Weekly Progress ───────────────────────────────────── */}
        <Section>
          <div className={`${styles.card} ${styles.accent}`}>
            <span className={styles.secLabel}>📈 Weekly Progress</span>

            <div className={styles.weekStats}>
              {[
                { label: "Consistency",       value: "80%",   sub: "4/5 workouts",  color: "#FF5C1A" },
                { label: "Calorie Adherence", value: "91%",   sub: "avg this week", color: "#B8F000" },
                { label: "Weight Lost",       value: "0.8kg", sub: "this week",     color: "#00C8E0" },
              ].map(s => (
                <div key={s.label} className={styles.weekStat}>
                  <span className={styles.weekStatVal} style={{ color: s.color, filter: `drop-shadow(0 0 10px ${s.color}66)` }}>
                    {s.value}
                  </span>
                  <span className={styles.weekStatLabel}>{s.label}</span>
                  <span className={styles.weekStatSub}>{s.sub}</span>
                </div>
              ))}
            </div>

            <div className={styles.dayTracker}>
              <span className={styles.secLabel}>Workout Days</span>
              <div className={styles.dayRow}>
                {WEEKLY.days.map((d, i) => (
                  <div key={d} className={styles.dayCol}>
                    <div className={`${styles.dayBox} ${WEEKLY.workouts[i] ? styles.dayDone : styles.dayMiss}`}>
                      {WEEKLY.workouts[i] ? "✓" : ""}
                    </div>
                    <span className={styles.dayName}>{d}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className={styles.secLabel}>Calories vs Target</span>
              <div className={styles.calBars}>
                {WEEKLY.calories.map((cal, i) => {
                  const p = cal ? pct(cal, WEEKLY.target[i]) : 0;
                  const isToday = i === 4;
                  return (
                    <div key={i} className={styles.calBarCol}>
                      <div className={styles.calBarTrack}>
                        <div
                          className={`${styles.calBarFillWk} ${!cal ? styles.wkEmpty : isToday ? styles.wkHot : styles.wkNormal}`}
                          style={{ height: `${p}%` }}
                        />
                      </div>
                      <span className={styles.calBarDay}>{WEEKLY.days[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
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