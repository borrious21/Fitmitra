// src/pages/protected/Dashboard/MealPlanner/Mealplanner.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../../context/AuthContext";
import { apiFetch } from "../../../../services/apiClient";
import { getMyProfile } from "../../../../services/profileService";
import styles from "./MealPlanner.module.css";

const MEAL_EMOJIS = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
const MEAL_ORDER  = ["breakfast", "lunch", "dinner", "snack"];

const GOAL_LABELS = {
  weight_loss: "Weight Loss", muscle_gain: "Muscle Gain",
  maintain_fitness: "Maintenance", endurance: "Endurance", wellness: "Wellness",
};

function NavAvatar({ avatarUrl, initials }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [avatarUrl]);
  if (avatarUrl && !imgError)
    return <img src={avatarUrl} alt="avatar" className={styles.navAvatarImg} onError={() => setImgError(true)} />;
  return <div className={styles.navAvatar}>{initials}</div>;
}

function CalSummary({ calories }) {
  return (
    <div className={styles.calSummary}>
      {[
        { val: calories.tdee,      unit: "kcal", key: "Daily Target" },
        { val: calories.protein_g, unit: "g",    key: "Protein"      },
        { val: calories.carbs_g,   unit: "g",    key: "Carbs"        },
        { val: calories.fats_g,    unit: "g",    key: "Fats"         },
      ].map(({ val, unit, key }) => (
        <div key={key} className={styles.calCard}>
          <div className={styles.calCardVal}>{val}<span className={styles.calCardUnit}>{unit}</span></div>
          <div className={styles.calCardKey}>{key}</div>
        </div>
      ))}
    </div>
  );
}

