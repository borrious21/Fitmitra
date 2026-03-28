// src/pages/Workout/Workout.jsx
import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate }  from "react-router-dom";
import { apiFetch }     from "../../../../services/apiClient";
import { AuthContext }  from "../../../../context/AuthContext";
import ActivityCalendar from "../../../../components/ActivityCalendar/ActivityCalendar";
import ThemeToggle      from "../../../../components/ThemeToggle/ThemeToggle";
import styles           from "./workout.module.css";

const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

const PROGRESSION_INFO = {
  reps_increase:   { label: "📈 +1 Rep next session",   color: "#10b981" },
  weight_increase: { label: "🏋️ +2.5kg next session",   color: "#f59e0b" },
  set_increase:    { label: "➕ +1 Set next session",   color: "#6366f1" },
  deload:          { label: "🔄 Deload — reduced load", color: "#64748b" },
  maintain:        { label: "✓ Maintain current load",  color: "#94a3b8" },
  maintain_hard:   { label: "💪 Tough — hold this week", color: "#f97316" },
  at_ceiling:      { label: "🏆 At peak — well done!",  color: "#eab308" },
};

const AVATAR_KEY = "fitmitra_avatar_url";
const getAvatar  = () => { try { return localStorage.getItem(AVATAR_KEY) || null; } catch { return null; } };

