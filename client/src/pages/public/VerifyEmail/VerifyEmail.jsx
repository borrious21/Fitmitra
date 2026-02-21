import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyEmailService, resendVerificationService } from "../../../services/authService";
import { Loader2, CheckCircle, AlertCircle, Activity, Heart, Mail, ArrowLeft } from "lucide-react";
import OtpInput from "../../../components/Otp/OtpInput";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";
import styles from "./Verifyemail.module.css";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email    = location.state?.email || "";

  const [otp, setOtp]                   = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState(null);
  const [success, setSuccess]           = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Email is missing. Please sign up again."); return; }
    if (otp.length !== 6) { setError("Please enter the complete 6-digit code"); return; }
    setIsLoading(true);
    try {
      await verifyEmailService(email, otp);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { state: { message: "Email verified! You can now sign in." } });
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message ||
        "Verification failed. Please check your code and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { setError("Email is missing. Please sign up again."); return; }
    setResendLoading(true);
    setResendMessage("");
    setError(null);
    try {
      await resendVerificationService(email);
      setResendMessage("A new verification code has been sent to your email!");
      setOtp("");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message ||
        "Failed to resend code. Please try again."
      );
    } finally {
      setResendLoading(false);
    }
  };

  // ── Left panel — reused in both states ────────────────────
  const LeftPanel = ({ titleLine1, titleAccent, description, items }) => (
    <div className={styles.leftPanel}>
      <div className={styles.imageOverlay} />
      <div className={styles.leftContent}>
        <div className={styles.brandLogo}>
          <Activity className={styles.brandIcon} />
          <span className={styles.brandName}>FitMitra</span>
        </div>
        <h2 className={styles.leftTitle}>
          {titleLine1}<br />
          <span className={styles.leftTitleAccent}>{titleAccent}</span>
        </h2>
        <p className={styles.leftDescription}>{description}</p>
        <div className={styles.features}>
          {items.map((f, i) => (
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
  );

  // ── SUCCESS STATE ──────────────────────────────────────────
  if (success) {
    return (
      <div className={styles.container}>
        <LeftPanel
          titleLine1="Welcome to"
          titleAccent="FitMitra!"
          description="Your email has been verified. You're all set to start your personalised fitness journey."
          items={["Account Activated", "Ready to Train", "Let's Get Started"]}
        />
        <div className={styles.rightPanel}>
          <div className={styles.themeToggleWrap}><ThemeToggle /></div>
          <div className={styles.wrapper}>
            <div className={styles.card}>
              <div className={styles.successIconWrapper}>
                <div className={styles.successIconCircle}>
                  <CheckCircle className={styles.checkIcon} />
                </div>
              </div>
              <div className={styles.header}>
                <h1 className={styles.successTitle}>Email Verified!</h1>
                <p className={styles.message}>
                  Your email has been verified successfully. Redirecting you to sign in...
                </p>
              </div>
              <div className={styles.infoBox}>
                <Mail className={styles.infoIcon} />
                <p className={styles.infoText}>
                  You can now access all features of FitMitra!
                </p>
              </div>
              <Link to="/login" className={styles.buttonPrimary}>
                <ArrowLeft className={styles.buttonIcon} />
                Go to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── OTP FORM STATE ─────────────────────────────────────────
  return (
    <div className={styles.container}>
      <LeftPanel
        titleLine1="Almost"
        titleAccent="There!"
        description="Enter the 6-digit code we sent to your email to verify your account and get started."
        items={["Secure Verification", "Quick Process", "Full Access Soon"]}
      />
      <div className={styles.rightPanel}>
        <div className={styles.themeToggleWrap}><ThemeToggle /></div>
        <div className={styles.wrapper}>
          <div className={styles.card}>

            <Link to="/login" className={styles.backButton}>
              <ArrowLeft className={styles.backIcon} /> Back to Sign In
            </Link>

            <div className={styles.header}>
              <div className={styles.logoWrapper}>
                <Activity className={styles.logoIcon} />
                <Heart className={styles.logoIconSecondary} />
              </div>
              <h1 className={styles.title}>Verify Email</h1>
              <p className={styles.subtitle}>
                We sent a 6-digit code to<br />
                <strong>{email}</strong>
              </p>
            </div>

            {error && (
              <div className={styles.errorAlert}>
                <AlertCircle className={styles.errorIcon} />
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            {resendMessage && (
              <div className={styles.successAlert}>
                <CheckCircle className={styles.successAlertIcon} />
                <p className={styles.successText}>{resendMessage}</p>
              </div>
            )}

            <form onSubmit={handleVerify} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Enter Verification Code</label>
                <OtpInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={isLoading}
                  error={!!error}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className={styles.submitButton}
              >
                {isLoading ? (
                  <><Loader2 className={styles.loadingSpinner} /> Verifying...</>
                ) : (
                  <><CheckCircle className={styles.buttonIcon} /> Verify Email</>
                )}
              </button>
            </form>

            <div className={styles.divider}>
              <div className={styles.dividerLine}>
                <div className={styles.dividerBorder} />
              </div>
              <div className={styles.dividerText}>
                <span className={styles.dividerTextInner}>Didn't receive the code?</span>
              </div>
            </div>

            <button
              onClick={handleResend}
              disabled={resendLoading}
              className={styles.resendButton}
            >
              {resendLoading ? (
                <><Loader2 className={styles.loadingSpinner} /> Resending...</>
              ) : (
                <><Mail className={styles.buttonIcon} /> Resend Code</>
              )}
            </button>

          </div>

          <p className={styles.footer}>
            Need help?{" "}
            <a href="/support" className={styles.footerLink}>Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;