function MealCard({ mealType, meal, onLog, logState }) {
  if (!meal) return null;
  const totalProtein = meal.items?.reduce((s, i) => s + (Number(i.protein_g) || 0), 0) || 0;
  const totalCarbs   = meal.items?.reduce((s, i) => s + (Number(i.carbs_g)   || 0), 0) || 0;
  const totalFats    = meal.items?.reduce((s, i) => s + (Number(i.fats_g)    || 0), 0) || 0;

  const isLogging = logState === "loading";
  const isLogged  = logState === "done";
  const isError   = logState === "error";
  const isDupe    = logState === "duplicate";

  return (
    <div className={styles.mealCard}>
      <div className={styles.mealCardHeader}>
        <div className={styles.mealCardTitle}>
          <span className={styles.mealEmoji}>{MEAL_EMOJIS[mealType] || "🍽️"}</span>
          <span className={styles.mealName}>{mealType}</span>
        </div>
        <span className={styles.mealCal}>{meal.calories} kcal</span>
      </div>

      <div className={styles.mealItems}>
        {meal.items?.map((item, i) => (
          <div key={i} className={styles.mealItem}>
            <div className={styles.mealItemLeft}>
              <span className={styles.mealItemName}>{item.name}</span>
              <span className={styles.mealItemPortion}>{item.portion}</span>
            </div>
            <div className={styles.mealItemRight}>
              <span className={styles.mealItemCal}>{item.calories} kcal</span>
              <div className={styles.mealItemMacros}>
                <span className={styles.macroChip} style={{ background:"rgba(255,92,26,.15)", color:"#FF5C1A" }}>P{Math.round(Number(item.protein_g)||0)}</span>
                <span className={styles.macroChip} style={{ background:"rgba(0,200,224,.12)", color:"#00C8E0" }}>C{Math.round(Number(item.carbs_g)  ||0)}</span>
                <span className={styles.macroChip} style={{ background:"rgba(184,240,0,.1)",  color:"#B8F000" }}>F{Math.round(Number(item.fats_g)   ||0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mealMacroBar}>
        {[
          { val: Math.round(totalProtein), key: "Protein", color: "#FF5C1A" },
          { val: Math.round(totalCarbs),   key: "Carbs",   color: "#00C8E0" },
          { val: Math.round(totalFats),    key: "Fats",    color: "#B8F000" },
        ].map(({ val, key, color }) => (
          <div key={key} className={styles.mealMacroItem}>
            <span className={styles.mealMacroVal} style={{ color }}>{val}g</span>
            <span className={styles.mealMacroKey}>{key}</span>
          </div>
        ))}
      </div>

      {/* Log button states */}
      {isLogged && <div className={styles.loggedBadge}>✓ Logged to diary</div>}
      {isDupe   && <div className={styles.loggedBadge} style={{ color:"#facc15", borderColor:"rgba(250,204,21,.3)" }}>✓ Already logged today</div>}
      {isError  && (
        <button className={styles.logMealBtn} style={{ borderColor:"rgba(239,68,68,.4)", color:"#f87171" }} onClick={() => onLog(mealType, meal)}>
          ⚠️ Failed — Retry
        </button>
      )}
      {!isLogged && !isDupe && !isError && (
        <button className={styles.logMealBtn} onClick={() => onLog(mealType, meal)} disabled={isLogging}>
          {isLogging ? "Logging…" : "+ Log This Meal"}
        </button>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className={styles.mealsGrid}>
      {[0,1,2,3].map(i => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeleton} style={{ height:20, width:"40%" }} />
          <div className={styles.skeleton} style={{ height:14, width:"90%" }} />
          <div className={styles.skeleton} style={{ height:14, width:"75%" }} />
          <div className={styles.skeleton} style={{ height:32, marginTop:8 }} />
        </div>
      ))}
    </div>
  );
}

function HistoryRow({ row }) {
  const date = new Date(row.plan_date).toLocaleDateString("en-IN", { weekday:"short", month:"short", day:"numeric" });
  return (
    <div className={styles.historyRow}>
      <span className={styles.historyDate}>{date}</span>
      <div className={styles.historyStats}>
        {[
          { val:row.tdee,      key:"kcal" },
          { val:row.protein_g, key:"P"    },
          { val:row.carbs_g,   key:"C"    },
          { val:row.fats_g,    key:"F"    },
        ].map(({ val, key }) => (
          <div key={key} className={styles.historyStat}>
            <span className={styles.historyStatVal}>{val}</span>
            <span className={styles.historyStatKey}>{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function unwrap(res) {
  if (!res) return null;
  if (res?.data?.plan) return res.data;
  if (res?.plan)       return res;
  return res?.data ?? res;
}

export default function MealPlanner() {
  const navigate    = useNavigate();
  const { user }    = useContext(AuthContext);

  const [planData,     setPlanData]     = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [fetching,     setFetching]     = useState(true);
  const [alert,        setAlert]        = useState(null);
  // logState per mealType: null | "loading" | "done" | "duplicate" | "error"
  const [logStates,    setLogStates]    = useState({});
  const [history,      setHistory]      = useState([]);
  const [avatarUrl,    setAvatarUrl]    = useState(null);
  const [profileError, setProfileError] = useState(false);

  const displayName = user?.name ?? "User";
  const initials    = displayName.split(" ").map(n => n[0] ?? "").join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    const init = async () => {
      setFetching(true);
      try {
        const raw  = await getMyProfile().catch(() => null);
        const data = raw?.data ?? raw;
        const resolved = data?.avatar_url ?? data?.data?.avatar_url ?? null;
        if (resolved) setAvatarUrl(resolved);
      } catch {}

      try {
        const res    = await apiFetch("/meal-planner/today");
        const result = unwrap(res);
        if (result?.plan?.meals) setPlanData(result);
      } catch (e) {
        const msg = e?.message ?? "";
        if (msg.includes("Profile not found") || msg.includes("profile")) setProfileError(true);
      }

      try {
        const histRes  = await apiFetch("/meal-planner/history?limit=5");
        const histData = histRes?.data ?? histRes;
        if (Array.isArray(histData)) setHistory(histData);
      } catch {}

      setFetching(false);
    };
    init();
  }, []);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setAlert(null);
    setLogStates({});
    try {
      const res    = await apiFetch("/meal-planner/generate", { method: "POST" });
      const result = unwrap(res);
      if (result?.plan?.meals) {
        setPlanData(result);
        showAlert("success", "🍽️ Meal plan ready!");
        const histRes  = await apiFetch("/meal-planner/history?limit=5").catch(() => null);
        const histData = histRes?.data ?? histRes;
        if (Array.isArray(histData)) setHistory(histData);
      } else {
        showAlert("error", "Plan generated but couldn't display. Try again.");
      }
    } catch (e) {
      const msg = e?.message ?? "";
      if (msg.includes("Profile not found") || msg.includes("profile")) {
        setProfileError(true);
        showAlert("error", "Please complete your profile first.");
      } else {
        showAlert("error", msg || "Failed to generate. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Log a meal — handles duplicate gracefully ─────────────────────────────
  const handleLogMeal = async (mealType, meal) => {
    setLogStates(prev => ({ ...prev, [mealType]: "loading" }));
    try {
      const totalCal  = meal.calories || 0;
      const totalProt = meal.items?.reduce((s, i) => s + (Number(i.protein_g) || 0), 0) || 0;
      const totalCarb = meal.items?.reduce((s, i) => s + (Number(i.carbs_g)   || 0), 0) || 0;
      const totalFat  = meal.items?.reduce((s, i) => s + (Number(i.fats_g)    || 0), 0) || 0;
      const mealNames = meal.items?.map(i => i.name).join(", ") || mealType;

      await apiFetch("/meals/log", {
        method: "POST",
        body: JSON.stringify({
          mealType,
          mealName: mealNames.slice(0, 148), // stay under VARCHAR(150)
          calories: Math.round(totalCal),
          protein:  Math.round(totalProt * 10) / 10,
          carbs:    Math.round(totalCarb * 10) / 10,
          fats:     Math.round(totalFat  * 10) / 10,
          source:   "custom",                // ← use "custom" not "ai_planner" — matches your existing source validation
          log_date: new Date().toLocaleDateString("en-CA"),
          notes:    "Logged from AI Meal Planner",
        }),
      });

      setLogStates(prev => ({ ...prev, [mealType]: "done" }));
      showAlert("success", `✅ ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} logged!`);
    } catch (e) {
      const msg = (e?.message ?? "").toLowerCase();

      // ── Handle duplicate meal_type for today gracefully ────────────────────
      if (
        msg.includes("duplicate") ||
        msg.includes("unique") ||
        msg.includes("already") ||
        e?.status === 409 ||
        // The meal service returns 400 for constraint violations
        (e?.status === 400 && msg.includes("meal"))
      ) {
        setLogStates(prev => ({ ...prev, [mealType]: "duplicate" }));
        showAlert("success", `${mealType} already logged today — diary is up to date.`);
      } else {
        setLogStates(prev => ({ ...prev, [mealType]: "error" }));
        showAlert("error", `Failed to log ${mealType}: ${e?.message || "unknown error"}`);
        console.error("[LogMeal] 400 body:", e);
      }
    }
  };

  const hasPlan = !!(planData?.plan?.meals);

  return (
    <div className={styles.wrapper}>
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
        <button className={styles.backBtn} onClick={() => navigate("/dashboard")}>← Dashboard</button>
        <a href="/profile" className={styles.navAvatarLink}>
          <NavAvatar avatarUrl={avatarUrl} initials={initials} />
        </a>
      </nav>

      <main className={styles.main}>
        {alert && (
          <div className={alert.type === "success" ? styles.alertSuccess : styles.alertError}>
            {alert.msg}
          </div>
        )}

        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>🍽️ AI <span>Meal Planner</span></h1>
          <p className={styles.pageSub}>
            Personalized Nepali meal plans · Groq AI · Medical safety filters
            {planData?.profile?.goal && ` · ${GOAL_LABELS[planData.profile.goal] ?? planData.profile.goal}`}
          </p>
        </div>

        {profileError && (
          <div className={styles.profileMissing}>
            <div className={styles.profileMissingTitle}>⚠️ Profile Incomplete</div>
            <div className={styles.profileMissingSub}>Complete your profile to generate a meal plan.</div>
            <button className={styles.profileBtn} onClick={() => navigate("/profile")}>Complete Profile →</button>
          </div>
        )}

        {!profileError && (
          <div className={styles.generateSection}>
            <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading || fetching}>
              {loading
                ? <><span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⚙️</span> Generating…</>
                : hasPlan ? "🔄 Regenerate Today's Plan" : "✨ Generate My Meal Plan"
              }
            </button>
            {hasPlan && (
              <button className={styles.regenerateBtn} onClick={() => navigate("/log-meal")} disabled={loading}>
                + Log Custom
              </button>
            )}
          </div>
        )}

        {(fetching || loading) && <SkeletonGrid />}

        {!fetching && !loading && hasPlan && (
          <>
            <CalSummary calories={planData.calories} />

            {planData.safety_rules?.length > 0 && (
              <div className={styles.safetyRow}>
                <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>⚠️ Avoiding:</span>
                {planData.safety_rules.map(r => <span key={r} className={styles.safetyChip}>❌ {r}</span>)}
              </div>
            )}

            <div className={styles.mealsGrid}>
              {MEAL_ORDER.map(mealType => (
                <MealCard
                  key={mealType}
                  mealType={mealType}
                  meal={planData.plan.meals[mealType]}
                  onLog={handleLogMeal}
                  logState={logStates[mealType] ?? null}
                />
              ))}
            </div>

            <div className={styles.calSummary} style={{ marginBottom:20 }}>
              {[
                { val: planData.plan.total_calories,  unit:"kcal", key:"Total Calories" },
                { val: planData.plan.total_protein_g, unit:"g",    key:"Total Protein"  },
                { val: planData.plan.total_carbs_g,   unit:"g",    key:"Total Carbs"    },
                { val: planData.plan.total_fats_g,    unit:"g",    key:"Total Fats"     },
              ].map(({ val, unit, key }) => (
                <div key={key} className={styles.calCard}>
                  <div className={styles.calCardVal}>{Math.round(val||0)}<span className={styles.calCardUnit}>{unit}</span></div>
                  <div className={styles.calCardKey}>{key}</div>
                </div>
              ))}
            </div>

            {planData.plan.tips?.length > 0 && (
              <div className={styles.tipsCard}>
                <div className={styles.tipsTitle}>💡 Coach Tips</div>
                <div className={styles.tipsList}>
                  {planData.plan.tips.map((tip, i) => (
                    <div key={i} className={styles.tipItem}><span className={styles.tipDot} />{tip}</div>
                  ))}
                </div>
                {planData.plan.water_recommendation_liters && (
                  <div className={styles.waterTip}>💧 Drink {planData.plan.water_recommendation_liters}L of water today</div>
                )}
              </div>
            )}
          </>
        )}

        {!fetching && !loading && !hasPlan && !profileError && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🍽️</span>
            <div className={styles.emptyTitle}>No meal plan yet</div>
            <div className={styles.emptySub}>Click "Generate My Meal Plan" to get a personalized Nepali meal plan.</div>
          </div>
        )}

        {history.length > 0 && (
          <div className={styles.historySection}>
            <div className={styles.historyTitle}>📅 Past Plans</div>
            {history.map(row => <HistoryRow key={row.plan_date} row={row} />)}
          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}