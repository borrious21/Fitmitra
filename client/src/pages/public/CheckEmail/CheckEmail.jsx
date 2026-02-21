import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./CheckEmail.module.css";

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
const IcoAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IcoInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcoLoader = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinIcon}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const IcoRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
const CheckEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "your email";

  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend verification email
  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendSuccess(false);
    try {
      // Replace with your actual resend service call
      // await resendVerificationEmailService(email);
      await new Promise((r) => setTimeout(r, 1200)); // mock
      setResendSuccess(true);
      // 60s cooldown
      let t = 60;
      setResendCooldown(t);
      const interval = setInterval(() => {
        t -= 1;
        setResendCooldown(t);
        if (t <= 0) clearInterval(interval);
      }, 1000);
    } catch {
      // handle silently — user can retry
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* bg */}
      <div className={styles.glow1} />
      <div className={styles.glow2} />
      <div className={styles.grid} />

      {/* nav brand */}
      <div className={styles.nav}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandIcon}><IcoPulse /></span>
          <span className={styles.brandName}>FitMitra</span>
        </Link>
      </div>

      {/* ── LEFT PANEL ────────────────────────────────────────── */}
      <div className={styles.leftPanel}>
        <div className={styles.leftGlow1} />
        <div className={styles.leftGlow2} />
        <div className={styles.leftGrid} />
        <div className={styles.leftContent}>

          <Link to="/" className={styles.leftBrand}>
            <span className={styles.brandIcon}><IcoPulse /></span>
            <span className={styles.brandName}>FitMitra</span>
          </Link>

          <span className={styles.eyebrow}>You're almost in</span>

          <h2 className={styles.leftTitle}>
            Check your<br /><span>inbox.</span>
          </h2>

          <p className={styles.leftDesc}>
            We've sent a verification link to your email. Click it to activate
            your account and start your fitness journey.
          </p>

          <div className={styles.leftSteps}>
            {[
              { n: "01", title: "Open your email",    desc: `Check the inbox for ${email}` },
              { n: "02", title: "Click the link",     desc: "Hit the verification link we sent" },
              { n: "03", title: "Start training",     desc: "Your FitMitra account is ready to go" },
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

      {/* ── RIGHT PANEL ───────────────────────────────────────── */}
      <div className={styles.rightPanel}>
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <div className={styles.cardGlow} />

            {/* icon */}
            <div className={styles.mailWrap}>
              <div className={styles.mailRing}><IcoMail /></div>
            </div>

            {/* header */}
            <div className={styles.header}>
              <div className={styles.logoRow}>
                <span className={styles.logoPulse}><IcoPulse /></span>
              </div>
              <h1 className={styles.title}>Check Your Email</h1>
              <p className={styles.subtitle}>
                We've sent a verification email to
              </p>
              <p className={styles.emailVal}>{email}</p>
            </div>

            {/* resend success */}
            {resendSuccess && (
              <div className={styles.successBanner}>
                <IcoCheck />
                <span>New email sent! Check your inbox.</span>
              </div>
            )}

            {/* warning box */}
            <div className={styles.warningBox}>
              <IcoAlert />
              <div>
                <p className={styles.warningTitle}>Link expires in 24 hours</p>
                <p className={styles.warningDesc}>
                  Make sure to verify before it expires. Check your{" "}
                  <strong>spam or junk folder</strong> if you don't see it.
                </p>
              </div>
            </div>

            {/* troubleshooting */}
            <div className={styles.troubleBox}>
              <div className={styles.troubleHeader}>
                <IcoInfo />
                <span className={styles.troubleTitle}>Not seeing the email?</span>
              </div>
              <ul className={styles.troubleList}>
                <li>Check spam, junk, or promotions folders</li>
                <li>Make sure <strong>{email}</strong> is correct</li>
                <li>Wait a minute — delivery can take a moment</li>
                <li>Try resending using the button below</li>
              </ul>
            </div>

            {/* actions */}
            <div className={styles.actions}>
              {/* primary: go verify */}
              <Link
                to="/verify-email"
                state={{ email: location.state?.email }}
                className={styles.btnPrimary}
              >
                <IcoCheck /> Enter Verification Code
              </Link>

              {/* resend */}
              <button
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                className={styles.btnSecondary}
              >
                {resendLoading ? (
                  <><IcoLoader /> Sending...</>
                ) : resendCooldown > 0 ? (
                  <><IcoRefresh /> Resend in {resendCooldown}s</>
                ) : (
                  <><IcoRefresh /> Resend Email</>
                )}
              </button>
            </div>

            {/* divider */}
            <div className={styles.divider}>
              <div className={styles.divLine}><div className={styles.divBorder} /></div>
              <div className={styles.divLabel}><span className={styles.divText}>Wrong email?</span></div>
            </div>

            {/* bottom links */}
            <div className={styles.linkRow}>
              <button
                onClick={() => navigate("/signup")}
                className={styles.textLink}
              >
                <IcoArrowLeft /> Use a different email
              </button>
              <Link to="/login" className={styles.textLink}>
                Sign in instead <IcoArrowRight />
              </Link>
            </div>
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

export default CheckEmail;