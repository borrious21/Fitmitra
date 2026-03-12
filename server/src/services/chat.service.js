// src/services/chat.service.js
import Anthropic from "@anthropic-ai/sdk";
import pool from "../../db/pool.js";
import ProfileModel from "../../models/profile.model.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;
const MAX_HISTORY_TURNS = 10; // last 10 turns kept for context

// ─────────────────────────────────────────────
//  Data fetchers
// ─────────────────────────────────────────────

async function fetchUserContext(userId) {
  const [profileRow, progressRow, weeklyRow, nutritionRow] = await Promise.all([
    ProfileModel.findByUserId(userId).catch(() => null),

    pool
      .query(
        `SELECT weight_kg, body_fat_percentage, energy_level,
                sleep_hours, water_intake_liters,
                blood_pressure_systolic, blood_pressure_diastolic, heart_rate,
                log_date
         FROM progress_logs
         WHERE user_id = $1
         ORDER BY log_date DESC LIMIT 1`,
        [userId]
      )
      .then((r) => r.rows[0] || null)
      .catch(() => null),

    pool
      .query(
        `SELECT COUNT(*) FILTER (WHERE completed = true) AS completed_this_week,
                COUNT(*)                                  AS total_this_week
         FROM workout_logs
         WHERE user_id = $1
           AND workout_date >= DATE_TRUNC('week', CURRENT_DATE)`,
        [userId]
      )
      .then((r) => r.rows[0] || null)
      .catch(() => null),

    pool
      .query(
        `SELECT COALESCE(SUM(calories_consumed), 0) AS cal_today,
                COALESCE(SUM(protein_g), 0)         AS protein_today
         FROM meal_logs
         WHERE user_id = $1 AND log_date = CURRENT_DATE`,
        [userId]
      )
      .then((r) => r.rows[0] || null)
      .catch(() => null),
  ]);

  return { profile: profileRow, progress: progressRow, weekly: weeklyRow, nutrition: nutritionRow };
}

// ─────────────────────────────────────────────
//  System prompt builder
// ─────────────────────────────────────────────

