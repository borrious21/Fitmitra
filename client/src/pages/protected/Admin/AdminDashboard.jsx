import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../services/apiClient";
import styles from "./AdminDashboard.module.css";
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Utensils, 
  ClipboardList, 
  TrendingUp, 
  ArrowLeft, 
  RotateCcw,
  UserPlus,
  BarChart3,
  PieChart,
  Target,
  Bell,
  AlertTriangle,
  Zap,
  ArrowRight
} from "lucide-react";

const GOAL_LABELS = {
  weight_loss:      "Weight Loss",
  muscle_gain:      "Muscle Gain",
  maintain_fitness: "Maintenance",
  endurance:        "Endurance",
  not_set:          "Not Set",
};
const GOAL_COLORS = {
  weight_loss:      "#ef4444",
  muscle_gain:      "#10b981",
  maintain_fitness: "#3b82f6",
  endurance:        "#f59e0b",
  not_set:          "#475569",
};

function BarChart({ data, color = "#CCFF00", height = 120 }) {
  if (!data?.length) return <div className={styles.chartEmpty}>No data yet</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(4, Math.floor(300 / data.length) - 3);

  return (
    <div className={styles.chartWrap}>
      <svg width="100%" viewBox={`0 0 ${data.length * (barW + 3)} ${height}`}
        preserveAspectRatio="none" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="adminBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const barH = Math.max(2, (d.value / max) * (height - 20));
          const x    = i * (barW + 3);
          const y    = height - 20 - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH}
                fill="url(#adminBarGrad)" rx="2" />
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.65rem', opacity: 0.4 }}>
        <span>{data[0]?.label}</span>
        <span>{data[data.length-1]?.label}</span>
      </div>
    </div>
  );
}

function DonutChart({ data }) {
  if (!data?.length) return <div className={styles.chartEmpty}>No data yet</div>;
  const total  = data.reduce((s, d) => s + d.count, 0);
  const r      = 40;
  const cx     = 60;
  const cy     = 60;
  const circ   = 2 * Math.PI * r;

  let offset = 0;
  const slices = data.map(d => {
    const pct   = d.count / total;
    const dash  = circ * pct;
    const slice = { ...d, dash, offset, pct };
    offset += dash;
    return slice;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={GOAL_COLORS[s.goal] ?? "#475569"} strokeWidth="12"
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }} />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="800" fill="#fff">{total}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {slices.slice(0, 4).map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: GOAL_COLORS[s.goal] || '#333' }} />
            <span style={{ opacity: 0.6 }}>{GOAL_LABELS[s.goal] || 'Other'}</span>
            <span style={{ fontWeight: 700 }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, loading, onClick }) {
  return (
    <div className={styles.kpiCard} style={{ borderTopColor: color }} onClick={onClick}>
      <div className={styles.kpiTop}>
        <span className={styles.kpiIcon} style={{ color }}>{Icon && <Icon size={24} />}</span>
        {loading ? <div className={styles.sk} style={{ height: 24, width: 60 }} /> : <span className={styles.kpiValue}>{value ?? "—"}</span>}
      </div>
      <div className={styles.kpiLabel}>{label}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  );
}

