import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyResetOtpService, resetPasswordService } from "../../../services/authService";
import OtpInput from "../../../components/Otp/OtpInput";
import styles from "./Resetpassword.module.css";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcoPulse = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IcoArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IcoArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const IcoCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IcoAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcoEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IcoEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const IcoLoader = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinIcon}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const IcoShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [step, setStep] = useState(1); // 1 = verify OTP, 2 = set new password
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name === "password") calculatePasswordStrength(value);
    }
    if (validationErrors[name]) setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    if (error) setError(null);
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const getStrengthClass = () => {
    if (passwordStrength <= 1) return styles.weak;
    if (passwordStrength <= 3) return styles.medium;
    return styles.strong;
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  // ── Step 1: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address"); return; }
    if (otp.length !== 6) { setError("Please enter the complete 6-digit code"); return; }

    setIsLoading(true);
    try {
      await verifyResetOtpService(email, otp);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid or expired code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Reset password ──────────────────────────────────────────────────
  const validatePassword = () => {
    const errors = {};
    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 8) errors.password = "Password must be at least 8 characters";
    if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setIsLoading(true);
    setError(null);
    try {
      await resetPasswordService(email, otp, formData.password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { state: { message: "Password reset successful! You can now sign in." } });
      }, 3000);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to reset password.";
      const isOtpExpired =
        message.toLowerCase().includes("expired") ||
        message.toLowerCase().includes("invalid otp") ||
        message.toLowerCase().includes("otp");
      if (isOtpExpired) {
        setOtp(""); setStep(1); setError("Your code expired. Please enter a new one.");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Left panel content per step ─────────────────────────────────────────────
  const leftContent = {
    success: {
      eyebrow: "All done",
      title: <>"Welcome<br /><span>back.</span>"</>,
      desc: "Your password has been reset. You're all set to continue your fitness journey.",
      steps: ["Secured & protected", "Ready to sign in", "Back on track"],
    },
    1: {
      eyebrow: "Almost there",
      title: <>Verify your<br /><span>identity.</span></>,
      desc: "Enter the 6-digit code we sent to your inbox. It expires in 10 minutes.",
      steps: ["Secure OTP Verification", "10-Minute Expiry", "Protected Reset Flow"],
    },
    2: {
      eyebrow: "Final step",
      title: <>Set your new<br /><span>password.</span></>,
      desc: "Choose a strong password to keep your FitMitra account and fitness data safe.",
      steps: ["At least 8 characters", "Mix of letters & numbers", "Special characters recommended"],
    },
  };

  const lc = success ? leftContent.success : leftContent[step];

  // ── Shared left panel ───────────────────────────────────────────────────────
  const LeftPanel = () => (
    <div className={styles.leftPanel}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />
      <div className={styles.glowPanel} />
      <div className={styles.leftContent}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandIcon}><IcoPulse /></span>
          <span className={styles.brandName}>FitMitra</span>
        </Link>
        <span className={styles.eyebrow}>{lc.eyebrow}</span>
        <h2 className={styles.leftTitle}>{lc.title}</h2>
        <p className={styles.leftDesc}>{lc.desc}</p>
        <div className={styles.leftSteps}>
          {lc.steps.map((s, i) => (
            <div className={styles.leftStep} key={i}>
              <div className={styles.leftStepCol}>
                <div className={styles.stepBadge}>0{i + 1}</div>
                {i < lc.steps.length - 1 && <div className={styles.stepLine} />}
              </div>
              <div className={styles.stepBody}>
                <div className={styles.stepTitle}>{s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Success state ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className={styles.page}>
        <LeftPanel />
        <div className={styles.rightPanel}>
          <div className={styles.wrapper}>
            <div className={styles.card}>
              <div className={styles.cardGlow} />
              <div className={styles.successIconWrap}>
                <div className={styles.successRing}>
                  <IcoCheck />
                </div>
              </div>
              <div className={styles.header}>
                <div className={styles.logoRow}>
                  <span className={styles.logoPulse}><IcoPulse /></span>
                </div>
                <h1 className={styles.title}>Password Reset!</h1>
                <p className={styles.subtitle}>Your password has been updated successfully.</p>
              </div>
              <div className={styles.infoBox}>
                <IcoLock />
                <p className={styles.infoText}>Redirecting you to sign in in a few seconds...</p>
              </div>
              <Link to="/login" className={styles.btnPrimary}>
                <IcoArrowLeft /> Go to Sign In
              </Link>
            </div>
            <p className={styles.footer}>
              Need help? <a href="/support" className={styles.footerLink}>Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: OTP entry ───────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className={styles.page}>
        <LeftPanel />
        <div className={styles.rightPanel}>
          <div className={styles.wrapper}>
            <div className={styles.card}>
              <div className={styles.cardGlow} />

              <Link to="/forgot-password" className={styles.backBtn}>
                <IcoArrowLeft /> Back
              </Link>

              <div className={styles.mailWrap}>
                <div className={styles.mailRing}><IcoShield /></div>
              </div>

              <div className={styles.header}>
                <div className={styles.logoRow}>
                  <span className={styles.logoPulse}><IcoPulse /></span>
                </div>
                <h1 className={styles.title}>Verify Reset Code</h1>
                <p className={styles.subtitle}>
                  {location.state?.email
                    ? <>We sent a code to <strong className={styles.emailAccent}>{location.state.email}</strong></>
                    : "Enter your email and the 6-digit code we sent you"}
                </p>
              </div>

              {error && (
                <div className={styles.errorAlert}>
                  <IcoAlert />
                  <p className={styles.errorText}>{error}</p>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>Email Address</label>
                  <input
                    type="email" id="email" name="email"
                    value={email} onChange={handleChange}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>6-Digit Code</label>
                  <OtpInput
                    length={6} value={otp} onChange={setOtp}
                    disabled={isLoading} error={!!error}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email || otp.length !== 6}
                  className={styles.btnPrimary}
                >
                  {isLoading
                    ? <><IcoLoader /> Verifying...</>
                    : <><IcoCheck /> Verify Code</>}
                </button>
              </form>

              <div className={styles.divider}>
                <div className={styles.divLine}><div className={styles.divBorder} /></div>
                <div className={styles.divLabel}><span className={styles.divText}>Didn't receive the code?</span></div>
              </div>

              <div className={styles.linkRow}>
                <Link to="/forgot-password" className={styles.textLink}>
                  Request new code <IcoArrowRight />
                </Link>
              </div>
            </div>
            <p className={styles.footer}>
              Need help? <a href="/support" className={styles.footerLink}>Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: New password ────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <LeftPanel />
      <div className={styles.rightPanel}>
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <div className={styles.cardGlow} />

            <button
              type="button"
              onClick={() => { setStep(1); setError(null); }}
              className={styles.backBtn}
            >
              <IcoArrowLeft /> Back to code entry
            </button>

            <div className={styles.mailWrap}>
              <div className={styles.mailRing}><IcoLock /></div>
            </div>

            <div className={styles.header}>
              <div className={styles.logoRow}>
                <span className={styles.logoPulse}><IcoPulse /></span>
              </div>
              <h1 className={styles.title}>Set New Password</h1>
              <p className={styles.subtitle}>Enter your new password below</p>
            </div>

            {error && (
              <div className={styles.errorAlert}>
                <IcoAlert />
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className={styles.form}>
              {/* New password */}
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>New Password</label>
                <div className={styles.pwWrap}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password" name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="Create a strong password"
                    disabled={isLoading}
                    className={`${styles.input} ${validationErrors.password ? styles.inputError : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.pwToggle}
                    disabled={isLoading}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <IcoEyeOff /> : <IcoEye />}
                  </button>
                </div>

                {formData.password && (
                  <div className={styles.strengthRow}>
                    <div className={styles.strengthTrack}>
                      <div
                        className={`${styles.strengthBar} ${getStrengthClass()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`${styles.strengthLabel} ${getStrengthClass()}`}>
                      {getStrengthLabel()}
                    </span>
                  </div>
                )}
                {validationErrors.password && (
                  <p className={styles.fieldError}>{validationErrors.password}</p>
                )}
              </div>

              {/* Confirm password */}
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password</label>
                <div className={styles.pwWrap}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword" name="confirmPassword"
                    value={formData.confirmPassword} onChange={handleChange}
                    placeholder="Re-enter your password"
                    disabled={isLoading}
                    className={`${styles.input} ${validationErrors.confirmPassword ? styles.inputError : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.pwToggle}
                    disabled={isLoading}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <IcoEyeOff /> : <IcoEye />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className={styles.fieldError}>{validationErrors.confirmPassword}</p>
                )}
              </div>

              <button type="submit" disabled={isLoading} className={styles.btnPrimary}>
                {isLoading
                  ? <><IcoLoader /> Resetting Password...</>
                  : <><IcoLock /> Reset Password</>}
              </button>
            </form>

            <div className={styles.divider}>
              <div className={styles.divLine}><div className={styles.divBorder} /></div>
              <div className={styles.divLabel}><span className={styles.divText}>Remember your password?</span></div>
            </div>

            <div className={styles.linkRow}>
              <Link to="/login" className={styles.textLink}>
                Sign in instead <IcoArrowRight />
              </Link>
            </div>
          </div>

          <p className={styles.footer}>
            Need help? <a href="/support" className={styles.footerLink}>Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;