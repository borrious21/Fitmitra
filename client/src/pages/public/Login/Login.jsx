import { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import {
  loginService,
  resendVerificationService,
  verifyEmailService,
} from "../../../services/authService";
import { Eye, EyeOff, Loader2, Aperture, Mail, ArrowLeft } from "lucide-react";
import OtpInput from "../../../components/Otp/OtpInput";
import { tokenStore } from "../../../services/apiClient";
import styles from "./Login.module.css";
import BackgroundVideo from "../../../components/BackgroundVideo/BackgroundVideo";

function resolveDestination(user, fallback) {
  const role = user.role ?? user.user_role ?? "";
  if (role === "admin") return "/admin";
  const hasOnboarded =
    user.hasCompletedOnboarding ?? user.has_completed_onboarding ?? false;
  return hasOnboarded ? fallback : "/onboarding";
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, mockLogin, error, clearError, user, isAuthenticated, isInitializing } =
    useContext(AuthContext);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const [showUnverifiedPrompt, setShowUnverifiedPrompt] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [postVerifyMessage, setPostVerifyMessage] = useState(null);

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => { clearError(); }, []);

  useEffect(() => {
    if (isAuthenticated && user && !isInitializing) {
      if (!user.isVerified) return;
      navigate(resolveDestination(user, from), { replace: true });
    }
  }, [isAuthenticated, user, isInitializing, navigate, from]);

  useEffect(() => {
    if (localError) {
      const msg = (localError?.message || String(localError)).toLowerCase();
      setShowUnverifiedPrompt(
        msg.includes("verify your email") ||
        msg.includes("not verified") ||
        msg.includes("unverified")
      );
    } else {
      setShowUnverifiedPrompt(false);
    }
  }, [localError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name])
      setValidationErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Invalid email address";
    if (!formData.password) errors.password = "Password is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setLocalError(null);
    try {
      const result = await loginService(formData.email, formData.password);
      login(result.token, result.user);
      if (result.refreshToken) tokenStore.setRefreshToken(result.refreshToken);
    } catch (err) {
      if (err?.status === 403) tokenStore.clearAll();
      setLocalError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email.trim()) {
      setValidationErrors({ email: "Please enter your email address" });
      return;
    }
    setResendLoading(true);
    setResendSuccess(false);
    setVerifyError(null);
    try {
      await resendVerificationService(formData.email);
      setResendSuccess(true);
      setShowUnverifiedPrompt(false);
      setLocalError(null);
    } catch (err) {
      setVerifyError(err.message || "Failed to resend verification code");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setVerifyError("Please enter the complete 6-digit code"); return; }
    if (!formData.email.trim()) { setVerifyError("Email is required."); return; }
    setVerifyLoading(true);
    setVerifyError(null);
    setPostVerifyMessage(null);
    try {
      await verifyEmailService(formData.email, otp);
      setOtp("");
      setResendSuccess(false);
      setLocalError(null);
      try {
        setIsLoading(true);
        const result = await loginService(formData.email, formData.password);
        login(result.token, result.user);
        if (result.refreshToken) tokenStore.setRefreshToken(result.refreshToken);
      } catch {
        setPostVerifyMessage("Email verified! Please sign in with your password to continue.");
      } finally {
        setIsLoading(false);
      }
    } catch (err) {
      setVerifyError(err.message || "Invalid verification code. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const displayError = localError || error;
  const displayErrorMsg = displayError?.message || (typeof displayError === "string" ? displayError : null);

  return (
    <div className={styles.page}>
      <BackgroundVideo src="/videos/auth_bg.mp4" opacity={0.3} />
      <Link to="/" className={styles.backBtn}>
        <ArrowLeft size={18} />
        <span>Back to Home</span>
      </Link>

      <div className={styles.pageInner}>
        {/* LEFT COLUMN: HERO TEXT */}
        <div className={styles.heroCol}>
          <div className={styles.heroTag}>Welcome Back</div>
          <h1 className={styles.heroTitle}>Continue Growing.</h1>
          <p className={styles.heroDesc}>
            Log back in to pick up where you left off. Track your daily progress, review new guided plans, and stay committed.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.statVal}>10k+</span>
              <span className={styles.statLbl}>Active Users</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.statVal}>500+</span>
              <span className={styles.statLbl}>Guided Plans</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN FORM */}
        <main className={styles.main}>
          <div className={styles.card}>
            <div className={styles.iconWrap}>
              <Aperture size={32} />
            </div>
            <h2 className={styles.cardTitle}>Welcome back!</h2>
            <p className={styles.cardSubtitle}>Sign in to access your guided workouts, daily plans, and personal journey.</p>

            {/* Post-verify success */}
            {postVerifyMessage && (
              <div className={styles.globalSuccess}>
                <p style={{ margin: 0 }}>{postVerifyMessage}</p>
              </div>
            )}
            {/* Generic error */}
            {displayErrorMsg && !showUnverifiedPrompt && !postVerifyMessage && (
              <div className={styles.globalError}>
                {displayErrorMsg}
              </div>
            )}
            {/* Unverified prompt */}
            {showUnverifiedPrompt && (
              <div className={styles.globalError}>
                <p style={{ margin: 0, paddingBottom: 8 }}>
                  <strong>Email Not Verified</strong><br />
                  Please verify your email to login. Send a 6-digit code to {formData.email}.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className={styles.resendBtn}
                >
                  {resendLoading
                    ? <><Loader2 size={13} className={styles.spin} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Sending...</>
                    : "Send Code"}
                </button>
              </div>
            )}

            {/* OTP entry after resend */}
            {resendSuccess && (
              <div className={styles.globalSuccess}>
                <p style={{ margin: 0 }}>Code sent to <strong>{formData.email}</strong>! Enter it below:</p>
                <form onSubmit={handleVerifyOtp} className={styles.otpInputWrap}>
                  <OtpInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={verifyLoading}
                    error={!!verifyError}
                  />
                  {verifyError && <p className={styles.errorText} style={{ marginTop: '0.5rem' }}>{verifyError}</p>}
                  <button
                    type="submit"
                    disabled={verifyLoading || otp.length !== 6}
                    className={styles.submitBtn}
                  >
                    {verifyLoading
                      ? <Loader2 size={18} className={styles.spin} />
                      : "Verify & Sign In"}
                  </button>
                  <p className={styles.otpAlt}>
                    Prefer a separate page? <Link to="/verify-email" state={{ email: formData.email }}>Go to verification page</Link>
                  </p>
                </form>
              </div>
            )}

            {/* Main login form (hides if doing OTP) */}
            {!resendSuccess && (
              <form onSubmit={handleSubmit} className={styles.form}>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>Email</label>
                  <div className={styles.inputWrap}>
                    <input
                      type="email" id="email" name="email"
                      value={formData.email} onChange={handleChange}
                      disabled={isLoading} placeholder="Enter your email"
                      className={`${styles.input} ${validationErrors.email ? styles.inputError : ""}`}
                    />
                    <Mail size={16} className={styles.inputIcon} style={{ pointerEvents: 'none' }} />
                  </div>
                  {validationErrors.email && <p className={styles.errorText}>{validationErrors.email}</p>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.label}>Password</label>
                  <div className={styles.inputWrap}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password" name="password"
                      value={formData.password} onChange={handleChange}
                      disabled={isLoading} placeholder="••••••••"
                      className={`${styles.input} ${validationErrors.password ? styles.inputError : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className={styles.inputIcon}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {validationErrors.password && <p className={styles.errorText}>{validationErrors.password}</p>}
                </div>

                <div className={styles.optionsRow}>
                  <div className={styles.checkboxWrap}>
                    <input
                      type="checkbox"
                      id="remember"
                      className={styles.checkbox}
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    <label htmlFor="remember" className={styles.checkboxLabel}>Remember me</label>
                  </div>
                  <Link to="/forgot-password" className={styles.forgotLink}>
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" disabled={isLoading} className={styles.submitBtn}>
                  {isLoading
                    ? <Loader2 size={18} className={styles.spin} />
                    : "Log In"}
                </button>



                <p className={styles.authHint}>
                  Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
              </form>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}