function NavCard({ icon: Icon, label, desc, path, color, badge }) {
  const navigate = useNavigate();
  return (
    <div className={styles.navCard} onClick={() => navigate(path)}>
      <div className={styles.navIcon} style={{ background: `${color}18`, color }}>{Icon && <Icon size={20} />}</div>
      <div>
        <div className={styles.navLabel}>{label}</div>
        <div className={styles.navDesc}>{(desc || "").toLowerCase()}</div>
      </div>
      {badge != null && <span style={{ marginLeft: 'auto', background: `${color}20`, color, fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '99px' }}>{badge}</span>}
      <ArrowRight size={16} className={styles.navArrow} />
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sync, setSync] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/dashboard");
      setData(res?.data ?? res);
      setSync(new Date());
    } catch {
      console.error("Admin dash fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const ov = data?.overview || {};
  const growthData = (data?.user_growth || []).map(d => ({ label: d.label?.split(" ")[0] || "", value: Number(d.signups || 0) }));

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>Command Center</h1>
          <p className={styles.sub}>
            {sync ? `Last synced at ${sync.toLocaleTimeString()}` : "Initializing administrative systems..."}
          </p>
        </div>
        <div className={styles.topRight}>
          <button className={styles.btnRefresh} onClick={fetchAll} disabled={loading}>
            <RotateCcw size={16} className={loading ? styles.spinIcon : ""} /> Refresh
          </button>
          <button className={styles.btnBack} onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} /> App View
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className={styles.kpiGrid}>
        <KpiCard icon={Users} label="Total Users" value={ov.total_users} color="#3b82f6" loading={loading} onClick={() => navigate("/admin/users")} sub={ov.new_users_today > 0 ? `+${ov.new_users_today} today` : null} />
        <KpiCard icon={Zap} label="Active Today" value={ov.active_today} color="#CCFF00" loading={loading} sub="live sessions" />
        <KpiCard icon={ShieldAlert} label="Banned" value={ov.banned_users} color="#ef4444" loading={loading} />
        <KpiCard icon={ShieldCheck} label="Verified" value={ov.verified_users} color="#6366f1" loading={loading} />
        <KpiCard icon={Activity} label="Workouts" value={ov.total_workouts} color="#f59e0b" loading={loading} onClick={() => navigate("/admin/logs")} />
        <KpiCard icon={Utensils} label="Meal Logs" value={ov.total_meal_logs} color="#FF5C1A" loading={loading} />
        <KpiCard icon={ClipboardList} label="Active Plans" value={ov.active_plans} color="#8b5cf6" loading={loading} onClick={() => navigate("/admin/plans")} />
        <KpiCard icon={TrendingUp} label="User Growth" value={ov.new_users_this_week} color="#06b6d4" loading={loading} />
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <header className={styles.chartHeader}>
             <span className={styles.chartTitle}><BarChart3 size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Signup Trends</span>
             <span className={styles.chartSub}>Last 14 Days</span>
          </header>
          {loading ? <div className={styles.sk} style={{ height: 120 }} /> : <BarChart data={growthData} color="#3b82f6" />}
        </div>
        <div className={styles.chartCard}>
           <header className={styles.chartHeader}>
              <span className={styles.chartTitle}><PieChart size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Goal Distribution</span>
              <span className={styles.chartSub}>User Base</span>
           </header>
           {loading ? <div className={styles.sk} style={{ height: 120 }} /> : <DonutChart data={data?.goal_distribution || []} />}
        </div>
      </div>

      <div className={styles.sectionTitle}>⚡ System Access</div>
      <div className={styles.navGrid}>
        <NavCard icon={Users} label="User Management" desc="Audit accounts & verify identities" path="/admin/users" color="#3b82f6" badge={ov.total_users} />
        <NavCard icon={BarChart3} label="Analytics" desc="Growth & retention metrics" path="/admin/analytics" color="#CCFF00" />
        <NavCard icon={Utensils} label="Food Database" desc="Manage meal library" path="/admin/meals" color="#FF5C1A" />
        <NavCard icon={Activity} label="Exercises" desc="Workouts & exercise library" path="/admin/exercises" color="#f59e0b" />
        <NavCard icon={ClipboardList} label="Workout Plans" desc="Manage user cycles" path="/admin/plans" color="#8b5cf6" />
        <NavCard icon={ShieldCheck} label="System Logs" desc="Security & audit trail" path="/admin/logs" color="#64748b" />
        <NavCard icon={Bell} label="Broadcast" desc="Global user notifications" path="/admin/notifications" color="#06b6d4" />
        <NavCard icon={AlertTriangle} label="At-Risk Users" desc="Flagged for inactivity" path="/admin/analytics" color="#ef4444" />
      </div>

      <div className={styles.footer}>FITMITRA COMMAND CENTER · PRISM OS v4.2</div>
    </div>
  );
}