import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyResetOtpService, resetPasswordService } from "../../../services/authService";
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight,
  Info
} from "lucide-react";
import OtpInput from "../../../components/Otp/OtpInput";
import styles from "./ResetPassword.module.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [step, setStep] = useState(1);
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
      setError(err.response?.data?.message || err.message || "Invalid or expired code.");
    } finally {
      setIsLoading(false);
    }
  };

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
        navigate("/login", { state: { message: "Password reset successful!" } });
      }, 3000);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to reset password.";
      if (message.toLowerCase().includes("otp")) {
        setOtp(""); setStep(1); setError("Code expired. Please request a new one.");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to={step === 1 ? "/forgot-password" : "#"} onClick={step === 2 ? () => setStep(1) : undefined} className={styles.backBtn}>
        <ArrowLeft size={18} />
        <span>{step === 1 ? "Back to Email Entry" : "Back to Verification"}</span>
      </Link>

      <video autoPlay loop muted playsInline className={styles.bgVideo} src="/videos/auth_bg.mp4" />
      
      {/* DECORATIVE ELEMENTS */}
      <div className={styles.ambientOrb1} />
      <div className={styles.ambientOrb2} />
      <div className={styles.decorativeSparkle}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </div>

      <div className={styles.pageInner}>
        {/* LEFT COLUMN: HERO TEXT */}
        <div className={styles.heroCol}>
          <div className={styles.heroTag}>Password Recovery</div>
          <h1 className={styles.heroTitle}>
            {success ? "All Logged" : (step === 1 ? "Identity" : "Secure")} <span>{success ? "In!" : (step === 1 ? "Verification" : "Update")}</span>
          </h1>
          <p className={styles.heroDesc}>
            {success 
              ? "Your password has been successfully reset. Redirecting you home." 
              : (step === 1 ? "Enter the 6-digit code we sent to your inbox to confirm your identity." : "Create a new strong password to regain access to your FitMitra dashboard.")}
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.statVal}>SSL</span>
              <span className={styles.statLbl}>Encrypted</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.statVal}>FAST</span>
              <span className={styles.statLbl}>Recovery</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN CARD */}
        <main className={styles.main}>
          <div className={styles.card}>
            {success ? (
              <div className={styles.successContent}>
                <div className={styles.successIconWrap}>
                  <div className={styles.successRing}>
                    <CheckCircle size={40} />
                  </div>
                </div>
                <h2 className={styles.title}>Reset Complete!</h2>
                <p className={styles.subtitle}>Your account is secure. Redirecting to login...</p>
              </div>
            ) : step === 1 ? (
              <>
                <div className={styles.iconWrap}>
                  <ShieldCheck size={32} />
                </div>
                <h2 className={styles.title}>Confirm Code</h2>
                <p className={styles.subtitle}>
                  Enter the 6-digit code sent to<br />
                  <strong>{email || "your email"}</strong>
                </p>

                {error && (
                  <div className={styles.errorAlert}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className={styles.form}>
                  {!location.state?.email && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email Address</label>
                      <input
                        type="email" name="email" value={email} onChange={handleChange}
                        placeholder="you@example.com" className={styles.input} required
                      />
                    </div>
                  )}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Verification Code</label>
                    <OtpInput length={6} value={otp} onChange={setOtp} disabled={isLoading} />
                  </div>
                  <button type="submit" disabled={isLoading || otp.length !== 6} className={styles.btnPrimary}>
                    {isLoading ? <><Loader2 size={18} className={styles.spinIcon} /> Verifying...</> : <>Verify identity <ArrowRight size={18} /></>}
                  </button>
                </form>

                <div className={styles.divider}>
                  <div className={styles.divLine} />
                  <span className={styles.divText}>Didn't get it?</span>
                  <div className={styles.divLine} />
                </div>

                <div className={styles.linkRow}>
                  <Link to="/forgot-password" className={styles.textLink}>Request new code</Link>
                </div>
              </>
            ) : (
              <>
                <div className={styles.iconWrap}>
                  <Lock size={32} />
                </div>
                <h2 className={styles.title}>New Password</h2>
                <p className={styles.subtitle}>Choose a strong password for your account.</p>

                {error && (
                  <div className={styles.errorAlert}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>New Password</label>
                    <div className={styles.pwWrap}>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password" value={formData.password} onChange={handleChange}
                        placeholder="••••••••" className={styles.input} required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.pwToggle}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className={styles.strengthRow}>
                        <div className={styles.strengthTrack}>
                          <div className={`${styles.strengthBar} ${getStrengthClass()}`} style={{ width: `${(passwordStrength / 5) * 100}%` }} />
                        </div>
                        <span className={styles.strengthLabel}>{getStrengthLabel()}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Confirm Password</label>
                    <div className={styles.pwWrap}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                        placeholder="••••••••" className={styles.input} required
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={styles.pwToggle}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && <p className={styles.errorText}>{validationErrors.confirmPassword}</p>}
                  </div>

                  <button type="submit" disabled={isLoading} className={styles.btnPrimary}>
                    {isLoading ? <><Loader2 size={18} className={styles.spinIcon} /> Saving...</> : <>Reset password <ArrowRight size={18} /></>}
                  </button>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResetPassword;