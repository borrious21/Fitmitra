import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../../context/AuthContext";
import { getMyProfile } from "../../../../services/profileService";
import { apiFetch } from "../../../../services/apiClient";
import Navbar from "../../../../components/Navbar/Navbar";
import styles from "./progress.module.css";

import { 
  Activity, Scale, Droplets, Heart, 
  TrendingUp, TrendingDown, ClipboardList, 
  Zap, Calendar, Clock, AlertCircle, CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

const EMPTY_LOG = {
  weight_kg: "", body_fat_percentage: "", energy_level: 5,
  sleep_hours: "", water_intake_liters: "",
  systolic: "", diastolic: "", heart_rate: "", notes: "",
};

// Fields that need special handling – excluded from the generic loop
const SPECIAL_FIELDS = new Set(['systolic', 'diastolic', 'notes', 'energy_level']);

export default function Progress() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(EMPTY_LOG);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [energyTouched, setEnergyTouched] = useState(false);

  useEffect(() => { 
    fetchLogs(); 
    fetchProfile(); 
  }, []);

  const fetchProfile = async () => {
    try {
      const raw = await getMyProfile();
      const data = raw?.data ?? raw;
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    } catch {}
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/progress/log");
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
    if (form.weight_kg && (isNaN(Number(form.weight_kg)) || Number(form.weight_kg) < 20)) e.weight_kg = "Invalid";
    if (form.sleep_hours && (isNaN(Number(form.sleep_hours)) || Number(form.sleep_hours) < 0 || Number(form.sleep_hours) > 24)) e.sleep_hours = "0–24";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { log_date: new Date().toISOString().split("T")[0] };

      // Generic numeric fields (excluding special-case ones)
      Object.keys(form).forEach(key => {
        if (SPECIAL_FIELDS.has(key)) return;
        if (form[key] !== "") payload[key] = Number(form[key]);
      });

      // Notes – only include if non-empty
      if (form.notes) payload.notes = form.notes;

      // Energy level – only include if user actually moved the slider
      if (energyTouched) payload.energy_level = Number(form.energy_level);

      // Blood pressure – map to correct server field names
      if (form.systolic && form.diastolic) {
        payload.blood_pressure_systolic  = Number(form.systolic);
        payload.blood_pressure_diastolic = Number(form.diastolic);
        payload.blood_pressure = `${form.systolic}/${form.diastolic}`;
      }

      await apiFetch("/progress/log", { method: "POST", body: JSON.stringify(payload) });
      setAlert({ type: "success", msg: "Entry recorded successfully." });
      setTimeout(() => setAlert(null), 3000);
      setForm(EMPTY_LOG);
      setEnergyTouched(false);
      fetchLogs();
    } catch (err) {
      setAlert({ type: "error", msg: err?.message ?? "Failed to save entry." });
    } finally {
      setSaving(false);
    }
  };

  // Derive Stats
  const latest = logs[0] || {};
  const previous = logs[1] || {};
  const weightDiff = latest.weight_kg && previous.weight_kg 
    ? (latest.weight_kg - previous.weight_kg).toFixed(1) 
    : 0;

  const chartData = logs.filter(l => l.weight_kg).slice(0, 10).reverse().map(l => ({
    date: new Date(l.log_date).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
    weight: Number(l.weight_kg)
  }));

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingWrap}>
          <div className={styles.loader} />
          <span>Syncing health data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Navbar />

      <main className={styles.mainContainer}>
        
        {/* Header Section */}
        <section className={styles.headerSec}>
          <div className={styles.headerTop}>
            <button className={styles.backBtn} onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={18} />
              <span>Dashboard</span>
            </button>
          </div>
          <h1 className={styles.pageTitle}>Performance Tracking</h1>
          <p className={styles.pageSub}>Monitor your vitals and physical metrics with precision.</p>
        </section>

        {/* Top Summary Widgets */}
        <section className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}><Scale size={14}/> Current Weight</span>
            <div className={styles.statValue}>
              {latest.weight_kg || '—'} <span className={styles.statUnit}>kg</span>
            </div>
            {latest.weight_kg && (
              <div className={`${styles.statTrend} ${weightDiff > 0 ? styles.trendUp : styles.trendDown}`}>
                {weightDiff > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                {Math.abs(weightDiff)} kg from last log
              </div>
            )}
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}><Activity size={14}/> Energy Level</span>
            <div className={styles.statValue}>
              {latest.energy_level || '—'} <span className={styles.statUnit}>/ 10</span>
            </div>
            <div style={{fontSize: '0.8rem', opacity: 0.5}}>Average across 7 days</div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}><CheckCircle2 size={14}/> Consistency</span>
            <div className={styles.statValue}>
              {logs.length} <span className={styles.statUnit}>Logs</span>
            </div>
            <div style={{fontSize: '0.8rem', opacity: 0.5}}>Total recorded entries</div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className={styles.contentGrid}>
          
          {/* New Entry Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}><ClipboardList size={20} color="var(--lime)"/> New Daily Entry</h2>
            {alert && <div className={alert.type === "success" ? styles.alertSuccess : styles.alertError}>
              {alert.type === "success" ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
              {alert.msg}
            </div>}
            
            <form onSubmit={handleSubmit} className={styles.formSec}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Weight (kg)</label>
                  <div className={styles.inputWrap}>
                    <Scale className={styles.inputIcon} size={16}/>
                    <input type="number" step="0.1" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} className={styles.formInput} placeholder="0.0" />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Body Fat %</label>
                  <div className={styles.inputWrap}>
                    <Activity className={styles.inputIcon} size={16}/>
                    <input type="number" step="0.1" value={form.body_fat_percentage} onChange={e => set('body_fat_percentage', e.target.value)} className={styles.formInput} placeholder="0.0" />
                  </div>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Sleep (hrs)</label>
                  <div className={styles.inputWrap}>
                    <Clock className={styles.inputIcon} size={16}/>
                    <input type="number" step="0.5" value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)} className={styles.formInput} placeholder="0" />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hydration (L)</label>
                  <div className={styles.inputWrap}>
                    <Droplets className={styles.inputIcon} size={16}/>
                    <input type="number" step="0.1" value={form.water_intake_liters} onChange={e => set('water_intake_liters', e.target.value)} className={styles.formInput} placeholder="0.0" />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Energy Level: {energyTouched ? `${form.energy_level} / 10` : <span style={{opacity:0.5}}>Not set</span>}
                </label>
                <div className={styles.rangeWrap}>
                  <input
                    type="range" min="1" max="10"
                    value={form.energy_level}
                    onChange={e => { set('energy_level', e.target.value); setEnergyTouched(true); }}
                    className={styles.rangeInput}
                  />
                </div>
              </div>

              <button type="submit" className={`${styles.btnSubmit} btn-primary`} disabled={saving}>
                {saving ? "Processing..." : "Submit Daily Log"}
              </button>
            </form>
          </div>

          {/* Visualization Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}><Zap size={20} color="var(--violet)"/> Weight Trend</h2>
            {chartData.length >= 1 ? (
              <div style={{width: '100%', height: '300px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--lime)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--lime)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{fill: '#888', fontSize: 11}} axisLine={false} tickLine={false} dy={8} />
                    <YAxis domain={['auto', 'auto']} tick={{fill: '#888', fontSize: 11}} axisLine={false} tickLine={false} width={40} tickFormatter={v => `${v}kg`} />
                    <Tooltip 
                      contentStyle={{ background: '#10121b', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#CCFF00' }}
                      formatter={(v) => [`${v} kg`, 'Weight']}
                    />
                    <Area type="monotone" dataKey="weight" stroke="var(--lime)" strokeWidth={3} fillOpacity={1} fill="url(#weightGrad)" dot={{ fill: '#CCFF00', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#CCFF00' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.4}}>
                <TrendingUp size={48} />
                <div style={{textAlign: 'center'}}>
                  <div style={{fontWeight: 700, marginBottom: '0.25rem'}}>No weight data yet</div>
                  <div style={{fontSize: '0.8rem'}}>Log your first entry to see trends</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* History Section */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}><Calendar size={20} color="var(--cyan)"/> Historical Records</h2>
          <div className={styles.tableWrap}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Body Comp</th>
                  <th>Vitals</th>
                  <th>Lifestyle</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="4" style={{textAlign:'center', padding: '3rem', opacity: 0.5}}>No entries recorded yet.</td></tr>
                ) : (
                  logs.slice(0, 10).map((log, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className={styles.logMain}>
                          <span className={styles.logTitle}>{new Date(log.log_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                          <span className={styles.logSub}>{new Date(log.log_date).getFullYear()}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.logMain}>
                          <span className={styles.logValue}>{log.weight_kg || '—'} <span className={styles.logUnit}>kg</span></span>
                          <span className={styles.logSub}>{log.body_fat_percentage ? `${log.body_fat_percentage}% BF` : 'BF% N/A'}</span>
                        </div>
                      </td>
                      <td>
                        {log.heart_rate || log.blood_pressure ? (
                          <div className={styles.logMain}>
                            <span className={styles.logValue}>{log.heart_rate || '—'} <span className={styles.logUnit}>bpm</span></span>
                            <span className={styles.logSub}>{log.blood_pressure || 'BP N/A'}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        <div className={styles.logMain}>
                          <span className={styles.logValue}>Level {log.energy_level}</span>
                          <span className={styles.logSub}>{log.sleep_hours || '0'}h Sleep / {log.water_intake_liters || '0'}L Water</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}