function buildSystemPrompt(ctx) {
  const { profile, progress, weekly, nutrition } = ctx;

  // ── Profile section ──
  let profileSection = "USER PROFILE: Not set up yet.";
  if (profile) {
    const med = profile.medical_conditions
      ? typeof profile.medical_conditions === "string"
        ? profile.medical_conditions
        : JSON.stringify(profile.medical_conditions)
      : "none reported";

    profileSection = `USER PROFILE:
- Age: ${profile.age ?? "unknown"}
- Gender: ${profile.gender ?? "unknown"}
- Weight: ${profile.weight_kg ? profile.weight_kg + " kg" : "unknown"}
- Height: ${profile.height_cm ? profile.height_cm + " cm" : "unknown"}
- BMI: ${profile.bmi ? Number(profile.bmi).toFixed(1) : "unknown"}
- Goal: ${profile.goal ?? "unknown"}  (weight_loss / muscle_gain / maintenance / endurance)
- Activity level: ${profile.activity_level ?? "unknown"}
- Fitness level: ${profile.fitness_level ?? "unknown"}  (beginner / intermediate / advanced)
- Diet type: ${profile.diet_type ?? "no preference"}
- Food preference: ${profile.food_preference ?? "no preference"}
- Medical conditions: ${med}
- Injuries: ${profile.injuries ?? "none reported"}`;
  }

  // ── Progress section ──
  let progressSection = "RECENT PROGRESS: No progress logs yet.";
  if (progress) {
    const bpStr =
      progress.blood_pressure_systolic && progress.blood_pressure_diastolic
        ? `${progress.blood_pressure_systolic}/${progress.blood_pressure_diastolic} mmHg`
        : "not logged";

    progressSection = `RECENT PROGRESS (as of ${progress.log_date ?? "latest"}):
- Current weight: ${progress.weight_kg ? progress.weight_kg + " kg" : "not logged"}
- Body fat: ${progress.body_fat_percentage ? progress.body_fat_percentage + "%" : "not logged"}
- Sleep last night: ${progress.sleep_hours ? progress.sleep_hours + " hrs" : "not logged"}
- Energy level: ${progress.energy_level ? progress.energy_level + "/10" : "not logged"}
- Water intake: ${progress.water_intake_liters ? progress.water_intake_liters + " L" : "not logged"}
- Blood pressure: ${bpStr}
- Heart rate: ${progress.heart_rate ? progress.heart_rate + " bpm" : "not logged"}`;
  }

  // ── Weekly activity section ──
  let weeklySection = "WEEKLY ACTIVITY: No workout data this week.";
  if (weekly) {
    weeklySection = `THIS WEEK'S ACTIVITY:
- Workouts completed: ${weekly.completed_this_week} / ${weekly.total_this_week} scheduled`;
  }

  // ── Nutrition section ──
  let nutritionSection = "TODAY'S NUTRITION: No meals logged today.";
  if (nutrition && Number(nutrition.cal_today) > 0) {
    nutritionSection = `TODAY'S NUTRITION:
- Calories consumed: ${Number(nutrition.cal_today).toFixed(0)} kcal
- Protein consumed: ${Number(nutrition.protein_today).toFixed(1)} g`;
  }

  // ── Safety flags ──
  const safetyFlags = buildSafetyFlags(profile, progress);

  return `You are FitMitra AI — a friendly, knowledgeable, and safety-first fitness and wellness assistant built into the FitMitra app.

ABOUT YOU:
- You are a personal fitness guide, meal advisor, recovery assistant, and wellness supporter.
- You speak in a warm, encouraging, and clear tone.
- You give PERSONALIZED answers using the user data below — not generic advice.
- You support both English and Nepali (if the user writes in Nepali, reply in Nepali).
- You have knowledge of Nepali foods (dal bhat, chiura, sel roti, gundruk, dhido, etc.) and can suggest them when relevant.

${profileSection}

${progressSection}

${weeklySection}

${nutritionSection}

${safetyFlags}

WHAT YOU CAN HELP WITH:
1. Fitness: workout plans, exercise form, warm-up/cool-down, beginner/home/gym workouts, workout splits.
2. Nutrition: calorie targets, macro basics, meal timing, pre/post workout meals, Nepali food suggestions, hydration.
3. Recovery: rest day advice, muscle soreness, sleep tips, stretching routines, overtraining warnings.
4. Wellness: breathing exercises, stress relief, relaxation routines, motivation, healthy habits.
5. Progress: interpret their current progress data and suggest next steps.
6. General Q&A: BMI, TDEE, protein needs, water intake, common fitness myths.

PERSONALIZATION RULES:
- Always reference the user's profile (goal, fitness level, weight, age, etc.) when giving advice.
- For a beginner → keep advice simple, low intensity, focus on form.
- For weight loss goal → emphasize calorie deficit, cardio, meal logging.
- For muscle gain goal → emphasize protein intake, progressive overload, sleep.
- If no profile → give general advice and suggest they complete their profile for personalized guidance.

SAFETY RULES (HIGHEST PRIORITY — always apply these):
- NEVER recommend very intense exercise (heavy HIIT, max-weight lifting) for users with high BP, heart conditions, or obesity (BMI > 35).
- NEVER recommend plyometrics, jump squats, or high-impact moves for users with knee/joint injuries.
- For users with diabetes → always mention blood sugar monitoring around exercise.
- For users with high BP → avoid breath-holding exercises (Valsalva), heavy straining.
- If a user describes chest pain, dizziness, severe shortness of breath → immediately advise them to stop exercise and see a doctor.
- For serious medical questions → always say: "I'm a wellness assistant, not a doctor. Please consult a healthcare professional for medical concerns."

WHAT YOU MUST NEVER DO:
- Diagnose diseases or medical conditions.
- Prescribe or recommend medicines or supplements with dosages.
- Guarantee specific results ("you will lose 5 kg in 2 weeks").
- Give dangerous or extreme diet advice (very low calorie < 1000 kcal/day).
- Replace medical advice for serious symptoms.

RESPONSE STYLE:
- Keep answers concise and practical (2–5 short paragraphs or a short list).
- Use emojis sparingly to keep it friendly (1–2 per response is fine).
- When suggesting workouts, use this format: Exercise Name — Sets x Reps (e.g., Push-ups — 3×12).
- End with a motivational nudge when appropriate.
- If user data is missing for a personalized answer, give a general answer and mention what profile info would help.`;
}

