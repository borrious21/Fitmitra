import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import { createProfile, checkProfile } from '../../../services/profileService';
import { Activity, Heart, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import styles from './Onboarding.module.css';
import ThemeToggle from '../../../components/ThemeToggle/ThemeToggle';

const normalizeUser = (rawUser) => {
  if (!rawUser) return rawUser;
  return {
    ...rawUser,
    hasCompletedOnboarding:
      rawUser.hasCompletedOnboarding ??
      rawUser.has_completed_onboarding ??
      false,
  };
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, token, updateUserProfile, setUser } = useContext(AuthContext);
  const [currentPart, setCurrentPart] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    heightUnit: 'cm',
    weight: '',
    weightUnit: 'kg',
    activityLevel: '',
    conditions: [],
    goal: '',
    diet: 'vegetarian',
  });

  const totalParts = 3;

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true });
      return;
    }

    const normalized = normalizeUser(user);

    if (normalized.hasCompletedOnboarding) {
      navigate('/dashboard', { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await checkProfile();
        if (cancelled) return;
        const exists = data?.exists ?? false;

        if (exists) {
          const updatedUser = { ...normalized, hasCompletedOnboarding: true };
          if (typeof setUser === 'function') {
            setUser(updatedUser);
          } else if (typeof updateUserProfile === 'function') {
            updateUserProfile({ hasCompletedOnboarding: true });
          }
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch {
        // Network error or 404 — fall through and show form
      }
      if (!cancelled) setIsChecking(false);
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPart]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, value) => {
    setFormData(prev => {
      const current = prev[name] || [];
      if (value === 'none' && !current.includes(value)) {
        return { ...prev, [name]: ['none'] };
      }
      const withoutNone = current.filter(v => v !== 'none');
      if (current.includes(value)) {
        return { ...prev, [name]: withoutNone.filter(v => v !== value) };
      }
      return { ...prev, [name]: [...withoutNone, value] };
    });
  };

  const validatePart = (part) => {
    switch (part) {
      case 1:
        return formData.age && formData.gender &&
               formData.height && formData.weight && formData.activityLevel;
      case 2:
        return formData.goal && formData.diet;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validatePart(currentPart)) {
      if (currentPart < totalParts) setCurrentPart(prev => prev + 1);
      else handleSubmit();
    } else {
      alert('Please fill in all required fields before continuing.');
    }
  };

  const handlePrev = () => {
    if (currentPart > 1) setCurrentPart(prev => prev - 1);
  };

  const convertToProfileFormat = () => {
    let heightCm = parseFloat(formData.height);
    if (formData.heightUnit === 'ft') heightCm = heightCm * 30.48;

    let weightKg = parseFloat(formData.weight);
    if (formData.weightUnit === 'lbs') weightKg = weightKg * 0.453592;

    const activityMap = {
      sedentary: 'sedentary',
      light:     'lightly_active',
      moderate:  'moderately_active',
      very:      'very_active',
      athlete:   'very_active',
    };

    const goalMap = {
      fatLoss:    'weight_loss',
      muscleGain: 'muscle_gain',
      maintain:   'maintain_fitness',
      endurance:  'endurance',
    };

    const dietMap = {
      vegetarian:  'veg',
      vegan:       'veg',
      nonVeg:      'non_veg',
      eggetarian:  'eggetarian',
    };

    return {
      age:            parseInt(formData.age),
      gender:         formData.gender.toLowerCase(),
      height_cm:      Math.round(heightCm),
      weight_kg:      parseFloat(weightKg.toFixed(1)),
      activity_level: activityMap[formData.activityLevel] || 'sedentary',
      goal:           goalMap[formData.goal] || 'maintain_fitness',
      diet_type:      dietMap[formData.diet] || 'veg',
      medical_conditions: {
        diabetes:            formData.conditions.includes('diabetes'),
        high_blood_pressure: formData.conditions.includes('highBP'),
        pcod:                false,
        thyroid:             false,
        injuries:            formData.conditions.includes('injuries'),
      },
    };
  };

  const syncUserAsOnboarded = () => {
    const updatedUser = { ...normalizeUser(user), hasCompletedOnboarding: true };
    if (typeof setUser === 'function') {
      setUser(updatedUser);
    } else if (typeof updateUserProfile === 'function') {
      updateUserProfile({ hasCompletedOnboarding: true });
    }
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({
          ...parsed,
          hasCompletedOnboarding:     true,
          has_completed_onboarding:   true,
        }));
      }
    } catch { /* ignore */ }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!token) {
        alert('Your session has expired. Please log in again.');
        navigate('/login', { replace: true });
        return;
      }

      await createProfile(convertToProfileFormat());
      syncUserAsOnboarded();
      navigate('/dashboard', { replace: true });

    } catch (error) {
      const status = error?.status ?? error?.response?.status;

      if (status === 409) {
        syncUserAsOnboarded();
        navigate('/dashboard', { replace: true });
        return;
      }

      if (status === 401) {
        alert('Your session has expired. Please log in again.');
        navigate('/login', { replace: true });
      } else {
        const msg = error?.message || error?.response?.data?.message || 'Unknown error';
        alert(`Failed to complete onboarding: ${msg}. Please try again.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className={styles.container}>
        <div className={styles.checkingScreen}>
          <Activity className={styles.checkingSpinner} />
          <p className={styles.checkingText}>Setting up your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <div className={styles.imageOverlay}></div>
        <div className={styles.leftContent}>
          <div className={styles.brandLogo}>
            <Activity className={styles.brandIcon} />
            <span className={styles.brandName}>FitMitra</span>
          </div>
          <h2 className={styles.leftTitle}>
            Personalize Your{' '}
            <span className={styles.leftTitleAccent}>Journey</span>
          </h2>
          <p className={styles.leftDescription}>
            We'll create a custom fitness plan based on your unique profile, goals, and lifestyle.
          </p>

          <div className={styles.stepsList}>
            {[
              { num: 1, title: 'Your Profile',      desc: 'Basic information & physical stats' },
              { num: 2, title: 'Goals & Nutrition',  desc: 'Fitness goals & dietary preferences' },
              { num: 3, title: 'Health & Lifestyle', desc: 'Health conditions (optional)' },
            ].map(({ num, title, desc }) => (
              <div key={num} className={[
                styles.stepItem,
                currentPart >= num ? styles.stepActive   : '',
                currentPart >  num ? styles.stepComplete : '',
              ].join(' ')}>
                <div className={styles.stepNumber}>
                  {currentPart > num ? <Check className={styles.checkIcon} /> : num}
                </div>
                <div className={styles.stepInfo}>
                  <div className={styles.stepTitle}>{title}</div>
                  <div className={styles.stepDesc}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className={styles.rightPanel}>

        {/* ✅ ThemeToggle in the correct place */}
        <div className={styles.themeToggleWrap}>
          <ThemeToggle />
        </div>

        <div className={styles.wrapper}>
          <div className={styles.card}>

            <div className={styles.header}>
              <div className={styles.logoWrapper}>
                <Activity className={styles.logoIcon} />
                <Heart className={styles.logoIconSecondary} />
              </div>
              <h1 className={styles.title}>
                {currentPart === 1 && "Let's Get to Know You"}
                {currentPart === 2 && 'Your Fitness Goals'}
                {currentPart === 3 && 'Health & Wellness'}
              </h1>
              <p className={styles.subtitle}>Part {currentPart} of {totalParts}</p>
            </div>

            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(currentPart / totalParts) * 100}%` }}
                />
              </div>
              <p className={styles.progressText}>
                {Math.round((currentPart / totalParts) * 100)}% Complete
              </p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className={styles.form}>

              {/* ── Part 1: Physical Stats ──────────────────────────────── */}
              {currentPart === 1 && (
                <div className={styles.formSection}>
                  <div className={styles.twoCol}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Age<span className={styles.required}>*</span></label>
                      <input
                        type="number" className={styles.input} name="age"
                        value={formData.age} onChange={handleInputChange}
                        min="13" max="80" placeholder="Your age (13–80)" required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Gender<span className={styles.required}>*</span></label>
                      <select className={styles.input} name="gender" value={formData.gender} onChange={handleInputChange} required>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.twoCol}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Height<span className={styles.required}>*</span></label>
                      <div className={styles.inputGroup}>
                        <input
                          type="number" className={styles.inputWithUnit} name="height"
                          value={formData.height} onChange={handleInputChange}
                          min="1" step="0.1" placeholder="Height" required
                        />
                        <select className={styles.unitSelector} name="heightUnit" value={formData.heightUnit} onChange={handleInputChange}>
                          <option value="cm">cm</option>
                          <option value="ft">ft</option>
                        </select>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Weight<span className={styles.required}>*</span></label>
                      <div className={styles.inputGroup}>
                        <input
                          type="number" className={styles.inputWithUnit} name="weight"
                          value={formData.weight} onChange={handleInputChange}
                          min="1" step="0.1" placeholder="Weight" required
                        />
                        <select className={styles.unitSelector} name="weightUnit" value={formData.weightUnit} onChange={handleInputChange}>
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Activity Level<span className={styles.required}>*</span></label>
                    <div className={styles.radioGrid}>
                      {[
                        { value: 'sedentary', title: 'Sedentary',   desc: 'Little or no exercise' },
                        { value: 'light',     title: 'Light',       desc: '1–3 days/week' },
                        { value: 'moderate',  title: 'Moderate',    desc: '3–5 days/week' },
                        { value: 'very',      title: 'Very Active', desc: '6–7 days/week' },
                      ].map(a => (
                        <label
                          key={a.value}
                          className={`${styles.radioCard} ${formData.activityLevel === a.value ? styles.selected : ''}`}
                        >
                          <input
                            type="radio" name="activityLevel" value={a.value}
                            checked={formData.activityLevel === a.value}
                            onChange={() => handleRadioChange('activityLevel', a.value)}
                            className={styles.radioInput}
                          />
                          <div className={styles.radioIndicator} />
                          <div className={styles.radioContent}>
                            <div className={styles.radioTitle}>{a.title}</div>
                            <div className={styles.radioDesc}>{a.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Part 2: Goals & Diet ────────────────────────────────── */}
              {currentPart === 2 && (
                <div className={styles.formSection}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Primary Fitness Goal<span className={styles.required}>*</span></label>
                    <div className={styles.radioGrid}>
                      {[
                        { value: 'fatLoss',    title: 'Weight Loss',      desc: 'Reduce body fat percentage' },
                        { value: 'muscleGain', title: 'Muscle Gain',      desc: 'Build lean muscle mass' },
                        { value: 'maintain',   title: 'Maintain Fitness', desc: 'Stay healthy and fit' },
                        { value: 'endurance',  title: 'Endurance',        desc: 'Improve stamina' },
                      ].map(g => (
                        <label
                          key={g.value}
                          className={`${styles.radioCard} ${formData.goal === g.value ? styles.selected : ''}`}
                        >
                          <input
                            type="radio" name="goal" value={g.value}
                            checked={formData.goal === g.value}
                            onChange={() => handleRadioChange('goal', g.value)}
                            className={styles.radioInput}
                          />
                          <div className={styles.radioIndicator} />
                          <div className={styles.radioContent}>
                            <div className={styles.radioTitle}>{g.title}</div>
                            <div className={styles.radioDesc}>{g.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Dietary Preference<span className={styles.required}>*</span></label>
                    <div className={styles.radioGrid}>
                      {[
                        { value: 'vegetarian', title: 'Vegetarian',     desc: 'No meat or fish' },
                        { value: 'nonVeg',     title: 'Non-Vegetarian', desc: 'Includes meat & fish' },
                        { value: 'eggetarian', title: 'Eggetarian',     desc: 'Eggs but no meat' },
                      ].map(d => (
                        <label
                          key={d.value}
                          className={`${styles.radioCard} ${formData.diet === d.value ? styles.selected : ''}`}
                        >
                          <input
                            type="radio" name="diet" value={d.value}
                            checked={formData.diet === d.value}
                            onChange={() => handleRadioChange('diet', d.value)}
                            className={styles.radioInput}
                          />
                          <div className={styles.radioIndicator} />
                          <div className={styles.radioContent}>
                            <div className={styles.radioTitle}>{d.title}</div>
                            <div className={styles.radioDesc}>{d.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Part 3: Health Conditions ───────────────────────────── */}
              {currentPart === 3 && (
                <div className={styles.formSection}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Health Conditions (Optional)</label>
                    <div className={styles.checkboxGrid}>
                      {[
                        { value: 'highBP',   title: 'High Blood Pressure' },
                        { value: 'diabetes', title: 'Diabetes' },
                        { value: 'injuries', title: 'Injuries' },
                        { value: 'none',     title: 'None' },
                      ].map(c => (
                        <label
                          key={c.value}
                          className={`${styles.checkboxCard} ${formData.conditions.includes(c.value) ? styles.selected : ''}`}
                        >
                          <input
                            type="checkbox" name="conditions" value={c.value}
                            checked={formData.conditions.includes(c.value)}
                            onChange={() => handleCheckboxChange('conditions', c.value)}
                            className={styles.checkboxInput}
                          />
                          <div className={styles.checkboxIndicator} />
                          <div className={styles.checkboxContent}>
                            <div className={styles.checkboxTitle}>{c.title}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.infoBox}>
                    <span className={styles.infoBoxDot} />
                    <p className={styles.infoText}>
                      Click "Create My Profile" to generate your personalized fitness plan!
                    </p>
                  </div>
                </div>
              )}

              {/* ── Navigation Buttons ──────────────────────────────────── */}
              <div className={styles.buttonGroup}>
                {currentPart > 1 && (
                  <button
                    type="button" className={styles.buttonSecondary}
                    onClick={handlePrev} disabled={isSubmitting}
                  >
                    <ChevronLeft className={styles.buttonIcon} />
                    Previous
                  </button>
                )}
                <button
                  type="button" className={styles.buttonPrimary}
                  onClick={handleNext} disabled={isSubmitting}
                  style={currentPart === 1 ? { marginLeft: 'auto' } : {}}
                >
                  {isSubmitting ? (
                    <><Activity className={styles.loadingSpinner} /> Creating Profile...</>
                  ) : currentPart === totalParts ? (
                    <><Check className={styles.buttonIcon} /> Create My Profile</>
                  ) : (
                    <>Continue <ChevronRight className={styles.buttonIcon} /></>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;