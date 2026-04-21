import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyEmailService, resendVerificationService } from "../../../services/authService";
import { Loader2, CheckCircle, AlertCircle, Mail, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import OtpInput from "../../../components/Otp/OtpInput";
import styles from "./VerifyEmail.module.css";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email    = location.state?.email || "";

  const [otp, setOtp]                     = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState(null);
  const [success, setSuccess]             = useState(false);
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
      setResendMessage("New code sent to your email!");
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to="/login" className={styles.backBtn}>
        <ArrowLeft size={18} />
        <span>Back to Sign In</span>
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
          <div className={styles.heroTag}>Account Verification</div>
          <h1 className={styles.heroTitle}>
            Almost <span>there!</span>
          </h1>
          <p className={styles.heroDesc}>
            Verify your email to activate your FitMitra account and begin your journey towards a healthier, stronger version of yourself.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.statVal}>12K+</span>
              <span className={styles.statLbl}>Active Members</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.statVal}>98%</span>
              <span className={styles.statLbl}>Success Rate</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN CARD */}
        <main className={styles.main}>
          <div className={styles.card}>
            {success ? (
              <div className={styles.successContent}>
                <div className={styles.successIconWrapper}>
                  <div className={styles.successIconCircle}>
                    <CheckCircle size={40} />
                  </div>
                </div>
                <h2 className={styles.title}>Email Verified!</h2>
                <p className={styles.subtitle}>
                  Your account is active. Redirecting you to sign in...
                </p>
              </div>
            ) : (
              <>
                <div className={styles.logoWrapper}>
                  <ShieldCheck size={32} />
                </div>
                <h2 className={styles.title}>Verify Email</h2>
                <p className={styles.subtitle}>
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>

                {error && (
                  <div className={styles.errorAlert}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {resendMessage && (
                  <div className={styles.successAlert}>
                    <CheckCircle size={16} />
                    <span>{resendMessage}</span>
                  </div>
                )}

                <form onSubmit={handleVerify} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Enter Verification Code</label>
                    <OtpInput
                      length={6} value={otp} onChange={setOtp}
                      disabled={isLoading} error={!!error}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className={styles.submitButton}
                  >
                    {isLoading ? (
                      <><Loader2 size={18} className={styles.loadingSpinner} /> Verifying...</>
                    ) : (
                      <>Verify Account <ArrowRight size={18} /></>
                    )}
                  </button>
                </form>

                <div className={styles.divider}>
                  <div className={styles.dividerLine} />
                  <span className={styles.dividerText}>Didn't receive the code?</span>
                  <div className={styles.dividerLine} />
                </div>

                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className={styles.resendButton}
                >
                  {resendLoading ? (
                    <><Loader2 size={16} className={styles.loadingSpinner} /> Sending...</>
                  ) : (
                    <><Mail size={16} /> Resend Verification Code</>
                  )}
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default VerifyEmail;