// src/components/ActivityCalendar/ActivityCalendar.jsx
// Fix: completedDates now handles both h.date and h.workout_date robustly

import { useState } from "react";
import styles from "./ActivityCalendar.module.css";

const DAYS_SHORT  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];
const DAYS_KEY    = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function shortenLabel(groups) {
  if (!groups?.length) return "";
  const joined = groups.join(" + ");
  if (joined.length <= 18) return joined;
  return groups.map(g =>
    g.replace("Cardio", "Cardio")
     .replace("(Moderate)", "")
     .replace("(30 min)", "")
     .replace("(Light)", "")
     .replace("Strength", "Str.")
     .replace("/ Light Cardio", "")
     .replace("/ Stretching", "")
     .replace("/ Mobility", "")
     .trim()
  ).join(" + ");
}

// FIX: Robust date extraction — handles both `date` and `workout_date` fields
function extractDateStr(historyItem) {
  const raw = historyItem.date ?? historyItem.workout_date;
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  // Normalize to midnight local to avoid timezone shifts
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export default function ActivityCalendar({ history, weeklyPlan, accountCreatedAt }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const accountDate = accountCreatedAt
    ? new Date(new Date(accountCreatedAt).toDateString())
    : new Date(today);

  // FIX: Use robust extraction, filter out nulls
  const completedDates = new Set(
    (history ?? []).map(extractDateStr).filter(Boolean)
  );

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    const isCurrent = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    if (isCurrent) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getCellData = (day) => {
    if (!day) return null;
    const date    = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0];
    const dayIdx  = date.getDay();
    const dayKey  = DAYS_KEY[dayIdx];
    const isFuture    = date > today;
    const isToday     = date.getTime() === today.getTime();
    const isPreSignup = date < accountDate;

    const planGroups    = weeklyPlan?.[dayKey] ?? [];
    const isRestInPlan  = planGroups.length > 0 &&
      planGroups.every(g => /^rest/i.test(g.trim()));
    const isSat           = dayIdx === 6;
    const isScheduledRest = isSat || isRestInPlan;

    let label = "";
    if (isScheduledRest)         label = "🛌 Rest";
    else if (planGroups.length)  label = shortenLabel(planGroups);

    let status;
    if (isPreSignup)              status = "presignup";
    else if (isScheduledRest)     status = isFuture ? "rest-future" : "rest";
    else if (isFuture)            status = "upcoming";
    else if (completedDates.has(dateStr)) status = "done";
    else                          status = "missed";

    return { dateStr, status, isToday, isPreSignup, isFuture, label };
  };

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const STYLE = {
    done:          { bg: "#22c55e18", border: "#22c55e55", numColor: "#22c55e", dot: "#22c55e" },
    missed:        { bg: "#eab30818", border: "#eab30855", numColor: "#eab308", dot: "#eab308" },
    rest:          { bg: "#ef444418", border: "#ef444455", numColor: "#ef4444", dot: "#ef4444" },
    "rest-future": { bg: "#ef444408", border: "#ef444428", numColor: "#ef444488", dot: null },
    upcoming:      { bg: "transparent", border: "rgba(255,255,255,0.06)", numColor: null, dot: null },
    presignup:     { bg: "transparent", border: "transparent", numColor: null, dot: null },
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.navRow}>
          <button className={styles.navBtn} onClick={prevMonth}>‹</button>
          <span className={styles.monthTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button
            className={styles.navBtn}
            onClick={nextMonth}
            disabled={isCurrentMonth}
            style={{ opacity: isCurrentMonth ? 0.25 : 1 }}
          >›</button>
        </div>
        <div className={styles.legend}>
          {[["done","#22c55e","Completed"],["missed","#eab308","Missed"],["rest","#ef4444","Rest"]].map(([s,c,l]) => (
            <span key={s} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: c }}/>{l}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.dayHeaders}>
        {DAYS_SHORT.map(d => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}
      </div>

      <div className={styles.grid}>
        {weeks.map((week, wi) => (
          <div key={wi} className={styles.weekRow}>
            {week.map((day, di) => {
              const data = getCellData(day);
              if (!day) return <div key={di} className={styles.cellEmpty}/>;

              const s = data.status;
              const st = STYLE[s];
              const muted = s === "presignup" || s === "upcoming" || s === "rest-future";

              return (
                <div
                  key={di}
                  className={`${styles.cell} ${muted ? styles.cellMuted : ""} ${data.isToday ? styles.cellToday : ""}`}
                  style={{ background: st.bg, borderColor: st.border }}
                >
                  <div className={styles.dayNum} style={st.numColor ? { color: st.numColor } : {}}>
                    {data.isToday
                      ? <span className={styles.todayBadge}>{day}</span>
                      : day
                    }
                  </div>
                  {data.label && (
                    <div className={styles.workoutLabel} style={st.numColor ? { color: st.numColor } : {}}>
                      {data.label}
                    </div>
                  )}
                  {st.dot && !muted && (
                    <div className={styles.statusDot} style={{ background: st.dot }}/>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}