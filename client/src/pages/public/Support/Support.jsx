import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Support.module.css";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";

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
const IcoCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoLoader = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinIcon}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const IcoChevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IcoAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcoTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IcoZap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IcoLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IcoTrend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);
const IcoUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const FAQ_CATEGORIES = [
  {
    icon: <IcoZap />,
    label: "Getting Started",
    color: "lime",
    faqs: [
      { q: "How do I create my FitMitra account?", a: "Sign up at fitmitra.com with your email. We'll send a 6-digit verification code — enter it and you're in. The whole process takes under 2 minutes." },
      { q: "Is FitMitra really free?", a: "Yes — 100% free, forever. No hidden plans, no trial periods, no credit card required. Every feature including AI workouts, meal plans, and progress tracking is completely free." },
      { q: "How does the AI personalise my plan?", a: "During onboarding we ask about your goals, fitness level, diet type, and schedule. Our AI generates a workout and nutrition plan tailored specifically to you, and refines it as you log sessions." },
    ],
  },
  {
    icon: <IcoTarget />,
    label: "Workouts & Nutrition",
    color: "orange",
    faqs: [
      { q: "Can I customise my workout plan?", a: "Absolutely. You can swap exercises, adjust difficulty, change session length, or mark rest days. The AI will adapt future sessions to account for any changes you make." },
      { q: "How does meal planning work?", a: "Based on your calorie target and macro goals, FitMitra generates daily meal plans with locally familiar foods. You can swap meals, log what you actually ate, and see real-time macro tracking." },
      { q: "What if I miss a workout?", a: "No worries — just log it as skipped. The AI will redistribute the week's training load so you don't fall behind. Streaks are paused, not broken, for rest days you plan in advance." },
    ],
  },
  {
    icon: <IcoTrend />,
    label: "Progress & Data",
    color: "cyan",
    faqs: [
      { q: "How is my progress tracked?", a: "Log each workout to record sets, reps, weight, and duration. Your dashboard shows weekly summaries, streak counters, body metrics over time, and AI-generated insights on your improvements." },
      { q: "Can I export my workout history?", a: "Yes. Head to Settings → Data → Export. You can download a CSV of your complete workout and nutrition history at any time." },
      { q: "Does FitMitra sync with other apps?", a: "We're working on integrations with Google Fit and Apple Health. For now you can manually import weight data from the Settings page." },
    ],
  },
  {
    icon: <IcoLock />,
    label: "Account & Security",
    color: "amber",
    faqs: [
      { q: "How do I reset my password?", a: "Go to the Sign In page and click 'Forgot Password'. Enter your email and we'll send a 6-digit reset code. Codes expire in 10 minutes." },
      { q: "How do I delete my account?", a: "Go to Settings → Account → Delete Account. This permanently removes all your data. The action cannot be undone, so make sure to export your data first if you need it." },
      { q: "Is my data secure?", a: "All data is encrypted at rest and in transit. We never sell your personal information. You can review our full privacy policy at fitmitra.com/privacy." },
    ],
  },
];

const ISSUE_TYPES = [
  "Account / Login", "Workout Plan", "Nutrition / Meals",
  "Progress Tracking", "Billing / Payments", "Bug Report",
  "Feature Request", "Other",
];

