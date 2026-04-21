import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordService } from "../../../services/authService";
import { Mail, ArrowLeft, ArrowRight, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import styles from "./ForgotPassword.module.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address"); return; }
    setIsLoading(true);
    try {
      await forgotPasswordService(email);
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to="/login" className={styles.backBtn}>
        <ArrowLeft size={18} />
        <span>Back to Sign In</span>
      </Link>

      <video autoPlay loop muted playsInline className={styles.bgVideo} src="/videos/auth_bg.mp4" />
      

      <div className={styles.decorativeSparkle}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </div>

      <div className={styles.pageInner}>
        {/* LEFT COLUMN: HERO TEXT */}
        <div className={styles.heroCol}>
          <div className={styles.heroTag}>Security Support</div>
          <h1 className={styles.heroTitle}>
            No worries. <span>We've got you.</span>
          </h1>
          <p className={styles.heroDesc}>
            It happens to the best of us. Enter your registered email and we'll send a secure 6-digit code to reset your access.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.statVal}>2s</span>
              <span className={styles.statLbl}>Avg. Delivery</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.statVal}>24/7</span>
              <span className={styles.statLbl}>Support Active</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN FORM */}
        <main className={styles.main}>
          <div className={styles.card}>
            <div className={styles.iconWrap}>
              <ShieldCheck size={32} />
            </div>
            <h2 className={styles.cardTitle}>Forgot password?</h2>
            <p className={styles.cardSubtitle}>
              Reset your password to resume your journey. We'll send a code to your registered email.
            </p>

            {error && (
              <div className={styles.globalError}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Registered Email</label>
                <div className={styles.inputWrap}>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className={styles.input}
                  />
                  <Mail size={16} className={styles.inputIcon} />
                </div>
              </div>

              <button type="submit" disabled={isLoading || !email} className={styles.submitBtn}>
                {isLoading ? (
                  <><Loader2 size={18} className={styles.spin} /> Sending...</>
                ) : (
                  <>Send Reset Code <ArrowRight size={18} /></>
                )}
              </button>

              <p className={styles.authHint}>
                Remember your password? <Link to="/login">Sign In</Link>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ForgotPassword;