function buildSafetyFlags(profile, progress) {
  if (!profile && !progress) return "";

  const flags = [];
  const med = profile?.medical_conditions;

  const hasCondition = (key) => {
    if (!med) return false;
    if (typeof med === "string") return med.toLowerCase().includes(key);
    if (typeof med === "object") return med[key] === true || med[key] === "true";
    return false;
  };

  if (hasCondition("high_blood_pressure") || hasCondition("hypertension")) {
    flags.push("⚠️  HIGH BLOOD PRESSURE: Avoid intense HIIT, breath-holding, very heavy lifts. Prefer moderate cardio.");
  }
  if (hasCondition("diabetes") || hasCondition("type_2_diabetes")) {
    flags.push("⚠️  DIABETES: Always remind about blood sugar monitoring before/after exercise.");
  }
  if (hasCondition("heart") || hasCondition("cardiac")) {
    flags.push("⚠️  HEART CONDITION: Keep intensity low-to-moderate. Suggest doctor clearance for new programs.");
  }
  if (profile?.bmi && Number(profile.bmi) >= 35) {
    flags.push("⚠️  HIGH BMI (≥35): Avoid high-impact exercises. Prioritize low-impact: walking, swimming, cycling.");
  }

  const injuries = profile?.injuries?.toLowerCase() ?? "";
  if (injuries.includes("knee")) {
    flags.push("⚠️  KNEE INJURY: Avoid jump squats, deep lunges, running on hard surfaces.");
  }
  if (injuries.includes("back") || injuries.includes("spine")) {
    flags.push("⚠️  BACK INJURY: Avoid heavy deadlifts, sit-ups, unsupported bends. Prioritize core stability.");
  }
  if (injuries.includes("shoulder")) {
    flags.push("⚠️  SHOULDER INJURY: Avoid overhead pressing, behind-neck exercises.");
  }

  const bpSys = progress?.blood_pressure_systolic;
  if (bpSys && Number(bpSys) >= 140) {
    flags.push("⚠️  CURRENT BP ELEVATED (≥140 systolic): Recommend doctor consultation before intense exercise.");
  }

  if (!flags.length) return "";
  return `ACTIVE SAFETY FLAGS (apply to all responses):\n${flags.join("\n")}`;
}

// ─────────────────────────────────────────────
//  Chat history helpers
// ─────────────────────────────────────────────

async function getChatHistory(userId, sessionId) {
  const { rows } = await pool.query(
    `SELECT role, content
     FROM chat_messages
     WHERE user_id = $1 AND session_id = $2
     ORDER BY created_at ASC
     LIMIT $3`,
    [userId, sessionId, MAX_HISTORY_TURNS * 2]
  );
  return rows.map((r) => ({ role: r.role, content: r.content }));
}

async function saveMessage(userId, sessionId, role, content) {
  await pool.query(
    `INSERT INTO chat_messages (user_id, session_id, role, content)
     VALUES ($1, $2, $3, $4)`,
    [userId, sessionId, role, content]
  );
}

async function createSession(userId) {
  const { rows } = await pool.query(
    `INSERT INTO chat_sessions (user_id) VALUES ($1) RETURNING id`,
    [userId]
  );
  return rows[0].id;
}

async function getOrCreateSession(userId, sessionId) {
  if (sessionId) {
    const { rows } = await pool.query(
      `SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );
    if (rows.length) return rows[0].id;
  }
  return createSession(userId);
}

async function getUserSessions(userId, limit = 20) {
  const { rows } = await pool.query(
    `SELECT cs.id, cs.created_at, cs.updated_at,
            (SELECT content FROM chat_messages
             WHERE session_id = cs.id AND role = 'user'
             ORDER BY created_at ASC LIMIT 1) AS first_message
     FROM chat_sessions cs
     WHERE cs.user_id = $1
     ORDER BY cs.updated_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

async function deleteSession(userId, sessionId) {
  await pool.query(
    `DELETE FROM chat_messages WHERE session_id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  const { rowCount } = await pool.query(
    `DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  return rowCount > 0;
}

// ─────────────────────────────────────────────
//  Main chat function
// ─────────────────────────────────────────────

export async function chat(userId, userMessage, sessionId = null) {
  // 1. Fetch user context (profile + progress)
  const ctx = await fetchUserContext(userId);

  // 2. Resolve session
  const resolvedSessionId = await getOrCreateSession(userId, sessionId);

  // 3. Load history
  const history = await getChatHistory(userId, resolvedSessionId);

  // 4. Build system prompt with personalized data
  const systemPrompt = buildSystemPrompt(ctx);

  // 5. Save user message
  await saveMessage(userId, resolvedSessionId, "user", userMessage);

  // 6. Call Anthropic
  const messages = [...history, { role: "user", content: userMessage }];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages,
  });

  const assistantMessage = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  // 7. Save assistant response
  await saveMessage(userId, resolvedSessionId, "assistant", assistantMessage);

  // 8. Update session timestamp
  await pool.query(
    `UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`,
    [resolvedSessionId]
  );

  return {
    message: assistantMessage,
    session_id: resolvedSessionId,
    input_tokens: response.usage?.input_tokens ?? 0,
    output_tokens: response.usage?.output_tokens ?? 0,
  };
}

export const ChatService = {
  chat,
  getChatHistory,
  getUserSessions,
  createSession,
  deleteSession,
};

export default ChatService;