function NavAvatar({ avatarUrl, initials }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [avatarUrl]);
  if (avatarUrl && !imgError) {
    return (
      <img src={avatarUrl} alt="avatar" className={styles.navAvatarImg}
        onError={() => { try { localStorage.removeItem(AVATAR_KEY); } catch {} setImgError(true); }} />
    );
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

function DeloadBanner() {
  return (
    <div className={styles.deloadBanner}>
      <span className={styles.deloadIcon}>🔄</span>
      <div>
        <strong>Deload Week</strong> — Volume is reduced by 20% and weight by ~35%.
        Focus on form, not load. Your body is recovering to grow stronger.
      </div>
    </div>
  );
}

function PRAlert({ exercise_name, new_1rm }) {
  return (
    <div className={styles.prAlert}>
      🏅 New PR on <strong>{exercise_name}</strong>! Estimated 1RM: <strong>{new_1rm}kg</strong>
    </div>
  );
}

function RPESelector({ value, onChange }) {
  return (
    <div className={styles.rpeWrap}>
      <span className={styles.rpeLabel}>How hard was it?</span>
      <div className={styles.rpeBtns}>
        {[
          { key: "easy",   label: "😊 Easy",  color: "#10b981" },
          { key: "medium", label: "😤 Medium", color: "#f59e0b" },
          { key: "hard",   label: "🔥 Hard",   color: "#ef4444" },
        ].map(d => (
          <button key={d.key}
            className={`${styles.rpeBtn} ${value === d.key ? styles.rpeBtnActive : ""}`}
            style={value === d.key ? { borderColor: d.color, background: `${d.color}20`, color: d.color } : {}}
            onClick={() => onChange(d.key)}>
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Workout() {
  const navigate  = useNavigate();
  const { user }  = useContext(AuthContext);

  const [workout,  setWorkout]  = useState(null);
  const [weekly,   setWeekly]   = useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [logging,  setLogging]  = useState(false);
  const [alert,    setAlert]    = useState(null);
  const [logForm,  setLogForm]  = useState(null);
  const [done,     setDone]     = useState({});
  const [prAlerts, setPRAlerts] = useState([]);
  const [insights, setInsights] = useState([]);

  const avatarUrl   = getAvatar();
  const displayName = user?.name ?? "User";
  const initials    = displayName.split(" ").map(n => n[0] ?? "").join("").slice(0, 2).toUpperCase();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [w, wk, hist, ins] = await Promise.allSettled([
        apiFetch("/dashboard/workout/today"),
        apiFetch("/workouts/weekly"),
        apiFetch("/workouts/history?limit=200"),
        apiFetch("/workouts/insights"),
      ]);
      if (w.status === "fulfilled") {
        const d = w.value?.data ?? w.value;
        setWorkout(d);
        const doneMap = {};
        (d?.exercises ?? []).forEach(e => { if (e.done) doneMap[e.name] = true; });
        setDone(doneMap);
      }
      if (wk.status   === "fulfilled") setWeekly(wk.value?.data ?? wk.value);
      if (hist.status === "fulfilled") { const d = hist.value?.data ?? hist.value; setHistory(Array.isArray(d) ? d : []); }
      if (ins.status  === "fulfilled") { const d = ins.value?.data  ?? ins.value;  setInsights(Array.isArray(d) ? d : []); }
    } catch { showAlert("error", "Failed to load workout."); }
    finally  { setLoading(false); }
  };

  const openLog = (ex) => setLogForm({
    exerciseName:     ex.name,
    isCardio:         ex.isCardio ?? false,
    sets:             ex.isCardio ? (ex.rounds ?? ex.sets ?? 4) : (ex.sets ?? 3),
    reps:             ex.isCardio ? 1 : (ex.reps ?? 10),
    weight:           ex.weight_kg > 0 ? String(ex.weight_kg) : "",
    duration:         ex.duration ?? "",
    allSetsCompleted: true,
    difficulty:       "medium",
    progressionNote:  ex.progression_note ?? null,
    estimatedKcal:    ex.estimated_kcal   ?? 0,
  });

  const submitLog = async () => {
    if (!logForm) return;
    setLogging(true);
    try {
      const RPE_MAP = { easy: 5, medium: 7, hard: 9 };
      await apiFetch("/workouts/log", {
        method: "POST",
        body: JSON.stringify({
          exercises: [{
            name:   logForm.exerciseName,
            sets:   Number(logForm.sets),
            reps:   logForm.isCardio ? 1 : Number(logForm.reps),
            weight: (!logForm.isCardio && logForm.weight) ? Number(logForm.weight) : null,
            notes:  logForm.isCardio && logForm.duration ? `Duration: ${logForm.duration}` : null,
          }],
          all_sets_completed: logForm.allSetsCompleted,
          rpe: RPE_MAP[logForm.difficulty] ?? 6,
        }),
      });

      setDone(d => ({ ...d, [logForm.exerciseName]: true }));

      try {
        const prRes = await apiFetch("/workouts/prs");
        const prs   = prRes?.data ?? prRes ?? [];
        const today = new Date().toISOString().split("T")[0];
        const newPR = Array.isArray(prs)
          ? prs.find(p => p.exercise_name === logForm.exerciseName && p.achieved_at >= today)
          : null;
        if (newPR) {
          setPRAlerts(prev => [...prev, { exercise_name: newPR.exercise_name, new_1rm: newPR.best_1rm }]);
          setTimeout(() => setPRAlerts(prev => prev.slice(1)), 6000);
        }
      } catch { /* silent */ }

      setLogForm(null);
      showAlert("success", `${logForm.exerciseName} logged! 💪`);
      const hist = await apiFetch("/workouts/history?limit=200");
      const d = hist?.data ?? hist;
      setHistory(Array.isArray(d) ? d : []);
    } catch (e) {
      showAlert("error", e?.message ?? "Failed to log exercise.");
    } finally {
      setLogging(false);
    }
  };

  const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); };

  const todayKey    = DAYS[new Date().getDay()];
  const exercises   = workout?.exercises ?? [];
  const doneCount   = exercises.filter(e => done[e.name]).length;
  const pct         = exercises.length ? Math.round((doneCount / exercises.length) * 100) : 0;
  const isRest      = workout ? workout.isRestDay === true : false;
  const isDeload    = workout?.is_deload_week === true;
  const sessionKcal = workout?.estimated_kcal ?? 0;
  const accountCreatedAt = user?.created_at ?? user?.createdAt ?? null;

  if (loading) return (
    <div className={styles.wrapper}>
      <div className={styles.loadWrap}><div className={styles.loadRing}/><span>Loading workout…</span></div>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <nav className={styles.nav}>
        <a className={styles.navLogo} href="/dashboard">
          <span className={styles.navLogoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </span>
          <span className={styles.navLogoWord}>FIT<span>MITRA</span></span>
        </a>
        <div className={styles.navRight}>
          <ThemeToggle />
          <button className={styles.backBtn} onClick={() => navigate(-1)}>← Dashboard</button>
          <a href="/profile" className={styles.navAvatarLink} title="Profile">
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
        {prAlerts.map((pr, i) => <PRAlert key={i} exercise_name={pr.exercise_name} new_1rm={pr.new_1rm} />)}
        {isDeload && <DeloadBanner />}

        <Section delay={0}>
          <div className={styles.heroCard}>
            <div className={styles.heroBg}/>
            <div className={styles.heroContent}>
              <div className={styles.heroLeft}>
                <div className={styles.dayLabel}>{isRest ? "🛌" : "💪"} {todayKey.charAt(0).toUpperCase() + todayKey.slice(1)}'s Workout</div>
                <h1 className={styles.heroTitle}>{workout?.name ?? "Rest Day"}</h1>
                {!isRest && (
                  <div className={styles.heroPills}>
                    {workout?.duration       && <span className={styles.pill}>⏱ {workout.duration}</span>}
                    {workout?.difficulty     && <span className={styles.pill}>📊 {workout.difficulty}</span>}
                    {sessionKcal > 0         && <span className={`${styles.pill} ${styles.pillFire}`}>🔥 ~{sessionKcal} kcal</span>}
                    {workout?.mesocycle_week && <span className={`${styles.pill} ${styles.pillSlate}`}>Week {workout.mesocycle_week}/4</span>}
                    {workout?.rotation_tier  && <span className={`${styles.pill} ${styles.pillPurple}`}>Tier {workout.rotation_tier}</span>}
                    {workout?.muscle_groups?.filter(g => !/^rest/i.test(g)).map(g => (
                      <span key={g} className={`${styles.pill} ${styles.pillAccent}`}>{g}</span>
                    ))}
                  </div>
                )}
              </div>
              {!isRest && (
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
              )}
            </div>
          </div>
        </Section>

        {!isRest && insights.length > 0 && (
          <Section delay={30}>
            <div className={styles.insightStrip}>
              {insights.slice(0, 2).map((ins, i) => (
                <div key={i} className={styles.insightChip}>
                  <span>{ins.icon ?? "💡"}</span><span>{ins.message ?? ins.text}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {isRest ? (
          <Section delay={60}>
            <div className={styles.restCard}>
              <span className={styles.restEmoji}>🛌</span>
              <h2>Rest & Recovery</h2>
              <p>Your muscles grow during rest. Take it easy today — stretch, hydrate, and sleep well.</p>
              <div className={styles.restTips}>
                {["💧 Drink at least 2L of water","🧘 10 min light stretching","😴 Aim for 8h sleep tonight","🚶 A light walk is fine"]
                  .map(t => <div key={t} className={styles.restTip}>{t}</div>)}
              </div>
            </div>
          </Section>
        ) : (
          <>
            <Section delay={60}>
              <h2 className={styles.sectionTitle}>Today's Exercises</h2>
              <div className={styles.exerciseList}>
                {exercises.map((ex, i) => {
                  const isDone   = !!done[ex.name];
                  const progInfo = ex.progression_note ? PROGRESSION_INFO[ex.progression_note] : null;
                  let metaLine;
                  if (ex.isCardio) {
                    const rounds  = ex.rounds ?? ex.sets;
                    const workDur = ex.duration ?? ex.reps;
                    const restDur = ex.rest ?? (ex.rest_seconds ? `${ex.rest_seconds}s` : null);
                    metaLine = ex.type === "steady"
                      ? `${workDur} · steady state`
                      : `${rounds} rounds · ${workDur} on${restDur ? ` / ${restDur} rest` : ""}`;
                  } else {
                    metaLine = `${ex.sets} sets × ${ex.reps} reps`;
                    if (ex.weight_kg > 0) metaLine += ` · ${ex.weight_kg}kg`;
                    if (ex.rest_seconds)  metaLine += ` · ${ex.rest_seconds}s rest`;
                  }
                  return (
                    <div key={ex.name} className={`${styles.exCard} ${isDone ? styles.exDone : ""} ${isDeload ? styles.exDeload : ""}`}>
                      <div className={styles.exNum}>{isDone ? "✓" : i + 1}</div>
                      <div className={styles.exBody}>
                        <div className={styles.exNameRow}>
                          <div className={styles.exName}>{ex.name}</div>
                          {ex.tier && <span className={styles.tierBadge}>Tier {ex.tier}</span>}
                        </div>
                        <div className={styles.exMeta}>{metaLine}</div>
                        {progInfo && !isDone && (
                          <div className={styles.progressionNote}
                            style={{ color: progInfo.color, borderColor: `${progInfo.color}33`, background: `${progInfo.color}0D` }}>
                            {progInfo.label}
                          </div>
                        )}
                        {ex.estimated_kcal > 0 && <div className={styles.exKcalLine}>🔥 ~{ex.estimated_kcal} kcal estimated</div>}
                      </div>
                      <button className={`${styles.logBtn} ${isDone ? styles.logBtnDone : ""}`}
                        onClick={() => !isDone && openLog(ex)} disabled={isDone}>
                        {isDone ? "Logged ✓" : "Log"}
                      </button>
                    </div>
                  );
                })}
              </div>
              {sessionKcal > 0 && doneCount === 0 && (
                <div className={styles.sessionKcalBar}>🔥 Estimated session burn: <strong>~{sessionKcal} kcal</strong></div>
              )}
              {doneCount > 0 && doneCount < exercises.length && (
                <div className={styles.sessionKcalBar}>✅ {doneCount} of {exercises.length} exercises logged</div>
              )}
              {doneCount === exercises.length && exercises.length > 0 && (
                <div className={`${styles.sessionKcalBar} ${styles.sessionComplete}`}>🎉 Workout complete! Great session.</div>
              )}
            </Section>

            {workout?.guidelines && Object.keys(workout.guidelines).length > 0 && (
              <Section delay={120}>
                <h2 className={styles.sectionTitle}>Guidelines</h2>
                <div className={styles.guideGrid}>
                  {Object.entries(workout.guidelines).map(([k, v]) => v && (
                    <div key={k} className={styles.guideCard}>
                      <span className={styles.guideKey}>{k.replace(/_/g, " ")}</span>
                      <span className={styles.guideVal}>{v}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {workout?.safety_notes?.length > 0 && (
              <Section delay={160}>
                <h2 className={styles.sectionTitle}>Safety Notes</h2>
                <div className={styles.safetyList}>
                  {workout.safety_notes.map((n, i) => (
                    <div key={i} className={styles.safetyNote}><span className={styles.safetyDot}/>{n}</div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        <Section delay={220}>
          <div className={styles.calendarSection}>
            <ActivityCalendar history={history} weeklyPlan={weekly?.weekly_plan} accountCreatedAt={accountCreatedAt} />
          </div>
        </Section>
      </main>

      {logForm && (
        <div className={styles.modalOverlay} onClick={() => setLogForm(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Log: {logForm.exerciseName}</h3>
            {logForm.progressionNote && PROGRESSION_INFO[logForm.progressionNote] && (
              <div className={styles.modalProgNote} style={{
                color:       PROGRESSION_INFO[logForm.progressionNote].color,
                background:  `${PROGRESSION_INFO[logForm.progressionNote].color}15`,
                borderColor: `${PROGRESSION_INFO[logForm.progressionNote].color}40`,
              }}>
                Target next session: {PROGRESSION_INFO[logForm.progressionNote].label}
              </div>
            )}
            <div className={styles.modalFields}>
              {logForm.isCardio ? (
                <>
                  <label className={styles.modalLabel}>Rounds completed
                    <input type="number" className={styles.modalInput} value={logForm.sets}
                      onChange={e => setLogForm(f => ({ ...f, sets: e.target.value }))} min="1"/>
                  </label>
                  <label className={styles.modalLabel}>Duration per round
                    <input type="text" className={styles.modalInput} value={logForm.duration}
                      onChange={e => setLogForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 45 sec"/>
                  </label>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
            <div className={styles.modalToggleRow}>
              <span className={styles.modalToggleLabel}>Completed all sets?</span>
              <button className={`${styles.toggleBtn} ${logForm.allSetsCompleted ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => setLogForm(f => ({ ...f, allSetsCompleted: !f.allSetsCompleted }))}>
                {logForm.allSetsCompleted ? "✓ Yes" : "✗ No"}
              </button>
            </div>
            <RPESelector value={logForm.difficulty} onChange={d => setLogForm(f => ({ ...f, difficulty: d }))} />
            {logForm.estimatedKcal > 0 && <div className={styles.modalKcal}>🔥 Estimated burn: ~{logForm.estimatedKcal} kcal</div>}
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