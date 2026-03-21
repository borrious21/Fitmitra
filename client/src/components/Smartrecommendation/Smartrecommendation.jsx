// src/components/SmartRecommendations/SmartRecommendations.jsx
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../services/apiClient";
import styles from "./Smartrecommendation.module.css";

function DataQualityBar({ quality }) {
  const { completeness_pct, has_weight_data, has_workout_data, has_meal_data } = quality;
  const items = [
    { label: "Weight",   ok: has_weight_data,  tip: "Log weight daily"       },
    { label: "Workouts", ok: has_workout_data,  tip: "Log workout sets"       },
    { label: "Meals",    ok: has_meal_data,     tip: "Log meals 3+ days/week" },
  ];
  return (
    <div className={styles.dataQuality}>
      <div className={styles.dqHeader}>
        <span className={styles.dqLabel}>Data quality</span>
        <span className={styles.dqPct} style={{ color: completeness_pct === 100 ? "#4ade80" : completeness_pct >= 67 ? "#f59e0b" : "#ef4444" }}>
          {completeness_pct}%
        </span>
      </div>
      <div className={styles.dqTrack}>
        <div className={styles.dqFill} style={{
          width: `${completeness_pct}%`,
          background: completeness_pct === 100 ? "#4ade80" : completeness_pct >= 67 ? "#f59e0b" : "#ef4444",
        }} />
      </div>
      <div className={styles.dqItems}>
        {items.map(({ label, ok, tip }) => (
          <span key={label} className={styles.dqItem} title={ok ? "" : tip}>
            <span style={{ color: ok ? "#4ade80" : "#475569" }}>{ok ? "✓" : "○"}</span> {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function AnalysisChips({ analysis }) {
  const { weight, workout, nutrition } = analysis;
  const chips = [];
  if (weight.change_kg !== null) {
    chips.push({
      label: `${weight.change_kg > 0 ? "+" : ""}${weight.change_kg}kg weight`,
      color: weight.status === "on_track" ? "#4ade80" : "#f59e0b",
    });
  }
  chips.push({
    label: `${workout.days_active}/7 workout days`,
    color: workout.consistency === "high" ? "#4ade80" : workout.consistency === "medium" ? "#f59e0b" : "#ef4444",
  });
  if (nutrition.avg_calories > 0) {
    chips.push({
      label: `${nutrition.avg_calories} avg kcal`,
      color: nutrition.status === "on_target" ? "#4ade80" : "#f59e0b",
    });
  }
  chips.push({
    label: `${workout.completion_rate}% completion`,
    color: workout.completion_rate >= 75 ? "#4ade80" : "#f59e0b",
  });
  return (
    <div className={styles.analysisChips}>
      {chips.map(({ label, color }) => (
        <span key={label} className={styles.chip} style={{ color, borderColor: `${color}33`, background: `${color}11` }}>
          {label}
        </span>
      ))}
    </div>
  );
}

function RecommendationCard({ rec, onApply, applying }) {
  const isApplyable = rec.type === "nutrition" && rec.title.toLowerCase().includes("calorie");
  return (
    <div className={styles.recCard} style={{ borderLeftColor: rec.color }}>
      <div className={styles.recHeader}>
        <span className={styles.recIcon}>{rec.icon}</span>
        <div className={styles.recMeta}>
          <span className={styles.recTitle}>{rec.title}</span>
          <span className={styles.recBadge} style={{ color: rec.priority === "high" ? "#ef4444" : rec.priority === "medium" ? "#f59e0b" : "#4ade80" }}>
            {rec.priority === "high" ? "⚠ High" : rec.priority === "medium" ? "◆ Medium" : "✓ Low"}
          </span>
        </div>
      </div>
      <p className={styles.recMsg}>{rec.message}</p>
      <div className={styles.recAction}>
        <span className={styles.recActionIcon}>👉</span>
        <span className={styles.recActionText}>{rec.action}</span>
      </div>
      {isApplyable && onApply && (
        <button className={styles.applyBtn} onClick={onApply} disabled={applying}>
          {applying ? "Applying…" : "Apply Adjustment →"}
        </button>
      )}
    </div>
  );
}

export default function SmartRecommendations() {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [applying, setApplying] = useState(false);
  const [alert,    setAlert]    = useState(null);
  const [expanded, setExpanded] = useState(false);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ FIXED: removed /api prefix — apiFetch already prepends /api
      const res    = await apiFetch("/recommendations");
      const result = res?.data ?? res;
      if (result?.recommendations) setData(result);
    } catch (e) {
      console.warn("[SmartRecs] fetch failed:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  const handleApply = async () => {
    setApplying(true);
    try {
      // ✅ FIXED: removed /api prefix
      const res    = await apiFetch("/recommendations/apply", { method: "POST" });
      const result = res?.data ?? res;
      if (result?.recommendations) setData(result);
      showAlert("success", res?.message || "Adjustments applied!");
    } catch (e) {
      showAlert("error", e?.message || "Failed to apply adjustments.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>🧠 Smart Recommendations</span>
        </div>
        <div className={styles.skeletonWrap}>
          {[80, 95, 70].map(w => <div key={w} className={styles.skeleton} style={{ width: `${w}%` }} />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const highPriority = data.recommendations.filter(r => r.priority === "high");
  const visible      = expanded ? data.recommendations : data.recommendations.slice(0, 2);
  const hasMore      = data.recommendations.length > 2;
  const needsAdjust  = data.adjustments.calorie_delta !== 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleRow}>
          <span className={styles.cardTitle}>🧠 Smart Recommendations</span>
          {highPriority.length > 0 && (
            <span className={styles.urgentBadge}>{highPriority.length} urgent</span>
          )}
        </div>
        <div className={styles.cardMeta}>
          <span className={styles.periodLabel}>Last 7 days · {data.goal?.replace(/_/g, " ")}</span>
          <button className={styles.refreshBtn} onClick={fetchRecs} title="Refresh">↺</button>
        </div>
      </div>

      {alert && (
        <div className={alert.type === "success" ? styles.alertSuccess : styles.alertError}>
          {alert.msg}
        </div>
      )}

      <DataQualityBar quality={data.data_quality} />
      <AnalysisChips analysis={data.analysis} />

      {needsAdjust && !data.adjustments.applied_calorie_target && (
        <div className={styles.adjustBanner}>
          <span className={styles.adjustIcon}>{data.adjustments.calorie_delta > 0 ? "📈" : "📉"}</span>
          <span className={styles.adjustText}>
            Suggested: {data.adjustments.calorie_delta > 0 ? "+" : ""}{data.adjustments.calorie_delta} kcal/day
          </span>
          <button className={styles.applyBannerBtn} onClick={handleApply} disabled={applying}>
            {applying ? "…" : "Apply"}
          </button>
        </div>
      )}

      {data.adjustments.applied_calorie_target && (
        <div className={styles.appliedBanner}>
          ✅ Calorie target updated to {data.adjustments.applied_calorie_target} kcal/day
        </div>
      )}

      <div className={styles.recList}>
        {visible.map((rec, i) => (
          <RecommendationCard
            key={i}
            rec={rec}
            onApply={rec.type === "nutrition" ? handleApply : null}
            applying={applying}
          />
        ))}
      </div>

      {hasMore && (
        <button className={styles.showMoreBtn} onClick={() => setExpanded(e => !e)}>
          {expanded ? "▲ Show less" : `▼ Show all ${data.recommendations.length} recommendations`}
        </button>
      )}

      <div className={styles.footer}>
        Updated {new Date(data.generated_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        {" · "}Based on your actual logs
      </div>
    </div>
  );
}