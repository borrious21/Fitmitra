import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Dashboard.module.css";

import Navbar from "../../../components/Navbar/Navbar";
import { AuthContext } from "../../../context/AuthContext";
import { apiFetch } from "../../../services/apiClient";
import { getMyProfile } from "../../../services/profileService";
import {
  getDashboardNutrition, getDashboardWorkout, getDashboardMeals,
  getDashboardStreak, getDashboardWeekly
} from "../../../services/dashboardService";
import {
  Activity, Dumbbell, Flame, Target, Zap, Droplets,
  Moon, Calendar, Clock, Heart, Footprints, Utensils, ChefHat, TrendingUp
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import AiCoach from "../../../components/AiCoach/AiCoach";

function pct(v, t) { return t ? Math.min(100, Math.round((v / t) * 100)) : 0; }

function unwrap(res) {
  if (res == null) return null;
  return res.data ?? res.result ?? res;
}

function pick(obj, paths, fallback = 0) {
  for (const path of paths) {
    const val = path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
    if (
      val != null &&
      val !== '' &&
      val !== false &&
      !(typeof val === 'object' && !Array.isArray(val))
    ) return val;
  }
  return fallback;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildChartData(rawWeekly) {
  const today = new Date();
  const slots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return {
      name:     DAY_LABELS[d.getDay()],
      isoDate:  d.toISOString().split('T')[0],
      calories: 0,
      workout:  0,
    };
  });

  if (!Array.isArray(rawWeekly) || rawWeekly.length === 0) return slots;

  rawWeekly.forEach(row => {
    const rowDate =
      row.date ?? row.log_date ?? row.workout_date ?? row.day ?? null;

    const calories = pick(row, ['calories', 'calories_consumed', 'kcal', 'total_calories'], 0);
    const workout  = pick(row, ['workout_minutes', 'workout', 'duration_minutes', 'minutes'], 0);

    const slot = slots.find(s => {
      if (!rowDate) return false;
      const rowStr = String(rowDate);
      if (s.isoDate === rowStr) return true;
      if (s.name === rowStr) return true;
      if (/^\d{1,2}$/.test(rowStr) && s.isoDate.endsWith(`-${rowStr.padStart(2, '0')}`)) return true;
      if (rowStr.includes('T') && s.isoDate === rowStr.split('T')[0]) return true;
      return false;
    });

    if (slot) {
      slot.calories += Number(calories) || 0;
      slot.workout  += Number(workout)  || 0;
    }
  });

  return slots;
}