const Support = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", issueType: "", message: "" });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleFaqToggle = (idx) => setOpenFaq(openFaq === idx ? null : idx);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: "" }));
    if (formError) setFormError(null);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim())    errs.name    = "Name is required";
    if (!form.email.trim())   errs.email   = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.issueType)      errs.issueType = "Please select an issue type";
    if (!form.message.trim()) errs.message  = "Message is required";
    else if (form.message.trim().length < 20) errs.message = "Please describe your issue in more detail";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await new Promise((r) => setTimeout(r, 1400));
      setFormSuccess(true);
    } catch {
      setFormError("Something went wrong. Please try again or email us directly.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />
      <div className={styles.grid} />

      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandIcon}><IcoPulse /></span>
            <span className={styles.brandName}>FitMitra</span>
          </Link>
          <div className={styles.navRight}>
            <ThemeToggle />
            <Link to="/" className={styles.navBack}>
              <IcoArrowLeft /> Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className={styles.pageInner}>

        {/* HERO */}
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Support Centre</span>
          <h1 className={styles.heroTitle}>
            How can we<br /><span>help you?</span>
          </h1>
          <p className={styles.heroSub}>
            Find answers in the FAQ below, or send us a message and we'll get
            back to you within 24 hours.
          </p>
          <div className={styles.quickLinks}>
            {[
              { icon: <IcoUser />,  label: "Account Issues", href: "#contact" },
              { icon: <IcoZap />,   label: "Workouts",       href: "#faq"     },
              { icon: <IcoLock />,  label: "Password Reset", href: "/forgot-password" },
              { icon: <IcoMail />,  label: "Email Us",       href: "#contact" },
            ].map((l, i) => (
              <a key={i} href={l.href} className={styles.quickLink}>
                <span className={styles.quickLinkIcon}>{l.icon}</span>
                <span>{l.label}</span>
                <IcoArrowRight />
              </a>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.faqSection} id="faq">
          <div className={styles.sectionHead}>
            <span className={styles.tag}>Frequently Asked</span>
            <h2 className={styles.sectionTitle}>Quick answers</h2>
          </div>
          <div className={styles.catTabs}>
            {FAQ_CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={() => { setActiveCategory(i); setOpenFaq(null); }}
                className={`${styles.catTab} ${styles[`cat_${cat.color}`]} ${activeCategory === i ? styles.catTabActive : ""}`}
              >
                <span className={styles.catTabIcon}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
          <div className={styles.faqList}>
            {FAQ_CATEGORIES[activeCategory].faqs.map((faq, i) => (
              <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ""}`}>
                <button className={styles.faqQuestion} onClick={() => handleFaqToggle(i)}>
                  <span>{faq.q}</span>
                  <span className={styles.faqChevron}><IcoChevron /></span>
                </button>
                {openFaq === i && (
                  <div className={styles.faqAnswer}><p>{faq.a}</p></div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CONTACT */}
        <section className={styles.contactSection} id="contact">
          <div className={styles.contactLayout}>
            <div className={styles.contactInfo}>
              <span className={styles.tag}>Still need help?</span>
              <h2 className={styles.sectionTitle}>Send us a message</h2>
              <p className={styles.contactDesc}>
                Can't find what you need? Our support team responds within 24 hours on weekdays.
              </p>
              <div className={styles.contactCards}>
                <div className={styles.contactCard}>
                  <div className={styles.contactCardIcon}><IcoMail /></div>
                  <div>
                    <div className={styles.contactCardTitle}>Email Support</div>
                    <div className={styles.contactCardVal}>fitmitra.ai.co@gmail.com</div>
                  </div>
                </div>
                <div className={styles.contactCard}>
                  <div className={styles.contactCardIcon}><IcoZap /></div>
                  <div>
                    <div className={styles.contactCardTitle}>Response Time</div>
                    <div className={styles.contactCardVal}>Within 24 hours</div>
                  </div>
                </div>
                <div className={styles.contactCard}>
                  <div className={styles.contactCardIcon}><IcoTarget /></div>
                  <div>
                    <div className={styles.contactCardTitle}>Support Hours</div>
                    <div className={styles.contactCardVal}>Mon – Fri, 9am – 6pm NPT</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.formCard}>
              <div className={styles.formCardGlow} />
              {formSuccess ? (
                <div className={styles.successState}>
                  <div className={styles.successRing}><IcoCheck /></div>
                  <h3 className={styles.successTitle}>Message Sent!</h3>
                  <p className={styles.successDesc}>
                    We've received your message and will get back to you within 24 hours.
                    Check your inbox for a confirmation.
                  </p>
                  <button
                    onClick={() => { setFormSuccess(false); setForm({ name: "", email: "", issueType: "", message: "" }); }}
                    className={styles.btnSecondary}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.formCardHeader}>
                    <div className={styles.logoRow}>
                      <span className={styles.logoPulse}><IcoPulse /></span>
                    </div>
                    <h3 className={styles.formCardTitle}>Contact Support</h3>
                    <p className={styles.formCardSub}>We'll respond within 24 hours</p>
                  </div>

                  {formError && (
                    <div className={styles.errorAlert}>
                      <IcoAlert /><p>{formError}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input
                          type="text" name="name"
                          value={form.name} onChange={handleFormChange}
                          placeholder="Your name" disabled={formLoading}
                          className={`${styles.input} ${formErrors.name ? styles.inputError : ""}`}
                        />
                        {formErrors.name && <p className={styles.fieldError}>{formErrors.name}</p>}
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                          type="email" name="email"
                          value={form.email} onChange={handleFormChange}
                          placeholder="you@example.com" disabled={formLoading}
                          className={`${styles.input} ${formErrors.email ? styles.inputError : ""}`}
                        />
                        {formErrors.email && <p className={styles.fieldError}>{formErrors.email}</p>}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Issue Type</label>
                      <select
                        name="issueType" value={form.issueType} onChange={handleFormChange}
                        disabled={formLoading}
                        className={`${styles.input} ${styles.select} ${formErrors.issueType ? styles.inputError : ""}`}
                      >
                        <option value="">Select a category...</option>
                        {ISSUE_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {formErrors.issueType && <p className={styles.fieldError}>{formErrors.issueType}</p>}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Message</label>
                      <textarea
                        name="message" value={form.message} onChange={handleFormChange}
                        placeholder="Describe your issue in detail..."
                        rows={5} disabled={formLoading}
                        className={`${styles.input} ${styles.textarea} ${formErrors.message ? styles.inputError : ""}`}
                      />
                      <div className={styles.charCount}>{form.message.length} / 1000</div>
                      {formErrors.message && <p className={styles.fieldError}>{formErrors.message}</p>}
                    </div>

                    <button type="submit" disabled={formLoading} className={styles.btnPrimary}>
                      {formLoading
                        ? <><IcoLoader /> Sending Message...</>
                        : <><IcoMail /> Send Message</>}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandIcon}><IcoPulse /></span>
            <span className={styles.brandName}>FitMitra</span>
          </Link>
          <p className={styles.footerText}>
            © {new Date().getFullYear()} FitMitra · Built for Nepal · Free forever
          </p>
          <div className={styles.footerLinks}>
            <a href="/privacy" className={styles.footerLink}>Privacy</a>
            <a href="/terms"   className={styles.footerLink}>Terms</a>
            <a href="/faq"     className={styles.footerLink}>FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Support;