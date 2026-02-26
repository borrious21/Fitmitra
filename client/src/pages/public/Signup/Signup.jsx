import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { Eye, EyeOff, Loader2, AlertCircle, Activity, Heart } from "lucide-react";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";
import styles from "./Signup.module.css";

const Signup = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors]       = useState({});
  const [passwordStrength, setPasswordStrength]       = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") calculatePasswordStrength(value);
    if (validationErrors[name]) setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    if (error) clearError();
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8)  strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password))   strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const getStrengthClass = () => {
    if (passwordStrength <= 1) return styles.weak;
    if (passwordStrength <= 3) return styles.medium;
    return styles.strong;
  };

  const getStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const result = await signup(formData.name, formData.email, formData.password);
      navigate("/verify-email", {
        state: {
          email: formData.email,
          message: result.message || "Account created. Please verify your email.",
        },
      });
    } catch (err) {
      console.error("Signup error:", err);
    }
  };

  return (
    <div className={styles.container}>

      {/* ── LEFT PANEL ──────────────────────────────────────── */}
      <div className={styles.leftPanel}>
        <div className={styles.imageOverlay} />
        <div className={styles.leftContent}>

          {/* Logo — matches nav: FIT + MITRA colored */}
          <div className={styles.brandLogo}>
            <Activity className={styles.brandIcon} />
            <span className={styles.brandName}>FIT<span>MITRA</span></span>
          </div>

          <h2 className={styles.leftTitle}>
            Your AI<br />
            <span className={styles.leftTitleAccent}>Fitness Coach.</span>
          </h2>
          <p className={styles.leftDescription}>
            Personalised workouts, smart nutrition, and real progress tracking — 100% free, forever.
          </p>

          <div className={styles.features}>
            {[
              "AI-Powered Meal Plans",
              "Custom Workout Routines",
              "Progress Tracking",
              "Mental Wellness Support",
            ].map((f, i) => (
              <div className={styles.feature} key={i}>
                <div className={styles.featureIcon}>✓</div>
                <span>{f}</span>
              </div>
            ))}
          </div>

          <div className={styles.leftStats}>
            <div className={styles.leftStat}>
              <span className={styles.leftStatNum}>12K+</span>
              <span className={styles.leftStatLbl}>Members</span>
            </div>
            <div className={styles.leftStat}>
              <span className={styles.leftStatNum}>98%</span>
              <span className={styles.leftStatLbl}>Adherence</span>
            </div>
            <div className={styles.leftStat}>
              <span className={styles.leftStatNum}>0₹</span>
              <span className={styles.leftStatLbl}>Cost</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────── */}
      <div className={styles.rightPanel}>

        <div className={styles.themeToggleWrap}>
          <ThemeToggle />
        </div>

        <div className={styles.wrapper}>
          <div className={styles.card}>

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.logoWrapper}>
                <Activity className={styles.logoIcon} />
                <Heart className={styles.logoIconSecondary} />
              </div>
              <h1 className={styles.title}>Join FitMitra</h1>
              <p className={styles.subtitle}>Start your personalised fitness journey</p>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.errorAlert}>
                <AlertCircle className={styles.errorIcon} />
                <div className={styles.errorText}><p>{error}</p></div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form}>

              {/* Name */}
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`${styles.input} ${validationErrors.name ? styles.inputError : ""}`}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
                {validationErrors.name && (
                  <p className={styles.validationError}>{validationErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${styles.input} ${validationErrors.email ? styles.inputError : ""}`}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
                {validationErrors.email && (
                  <p className={styles.validationError}>{validationErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${styles.input} ${validationErrors.password ? styles.inputError : ""}`}
                    placeholder="Create a strong password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                    disabled={isLoading}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className={styles.toggleIcon} /> : <Eye className={styles.toggleIcon} />}
                  </button>
                </div>
                {formData.password && (
                  <div className={styles.passwordStrength}>
                    <div className={styles.passwordStrengthBar}>
                      <div className={styles.progressBarWrapper}>
                        <div
                          className={`${styles.progressBar} ${getStrengthClass()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className={styles.strengthText}>{getStrengthText()}</span>
                    </div>
                  </div>
                )}
                {validationErrors.password && (
                  <p className={styles.validationError}>{validationErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`${styles.input} ${validationErrors.confirmPassword ? styles.inputError : ""}`}
                    placeholder="Re-enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.passwordToggle}
                    disabled={isLoading}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className={styles.toggleIcon} /> : <Eye className={styles.toggleIcon} />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className={styles.validationError}>{validationErrors.confirmPassword}</p>
                )}
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading} className={styles.submitButton}>
                {isLoading ? (
                  <><Loader2 className={styles.loadingSpinner} /> Initialising profile...</>
                ) : (
                  <><Activity className={styles.buttonIcon} /> Start Your Journey</>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className={styles.divider}>
              <div className={styles.dividerLine}>
                <div className={styles.dividerBorder} />
              </div>
              <div className={styles.dividerText}>
                <span className={styles.dividerTextInner}>Already have an account?</span>
              </div>
            </div>

            {/* Sign in link */}
            <div className={styles.signinLinkWrapper}>
              <Link to="/login" className={styles.signinLink}>Sign in →</Link>
            </div>

          </div>

          {/* Footer */}
          <p className={styles.footer}>
            By creating an account, you agree to our{" "}
            <a href="/terms" className={styles.footerLink}>Terms</a>{" "}
            and{" "}
            <a href="/privacy" className={styles.footerLink}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;