export default function Dashboard() {
  const navigate   = useNavigate();
  const { user }   = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(true);
  const [raw, setRaw] = useState({
    profile: null, nutrition: null, workout: null,
    meals: [], streak: null, weekly: [], latestWeight: null
  });

  useEffect(() => {
    (async () => {
      try {
        const [prof, nutr, work, mls, strk, wkl, progressRes] = await Promise.allSettled([
          getMyProfile(),
          getDashboardNutrition(),
          getDashboardWorkout(),
          getDashboardMeals(),
          getDashboardStreak(),
          getDashboardWeekly(),
          apiFetch('/progress/log'),
        ]);

        const resolved = {
          profile:      prof.status  === 'fulfilled' ? unwrap(prof.value)  : null,
          nutrition:    nutr.status  === 'fulfilled' ? unwrap(nutr.value)  : null,
          workout:      work.status  === 'fulfilled' ? unwrap(work.value)  : null,
          meals:        mls.status   === 'fulfilled' ? unwrap(mls.value)   : null,
          streak:       strk.status  === 'fulfilled' ? unwrap(strk.value)  : null,
          weekly:       wkl.status   === 'fulfilled' ? unwrap(wkl.value)   : null,
          latestWeight: null,
        };

        if (progressRes.status === 'fulfilled') {
          const logs = progressRes.value;
          const logsArr = Array.isArray(logs?.data ?? logs) ? (logs?.data ?? logs) : [];
          const latestWithWeight = logsArr.find(l => l.weight_kg);
          if (latestWithWeight) resolved.latestWeight = Number(latestWithWeight.weight_kg);
        }

        console.group('[Dashboard] API responses');
        Object.entries(resolved).forEach(([k, v]) => console.log(k, v));
        console.groupEnd();

        setRaw(resolved);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.checkingScreen}>
          <Zap className={styles.checkingSpinner} size={32} />
          <p className={styles.checkingText}>Syncing metrics...</p>
        </div>
      </div>
    );
  }

  const { profile, nutrition, workout, meals: mealsRaw, streak, weekly: weeklyRaw, latestWeight } = raw;

  const currentWeight = latestWeight ?? pick(profile, ['weight_kg'], 70);

  const meals = Array.isArray(mealsRaw)
    ? mealsRaw
    : Array.isArray(mealsRaw?.meals)
      ? mealsRaw.meals
      : [];

  const weeklyArr = Array.isArray(weeklyRaw)
    ? weeklyRaw
    : Array.isArray(weeklyRaw?.history)
      ? weeklyRaw.history
      : Array.isArray(weeklyRaw?.data)
        ? weeklyRaw.data
        : Array.isArray(weeklyRaw?.weekly)
          ? weeklyRaw.weekly
          : [];

  const calIntake = pick(nutrition, [
    'calories.consumed', 'calories_consumed', 'calories.intake',
    'today.calories', 'kcal_consumed', 'total_calories'
  ], 0);

  const calTarget = pick(nutrition, [
    'calories.target', 'calorie_target', 'calories.goal',
    'target_calories', 'tdee'
  ], 2000);

  const caloriesBurned = pick(workout, [
    'today.calories_burned', 'calories_burned', 'kcal_burned',
    'today.kcal', 'estimated_kcal', 'burn'
  ], 0);

  const waterConsumed = pick(nutrition, [
    'water_L.consumed', 'water.consumed', 'water_liters',
    'water_intake_liters', 'water_consumed', 'hydration.consumed'
  ], 0);

  const waterTarget = pick(nutrition, [
    'water_L.target', 'water.target', 'water_target_liters',
    'water_goal', 'hydration.target'
  ], 3);

  const currentStreak = pick(streak, [
    'current_workout_streak', 'current_streak', 'streak',
    'workout_streak', 'streakCount'
  ], 0);

  const streakLevel = pick(streak, ['level', 'streak_level'], 1);

  const proteinConsumed = pick(nutrition, [
    'macros.protein.consumed', 'protein_g', 'protein_consumed',
    'macros.protein.amount', 'protein'
  ], 0);

  const proteinGoal = pick(nutrition, [
    'macros.protein.target', 'protein_target', 'protein_goal',
    'protein_g_goal', 'macros.protein.goal'
  ], 150);

  const carbsConsumed = pick(nutrition, [
    'macros.carbs.consumed', 'carbs_g', 'carbs_consumed',
    'macros.carbs.amount', 'carbs'
  ], 0);

  const fatsConsumed = pick(nutrition, [
    'macros.fats.consumed', 'macros.fat.consumed', 'fats_g', 'fat_g',
    'fats_consumed', 'fat_consumed', 'fats', 'fat'
  ], 0);

  const fatsGoal = pick(nutrition, [
    'macros.fats.target', 'macros.fat.target', 'fats_target', 'fat_target',
    'fats_goal', 'fat_goal', 'fats_g_goal', 'fat_g_goal'
  ], 65);

  console.log('[Dashboard] nutrition shape:', JSON.stringify(nutrition, null, 2));
  console.log('[Dashboard] weekly shape:',   JSON.stringify(weeklyRaw,  null, 2));
  console.log('[Dashboard] profile shape:',  JSON.stringify(profile,    null, 2));

  const chartData = buildChartData(weeklyArr);

  const displayName = pick(profile, ['full_name', 'name', 'first_name'], 'User');
  const firstName   = String(displayName).split(' ')[0];
  const initials    = firstName.slice(0, 2).toUpperCase();

  const fitnessDataForCoach = {
    goal:            pick(profile, ['goal'], 'general_fitness'),
    weight:          currentWeight,
    height:          pick(profile, ['height_cm'], 170),
    age:             pick(profile, ['age'], 25),
    gender:          profile?.gender ?? 'unknown',
    activity:        pick(profile, ['activity_level'], 'moderately_active'),
    diet_type:       pick(profile, ['diet_type'], 'non_veg'),
    calories:        calIntake,
    target_calories: calTarget,
    calories_burned: caloriesBurned,
    protein:         proteinConsumed,
    protein_goal:    proteinGoal,
    carbs:           carbsConsumed,
    carbs_goal:      pick(nutrition, [
      'macros.carbs.target', 'carbs_target', 'carbs_goal',
      'carbs_g_goal', 'macros.carbs.goal'
    ], 250),
    fats:            fatsConsumed,
    fats_goal:       fatsGoal,
    workout:         pick(workout, [
      'today.duration_minutes', 'duration_minutes', 'workout_minutes',
      'minutes_today', 'today.minutes', 'total_minutes'
    ], 0),
    workout_goal:    pick(workout, ['goal_minutes', 'target_minutes', 'weekly_goal'], 45),
    water:           waterConsumed,
    water_goal:      waterTarget,
    sleep:           pick(profile, ['sleep_hours', 'sleep_goal_hours'], 8),
    energy:          pick(profile, ['energy_level', 'energy'], 7),
    streak:          currentStreak,
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  try {
    return (
      <div className={styles.wrapper}>
        <Navbar />

        <main className={styles.mainContainer}>

          {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
          <section className={styles.leftCol}>

            <div className={styles.headerRow}>
              <h1 className={styles.pageTitle}>My Activities</h1>
              <div className={styles.datePickerWrap}>
                {currentDate}
                <Calendar size={14} />
              </div>
            </div>

            {/* 4 KPI Cards */}
            <div className={styles.kpiGrid}>

              <div className={`${styles.kpiCard} ${styles.bgBlue}`}>
                <div className={styles.kpiHeader}><Heart size={16}/> Workout Streak</div>
                <div className={styles.kpiValueArea}>
                  <div className={styles.kpiValue}>{currentStreak} <span className={styles.kpiUnit}>days</span></div>
                  <div className={styles.kpiSub}>Level {streakLevel}</div>
                </div>
                <svg className={styles.waveBg} viewBox="0 0 1440 320" preserveAspectRatio="none">
                  <path fill="#fff" fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"/>
                </svg>
              </div>

              <div className={`${styles.kpiCard} ${styles.bgPink}`}>
                <div className={styles.kpiHeader}><Flame size={16}/> Active Burn</div>
                <div className={styles.kpiValueArea}>
                  <div className={styles.kpiValue}>{caloriesBurned} <span className={styles.kpiUnit}>kcal</span></div>
                  <div className={styles.kpiSub}>Estimated Burn</div>
                </div>
                <svg className={styles.waveBg} viewBox="0 0 1440 320" preserveAspectRatio="none">
                  <path fill="#fff" fillOpacity="1" d="M0,192L60,181.3C120,171,240,149,360,165.3C480,181,600,235,720,240C840,245,960,203,1080,186.7C1200,171,1320,181,1380,186.7L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"/>
                </svg>
              </div>

              <div className={`${styles.kpiCard} ${styles.bgOrange}`}>
                <div className={styles.kpiHeader}><Footprints size={16}/> Calories Intake</div>
                <div className={styles.kpiValueArea}>
                  <div className={styles.kpiValue}>{calIntake} <span className={styles.kpiUnit}>kcal</span></div>
                  <div className={styles.kpiSub}>{calTarget} kcal Goal</div>
                </div>
                <svg className={styles.waveBg} viewBox="0 0 1440 320" preserveAspectRatio="none">
                  <path fill="#fff" fillOpacity="1" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"/>
                </svg>
              </div>

              <div className={`${styles.kpiCard} ${styles.bgCyan}`}>
                <div className={styles.kpiHeader}><Droplets size={16}/> Hydration</div>
                <div className={styles.kpiValueArea}>
                  <div className={styles.kpiValue}>{waterConsumed} <span className={styles.kpiUnit}>L</span></div>
                  <div className={styles.kpiSub}>{waterTarget} L Goal</div>
                </div>
                <svg className={styles.waveBg} viewBox="0 0 1440 320" preserveAspectRatio="none">
                  <path fill="#fff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,117.3C960,139,1056,181,1152,192C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"/>
                </svg>
              </div>

            </div>

            {/* ── Quick Actions ─────────────────────────────────────────── */}
            <div className={styles.quickActionsSection}>
              <h2 className={styles.quickActionsTitle}>Quick Actions</h2>
              <div className={styles.quickActionsGrid}>

                <button className={`${styles.qaCard} ${styles.qaWorkout}`} onClick={() => navigate('/workout')}>
                  <div className={styles.qaIconWrap}><Dumbbell size={22}/></div>
                  <div className={styles.qaText}>
                    <span className={styles.qaLabel}>Continue Workout</span>
                    <span className={styles.qaSub}>Pick up where you left off</span>
                  </div>
                </button>

                <button className={`${styles.qaCard} ${styles.qaMeal}`} onClick={() => navigate('/log-meal')}>
                  <div className={styles.qaIconWrap}><Utensils size={22}/></div>
                  <div className={styles.qaText}>
                    <span className={styles.qaLabel}>Log Your Meals</span>
                    <span className={styles.qaSub}>Track today's nutrition</span>
                  </div>
                </button>

                <button className={`${styles.qaCard} ${styles.qaPlanner}`} onClick={() => navigate('/meal-plan')}>
                  <div className={styles.qaIconWrap}><ChefHat size={22}/></div>
                  <div className={styles.qaText}>
                    <span className={styles.qaLabel}>Meal Planner</span>
                    <span className={styles.qaSub}>Plan your weekly meals</span>
                  </div>
                </button>

                <button className={`${styles.qaCard} ${styles.qaProgress}`} onClick={() => navigate('/progress')}>
                  <div className={styles.qaIconWrap}><TrendingUp size={22}/></div>
                  <div className={styles.qaText}>
                    <span className={styles.qaLabel}>Track Progress</span>
                    <span className={styles.qaSub}>Log vitals & weight</span>
                  </div>
                </button>

              </div>
            </div>

            {/* Activity Statistics Chart */}
            <div className={styles.chartSection}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>Activity Statistics</h2>
                <select className={styles.chartSelect}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className={styles.chartLegend}>
                <div className={styles.legendItem}><div className={styles.legendDot} style={{background:'#00C8E0'}}/> Calories</div>
                <div className={styles.legendItem}><div className={styles.legendDot} style={{background:'#FF2E93'}}/> Workout (min)</div>
              </div>

              {chartData.every(d => d.calories === 0 && d.workout === 0) ? (
                <div className={styles.chartEmpty}>
                  <Activity size={32} opacity={0.3}/>
                  <p>No activity data yet — start logging workouts and meals!</p>
                </div>
              ) : (
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorDiet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#00C8E0" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#00C8E0" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorWorkout" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#FF2E93" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#FF2E93" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#888', fontSize:12}} dy={10}/>
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'#888', fontSize:12}}/>
                      <Tooltip
                        contentStyle={{borderRadius:'12px', background:'#10121b', border:'1px solid rgba(255,255,255,0.1)', color:'#fff'}}
                        itemStyle={{color:'#fff'}}
                      />
                      <Area type="monotone" dataKey="calories" stroke="#00C8E0" strokeWidth={3} fillOpacity={1} fill="url(#colorDiet)"/>
                      <Area type="monotone" dataKey="workout"  stroke="#FF2E93" strokeWidth={3} fillOpacity={1} fill="url(#colorWorkout)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Performance Milestones */}
            <div className={styles.milestonesSection}>
              <div className={styles.milestonesHeader}>
                <h2 className={styles.milestonesTitle}>Performance Milestones</h2>
                <Link to="/progress" className={styles.viewAllLink}>View All <TrendingUp size={14}/></Link>
              </div>
              <div className={styles.milestonesGrid}>
                <div className={styles.milestoneCard}>
                  <div className={styles.milestoneIcon} style={{background:'rgba(204,255,0,0.1)',color:'var(--lime)'}}><Target size={20}/></div>
                  <div className={styles.milestoneInfo}>
                    <div className={styles.milestoneLabel}>Weight Goal</div>
                    <div className={styles.milestoneTarget}>
                      Target: {pick(profile, ['target_weight', 'goal_weight'], 65)} kg
                    </div>
                  </div>
                  <div className={styles.milestoneProgress}>
                    <div className={styles.progressText}>85%</div>
                    <div className={styles.progressBar}><div className={styles.progressFill} style={{width:'85%',background:'var(--lime)'}}/></div>
                  </div>
                </div>
                <div className={styles.milestoneCard}>
                  <div className={styles.milestoneIcon} style={{background:'rgba(0,200,224,0.1)',color:'#00C8E0'}}><Zap size={20}/></div>
                  <div className={styles.milestoneInfo}>
                    <div className={styles.milestoneLabel}>Weekly Consistency</div>
                    <div className={styles.milestoneTarget}>
                      {pick(streak, ['weekly_workouts', 'workouts_this_week'], 0)} / 7 Days Active
                    </div>
                  </div>
                  <div className={styles.milestoneProgress}>
                    <div className={styles.progressText}>
                      {pct(pick(streak, ['weekly_workouts', 'workouts_this_week'], 0), 7)}%
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{
                        width: `${pct(pick(streak, ['weekly_workouts','workouts_this_week'], 0), 7)}%`,
                        background: '#00C8E0'
                      }}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* ── RIGHT COLUMN (SIDEBAR) ───────────────────────────────────── */}
          <aside className={styles.rightCol}>

            <div className={styles.profileSidebarCard}>
              <div className={styles.sidebarAvatarWrap}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="Profile" className={styles.sidebarAvatarImg}/>
                  : initials}
              </div>
              <h3 className={styles.sidebarName}>{pick(profile, ['full_name','name'], 'User')}</h3>
              <div className={styles.sidebarSubName}>
                {pick(profile, ['age'], 25)} Years, {pick(profile, ['gender'], 'Unknown')}
              </div>

              <div className={styles.sidebarMetricsGrid}>
                <div className={styles.sidebarMetric}>
                  <span className={styles.sidebarMetricLabel}>Weight</span>
                  <span className={styles.sidebarMetricValue}>{currentWeight} kg</span>
                </div>
                <div className={styles.sidebarMetric}>
                  <span className={styles.sidebarMetricLabel}>Height</span>
                  <span className={styles.sidebarMetricValue}>{pick(profile, ['height_cm'], 165)} cm</span>
                </div>
                <div className={styles.sidebarMetric}>
                  <span className={styles.sidebarMetricLabel}>Goal</span>
                  <span className={styles.sidebarMetricValue} style={{textTransform:'capitalize'}}>
                    {pick(profile, ['goal'], 'fit').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.journalsSection}>
              <div className={styles.journalsHeader}>
                <h2 className={styles.journalsTitle}>Journals</h2>
                <div className={styles.microDate}>{currentDate} <Calendar size={12}/></div>
              </div>

              <div className={styles.journalList}>
                {meals.length === 0 ? (
                  <div className={styles.journalCard} style={{textAlign:'center', opacity:0.6}}>
                    No meal entries today.
                  </div>
                ) : (
                  meals.map((meal, idx) => {

                    if (idx === 0) console.log('[Dashboard] meal[0] raw:', JSON.stringify(meal, null, 2));

                    const mealKcal =
                      meal.total_kcal ??
                      meal.calories_consumed ??
                      meal.calories ??
                      meal.kcal ??
                      meal.total_calories ??
                      meal.calorie_count ??
                      meal.energy_kcal ??
                      meal.caloric_value ??
                      (Array.isArray(meal.foods) && meal.foods.length > 0
                        ? meal.foods.reduce((sum, f) =>
                            sum + (f.calories ?? f.kcal ?? f.total_kcal ?? f.calorie_count ?? 0), 0)
                        : null) ??
                      0;

                    const mealTypeLabel = (
                      meal.meal_type || meal.type || 'Meal'
                    ).replace(/_/g, ' ').toUpperCase();

                    const mealTime =
                      meal.time ??
                      meal.consumed_at?.split('T')[1]?.slice(0, 5) ??
                      meal.logged_at?.split('T')[1]?.slice(0, 5) ??
                      '—';

                    const mealDesc =
                      (Array.isArray(meal.foods) && meal.foods.length > 0
                        ? meal.foods.map(f => f.name).join(', ')
                        : null) ??
                      meal.meal_name ??
                      meal.name ??
                      'No foods listed';

                    return (
                      <div key={idx} className={styles.journalCard}>
                        <div className={styles.journalRow}>
                          <span className={styles.journalName}>{mealTypeLabel}</span>
                          <span className={styles.journalTime}>
                            <Clock size={10} style={{marginRight:'2px'}}/>
                            {mealTime}
                          </span>
                        </div>
                        <div className={styles.journalMeta}>
                          <span>{mealDesc}</span>
                          <span className={styles.journalHighlight}>
                            {mealKcal} kcal
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <AiCoach fitnessData={fitnessDataForCoach} isInline={true}/>

          </aside>

        </main>
      </div>
    );
  } catch (err) {
    console.error('Dashboard Render Error:', err);
    return (
      <div className={styles.wrapper} style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'}}>
        <div>
          <h1 style={{color:'#FF5C1A'}}>⚠️ Dashboard Rendering Error</h1>
          <p style={{opacity:0.7}}>Something went wrong. Please try refreshing.</p>
          <pre style={{background:'rgba(255,255,255,0.05)',padding:'1rem',borderRadius:'8px',fontSize:'12px',marginTop:'1rem',textAlign:'left',maxWidth:'600px',overflowX:'auto'}}>
            {err.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{marginTop:'2rem',background:'#CCFF00',color:'#000',border:'none',padding:'10px 20px',borderRadius:'8px',fontWeight:'bold',cursor:'pointer'}}>
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}