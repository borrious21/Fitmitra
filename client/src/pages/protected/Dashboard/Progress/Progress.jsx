// src/pages/Progress/Progress.jsx
import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../../context/AuthContext";
import { getMyProfile } from "../../../../services/profileService";
import { apiFetch } from "../../../../services/apiClient";
import ThemeToggle from "../../../../components/ThemeToggle/ThemeToggle";
import styles from "./Progress.module.css";

const NAV_TABS = [
  { key: "today",    label: "today",    path: "/dashboard" },
  { key: "progress", label: "progress", path: "/progress"  },
  { key: "plans",    label: "plans",    path: "/plans"      },
];

const HISTORY_PAGE_SIZE = 7;

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
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.06 });
      if (ref.current) obs.observe(ref.current);
      return () => obs.disconnect();
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);
  return <div ref={ref} className={`${styles.section}${vis ? " " + styles.vis : ""}`}>{children}</div>;
}

const EMPTY_LOG = {
  weight_kg: "", body_fat_percentage: "", energy_level: 5,
  sleep_hours: "", water_intake_liters: "",
  systolic: "", diastolic: "", heart_rate: "", notes: "",
};

export default function Progress() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useContext(AuthContext);
  const activeTab  = NAV_TABS.find(t => t.path === location.pathname)?.key ?? "progress";

  const [logs,       setLogs]       = useState([]);
  const [form,       setForm]       = useState(EMPTY_LOG);
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [alert,      setAlert]      = useState(null);
  const [errors,     setErrors]     = useState({});
  const [histPage,   setHistPage]   = useState(1);
  const [activeTab2, setActiveTab2] = useState("body");
  const [avatarUrl,  setAvatarUrl]  = useState(null);

  const displayName = user?.name ?? "User";
  const initials    = displayName.split(" ").map(n => n[0] ?? "").join("").slice(0, 2).toUpperCase();

  useEffect(() => { fetchLogs(); fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const raw  = await getMyProfile();
      const data = raw?.data ?? raw;
      // Same multi-field resolution as Dashboard
      const resolved =
        data?.avatar_url       ??
        data?.data?.avatar_url ??
        data?.url              ??
        data?.data?.url        ??
        null;
      if (resolved) setAvatarUrl(resolved);
    } catch {}
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res  = await apiFetch("/progress/log");
      const data = Array.isArray(res?.data ?? res) ? (res?.data ?? res) : [];
      setLogs(data);
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
    if (form.weight_kg && (isNaN(Number(form.weight_kg)) || Number(form.weight_kg) < 20))
      e.weight_kg = "Invalid weight";
    if (form.sleep_hours && (isNaN(Number(form.sleep_hours)) || Number(form.sleep_hours) < 0 || Number(form.sleep_hours) > 24))
      e.sleep_hours = "0–24 hrs";
    if (form.water_intake_liters && isNaN(Number(form.water_intake_liters)))
      e.water_intake_liters = "Invalid";
    if (form.systolic && (isNaN(Number(form.systolic)) || Number(form.systolic) < 60 || Number(form.systolic) > 250))
      e.systolic = "60–250";
    if (form.diastolic && (isNaN(Number(form.diastolic)) || Number(form.diastolic) < 40 || Number(form.diastolic) > 150))
      e.diastolic = "40–150";
    if (form.heart_rate && (isNaN(Number(form.heart_rate)) || Number(form.heart_rate) < 30 || Number(form.heart_rate) > 250))
      e.heart_rate = "30–250 bpm";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { log_date: new Date().toISOString().split("T")[0] };
      if (form.weight_kg)           payload.weight_kg            = Number(form.weight_kg);
      if (form.body_fat_percentage) payload.body_fat_percentage  = Number(form.body_fat_percentage);
      if (form.energy_level)        payload.energy_level         = Number(form.energy_level);
      if (form.sleep_hours)         payload.sleep_hours          = Number(form.sleep_hours);
      if (form.water_intake_liters) payload.water_intake_liters  = Number(form.water_intake_liters);
      if (form.heart_rate)          payload.heart_rate           = Number(form.heart_rate);
      if (form.notes)               payload.notes                = form.notes;
      if (form.systolic && form.diastolic) {
        payload.blood_pressure_systolic  = Number(form.systolic);
        payload.blood_pressure_diastolic = Number(form.diastolic);
        payload.blood_pressure = `${form.systolic}/${form.diastolic}`;
      }
      await apiFetch("/progress/log", { method: "POST", body: JSON.stringify(payload) });
      showAlert("success", "Progress logged! 📈");
      setForm(EMPTY_LOG);
      setHistPage(1);
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

  const latest     = logs[0];
  const prev       = logs[1];
  const weightDiff = latest?.weight_kg && prev?.weight_kg
    ? (Number(latest.weight_kg) - Number(prev.weight_kg)).toFixed(1)
    : null;

  const totalPages = Math.max(1, Math.ceil(logs.length / HISTORY_PAGE_SIZE));
  const pagedLogs  = logs.slice((histPage - 1) * HISTORY_PAGE_SIZE, histPage * HISTORY_PAGE_SIZE);
  const weightLogs = logs.filter(l => l.weight_kg).slice(0, 7).reverse();

  const bpColor = (sys) => {
    if (!sys) return "var(--d-t2)";
    if (sys < 120) return "#10b981";
    if (sys < 130) return "#B8F000";
    if (sys < 140) return "#f59e0b";
    return "#ef4444";
  };
  const bpLabel = (sys) => {
    if (!sys) return null;
    if (sys < 120) return "Normal";
    if (sys < 130) return "Elevated";
    if (sys < 140) return "Stage 1";
    return "Stage 2";
  };

  return (
    <div className={styles.wrapper}>
      {/* ── NAV ── */}
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

        <Section delay={0}>
          <h1 className={styles.title}>📈 Progress Tracking</h1>
          <p className={styles.sub}>Log your daily metrics to see trends over time</p>
        </Section>

        {latest && (
          <Section delay={60}>
            <h2 className={styles.sectionTitle}>Latest Snapshot</h2>
            <div className={styles.statsGrid}>
              {[
                {
                  icon: "⚖️", label: "Weight",
                  val: latest.weight_kg ? `${latest.weight_kg} kg` : "—",
                  sub: weightDiff ? `${Number(weightDiff) > 0 ? "+" : ""}${weightDiff} kg vs prev` : null,
                  color: Number(weightDiff) < 0 ? "#B8F000" : Number(weightDiff) > 0 ? "#FF4D6D" : "#fff",
                },
                {
                  icon: "😴", label: "Sleep",
                  val: latest.sleep_hours ? `${latest.sleep_hours}h` : "—",
                  sub: latest.sleep_hours >= 8 ? "Excellent" : latest.sleep_hours >= 7 ? "Good" : latest.sleep_hours ? "Low" : null,
                  color: latest.sleep_hours >= 8 ? "#10b981" : latest.sleep_hours >= 7 ? "#B8F000" : "#f59e0b",
                },
                { icon: "⚡", label: "Energy",  val: latest.energy_level ? `${latest.energy_level}/10` : "—", sub: null, color: "#FF5C1A" },
                { icon: "💧", label: "Water",   val: latest.water_intake_liters ? `${latest.water_intake_liters}L` : "—", sub: null, color: "#00C8E0" },
                {
                  icon: "🫀", label: "Blood Pressure",
                  val: (latest.blood_pressure_systolic && latest.blood_pressure_diastolic)
                    ? `${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic}`
                    : latest.blood_pressure ?? "—",
                  sub: bpLabel(latest.blood_pressure_systolic),
                  color: bpColor(latest.blood_pressure_systolic),
                },
                { icon: "💓", label: "Heart Rate", val: latest.heart_rate ? `${latest.heart_rate} bpm` : "—", sub: null, color: "#FF4D6D" },
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

        {weightLogs.length >= 2 && (
          <Section delay={80}>
            <h2 className={styles.sectionTitle}>Weight Trend</h2>
            <div className={styles.trendCard}>
              <div className={styles.trendChart}>
                {weightLogs.map((l, i) => {
                  const vals = weightLogs.map(x => Number(x.weight_kg));
                  const min  = Math.min(...vals) - 1;
                  const max  = Math.max(...vals) + 1;
                  const pct  = 100 - ((Number(l.weight_kg) - min) / (max - min)) * 100;
                  return (
                    <div key={i} className={styles.trendBarCol}>
                      <div className={styles.trendBarWrap}>
                        <div className={styles.trendDot} style={{ top: `${pct}%` }}>
                          <span className={styles.trendTooltip}>{l.weight_kg}kg</span>
                        </div>
                      </div>
                      <span className={styles.trendLabel}>
                        {new Date(l.log_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className={styles.trendStats}>
                <div className={styles.trendStat}>
                  <span className={styles.trendStatVal} style={{ color: "#FF5C1A" }}>
                    {weightLogs[weightLogs.length - 1]?.weight_kg} kg
                  </span>
                  <span className={styles.trendStatLabel}>Latest</span>
                </div>
                <div className={styles.trendStat}>
                  <span className={styles.trendStatVal} style={{
                    color: (Number(weightLogs[weightLogs.length-1]?.weight_kg) - Number(weightLogs[0]?.weight_kg)) <= 0 ? "#B8F000" : "#FF4D6D"
                  }}>
                    {((Number(weightLogs[weightLogs.length-1]?.weight_kg) - Number(weightLogs[0]?.weight_kg)) > 0 ? "+" : "")}
                    {(Number(weightLogs[weightLogs.length-1]?.weight_kg) - Number(weightLogs[0]?.weight_kg)).toFixed(1)} kg
                  </span>
                  <span className={styles.trendStatLabel}>7-log change</span>
                </div>
              </div>
            </div>
          </Section>
        )}

        <Section delay={120}>
          <h2 className={styles.sectionTitle}>Log Today</h2>
          <div className={styles.formTabs}>
            {[
              { key: "body",   label: "⚖️ Body"   },
              { key: "health", label: "🩺 Health" },
              { key: "all",    label: "📋 All"    },
            ].map(t => (
              <button
                key={t.key}
                className={`${styles.formTab}${activeTab2 === t.key ? " " + styles.formTabActive : ""}`}
                onClick={() => setActiveTab2(t.key)}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>

            {(activeTab2 === "body" || activeTab2 === "all") && (
              <>
                <div className={styles.formSectionLabel}>Body Metrics</div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Weight (kg)</label>
                    <input type="number" step="0.1" min="20" max="300"
                      className={`${styles.input} ${errors.weight_kg ? styles.inputErr : ""}`}
                      value={form.weight_kg} onChange={e => set("weight_kg", e.target.value)}
                      placeholder="e.g. 72.5"/>
                    {errors.weight_kg && <span className={styles.errMsg}>{errors.weight_kg}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Body Fat %</label>
                    <input type="number" step="0.1" min="2" max="60"
                      className={styles.input}
                      value={form.body_fat_percentage} onChange={e => set("body_fat_percentage", e.target.value)}
                      placeholder="e.g. 18"/>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Energy Level — {form.energy_level}/10</label>
                  <input type="range" min="1" max="10" value={form.energy_level}
                    onChange={e => set("energy_level", e.target.value)} className={styles.slider}/>
                  <div className={styles.sliderLabels}><span>😴 Low</span><span>⚡ High</span></div>
                </div>
              </>
            )}

            {(activeTab2 === "health" || activeTab2 === "all") && (
              <>
                <div className={styles.formSectionLabel}>Health Metrics</div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>🫀 Blood Pressure (mmHg)</label>
                  <div className={styles.bpRow}>
                    <div className={styles.bpInputWrap}>
                      <input type="number" min="60" max="250"
                        className={`${styles.input} ${styles.bpInput} ${errors.systolic ? styles.inputErr : ""}`}
                        value={form.systolic} onChange={e => set("systolic", e.target.value)}
                        placeholder="Systolic"/>
                      {errors.systolic && <span className={styles.errMsg}>{errors.systolic}</span>}
                    </div>
                    <span className={styles.bpSep}>/</span>
                    <div className={styles.bpInputWrap}>
                      <input type="number" min="40" max="150"
                        className={`${styles.input} ${styles.bpInput} ${errors.diastolic ? styles.inputErr : ""}`}
                        value={form.diastolic} onChange={e => set("diastolic", e.target.value)}
                        placeholder="Diastolic"/>
                      {errors.diastolic && <span className={styles.errMsg}>{errors.diastolic}</span>}
                    </div>
                  </div>
                  {form.systolic && !errors.systolic && (
                    <span className={styles.bpHint} style={{ color: bpColor(Number(form.systolic)) }}>
                      {bpLabel(Number(form.systolic))}
                    </span>
                  )}
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>💓 Heart Rate (bpm)</label>
                    <input type="number" min="30" max="250"
                      className={`${styles.input} ${errors.heart_rate ? styles.inputErr : ""}`}
                      value={form.heart_rate} onChange={e => set("heart_rate", e.target.value)}
                      placeholder="e.g. 72"/>
                    {errors.heart_rate && <span className={styles.errMsg}>{errors.heart_rate}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>💧 Water (litres)</label>
                    <input type="number" step="0.1" min="0"
                      className={`${styles.input} ${errors.water_intake_liters ? styles.inputErr : ""}`}
                      value={form.water_intake_liters} onChange={e => set("water_intake_liters", e.target.value)}
                      placeholder="e.g. 2.5"/>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>😴 Sleep (hrs)</label>
                  <input type="number" step="0.5" min="0" max="24"
                    className={`${styles.input} ${errors.sleep_hours ? styles.inputErr : ""}`}
                    value={form.sleep_hours} onChange={e => set("sleep_hours", e.target.value)}
                    placeholder="e.g. 7.5"/>
                  {errors.sleep_hours && <span className={styles.errMsg}>{errors.sleep_hours}</span>}
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Notes (optional)</label>
              <input className={styles.input} value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="e.g. Felt sore from yesterday's workout"/>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? "Saving…" : "📈 Log Progress"}
            </button>
          </form>
        </Section>

        {!loading && logs.length > 0 && (
          <Section delay={180}>
            <div className={styles.historyHeader}>
              <h2 className={styles.sectionTitle}>History</h2>
              <span className={styles.historyCount}>{logs.length} entries</span>
            </div>
            <div className={styles.historyList}>
              {pagedLogs.map((log, i) => (
                <div key={log.id ?? i} className={styles.historyRow}>
                  <div className={styles.historyLeft}>
                    <span className={styles.historyDate}>
                      {new Date(log.log_date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    {log.notes && <span className={styles.historyNote}>{log.notes}</span>}
                  </div>
                  <div className={styles.historyStats}>
                    {log.weight_kg           && <span className={styles.histStat}>⚖️ {log.weight_kg}kg</span>}
                    {log.sleep_hours         && <span className={styles.histStat}>😴 {log.sleep_hours}h</span>}
                    {log.energy_level        && <span className={styles.histStat}>⚡ {log.energy_level}/10</span>}
                    {log.water_intake_liters && <span className={styles.histStat}>💧 {log.water_intake_liters}L</span>}
                    {(log.blood_pressure_systolic || log.blood_pressure) && (
                      <span className={styles.histStat} style={{
                        color: bpColor(log.blood_pressure_systolic),
                        borderColor: `${bpColor(log.blood_pressure_systolic)}44`,
                        background: `${bpColor(log.blood_pressure_systolic)}10`,
                      }}>
                        🫀 {log.blood_pressure_systolic && log.blood_pressure_diastolic
                          ? `${log.blood_pressure_systolic}/${log.blood_pressure_diastolic}`
                          : log.blood_pressure}
                      </span>
                    )}
                    {log.heart_rate          && <span className={styles.histStat}>💓 {log.heart_rate}bpm</span>}
                    {log.body_fat_percentage && <span className={styles.histStat}>📊 {log.body_fat_percentage}%bf</span>}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn}
                  onClick={() => setHistPage(p => Math.max(1, p - 1))}
                  disabled={histPage === 1}>← Prev</button>
                <div className={styles.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p}
                      className={`${styles.pageNum}${histPage === p ? " " + styles.pageNumActive : ""}`}
                      onClick={() => setHistPage(p)}>{p}</button>
                  ))}
                </div>
                <button className={styles.pageBtn}
                  onClick={() => setHistPage(p => Math.min(totalPages, p + 1))}
                  disabled={histPage === totalPages}>Next →</button>
              </div>
            )}

            {logs.length === 0 && !loading && (
              <div className={styles.emptyHistory}>
                <span>📭</span>
                <p>No logs yet. Start tracking today!</p>
              </div>
            )}
          </Section>
        )}
      </main>
    </div>
  );
}