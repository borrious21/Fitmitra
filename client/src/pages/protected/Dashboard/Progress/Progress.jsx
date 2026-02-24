// src/pages/Progress/Progress.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../services/apiClient";
import styles from "./Progress.module.css";

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

const EMPTY_LOG = { weight_kg: "", body_fat_percentage: "", energy_level: 5, sleep_hours: "", water_intake_liters: "", notes: "" };

export default function Progress() {
  const navigate = useNavigate();
  const [logs,    setLogs]    = useState([]);
  const [form,    setForm]    = useState(EMPTY_LOG);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert,   setAlert]   = useState(null);
  const [errors,  setErrors]  = useState({});

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/progress");
      setLogs(Array.isArray(res?.data ?? res) ? (res?.data ?? res) : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (form.weight_kg && (isNaN(Number(form.weight_kg)) || Number(form.weight_kg) < 20)) e.weight_kg = "Invalid weight";
    if (form.sleep_hours && (isNaN(Number(form.sleep_hours)) || Number(form.sleep_hours) < 0 || Number(form.sleep_hours) > 24)) e.sleep_hours = "0–24 hrs";
    if (form.water_intake_liters && isNaN(Number(form.water_intake_liters))) e.water_intake_liters = "Invalid";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        log_date: new Date().toISOString().split("T")[0],
      };
      if (form.weight_kg)          payload.weight_kg           = Number(form.weight_kg);
      if (form.body_fat_percentage) payload.body_fat_percentage = Number(form.body_fat_percentage);
      if (form.energy_level)       payload.energy_level        = Number(form.energy_level);
      if (form.sleep_hours)        payload.sleep_hours         = Number(form.sleep_hours);
      if (form.water_intake_liters) payload.water_intake_liters = Number(form.water_intake_liters);
      if (form.notes)              payload.notes               = form.notes;

      await apiFetch("/progress", { method: "POST", body: JSON.stringify(payload) });
      showAlert("success", "Progress logged! 📈");
      setForm(EMPTY_LOG);
      fetchLogs();
    } catch (err) {
      showAlert("error", err?.message ?? "Failed to log progress.");
    } finally {
      setSaving(false);
    }
  };

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  // Latest stats
  const latest = logs[0];
  const prev   = logs[1];
  const weightDiff = latest?.weight_kg && prev?.weight_kg
    ? (Number(latest.weight_kg) - Number(prev.weight_kg)).toFixed(1)
    : null;

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

        <Section delay={0}>
          <h1 className={styles.title}>📈 Progress Tracking</h1>
          <p className={styles.sub}>Log your daily metrics to see trends over time</p>
        </Section>

        {/* LATEST STATS */}
        {latest && (
          <Section delay={60}>
            <h2 className={styles.sectionTitle}>Latest Snapshot</h2>
            <div className={styles.statsGrid}>
              {[
                { icon: "⚖️", label: "Weight",    val: latest.weight_kg ? `${latest.weight_kg} kg` : "—",
                  sub: weightDiff ? `${weightDiff > 0 ? "+" : ""}${weightDiff} kg` : null,
                  color: Number(weightDiff) < 0 ? "#B8F000" : Number(weightDiff) > 0 ? "#FF4D6D" : "#fff" },
                { icon: "😴", label: "Sleep",     val: latest.sleep_hours ? `${latest.sleep_hours}h` : "—", color: "#00C8E0" },
                { icon: "⚡", label: "Energy",    val: latest.energy_level ? `${latest.energy_level}/10` : "—", color: "#FF5C1A" },
                { icon: "💧", label: "Water",     val: latest.water_intake_liters ? `${latest.water_intake_liters}L` : "—", color: "#00C8E0" },
              ].map(s => (
                <div key={s.label} className={styles.statCard}>
                  <span className={styles.statIcon}>{s.icon}</span>
                  <span className={styles.statVal} style={{ color: s.color }}>{s.val}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                  {s.sub && <span className={styles.statSub} style={{ color: s.color }}>{s.sub}</span>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* LOG FORM */}
        <Section delay={120}>
          <h2 className={styles.sectionTitle}>Log Today</h2>
          <form onSubmit={handleSubmit} className={styles.form}>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Weight (kg)</label>
                <input type="number" step="0.1" min="20" max="300"
                  className={`${styles.input} ${errors.weight_kg ? styles.inputErr : ""}`}
                  value={form.weight_kg} onChange={e => set("weight_kg", e.target.value)} placeholder="e.g. 72.5"/>
                {errors.weight_kg && <span className={styles.errMsg}>{errors.weight_kg}</span>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Body Fat %</label>
                <input type="number" step="0.1" min="2" max="60"
                  className={styles.input}
                  value={form.body_fat_percentage} onChange={e => set("body_fat_percentage", e.target.value)} placeholder="e.g. 18"/>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Sleep (hrs)</label>
                <input type="number" step="0.5" min="0" max="24"
                  className={`${styles.input} ${errors.sleep_hours ? styles.inputErr : ""}`}
                  value={form.sleep_hours} onChange={e => set("sleep_hours", e.target.value)} placeholder="e.g. 7.5"/>
                {errors.sleep_hours && <span className={styles.errMsg}>{errors.sleep_hours}</span>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Water (litres)</label>
                <input type="number" step="0.1" min="0"
                  className={`${styles.input} ${errors.water_intake_liters ? styles.inputErr : ""}`}
                  value={form.water_intake_liters} onChange={e => set("water_intake_liters", e.target.value)} placeholder="e.g. 2.5"/>
              </div>
            </div>

            {/* ENERGY SLIDER */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Energy Level — {form.energy_level}/10</label>
              <input type="range" min="1" max="10" value={form.energy_level}
                onChange={e => set("energy_level", e.target.value)} className={styles.slider}/>
              <div className={styles.sliderLabels}><span>😴 Low</span><span>⚡ High</span></div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Notes (optional)</label>
              <input className={styles.input} value={form.notes}
                onChange={e => set("notes", e.target.value)} placeholder="e.g. Felt sore from yesterday's workout"/>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? "Saving…" : "📈 Log Progress"}
            </button>
          </form>
        </Section>

        {/* HISTORY */}
        {!loading && logs.length > 0 && (
          <Section delay={180}>
            <h2 className={styles.sectionTitle}>History</h2>
            <div className={styles.historyList}>
              {logs.slice(0, 14).map((log, i) => (
                <div key={log.id ?? i} className={styles.historyRow}>
                  <span className={styles.historyDate}>
                    {new Date(log.log_date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <div className={styles.historyStats}>
                    {log.weight_kg         && <span className={styles.histStat}>⚖️ {log.weight_kg}kg</span>}
                    {log.sleep_hours       && <span className={styles.histStat}>😴 {log.sleep_hours}h</span>}
                    {log.energy_level      && <span className={styles.histStat}>⚡ {log.energy_level}/10</span>}
                    {log.water_intake_liters && <span className={styles.histStat}>💧 {log.water_intake_liters}L</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </main>
    </div>
  );
}