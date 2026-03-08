// ── src/pages/protected/Admin/Sections/AdminAnalytics.jsx ────
import { useState, useEffect } from "react";
import api from "../../../../services/api";

const StatCard = ({ label, value, sub, color = "#FF5C1A" }) => (
  <div style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.25rem 1.5rem" }}>
    <div style={{ fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#525D72", marginBottom: "0.5rem" }}>{label}</div>
    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "2rem", fontWeight: 900, color, lineHeight: 1 }}>{value ?? "—"}</div>
    {sub && <div style={{ fontSize: "0.72rem", color: "#525D72", marginTop: "0.35rem" }}>{sub}</div>}
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.25rem 1.5rem", marginTop: "1.25rem" }}>
    <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.9rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F0F2F5", marginBottom: "1rem" }}>{title}</h3>
    {children}
  </div>
);

const TH = ({ children }) => (
  <th style={{ padding: "0.6rem 0.875rem", textAlign: "left", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#525D72", whiteSpace: "nowrap" }}>{children}</th>
);
const TD = ({ children, bold, accent }) => (
  <td style={{ padding: "0.6rem 0.875rem", fontSize: "0.78rem", color: accent ? "#FF5C1A" : bold ? "#F0F2F5" : "#9AA3B4", fontWeight: bold || accent ? 700 : 400, whiteSpace: "nowrap" }}>{children ?? "—"}</td>
);

const Bar = ({ value, max, color = "#FF5C1A" }) => {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
    </div>
  );
};

const MEAL_COLORS = { breakfast: "#f59e0b", lunch: "#22c55e", dinner: "#3b82f6", snack: "#a855f7" };

export default function AdminAnalytics() {
  const [overview,  setOverview]  = useState(null);
  const [workouts,  setWorkouts]  = useState([]);
  const [meals,     setMeals]     = useState([]);
  const [topUsers,  setTopUsers]  = useState([]);
  const [atRisk,    setAtRisk]    = useState([]);
  const [retention, setRetention] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, wu, ml, tu, ar, ret] = await Promise.all([
          api.get("/admin/analytics/overview"),
          api.get("/admin/analytics/workouts"),
          api.get("/admin/analytics/meals"),
          api.get("/admin/analytics/top-users"),
          api.get("/admin/analytics/at-risk"),
          api.get("/admin/analytics/retention"),
        ]);
        setOverview(ov.data.data);
        setWorkouts(wu.data.data);
        setMeals(ml.data.data);
        setTopUsers(tu.data.data.users);
        setAtRisk(ar.data.data.users);
        setRetention(ret.data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "1rem" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: "#0F1217", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.25rem", height: 100, animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );

  const maxWorkouts = Math.max(...workouts.map(w => Number(w.total_workouts)), 1);
  const maxMeals    = Math.max(...meals.map(m => Number(m.total_logs)), 1);

  return (
    <div>
      {/* Overview KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: "1rem" }}>
        <StatCard label="Total Users"      value={overview?.total_users?.toLocaleString()} color="#FF5C1A" />
        <StatCard label="Total Workouts"   value={overview?.total_workouts?.toLocaleString()} color="#22c55e" />
        <StatCard label="Meals Logged"     value={overview?.total_meals_logged?.toLocaleString()} color="#3b82f6" />
        <StatCard label="Active Plans"     value={overview?.active_plans?.toLocaleString()} color="#a855f7" />
        <StatCard label="Active Today"     value={overview?.active_today?.toLocaleString()} color="#f59e0b" />
        <StatCard label="New This Week"    value={overview?.new_users_this_week?.toLocaleString()} color="#22c55e" />
      </div>

      {/* Workout activity — last 30 days */}
      {workouts.length > 0 && (
        <Section title="Workout Activity — Last 30 Days">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <TH>Date</TH><TH>Total Workouts</TH><TH>Unique Users</TH><TH>Volume</TH>
              </tr></thead>
              <tbody>
                {workouts.slice(-14).map(w => (
                  <tr key={w.day} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <TD>{new Date(w.day).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</TD>
                    <TD accent>{w.total_workouts}</TD>
                    <TD>{w.unique_users}</TD>
                    <td style={{ padding: "0.6rem 0.875rem", width: 200 }}>
                      <Bar value={Number(w.total_workouts)} max={maxWorkouts} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Meal breakdown */}
      {meals.length > 0 && (
        <Section title="Meal Logs Breakdown — Last 30 Days">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "0.875rem" }}>
            {meals.map(m => (
              <div key={m.meal_type} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "0.875rem 1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: MEAL_COLORS[m.meal_type] ?? "#9AA3B4" }}>{m.meal_type}</span>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.2rem", fontWeight: 900, color: "#F0F2F5" }}>{Number(m.total_logs).toLocaleString()}</span>
                </div>
                <Bar value={Number(m.total_logs)} max={maxMeals} color={MEAL_COLORS[m.meal_type] ?? "#9AA3B4"} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
                  <span style={{ fontSize: "0.68rem", color: "#525D72" }}>Avg {Math.round(m.avg_calories)} kcal</span>
                  <span style={{ fontSize: "0.68rem", color: "#525D72" }}>{Math.round(m.avg_protein)}g protein</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Top Active Users */}
      {topUsers.length > 0 && (
        <Section title="Top Active Users — Last 30 Days">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>#</TH><TH>Name</TH><TH>Email</TH><TH>Workouts</TH></tr></thead>
              <tbody>
                {topUsers.map((u, i) => (
                  <tr key={u.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.6rem 0.875rem", fontSize: "0.72rem", color: i < 3 ? "#FF5C1A" : "#525D72", fontWeight: 800 }}>#{i + 1}</td>
                    <TD bold>{u.name}</TD>
                    <TD>{u.email}</TD>
                    <TD accent>{u.workout_count}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* At-Risk Users */}
      {atRisk.length > 0 && (
        <Section title="At-Risk Users">
          <div style={{ fontSize: "0.72rem", color: "#525D72", marginBottom: "0.75rem" }}>
            Users with medical conditions or BMI outside 18.5–30 range.
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Name</TH><TH>Email</TH><TH>Age</TH><TH>Weight</TH><TH>BMI</TH><TH>Conditions</TH></tr></thead>
              <tbody>
                {atRisk.map(u => {
                  const bmi = u.approx_bmi;
                  const bmiColor = !bmi ? "#525D72" : bmi > 30 ? "#ef4444" : bmi < 18.5 ? "#f59e0b" : "#22c55e";
                  return (
                    <tr key={u.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <TD bold>{u.name}</TD>
                      <TD>{u.email}</TD>
                      <TD>{u.age}</TD>
                      <TD>{u.weight_kg ? `${u.weight_kg}kg` : "—"}</TD>
                      <td style={{ padding: "0.6rem 0.875rem" }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, color: bmiColor }}>{bmi ?? "—"}</span>
                      </td>
                      <td style={{ padding: "0.6rem 0.875rem", fontSize: "0.72rem", color: "#ef4444" }}>
                        {u.medical_conditions
                          ? Object.entries(u.medical_conditions).filter(([, v]) => v === true || v === "true").map(([k]) => k.replace(/_/g, " ")).join(", ") || "—"
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Retention */}
      {retention.length > 0 && (
        <Section title="User Retention — Last 90 Days">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Cohort Week</TH><TH>New Users</TH><TH>Retained (7d)</TH><TH>Retention %</TH></tr></thead>
              <tbody>
                {retention.map(r => {
                  const pct = r.new_users > 0 ? Math.round((r.retained_last_7d / r.new_users) * 100) : 0;
                  return (
                    <tr key={r.cohort_week} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <TD>{new Date(r.cohort_week).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</TD>
                      <TD>{r.new_users}</TD>
                      <TD>{r.retained_last_7d}</TD>
                      <td style={{ padding: "0.6rem 0.875rem" }}>
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1rem", fontWeight: 900, color: pct >= 50 ? "#22c55e" : pct >= 25 ? "#f59e0b" : "#ef4444" }}>{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}