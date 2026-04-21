import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import { createProfile, checkProfile } from '../../../services/profileService';
import { 
  Activity, 
  Heart, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Loader2, 
  User, 
  Target, 
  Activity as ActivityIcon,
  Flame,
  Award
} from 'lucide-react';
import styles from './Onboarding.module.css';

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
    weight: '',
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
        // Fall through
      }
      if (!cancelled) setIsChecking(false);
    })();

    return () => { cancelled = true; };
  }, []);

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
        const next = withoutNone.filter(v => v !== value);
        return { ...prev, [name]: next.length === 0 ? [] : next };
      }
      return { ...prev, [name]: [...withoutNone, value] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentPart < totalParts) {
      setCurrentPart(prev => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      // Map UI diet labels → DB CHECK constraint values ('veg','non_veg','eggetarian')
      const dietMap = {
        'vegetarian':     'veg',
        'non-vegetarian': 'non_veg',
        'vegan':          'veg',
        'eggetarian':     'eggetarian',
      };

      const profileData = {
        age:            parseInt(formData.age, 10),
        gender:         formData.gender,
        height_cm:      parseFloat(formData.height),
        weight_kg:      parseFloat(formData.weight),
        activity_level: formData.activityLevel,
        goal:           formData.goal,
        diet_type:      dietMap[formData.diet] ?? 'veg',
        medical_conditions: {
          high_blood_pressure: formData.conditions.includes('hypertension'),
          diabetes:            formData.conditions.includes('diabetes'),
          thyroid:             formData.conditions.includes('hypothyroidism'),
          injuries:            false,
        },
      };

      await createProfile(profileData);

      if (typeof updateUserProfile === 'function') {
        updateUserProfile({ hasCompletedOnboarding: true });
      } else if (typeof setUser === 'function') {
        setUser({ ...user, hasCompletedOnboarding: true });
      }

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);

    } catch (err) {
      console.error('Onboarding submission error:', err);
      // Try to surface the actual server message
      if (err?.response) {
        err.response.json()
          .then(body => console.error('Server error body:', body))
          .catch(() => {});
      }
      alert(err.message || 'Something went wrong. Please check your data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className={styles.checkingScreen}>
        <Loader2 className={styles.checkingSpinner} size={32} />
        <p className={styles.checkingText}>Initializing your experience...</p>
      </div>
    );
  }

  const steps = [
    { title: 'Personal Info', desc: 'Basics to start' },
    { title: 'Fitness Goals', desc: 'Your target' },
    { title: 'Final Sync', desc: 'Health & diet' },
  ];

  const heroContent = [
    { title: <>Start your<span>New Chapter.</span></>, desc: "To build the most effective plan for you, we need to know the basics. Your data remains completely private." },
    { title: <>Define your<span>Ambition.</span></>, desc: "Knowing your primary goal helps us tailor the specific intensity and volume of your training cycles." },
    { title: <>Finalizing your<span>Vision.</span></>, desc: "Your health conditions and diet play a critical role in how we calculate your nutrition targets." },
  ];

  return (
    <div className={styles.page}>
      <video autoPlay loop muted playsInline className={styles.bgVideo} src="/videos/auth_bg.mp4" />
      <div className={styles.ambientOrb1} />
      <div className={styles.ambientOrb2} />

      <div className={styles.pageInner}>
        {/* LEFT COLUMN: HERO & STEPS */}
        <div className={styles.heroCol}>
          <div className={styles.heroTag}>Setup Phase</div>
          <h1 className={styles.heroTitle}>
            {heroContent[currentPart - 1].title}
          </h1>
          <p className={styles.heroDesc}>
            {heroContent[currentPart - 1].desc}
          </p>

          <div className={styles.stepsList}>
            {steps.map((s, i) => (
              <div
                key={i}
                className={`${styles.stepItem} ${
                  currentPart === i + 1
                    ? styles.stepActive
                    : currentPart > i + 1
                      ? styles.stepComplete
                      : ''
                }`}
              >
                <div className={styles.stepBadge}>
                  {currentPart > i + 1 ? <Check size={14} /> : i + 1}
                </div>
                <div>
                  <div className={styles.stepLabel}>{s.title}</div>
                  <div className={styles.radioDesc}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: FORM CARD */}
        <main className={styles.main}>
          <div className={styles.card}>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(currentPart / totalParts) * 100}%` }}
                />
              </div>
              <div className={styles.progressText}>Step {currentPart} of {totalParts}</div>
            </div>

            <form onSubmit={handleSubmit} className={styles.formSection}>
              {currentPart === 1 && (
                <PartOne
                  formData={formData}
                  onChange={handleInputChange}
                  onRadioChange={handleRadioChange}
                />
              )}
              {currentPart === 2 && (
                <PartTwo
                  formData={formData}
                  onRadioChange={handleRadioChange}
                />
              )}
              {currentPart === 3 && (
                <PartThree
                  formData={formData}
                  onRadioChange={handleRadioChange}
                  onCheckboxChange={handleCheckboxChange}
                />
              )}

              <div className={styles.buttonGroup}>
                {currentPart > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentPart(prev => prev - 1)}
                    className={styles.buttonSecondary}
                    disabled={isSubmitting}
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.buttonPrimary}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? <Loader2 className={styles.loadingSpinner} />
                    : currentPart === totalParts ? 'Finish Setup' : 'Next Step'
                  }
                  {!isSubmitting && <ChevronRight size={18} />}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

// ── Step 1: Personal Info ────────────────────────────────────────────────────
const PartOne = ({ formData, onChange, onRadioChange }) => (
  <div className={styles.formSection}>
    <div className={styles.formGroup}>
      <label className={styles.label}>Biological Age</label>
      <input
        type="number"
        name="age"
        value={formData.age}
        onChange={onChange}
        placeholder="e.g. 24"
        className={styles.input}
        required
      />
    </div>

    <div className={styles.formGroup}>
      <label className={styles.label}>Biological Gender</label>
      <div className={styles.radioGrid}>
        {['male', 'female', 'other'].map(g => (
          <div
            key={g}
            className={`${styles.radioCard} ${formData.gender === g ? styles.selected : ''}`}
            onClick={() => onRadioChange('gender', g)}
          >
            <div className={styles.radioIndicator} />
            <span className={styles.radioTitle}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>

    <div className={styles.formGroup}>
      <label className={styles.label}>Physical Height (cm)</label>
      <input
        type="number"
        name="height"
        value={formData.height}
        onChange={onChange}
        placeholder="e.g. 175"
        className={styles.input}
        required
      />
    </div>

    <div className={styles.formGroup}>
      <label className={styles.label}>Current Weight (kg)</label>
      <input
        type="number"
        name="weight"
        value={formData.weight}
        onChange={onChange}
        placeholder="e.g. 70"
        className={styles.input}
        required
      />
    </div>
  </div>
);

// ── Step 2: Fitness Goals ────────────────────────────────────────────────────
const PartTwo = ({ formData, onRadioChange }) => (
  <div className={styles.formSection}>
    <div className={styles.formGroup}>
      <label className={styles.label}>Activity Intensity</label>
      <div className={styles.radioGrid} style={{ gridTemplateColumns: '1fr' }}>
        {[
          { v: 'sedentary',        t: 'Sedentary',         d: 'Office worker, little to no exercise' },
          { v: 'lightly_active',   t: 'Lightly Active',    d: 'Light exercise 1–3 days/week' },
          { v: 'moderately_active',t: 'Moderately Active', d: 'Moderate exercise 3–5 days/week' },
          { v: 'very_active',      t: 'Very Active',       d: 'Hard exercise 6–7 days/week' },
        ].map(item => (
          <div
            key={item.v}
            className={`${styles.radioCard} ${formData.activityLevel === item.v ? styles.selected : ''}`}
            onClick={() => onRadioChange('activityLevel', item.v)}
          >
            <div className={styles.radioIndicator} />
            <div className={styles.radioContent}>
              <div className={styles.radioTitle}>{item.t}</div>
              <div className={styles.radioDesc}>{item.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className={styles.formGroup}>
      <label className={styles.label}>Primary Fitness Goal</label>
      <div className={styles.radioGrid} style={{ gridTemplateColumns: '1fr' }}>
        {[
          { v: 'weight_loss',  t: 'Weight Loss',  d: 'Fat burn and calorie deficit' },
          { v: 'muscle_gain',  t: 'Muscle Gain',  d: 'Hypertrophy and mass building' },
          { v: 'maintenance',  t: 'Maintenance',  d: 'Stay at current weight and tone' },
        ].map(item => (
          <div
            key={item.v}
            className={`${styles.radioCard} ${formData.goal === item.v ? styles.selected : ''}`}
            onClick={() => onRadioChange('goal', item.v)}
          >
            <div className={styles.radioIndicator} />
            <div className={styles.radioContent}>
              <div className={styles.radioTitle}>{item.t}</div>
              <div className={styles.radioDesc}>{item.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Step 3: Health & Diet ────────────────────────────────────────────────────
const PartThree = ({ formData, onRadioChange, onCheckboxChange }) => (
  <div className={styles.formSection}>
    <div className={styles.formGroup}>
      <label className={styles.label}>Dietary Preference</label>
      <div className={styles.checkboxGrid}>
        {[
          { v: 'vegetarian',     t: 'Vegetarian' },
          { v: 'non-vegetarian', t: 'Non-Vegetarian' },
          { v: 'vegan',          t: 'Vegan' },
          { v: 'eggetarian',     t: 'Eggetarian' },
        ].map(d => (
          <div
            key={d.v}
            className={`${styles.checkboxCard} ${formData.diet === d.v ? styles.selected : ''}`}
            onClick={() => onRadioChange('diet', d.v)}
          >
            <div className={styles.checkboxIndicator} />
            <span className={styles.checkboxTitle}>{d.t}</span>
          </div>
        ))}
      </div>
    </div>

    <div className={styles.formGroup}>
      <label className={styles.label}>Health Conditions (Optional)</label>
      <div className={styles.checkboxGrid}>
        {[
          { v: 'diabetes',       t: 'Diabetes' },
          { v: 'hypertension',   t: 'Hypertension' },
          { v: 'hypothyroidism', t: 'Hypothyroid' },
          { v: 'none',           t: 'No Conditions' },
        ].map(c => (
          <div
            key={c.v}
            className={`${styles.checkboxCard} ${formData.conditions.includes(c.v) ? styles.selected : ''}`}
            onClick={() => onCheckboxChange('conditions', c.v)}
          >
            <div className={styles.checkboxIndicator} />
            <span className={styles.checkboxTitle}>{c.t}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Onboarding;