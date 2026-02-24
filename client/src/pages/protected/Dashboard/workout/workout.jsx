// src/pages/Workout/Workout.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../../services/apiClient";
import styles from "./Workout.module.css";

const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

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

export default function Workout() {
  const navigate = useNavigate();
  const [workout,   setWorkout]   = useState(null);
  const [weekly,    setWeekly]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [logging,   setLogging]   = useState(false);
  const [alert,     setAlert]     = useState(null);
  const [logForm,   setLogForm]   = useState(null); // { exerciseName, sets, reps, weight }
  const [done,      setDone]      = useState({});   // { [exerciseName]: true }

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [w, wk] = await Promise.allSettled([
        apiFetch("/dashboard/workout/today"),
        apiFetch("/workouts/weekly"),
      ]);
      if (w.status === "fulfilled") {
        const d = w.value?.data ?? w.value;
        setWorkout(d);
        // pre-mark any already-logged exercises
        const doneMap = {};
        (d?.exercises ?? []).forEach(e => { if (e.done) doneMap[e.name] = true; });
        setDone(doneMap);
      }
      if (wk.status === "fulfilled") setWeekly(wk.value?.data ?? wk.value);
    } catch (e) {
      showAlert("error", "Failed to load workout.");
    } finally {
      setLoading(false);
    }
  };

  const openLog = (ex) => setLogForm({ exerciseName: ex.name, sets: ex.sets ?? 3, reps: ex.reps ?? 10, weight: "" });

  const submitLog = async () => {
    if (!logForm) return;
    setLogging(true);
    try {
      await apiFetch("/workouts/log", {
        method: "POST",
        body: JSON.stringify({
          exercises: [{
            name:   logForm.exerciseName,
            sets:   Number(logForm.sets),
            reps:   Number(logForm.reps),
            weight: logForm.weight ? Number(logForm.weight) : null,
          }],
        }),
      });
      setDone(d => ({ ...d, [logForm.exerciseName]: true }));
      setLogForm(null);
      showAlert("success", `${logForm.exerciseName} logged! 💪`);
    } catch (e) {
      showAlert("error", e?.message ?? "Failed to log exercise.");
    } finally {
      setLogging(false);
    }
  };

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  const todayKey  = DAYS[new Date().getDay()];
  const exercises = workout?.exercises ?? [];
  const doneCount = exercises.filter(e => done[e.name]).length;
  const pct       = exercises.length ? Math.round((doneCount / exercises.length) * 100) : 0;
  const isRest    = !exercises.length || workout?.name?.toLowerCase().includes("rest");

  if (loading) return (
    <div className={styles.wrapper}>
      <div className={styles.loadWrap}><div className={styles.loadRing}/><span>Loading workout…</span></div>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      {/* NAV */}
      <nav className={styles.nav}>
        <a className={styles.navLogo} href="/dashboard">
          <span className={styles.navLogoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
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

        {/* HERO */}
        <Section delay={0}>
          <div className={styles.heroCard}>
            <div className={styles.heroBg}/>
            <div className={styles.heroContent}>
              <div className={styles.heroLeft}>
                <span className={styles.dayLabel}>💪 {todayKey.charAt(0).toUpperCase() + todayKey.slice(1)}'s Workout</span>
                <h1 className={styles.heroTitle}>{workout?.name ?? "Rest Day"}</h1>
                <div className={styles.heroPills}>
                  {workout?.duration   && <span className={styles.pill}>⏱ {workout.duration}</span>}
                  {workout?.difficulty && <span className={styles.pill}>📊 {workout.difficulty}</span>}
                  {workout?.muscle_groups?.map(g => <span key={g} className={`${styles.pill} ${styles.pillAccent}`}>{g}</span>)}
                </div>
              </div>

              {/* Progress ring */}
              <div className={styles.ringWrap}>
                <svg viewBox="0 0 100 100" className={styles.ring}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="url(#wGrad)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
                    style={{ transition: "stroke-dashoffset 1s ease", filter: "drop-shadow(0 0 8px rgba(255,92,26,0.6))" }}
                  />
                  <defs>
                    <linearGradient id="wGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF5C1A"/><stop offset="100%" stopColor="#FF8A3D"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className={styles.ringInner}>
                  <span className={styles.ringPct}>{pct}%</span>
                  <span className={styles.ringLabel}>{doneCount}/{exercises.length}</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* REST DAY */}
        {isRest ? (
          <Section delay={60}>
            <div className={styles.restCard}>
              <span className={styles.restEmoji}>🛋️</span>
              <h2>Rest & Recovery</h2>
              <p>Your muscles grow during rest. Take it easy today — stretch, hydrate, and sleep well.</p>
            </div>
          </Section>
        ) : (
          <>
            {/* EXERCISE LIST */}
            <Section delay={60}>
              <h2 className={styles.sectionTitle}>Today's Exercises</h2>
              <div className={styles.exerciseList}>
                {exercises.map((ex, i) => {
                  const isDone = !!done[ex.name];
                  return (
                    <div key={ex.name} className={`${styles.exCard} ${isDone ? styles.exDone : ""}`}>
                      <div className={styles.exNum}>{isDone ? "✓" : i + 1}</div>
                      <div className={styles.exBody}>
                        <div className={styles.exName}>{ex.name}</div>
                        <div className={styles.exMeta}>
                          {ex.sets} sets × {ex.reps} reps
                          {ex.weight ? ` · ${ex.weight}kg` : ""}
                        </div>
                      </div>
                      <button
                        className={`${styles.logBtn} ${isDone ? styles.logBtnDone : ""}`}
                        onClick={() => !isDone && openLog(ex)}
                        disabled={isDone}
                      >
                        {isDone ? "Logged" : "Log"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* GUIDELINES */}
            {workout?.guidelines && (
              <Section delay={120}>
                <h2 className={styles.sectionTitle}>📋 Guidelines</h2>
                <div className={styles.guideGrid}>
                  {Object.entries(workout.guidelines).map(([k, v]) => (
                    <div key={k} className={styles.guideCard}>
                      <span className={styles.guideKey}>{k.replace(/_/g, " ")}</span>
                      <span className={styles.guideVal}>{v}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* SAFETY NOTES */}
            {workout?.safety_notes?.length > 0 && (
              <Section delay={160}>
                <h2 className={styles.sectionTitle}>⚠️ Safety Notes</h2>
                <div className={styles.safetyList}>
                  {workout.safety_notes.map((n, i) => (
                    <div key={i} className={styles.safetyNote}>
                      <span className={styles.safetyDot}/>
                      {n}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        {/* WEEKLY PLAN */}
        {weekly?.weekly_plan && (
          <Section delay={200}>
            <h2 className={styles.sectionTitle}>📅 Weekly Split</h2>
            <div className={styles.weekGrid}>
              {DAYS.map(day => {
                const groups = weekly.weekly_plan[day] ?? [];
                const isToday = day === todayKey;
                const isRestDay = groups.some(g => /rest/i.test(g));
                return (
                  <div key={day} className={`${styles.weekCard} ${isToday ? styles.weekCardToday : ""} ${isRestDay ? styles.weekCardRest : ""}`}>
                    <span className={styles.weekDay}>{day.slice(0,3).toUpperCase()}</span>
                    {groups.length
                      ? groups.map(g => <span key={g} className={styles.weekGroup}>{g}</span>)
                      : <span className={styles.weekGroup}>Rest</span>
                    }
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </main>

      {/* LOG MODAL */}
      {logForm && (
        <div className={styles.modalOverlay} onClick={() => setLogForm(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Log: {logForm.exerciseName}</h3>
            <div className={styles.modalFields}>
              <label className={styles.modalLabel}>Sets
                <input type="number" className={styles.modalInput} value={logForm.sets}
                  onChange={e => setLogForm(f => ({ ...f, sets: e.target.value }))} min="1"/>
              </label>
              <label className={styles.modalLabel}>Reps
                <input type="number" className={styles.modalInput} value={logForm.reps}
                  onChange={e => setLogForm(f => ({ ...f, reps: e.target.value }))} min="1"/>
              </label>
              <label className={styles.modalLabel}>Weight (kg) — optional
                <input type="number" className={styles.modalInput} value={logForm.weight}
                  onChange={e => setLogForm(f => ({ ...f, weight: e.target.value }))} min="0" step="0.5" placeholder="0"/>
              </label>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setLogForm(null)}>Cancel</button>
              <button className={styles.modalConfirm} onClick={submitLog} disabled={logging}>
                {logging ? "Logging…" : "✓ Log Exercise"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}