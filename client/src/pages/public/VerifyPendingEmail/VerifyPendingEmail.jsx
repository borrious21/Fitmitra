import { Link, useLocation } from "react-router-dom";
import styles from "./VerifyPendingEmail.module.css";

const IcoPulse = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IcoMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="2,4 12,13 22,4" />
  </svg>
);
const IcoArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IcoCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcoStar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
const VerifyEmailPending = () => {
  const location = useLocation();
  const email = location.state?.email || "your email";
  const message =
    location.state?.message ||
    "Please check your email and enter the 6-digit code to verify your account.";

  const leftSteps = [
    { n: "01", title: "Open your email", desc: `Check the inbox for ${email}` },
    { n: "02", title: "Copy the code",   desc: "Find the 6-digit OTP we sent you" },
    { n: "03", title: "Enter & verify",  desc: "Paste it on the next screen — expires in 10 min" },
  ];

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

          <span className={styles.eyebrow}>Almost there</span>

          <h2 className={styles.leftTitle}>
            One step<br />
            <span>away.</span>
          </h2>

          <p className={styles.leftDesc}>
            We've sent a 6-digit OTP to your inbox. Enter it to unlock your
            personalised fitness journey — workouts, nutrition &amp; more.
          </p>

          <div className={styles.leftSteps}>
            {leftSteps.map((s, i) => (
              <div className={styles.leftStep} key={i}>
                <div className={styles.leftStepCol}>
                  <div className={styles.stepBadge}>{s.n}</div>
                  {i < leftSteps.length - 1 && <div className={styles.stepLine} />}
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

            <div className={styles.mailWrap}>
              <div className={styles.mailRing}><IcoMail /></div>
            </div>

            <div className={styles.header}>
              <div className={styles.logoRow}>
                <span className={styles.logoPulse}><IcoPulse /></span>
              </div>
              <h1 className={styles.title}>Check Your Email</h1>
              <p className={styles.message}>{message}</p>
              <p className={styles.emailVal}>{email}</p>
            </div>

            <div className={styles.infoBox}>
              <div className={styles.infoHeader}>
                <IcoInfo />
                <h3 className={styles.infoTitle}>What to do next</h3>
              </div>
              <ol className={styles.infoSteps}>
                <li>
                  <span className={styles.stepNum}>1</span>
                  <span className={styles.stepText}>Open the email we sent to {email}</span>
                </li>
                <li>
                  <span className={styles.stepNum}>2</span>
                  <span className={styles.stepText}>Copy the 6-digit verification code</span>
                </li>
                <li>
                  <span className={styles.stepNum}>3</span>
                  <span className={styles.stepText}>
                    Enter it on the verification page — code expires in 10 minutes
                  </span>
                </li>
              </ol>
            </div>

            <div className={styles.tip}>
              <IcoStar />
              <p className={styles.tipText}>
                <strong>Didn't receive it?</strong> Check your spam folder. You can
                request a new code on the verification page if yours has expired.
              </p>
            </div>

            <div className={styles.actions}>
              <Link
                to="/verify-email"
                state={{ email: location.state?.email }}
                className={styles.btnPrimary}
              >
                <IcoCheck /> Enter Verification Code
              </Link>
              <Link to="/signup" className={styles.btnSecondary}>
                Create a different account
              </Link>
            </div>

            <div className={styles.divider}>
              <div className={styles.divLine}><div className={styles.divBorder} /></div>
              <div className={styles.divLabel}><span className={styles.divText}>Need assistance?</span></div>
            </div>

            <div className={styles.help}>
              <p className={styles.helpText}>
                Having trouble?{" "}
                <a href="/support" className={styles.supportLink}>Contact Support</a>
              </p>
            </div>
          </div>

          <p className={styles.footer}>
            Questions about verification?{" "}
            <a href="/faq" className={styles.footerLink}>Visit our FAQ</a>
          </p>
        </div>
      </div>

    </div>
  );
};

export default VerifyEmailPending;