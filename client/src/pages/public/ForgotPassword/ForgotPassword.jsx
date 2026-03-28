import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordService } from "../../../services/authService";
import styles from "./ForgotPassword.module.css";

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
const IcoMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="2,4 12,13 22,4" />
  </svg>
);
const IcoAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcoLoader = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinIcon}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
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

      {/* ── LEFT PANEL ──────────────────────────────────────── */}
      <div className={styles.leftPanel}>
        <div className={styles.glow1} />
        <div className={styles.glow2} />
        <div className={styles.glowPanel} />

        <div className={styles.leftContent}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandIcon}><IcoPulse /></span>
            <span className={styles.brandName}>FitMitra</span>
          </Link>

          <span className={styles.eyebrow}>No worries</span>

          <h2 className={styles.leftTitle}>
            We've got<br />
            <span>you covered.</span>
          </h2>

          <p className={styles.leftDesc}>
            Forgot your password? We'll send a 6-digit reset code to your inbox
            so you can get back to training fast.
          </p>

          <div className={styles.leftSteps}>
            {[
              { n: "01", title: "Enter your email",   desc: "We'll look up your FitMitra account" },
              { n: "02", title: "Get the code",        desc: "A 6-digit OTP arrives in seconds" },
              { n: "03", title: "Reset & continue",    desc: "Set a new password and jump back in" },
            ].map((s, i, arr) => (
              <div className={styles.leftStep} key={i}>
                <div className={styles.leftStepCol}>
                  <div className={styles.stepBadge}>{s.n}</div>
                  {i < arr.length - 1 && <div className={styles.stepLine} />}
                </div>
                <div className={styles.stepBody}>
                  <div className={styles.stepTitle}>{s.title}</div>
                  <div className={styles.stepDesc}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────── */}
      <div className={styles.rightPanel}>
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <div className={styles.cardGlow} />

            <Link to="/login" className={styles.backBtn}>
              <IcoArrowLeft /> Back to Sign In
            </Link>

            {/* Icon */}
            <div className={styles.mailWrap}>
              <div className={styles.mailRing}><IcoMail /></div>
            </div>

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.logoRow}>
                <span className={styles.logoPulse}><IcoPulse /></span>
              </div>
              <h1 className={styles.title}>Forgot Password?</h1>
              <p className={styles.subtitle}>
                Enter your email and we'll send you a 6-digit reset code.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.errorAlert}>
                <IcoAlert />
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  className={styles.input}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className={styles.btnPrimary}
              >
                {isLoading
                  ? <><IcoLoader /> Sending Code...</>
                  : <><IcoMail /> Send Reset Code</>}
              </button>
            </form>

            {/* Divider */}
            <div className={styles.divider}>
              <div className={styles.divLine}><div className={styles.divBorder} /></div>
              <div className={styles.divLabel}><span className={styles.divText}>Remember your password?</span></div>
            </div>

            {/* Sign in link */}
            <div className={styles.linkRow}>
              <Link to="/login" className={styles.textLink}>
                Sign in instead <IcoArrowRight />
              </Link>
            </div>
          </div>

          <p className={styles.footer}>
            Need help?{" "}
            <a href="/support" className={styles.footerLink}>Contact Support</a>
            {" "}or check our{" "}
            <a href="/faq" className={styles.footerLink}>FAQ</a>
          </p>
        </div>
      </div>

    </div>
  );
};

export default ForgotPassword;