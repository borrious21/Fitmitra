import { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import {
  loginService,
  resendVerificationService,
  verifyEmailService,
} from "../../../services/authService";
import { Eye, EyeOff, Loader2, AlertCircle, Activity, Heart, Mail } from "lucide-react";
import OtpInput from "../../../components/Otp/OtpInput";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";
import styles from "./Login.module.css";

const Login = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, logout, error, clearError, user, isAuthenticated, isInitializing } =
    useContext(AuthContext);

  const [formData, setFormData]         = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading]       = useState(false);
  const [localError, setLocalError]     = useState(null);

  const [showUnverifiedPrompt, setShowUnverifiedPrompt] = useState(false);
  const [resendLoading, setResendLoading]   = useState(false);
  const [resendSuccess, setResendSuccess]   = useState(false);
  const [otp, setOtp]                       = useState("");
  const [verifyLoading, setVerifyLoading]   = useState(false);
  const [verifyError, setVerifyError]       = useState(null);
  const [postVerifyMessage, setPostVerifyMessage] = useState(null);

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => { clearError(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAuthenticated && user && !isInitializing) {
      if (!user.isVerified) return; // don't redirect unverified users

      // Normalize both camelCase and snake_case variants from the backend
      const hasOnboarded =
        user.hasCompletedOnboarding ?? user.has_completed_onboarding ?? false;

      const destination = hasOnboarded ? from : "/onboarding";
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, isInitializing, navigate, from]);

  useEffect(() => {
    if (localError) {
      const msg = (localError?.message || String(localError)).toLowerCase();
      const isUnverified =
        msg.includes("verify your email") ||
        msg.includes("not verified") ||
        msg.includes("unverified");
      setShowUnverifiedPrompt(isUnverified);
    } else {
      setShowUnverifiedPrompt(false);
    }
  }, [localError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email address";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setLocalError(null);
    try {
      const { token, user: rawUser } = await loginService(formData.email, formData.password);
      login(token, rawUser);
    } catch (err) {
      if (err?.status === 403) logout(); // clear stale token so redirect guard doesn't fire
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
        const { token, user: rawUser } = await loginService(formData.email, formData.password);
        login(token, rawUser);
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

  const displayError    = localError || error;
  const displayErrorMsg = displayError?.message || (typeof displayError === "string" ? displayError : null);

  return (
    <div className={styles.container}>

      <div className={styles.leftPanel}>
        <div className={styles.imageOverlay} />
        <div className={styles.leftContent}>

          <div className={styles.brandLogo}>
            <Activity className={styles.brandIcon} />
            <span className={styles.brandName}>FitMitra</span>
          </div>

          <h2 className={styles.leftTitle}>
            Welcome<br />
            <span className={styles.leftTitleAccent}>Back.</span>
          </h2>
          <p className={styles.leftDescription}>
            Your fitness journey continues. Pick up right where you left off — your AI coach has been waiting.
          </p>

          <div className={styles.features}>
            {["Track your progress", "Access your plans", "Stay motivated daily"].map((f, i) => (
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

      <div className={styles.rightPanel}>

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
              <h1 className={styles.title}>Sign In</h1>
              <p className={styles.subtitle}>Welcome back to FitMitra</p>
            </div>

            {postVerifyMessage && (
              <div className={styles.successAlert}>
                <Mail className={styles.successIcon} />
                <p className={styles.successText}>{postVerifyMessage}</p>
              </div>
            )}

            {displayErrorMsg && !showUnverifiedPrompt && !postVerifyMessage && (
              <div className={styles.errorAlert}>
                <AlertCircle className={styles.errorIcon} />
                <p className={styles.errorText}>{displayErrorMsg}</p>
              </div>
            )}

            {showUnverifiedPrompt && (
              <div className={styles.warningAlert}>
                <AlertCircle className={styles.warningIcon} />
                <div className={styles.warningContent}>
                  <p className={styles.warningText}>
                    <strong>Email Not Verified</strong>
                    <br />
                    Please verify your email to log in. Click below to receive a new 6-digit code at{" "}
                    <strong>{formData.email}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className={styles.resendLink}
                  >
                    {resendLoading ? (
                      <><Loader2 className={styles.resendSpinner} /> Sending...</>
                    ) : (
                      <><Mail className={styles.resendIcon} /> Send Code</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {resendSuccess && (
              <div className={styles.successAlert}>
                <div style={{ width: "100%" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem", marginBottom:"1rem" }}>
                    <Mail className={styles.successIcon} />
                    <p className={styles.successText}>
                      Code sent to <strong>{formData.email}</strong>! Enter it below:
                    </p>
                  </div>
                  <form onSubmit={handleVerifyOtp} style={{ marginTop:"1rem" }}>
                    <OtpInput
                      length={6}
                      value={otp}
                      onChange={setOtp}
                      disabled={verifyLoading}
                      error={!!verifyError}
                    />
                    {verifyError && (
                      <p style={{ color:"var(--err-icon)", fontSize:"0.8rem", marginTop:"0.5rem", textAlign:"center", fontWeight:600 }}>
                        {verifyError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={verifyLoading || otp.length !== 6}
                      className={styles.submitButton}
                      style={{ marginTop:"1rem" }}
                    >
                      {verifyLoading ? (
                        <><Loader2 className={styles.loadingSpinner} /> Verifying...</>
                      ) : "Verify & Sign In"}
                    </button>
                    <p style={{ fontSize:"0.775rem", color:"var(--ok-text)", marginTop:"0.75rem", textAlign:"center" }}>
                      Prefer a separate page?{" "}
                      <Link
                        to="/verify-email"
                        state={{ email: formData.email }}
                        style={{ color:"var(--orange)", fontWeight:700, textDecoration:"underline" }}
                      >
                        Go to verification page
                      </Link>
                    </p>
                  </form>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`${styles.input} ${validationErrors.email ? styles.inputError : ""}`}
                  placeholder="you@example.com"
                />
                {validationErrors.email && (
                  <p className={styles.validationError}>{validationErrors.email}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`${styles.input} ${validationErrors.password ? styles.inputError : ""}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className={styles.toggleIcon} />
                    ) : (
                      <Eye className={styles.toggleIcon} />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className={styles.validationError}>{validationErrors.password}</p>
                )}
              </div>

              <div className={styles.forgotPasswordWrapper}>
                <Link to="/forgot-password" className={styles.forgotPasswordLink}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={isLoading} className={styles.submitButton}>
                {isLoading ? (
                  <><Loader2 className={styles.loadingSpinner} /> Signing in...</>
                ) : (
                  <><Activity className={styles.buttonIcon} /> Sign In</>
                )}
              </button>
            </form>

            <div className={styles.divider}>
              <div className={styles.dividerLine}>
                <div className={styles.dividerBorder} />
              </div>
              <div className={styles.dividerText}>
                <span className={styles.dividerTextInner}>Don't have an account?</span>
              </div>
            </div>

            <div className={styles.signupLinkWrapper}>
              <Link to="/signup" className={styles.signupLink}>
                Create account
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;