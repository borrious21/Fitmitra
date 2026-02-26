// src/services/gamification.service.js
// ─────────────────────────────────────────────────────────────
//  Gamification Engine
//  Features:
//    • XP system (workout completed, PBs, streaks)
//    • Level system with thresholds + XP-to-next display
//    • Daily streak tracking (consecutive days active)
//    • Weekly streak bonus
//    • Missed workout penalty + recovery suggestion
//    • Adaptive difficulty signal (too easy / too hard)
//    • Badge / achievement unlocks
// ─────────────────────────────────────────────────────────────

import { MISSED_WORKOUT_RECOVERY } from "./plan.generator.js";

// ── XP TABLE ─────────────────────────────────────────────────

export const XP_TABLE = {
  workout_completed:   100,
  personal_best:       250,
  streak_7_days:       500,
  streak_14_days:     1000,
  streak_30_days:     2500,
  all_workouts_week:   300,   // completed every planned session in a week
  missed_workout:      -50,   // penalty per skipped session
  deload_completed:    150,   // bonus for completing deload week (recovery discipline)
  hydration_logged:     25,
  sleep_logged:         25,
};

// ── LEVEL THRESHOLDS ─────────────────────────────────────────
// Level 1 starts at 0 XP. Each row = XP needed to reach that level.

const LEVEL_THRESHOLDS = [
  0,       // Level 1
  500,     // Level 2
  1200,    // Level 3
  2500,    // Level 4
  5000,    // Level 5
  9000,    // Level 6
  15000,   // Level 7
  25000,   // Level 8
  40000,   // Level 9
  60000,   // Level 10 — Elite
];

export function computeLevel(xp) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? null; // null = max level
  const xpToNext      = nextThreshold !== null ? nextThreshold - xp : 0;
  const progressPct   = nextThreshold
    ? Math.round(((xp - LEVEL_THRESHOLDS[level - 1]) / (nextThreshold - LEVEL_THRESHOLDS[level - 1])) * 100)
    : 100;

  return {
    current:      level,
    label:        getLevelLabel(level),
    xp_to_next:   xpToNext,
    progress_pct: progressPct,
    is_max_level: nextThreshold === null,
  };
}

function getLevelLabel(level) {
  const labels = {
    1:  "🌱 Rookie",
    2:  "🏃 Mover",
    3:  "💪 Grinder",
    4:  "🔥 Crusher",
    5:  "⚡ Athlete",
    6:  "🥈 Contender",
    7:  "🥇 Champion",
    8:  "🏆 Elite",
    9:  "💎 Legend",
    10: "🚀 GOAT",
  };
  return labels[level] ?? `Level ${level}`;
}

// ── BADGE / ACHIEVEMENT SYSTEM ────────────────────────────────

const BADGES = [
  { id: "first_workout",   label: "First Step 👟",      condition: (stats) => stats.total_completed >= 1       },
  { id: "week_streak",     label: "7-Day Warrior 🔥",   condition: (stats) => stats.longest_streak >= 7        },
  { id: "pb_hunter",       label: "PR Machine 💥",      condition: (stats) => stats.total_pbs >= 5             },
  { id: "iron_will",       label: "Iron Will 🛡️",       condition: (stats) => stats.total_completed >= 50      },
  { id: "century",         label: "Century Club 💯",     condition: (stats) => stats.total_completed >= 100     },
  { id: "deload_discipline",label: "Smart Trainer 🧠",  condition: (stats) => stats.deloads_completed >= 2     },
  { id: "no_miss_month",   label: "Perfect Month 📅",   condition: (stats) => stats.consecutive_weeks_full >= 4},
];

export function computeBadges(stats) {
  return BADGES.filter((b) => b.condition(stats)).map((b) => ({ id: b.id, label: b.label }));
}

// ── STREAK CALCULATOR ─────────────────────────────────────────

/**
 * Computes the current streak and longest streak from an array of
 * { date: "YYYY-MM-DD", completed: boolean } log entries.
 * Entries should be sorted ascending by date.
 */
export function computeStreak(logs = []) {
  const completedDates = [
    ...new Set(
      logs.filter((l) => l.completed).map((l) => new Date(l.date).toDateString())
    ),
  ].sort((a, b) => new Date(a) - new Date(b));

  let currentStreak = 0;
  let longestStreak = 0;
  let streak        = 0;

  for (let i = 0; i < completedDates.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(completedDates[i - 1]);
      const curr = new Date(completedDates[i]);
      const diffDays = Math.round((curr - prev) / 86400000);
      streak = diffDays <= 1 ? streak + 1 : 1;
    }
    if (streak > longestStreak) longestStreak = streak;
  }

  // Current streak: only counts if last activity was today or yesterday
  if (completedDates.length > 0) {
    const lastDate  = new Date(completedDates[completedDates.length - 1]);
    const today     = new Date();
    const diffToday = Math.round((today - lastDate) / 86400000);
    currentStreak   = diffToday <= 1 ? streak : 0;
  }

  return { currentStreak, longestStreak };
}

