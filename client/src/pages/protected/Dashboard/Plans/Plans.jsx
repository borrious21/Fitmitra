// src/pages/Plans/Plans.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../../services/apiClient";
import styles from "./Plans.module.css";

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

export default function Plans() {
  const navigate   = useNavigate();
  const [plan,      setPlan]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [alert,     setAlert]     = useState(null);

  useEffect(() => { fetchPlan(); }, []);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/plans/active");
      setPlan(res?.data ?? res);
    } catch (err) {
      if (err?.status === 404) setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      await apiFetch("/plans/generate", { method: "POST" });
      showAlert("success", "New plan generated! 🎯");
      fetchPlan();
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

  const workoutPlan = plan?.workout_plan;
  const weeklyPlan  = workoutPlan?.weekly_plan ?? {};
  const meta        = workoutPlan?.meta ?? {};
  const guidelines  = workoutPlan?.guidelines ?? {};
  const safetyNotes = workoutPlan?.safety_notes ?? [];
  const details     = workoutPlan?.workout_details ?? {};

  const todayKey = DAYS[new Date().getDay()];

  if (loading) return (
    <div className={styles.wrapper}>
      <div className={styles.loadWrap}><div className={styles.loadRing}/><span>Loading plan…</span></div>
    </div>
  );

  return (
    <div className={styles.wrapper}>
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

        {/* HEADER */}
        <Section delay={0}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>📋 Your Plan</h1>
              <p className={styles.sub}>
                {plan
                  ? `Generated ${new Date(plan.generated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${plan.duration_weeks ?? 4} weeks`
                  : "No active plan yet"}
              </p>
            </div>
            <button
              className={styles.generateBtn}
              onClick={generatePlan}
              disabled={generating}
            >
              {generating ? "Generating…" : plan ? "🔄 Regenerate" : "✨ Generate Plan"}
            </button>
          </div>
        </Section>

        {!plan ? (
          <Section delay={60}>
            <div className={styles.emptyCard}>
              <span className={styles.emptyEmoji}>🎯</span>
              <h2>No Active Plan</h2>
              <p>Generate a personalized workout plan based on your profile — goal, activity level, and health conditions are all taken into account.</p>
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
                  { icon: "🎯", label: "Goal",     val: (meta.goal ?? "—").replace(/_/g, " ") },
                  { icon: "⚡", label: "Intensity", val: meta.intensity ?? "—" },
                  { icon: "📅", label: "Duration",  val: `${plan.duration_weeks ?? 4} weeks` },
                  { icon: "🏃", label: "Activity",  val: (meta.activity_level ?? "—").replace(/_/g, " ") },
                ].map(m => (
                  <div key={m.label} className={styles.metaCard}>
                    <span className={styles.metaIcon}>{m.icon}</span>
                    <span className={styles.metaVal} style={{ textTransform: "capitalize" }}>{m.val}</span>
                    <span className={styles.metaLabel}>{m.label}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* WEEKLY SPLIT */}
            <Section delay={100}>
              <h2 className={styles.sectionTitle}>📅 Weekly Split</h2>
              <div className={styles.weekGrid}>
                {DAYS.map(day => {
                  const groups   = weeklyPlan[day] ?? [];
                  const isToday  = day === todayKey;
                  const isRest   = groups.some(g => /rest/i.test(g));
                  return (
                    <div key={day} className={`${styles.weekCard} ${isToday ? styles.today : ""} ${isRest ? styles.restDay : ""}`}>
                      <span className={styles.weekDayLabel}>{day.slice(0,3).toUpperCase()}</span>
                      {isToday && <span className={styles.todayBadge}>Today</span>}
                      <div className={styles.weekGroups}>
                        {groups.length
                          ? groups.map(g => <span key={g} className={styles.weekGroup}>{g}</span>)
                          : <span className={styles.weekGroup}>Rest</span>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* WORKOUT DETAILS */}
            {Object.keys(details).length > 0 && (
              <Section delay={140}>
                <h2 className={styles.sectionTitle}>⚙️ Workout Details</h2>
                <div className={styles.detailsGrid}>
                  {details.sets_range   && <Detail icon="🔢" label="Sets"     val={details.sets_range}/>}
                  {details.reps_range   && <Detail icon="🔁" label="Reps"     val={details.reps_range}/>}
                  {details.rest_between_sets && <Detail icon="⏸️" label="Rest"     val={details.rest_between_sets}/>}
                  {details.cardio_guidance?.type && <Detail icon="🏃" label="Cardio"   val={details.cardio_guidance.type}/>}
                  {details.cardio_guidance?.duration && <Detail icon="⏱️" label="Duration" val={details.cardio_guidance.duration}/>}
                  {details.cardio_guidance?.frequency && <Detail icon="📆" label="Frequency" val={details.cardio_guidance.frequency}/>}
                </div>
              </Section>
            )}

            {/* GUIDELINES */}
            {Object.keys(guidelines).length > 0 && (
              <Section delay={180}>
                <h2 className={styles.sectionTitle}>📋 Guidelines</h2>
                <div className={styles.guideList}>
                  {Object.entries(guidelines).map(([k, v]) => (
                    <div key={k} className={styles.guideRow}>
                      <span className={styles.guideKey}>{k.replace(/_/g, " ")}</span>
                      <span className={styles.guideVal}>{v}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* SAFETY */}
            {safetyNotes.length > 0 && (
              <Section delay={220}>
                <h2 className={styles.sectionTitle}>⚠️ Safety Notes</h2>
                <div className={styles.safetyList}>
                  {safetyNotes.map((n, i) => (
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
      </main>
    </div>
  );
}

function Detail({ icon, label, val }) {
  return (
    <div className={styles.detailCard}>
      <span className={styles.detailIcon}>{icon}</span>
      <div>
        <div className={styles.detailLabel}>{label}</div>
        <div className={styles.detailVal}>{val}</div>
      </div>
    </div>
  );
}