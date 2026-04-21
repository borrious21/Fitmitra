import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";

const IcoPulse = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IcoHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IcoArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IcoZap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const NotFound = () => {
  return (
    <div className={styles.page}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />
      <div className={styles.grid} />

      {/* NAV */}
      <div className={styles.nav}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandIcon}><IcoPulse /></span>
          <span className={styles.brandName}>FitMitra</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className={styles.inner}>
        <div className={styles.heroNum}>
          <span className={styles.num4a}>4</span>
          <span className={styles.numIcon}><IcoZap /></span>
          <span className={styles.num4b}>4</span>
        </div>

        <div className={styles.card}>
          <div className={styles.cardGlow} />
          <div className={styles.cardTop}>
            <span className={styles.eyebrow}>Lost your route?</span>
            <h1 className={styles.title}>Page Not Found</h1>
            <p className={styles.subtitle}>
              The page you're looking for doesn't exist. It might have been
              moved, deleted, or you may have taken a wrong turn.
            </p>
          </div>
          <div className={styles.actions}>
            <Link to="/dashboard" className={styles.btnPrimary}>
              <IcoHome /> Go to Dashboard
            </Link>
            <button onClick={() => window.history.back()} className={styles.btnSecondary}>
              <IcoArrowLeft /> Go Back
            </button>
          </div>
        </div>

        <p className={styles.help}>
          Think this is a mistake?{" "}
          <Link to="/contact-support" className={styles.helpLink}>
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
};

export default NotFound;