// ── XP ENGINE ────────────────────────────────────────────────

/**
 * Computes total XP, level, streak, and gamification stats
 * from an array of workout log entries.
 *
 * @param {Array} logs  — workout log entries:
 *   { date, completed, personal_best, is_deload, split, kcal_burned, perceived_effort }
 * @param {Array} weeklyPlans — planned workouts per week (for "all completed" bonus)
 * @returns {Object} gamification summary
 */
export function computeXP(logs = [], weeklyPlans = []) {
  let xp = 0;

  const stats = {
    total_completed:        0,
    total_missed:           0,
    total_pbs:              0,
    deloads_completed:      0,
    longest_streak:         0,
    consecutive_weeks_full: 0,
  };

  // Per-log XP
  for (const log of logs) {
    if (log.completed) {
      xp += XP_TABLE.workout_completed;
      stats.total_completed++;
      if (log.personal_best) { xp += XP_TABLE.personal_best; stats.total_pbs++; }
      if (log.is_deload)     { xp += XP_TABLE.deload_completed; stats.deloads_completed++; }
      if (log.hydration_logged) xp += XP_TABLE.hydration_logged;
      if (log.sleep_logged)     xp += XP_TABLE.sleep_logged;
    } else {
      xp += XP_TABLE.missed_workout; // negative
      stats.total_missed++;
    }
  }

  // Streak bonuses
  const { currentStreak, longestStreak } = computeStreak(logs);
  stats.longest_streak = longestStreak;

  if (longestStreak >= 30) xp += XP_TABLE.streak_30_days;
  else if (longestStreak >= 14) xp += XP_TABLE.streak_14_days;
  else if (longestStreak >= 7)  xp += XP_TABLE.streak_7_days;

  // Weekly completion bonus: check each week's logs vs. plan count
  if (weeklyPlans.length > 0) {
    let consecutiveFullWeeks = 0;
    for (const wp of weeklyPlans) {
      const weekLogs     = logs.filter((l) => l.week === wp.week && l.completed);
      const plannedCount = wp.workouts?.length ?? 0;
      if (weekLogs.length >= plannedCount && plannedCount > 0) {
        xp += XP_TABLE.all_workouts_week;
        consecutiveFullWeeks++;
      } else {
        consecutiveFullWeeks = 0;
      }
    }
    stats.consecutive_weeks_full = consecutiveFullWeeks;
  }

  // Ensure XP never goes below 0
  xp = Math.max(0, xp);

  const level  = computeLevel(xp);
  const badges = computeBadges(stats);

  return {
    xp,
    level,
    streak: {
      current: currentStreak,
      longest: longestStreak,
    },
    stats,
    badges,
  };
}

// ── ADAPTIVE DIFFICULTY ───────────────────────────────────────

/**
 * Signals whether the plan should be made harder or easier
 * based on the user's recent perceived effort logs.
 *
 * @param {Array} recentLogs  — last 2–3 weeks of logs with perceived_effort
 * @returns {{ signal, message }}
 */
export function adaptiveDifficultySignal(recentLogs = []) {
  if (recentLogs.length === 0) return { signal: "maintain", message: "Not enough data." };

  const efforts = recentLogs.map((l) => l.perceived_effort).filter(Boolean);
  const easyCount  = efforts.filter((e) => e === "easy").length;
  const hardCount  = efforts.filter((e) => e === "hard").length;
  const ratio      = efforts.length;

  if (easyCount / ratio >= 0.6) {
    return {
      signal:  "increase",
      message: "Most sessions feel easy — consider moving to the next fitness level or adding weight.",
    };
  }
  if (hardCount / ratio >= 0.6) {
    return {
      signal:  "decrease",
      message: "Many sessions feel very hard — consider adding an extra rest day or reducing volume.",
    };
  }
  return {
    signal:  "maintain",
    message: "Difficulty is well-balanced — keep following the plan.",
  };
}

// ── MISSED WORKOUT RECOVERY ───────────────────────────────────

/**
 * Returns a makeup suggestion when a user misses a session.
 *
 * @param {string} missedSplit  — e.g. "Push", "Legs"
 * @returns {{ missed_split, recovery_suggestion, xp_penalty }}
 */
export function getMissedWorkoutRecovery(missedSplit) {
  return {
    missed_split:         missedSplit,
    recovery_suggestion:  MISSED_WORKOUT_RECOVERY[missedSplit] ?? "20-min light walk",
    xp_penalty:           XP_TABLE.missed_workout,
    tip: "Even partial makeups reduce XP loss — something is always better than nothing.",
  };
}