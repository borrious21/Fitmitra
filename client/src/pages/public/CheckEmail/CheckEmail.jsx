import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Mail, ArrowLeft, ArrowRight, CheckCircle2,
  AlertCircle, RefreshCw, Loader2, ShieldCheck,
  Info, Clock
} from "lucide-react";
import styles from "./CheckEmail.module.css";

const CheckEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "your email";

  const [resendLoading,  setResendLoading]  = useState(false);
  const [resendSuccess,  setResendSuccess]  = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setResendSuccess(true);
      let t = 60;
      setResendCooldown(t);
      const interval = setInterval(() => {
        t -= 1;
        setResendCooldown(t);
        if (t <= 0) clearInterval(interval);
      }, 1000);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Back button */}
      <Link to="/login" className={styles.backBtn}>
        <ArrowLeft size={18} />
        <span>Back to Sign In</span>
      </Link>

      {/* Decorative background */}
      <div className={styles.ambientOrb1} />
      <div className={styles.ambientOrb2} />

      <div className={styles.pageInner}>

        {/* ── LEFT: HERO ── */}
        <div className={styles.heroCol}>
          <div className={styles.heroTag}>Email Verification</div>
          <h1 className={styles.heroTitle}>
            Check your <span>inbox!</span>
          </h1>
          <p className={styles.heroDesc}>
            We've sent a verification link to your email. Follow the steps
            below to activate your FitMitra account and start your journey.
          </p>

          <div className={styles.steps}>
            {[
              { n: "01", title: "Open your email",  desc: `Check the inbox for ${email}` },
              { n: "02", title: "Click the link",   desc: "Hit the verification link we sent you" },
              { n: "03", title: "Start training",   desc: "Your FitMitra account is ready to go" },
            ].map((s, i, arr) => (
              <div className={styles.step} key={i}>
                <div className={styles.stepCol}>
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

        {/* ── RIGHT: CARD ── */}
        <main className={styles.main}>
          <div className={styles.card}>

            <div className={styles.logoWrapper}>
              <Mail size={32} />
            </div>

            <h2 className={styles.title}>Check Your Email</h2>
            <p className={styles.subtitle}>
              We sent a verification link to <strong>{email}</strong>
            </p>

            {/* Resend success */}
            {resendSuccess && (
              <div className={styles.successAlert}>
                <CheckCircle2 size={16} />
                <span>New email sent! Check your inbox.</span>
              </div>
            )}

            {/* Expiry warning */}
            <div className={styles.warningBox}>
              <Clock size={16} />
              <div>
                <p className={styles.warningTitle}>Link expires in 24 hours</p>
                <p className={styles.warningDesc}>
                  Check your <strong>spam or junk folder</strong> if you don't see it in your inbox.
                </p>
              </div>
            </div>

            {/* Trouble box */}
            <div className={styles.troubleBox}>
              <div className={styles.troubleHeader}>
                <Info size={14} />
                <span className={styles.troubleTitle}>Not seeing the email?</span>
              </div>
              <ul className={styles.troubleList}>
                <li>Check spam, junk, or promotions folders</li>
                <li>Make sure <strong>{email}</strong> is correct</li>
                <li>Wait a minute — delivery can take a moment</li>
                <li>Try resending using the button below</li>
              </ul>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <Link
                to="/verify-email"
                state={{ email: location.state?.email }}
                className={styles.primaryBtn}
              >
                <ShieldCheck size={18} /> Enter Verification Code
              </Link>

              <button
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                className={styles.resendButton}
              >
                {resendLoading ? (
                  <><Loader2 size={16} className={styles.spin} /> Sending...</>
                ) : resendCooldown > 0 ? (
                  <><RefreshCw size={16} /> Resend in {resendCooldown}s</>
                ) : (
                  <><RefreshCw size={16} /> Resend Email</>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>Wrong email?</span>
              <div className={styles.dividerLine} />
            </div>

            {/* Link row */}
            <div className={styles.linkRow}>
              <button onClick={() => navigate("/signup")} className={styles.textLink}>
                <ArrowLeft size={14} /> Use a different email
              </button>
              <Link to="/login" className={styles.textLink}>
                Sign in instead <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <p className={styles.footer}>
            Need help?{" "}
            <a href="/support" className={styles.footerLink}>Contact Support</a>
          </p>
        </main>
      </div>
    </div>
  );
};

export default CheckEmail;