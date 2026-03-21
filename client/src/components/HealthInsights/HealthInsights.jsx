import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../services/apiClient";
import styles from "./HealthInsights.module.css";

export default function HealthInsights() {
  const [insights, setInsights] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lastSync, setLastSync] = useState(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/dashboard/insights");
      const data = res?.data ?? res;
      setInsights(Array.isArray(data) ? data : []);
      setLastSync(new Date());
    } catch {
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrap}>🧠</div>
            <div>
              <div className={styles.title}>Real-Time Health Insights</div>
              <div className={styles.sub}>Analyzing your data…</div>
            </div>
          </div>
        </div>
        <div className={styles.skeletonList}>
          {[90, 75, 85].map(w => (
            <div key={w} className={styles.skeletonRow}>
              <div className={styles.skeletonDot} />
              <div className={styles.skeleton} style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!insights.length) return null;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrap}>🧠</div>
          <div>
            <div className={styles.title}>Real-Time Health Insights</div>
            <div className={styles.sub}>Based on your actual logs today</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.liveBadge}>
            <span className={styles.liveDot} />
            Live
          </span>
          <button
            className={styles.refreshBtn}
            onClick={fetchInsights}
            title="Refresh insights"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Insights */}
      <div className={styles.list}>
        {insights.map((ins, i) => {
          const icon  = ins.icon  ?? "💡";
          const text  = ins.message ?? ins.text ?? "";
          const color = ins.color ?? "#FF5C1A";
          return (
            <div
              key={i}
              className={styles.insightRow}
              style={{
                background:   `${color}0D`,
                borderColor:  `${color}30`,
                animationDelay: `${i * 80}ms`,
              }}
            >
              <span className={styles.insightIcon}>{icon}</span>
              <span className={styles.insightText}>{text}</span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {lastSync && (
        <div className={styles.footer}>
          Updated {lastSync.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          {" · "}{insights.length} insight{insights.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}