import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Info, Star } from "lucide-react";
import styles from "./VerifyPendingEmail.module.css";

const VerifyEmailPending = () => {
  const location = useLocation();
  const email = location.state?.email || "your email";
  const message =
    location.state?.message ||
    "Please check your email and enter the 6-digit code to verify your account.";

  const leftSteps = [
    { n: "01", title: "Open your email",  desc: `Check the inbox for ${email}` },
    { n: "02", title: "Copy the code",    desc: "Find the 6-digit OTP we sent you" },
    { n: "03", title: "Enter & verify",   desc: "Paste it on the next screen — expires in 10 min" },
  ];

  return (
    <div className={styles.page}>
      <Link to="/login" className={styles.backBtn}>
        <ArrowLeft size={18} />
        <span>Back to Sign In</span>
      </Link>

      {/* DECORATIVE */}
      <div className={styles.ambientOrb1} />
      <div className={styles.ambientOrb2} />

      <div className={styles.pageInner}>

        {/* LEFT COLUMN */}
        <div className={styles.heroCol}>
          <div className={styles.heroTag}>Account Verification</div>
          <h1 className={styles.heroTitle}>
            One step <span>away.</span>
          </h1>
          <p className={styles.heroDesc}>
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

        {/* RIGHT COLUMN */}
        <main className={styles.main}>
          <div className={styles.card}>

            <div className={styles.mailWrap}>
              <div className={styles.mailRing}>
                <Mail size={28} />
              </div>
            </div>

            <h2 className={styles.title}>Check Your Email</h2>
            <p className={styles.subtitle}>{message}</p>
            <p className={styles.emailVal}>{email}</p>

            <div className={styles.infoBox}>
              <div className={styles.infoHeader}>
                <Info size={16} />
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
              <Star size={16} />
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
                Enter Verification Code
              </Link>
              <Link to="/signup" className={styles.btnSecondary}>
                Create a different account
              </Link>
            </div>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>Need assistance?</span>
              <div className={styles.dividerLine} />
            </div>

            <p className={styles.helpText}>
              Having trouble?{" "}
              <a href="/support" className={styles.supportLink}>Contact Support</a>
            </p>

          </div>

          <p className={styles.footer}>
            Questions about verification?{" "}
            <a href="/faq" className={styles.footerLink}>Visit our FAQ</a>
          </p>
        </main>

      </div>
    </div>
  );
};

export default VerifyEmailPending;