import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./Landing.module.css";
import ThemeToggle from "../../../components/ThemeToggle/ThemeToggle";

const IcoBolt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IcoTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IcoBrain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66Z" />
  </svg>
);
const IcoTrend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);
const IcoStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IcoArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const IcoPulse = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/>
    <line x1="10" y1="1" x2="10" y2="4"/>
    <line x1="14" y1="1" x2="14" y2="4"/>
  </svg>
);
const IcoMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IcoX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcoGift = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);

function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function StatCounter({ value, suffix, label, inView }) {
  const count = useCounter(value, 2000, inView);
  return (
    <div className={styles.statItem}>
      <div className={styles.statNum}>{count.toLocaleString()}{suffix}</div>
      <div className={styles.statLbl}>{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsRef, statsInView] = useInView(0.3);
  const [featRef, featInView] = useInView(0.1);
  const [howRef, howInView] = useInView(0.2);
  const [testRef, testInView] = useInView(0.2);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const features = [
    { icon: <IcoBolt />,   label: "Adaptive AI",      title: "Workouts That Evolve", desc: "Your plan adjusts in real-time to your energy, schedule, and progress. Every session is uniquely yours.", color: "lime" },
    { icon: <IcoTarget />, label: "Smart Nutrition",   title: "Meals Built for You",  desc: "Calorie targets, macro splits, and full meal plans designed around your goal, diet type, and lifestyle.", color: "sky" },
    { icon: <IcoTrend />,  label: "Progress Tracking", title: "See Every Gain",       desc: "Visual charts, streak counters, and achievement milestones that keep the momentum alive.", color: "rose" },
    { icon: <IcoBrain />,  label: "Holistic Wellness", title: "Mind Meets Body",      desc: "Rest scores, stress tips, and guided breathing built right into your fitness journey.", color: "amber" },
  ];

  const steps = [
    { n: "01", title: "Build your profile",  desc: "Share your goals, fitness level, and dietary preferences. Under 3 minutes.", emoji: "👤" },
    { n: "02", title: "Get your AI plan",    desc: "A personalised workout schedule and nutrition plan designed for your life, instantly.", emoji: "⚡" },
    { n: "03", title: "Track and evolve",    desc: "Log sessions, watch progress, and let the AI refine your plan week by week.", emoji: "📈" },
  ];

  const testimonials = [
    { name: "Priya Sharma", role: "LOST 14 KG · 5 MONTHS",   quote: "FitMitra felt like having a personal trainer AND nutritionist in my pocket. The AI adapts before I even realise I need it.", metric: "−14kg", avatar: "PS" },
    { name: "Arjun Mehta",  role: "GAINED 8 KG LEAN MUSCLE", quote: "The macro-tracking is insanely accurate. Five apps before this — none came close to this level of personalisation.",      metric: "+8kg",  avatar: "AM" },
    { name: "Neha Kapoor",  role: "MARATHON FINISHER",        quote: "Couch to half-marathon in 16 weeks. The streak feature carried me through the hard days.",                                 metric: "21km",  avatar: "NK" },
  ];

  return (
    <div className={styles.page}>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className={`${styles.nav} ${scrolled ? styles.navSolid : ""}`}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark}><IcoPulse /></span>
            {/* Split logo word to match Workout page: FIT + MITRA colored */}
            <span className={styles.logoWord}>FIT<span>MITRA</span></span>
          </Link>

          <ul className={styles.navLinks}>
            {["features","how","stories"].map(id => (
              <li key={id}><a href={`#${id}`}>{id.charAt(0).toUpperCase() + id.slice(1)}</a></li>
            ))}
          </ul>

          <div className={styles.navRight}>
            <ThemeToggle />
            <Link to="/login" className={styles.navSignin}>Sign in</Link>
            <Link to="/signup" className={styles.navBtn}>Get started free →</Link>
          </div>

          <div className={styles.navMobileRight}>
            <ThemeToggle />
            <button className={styles.burger} onClick={() => setMenuOpen(p => !p)} aria-label="Menu">
              {menuOpen ? <IcoX /> : <IcoMenu />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className={styles.drawer}>
            <a href="#features" onClick={() => setMenuOpen(false)}>// Features</a>
            <a href="#how"      onClick={() => setMenuOpen(false)}>// How it works</a>
            <a href="#stories"  onClick={() => setMenuOpen(false)}>// Stories</a>
            <Link to="/login"   onClick={() => setMenuOpen(false)}>Sign in</Link>
            <Link to="/signup" className={styles.drawerCta} onClick={() => setMenuOpen(false)}>
              Get started free →
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden>
          <div className={styles.glow1} />
          <div className={styles.glow2} />
          <div className={styles.gridLines} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.freePill}>
              <span className={styles.freePillIco}><IcoGift /></span>
              100% Free to Use · No Credit Card
            </div>

            <h1 className={styles.heroH}>
              <span className={styles.line1}>Move with</span>
              <span className={styles.line2}>intelligence.</span>
              {/* line3 cursor is handled via CSS ::after */}
              <span className={styles.line3}>Live without limits</span>
            </h1>

            <p className={styles.heroP}>
              FitMitra is your AI-powered fitness coach for Nepal — fully personalised workouts,
              smart meal plans, and real progress tracking. Completely free, forever.
            </p>

            <div className={styles.heroActions}>
              <Link to="/signup" className={styles.heroCta}>
                Start your journey free
                <span className={styles.ctaArrow}><IcoArrow /></span>
              </Link>
              <a href="#how" className={styles.heroGhost}>How it works</a>
            </div>

            <div className={styles.socialProof}>
              <div className={styles.avatarStack}>
                {["R","S","A","M","P"].map((l, i) => (
                  <div className={styles.miniAvatar} key={i} style={{ "--idx": i }}>{l}</div>
                ))}
              </div>
              <p className={styles.proofText}><strong>12,000+</strong> members already transforming</p>
            </div>
          </div>

          <div className={styles.heroRight}>
            {/* Dashboard card */}
            <div className={styles.card}>
              <div className={styles.cardGlow} />
              <div className={styles.cardTop}>
                <div className={styles.cardAvatar}>RK</div>
                <div className={styles.cardMeta}>
                  <div className={styles.cardName}>Rahul Kumar</div>
                  <div className={styles.cardSub}>
                    <span className={styles.dot} />Weight Loss · Week 8
                  </div>
                </div>
                <div className={styles.streakTag}>🔥 14 days</div>
              </div>

              <div className={styles.chartWrap}>
                <div className={styles.chartHeader}>
                  <span className={styles.chartLbl}>Weekly calories burned</span>
                  <span className={styles.chartUp}>↑ 12% this week</span>
                </div>
                <div className={styles.bars}>
                  {[65,80,55,90,72,88,60].map((h, i) => (
                    <div className={styles.barCol} key={i}>
                      <div className={styles.barTrack}>
                        <div
                          className={`${styles.bar} ${i===3||i===5 ? styles.barHot : ""}`}
                          style={{ "--h":`${h}%`, "--d":`${i*0.08}s` }}
                        />
                      </div>
                      <span className={styles.barDay}>{["M","T","W","T","F","S","S"][i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.cardNums}>
                {[["2,340","kcal target"],["-3.2kg","progress"],["87%","adherence"]].map(([v,k],i) => (
                  <div className={styles.cardNum} key={i}>
                    <span className={styles.numVal}>{v}</span>
                    <span className={styles.numKey}>{k}</span>
                  </div>
                ))}
              </div>

              <div className={styles.mealRow}>
                <span className={styles.mealEmoji}>🥗</span>
                <div className={styles.mealInfo}>
                  <div className={styles.mealName}>Next: Dal Tadka Bowl</div>
                  <div className={styles.mealMacro}>420 kcal · 28g protein · 52g carbs</div>
                </div>
                <span className={styles.aiTag}>AI Pick</span>
              </div>
            </div>

            {/* Float chips */}
            <div className={`${styles.float} ${styles.f1}`}>
              <span>✓</span>
              <div><b>Workout logged</b>+480 kcal burned</div>
            </div>
            <div className={`${styles.float} ${styles.f2}`}>
              <span>🎯</span>
              <div><b>Goal on track</b>−2.1kg this month</div>
            </div>
            <div className={`${styles.float} ${styles.f3}`}>
              <span>⚡</span>
              <div><b>Plan adapted</b>Rest day added</div>
            </div>
          </div>
        </div>

        <a href="#features" className={styles.scrollHint} aria-label="Scroll down">
          <div className={styles.scrollPill}><div className={styles.scrollBall} /></div>
        </a>
      </section>

      {/* ── TICKER ───────────────────────────────────────────── */}
      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          {[...Array(2)].map((_, rep) =>
            ["AI Workouts","Smart Nutrition","Sleep Tracking","Progress Analytics","Macro Splits",
             "Adaptive Plans","Recovery Scores","Mindfulness","Calorie Tracking","Health Insights","100% Free"]
            .map((t, i) => (
              <span className={styles.tickItem} key={`${rep}-${i}`} aria-hidden={rep===1}>
                <span className={styles.tickDot} />{t}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section className={styles.stats} ref={statsRef}>
        <div className={styles.statsRow}>
          <StatCounter value={12000} suffix="+" label="Active Members"    inView={statsInView} />
          <div className={styles.vline} />
          <StatCounter value={98}    suffix="%" label="Plan Adherence"    inView={statsInView} />
          <div className={styles.vline} />
          <StatCounter value={4800}  suffix="+" label="Workouts Generated" inView={statsInView} />
          <div className={styles.vline} />
          <StatCounter value={0}     suffix="₹" label="Cost. Always."     inView={statsInView} />
        </div>
      </section>

      {/* ── FREE BANNER ──────────────────────────────────────── */}
      <section className={styles.freeBanner}>
        <div className={styles.freeBannerInner}>
          <div className={styles.freeIco}><IcoGift /></div>
          <div className={styles.freeText}>
            <h3>Completely free. No plans, no paywalls, no tricks.</h3>
            <p>FitMitra is built for Nepal — accessible to everyone, regardless of budget. Every feature, every AI tool, every update. Free forever.</p>
          </div>
          <Link to="/signup" className={styles.freeCta}>Join for free →</Link>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className={styles.features} id="features" ref={featRef}>
        <div className={styles.inner}>
          <div className={styles.secHead}>
            <span className={styles.tag}>What FitMitra does</span>
            <h2 className={styles.secTitle}>Everything your body<br />needs, free.</h2>
            <p className={styles.secSub}>One intelligent platform that replaces the personal trainer, the dietitian, and the wellness app — at no cost.</p>
          </div>
          <div className={styles.featGrid}>
            {features.map((f, i) => (
              <div key={i}
                className={`${styles.featCard} ${styles[`c_${f.color}`]} ${featInView ? styles.visible : ""}`}
                style={{ "--d": `${i * 0.1}s` }}>
                <div className={styles.featNum}>0{i+1}</div>
                <div className={styles.featIco}>{f.icon}</div>
                <span className={styles.featLbl}>{f.label}</span>
                <h3 className={styles.featTitle}>{f.title}</h3>
                <p className={styles.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className={styles.how} id="how" ref={howRef}>
        <div className={styles.inner}>
          <div className={styles.howLayout}>
            <div className={styles.howLeft}>
              <span className={styles.tag}>Simple as it gets</span>
              <h2 className={styles.secTitle}>
                From sign-up to<br />first sweat in<br />
                <em className={styles.howEm}>minutes.</em>
              </h2>
              <p className={styles.secSub} style={{ textAlign:"left", marginLeft:0 }}>
                No overwhelm. No dashboards. Just you, your goal, and an AI that gets it.
              </p>
              <Link to="/signup" className={styles.heroCta} style={{ marginTop:"1rem" }}>
                Start free now <span className={styles.ctaArrow}><IcoArrow /></span>
              </Link>
            </div>
            <div className={styles.howRight}>
              {steps.map((s, i) => (
                <div key={i}
                  className={`${styles.step} ${howInView ? styles.stepVis : ""}`}
                  style={{ "--d": `${i * 0.15}s` }}>
                  <div className={styles.stepLeft}>
                    <div className={styles.stepBadge}>{s.n}</div>
                    {i < steps.length - 1 && <div className={styles.stepLine} />}
                  </div>
                  <div className={styles.stepBody}>
                    <span className={styles.stepEmoji}>{s.emoji}</span>
                    <h3 className={styles.stepTitle}>{s.title}</h3>
                    <p className={styles.stepDesc}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className={styles.stories} id="stories" ref={testRef}>
        <div className={styles.inner}>
          <div className={styles.secHead}>
            <span className={styles.tag}>Real results</span>
            <h2 className={styles.secTitle}>The proof is in<br />the progress.</h2>
          </div>
          <div className={styles.testGrid}>
            {testimonials.map((t, i) => (
              <div key={i}
                className={`${styles.testCard} ${testInView ? styles.visible : ""}`}
                style={{ "--d": `${i * 0.14}s` }}>
                <div className={styles.testMetric}>{t.metric}</div>
                <div className={styles.testStars}>
                  {[...Array(5)].map((_,si) => <span key={si} className={styles.star}><IcoStar /></span>)}
                </div>
                <p className={styles.testQuote}>"{t.quote}"</p>
                <div className={styles.testAuthor}>
                  <div className={styles.testAvatar}>{t.avatar}</div>
                  <div>
                    <div className={styles.testName}>{t.name}</div>
                    <div className={styles.testRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className={styles.finale}>
        <div className={styles.finaleBg} aria-hidden>
          <div className={styles.fo1} /><div className={styles.fo2} />
        </div>
        <div className={styles.finaleInner}>
          <span className={styles.finaleTag}>🚀 Join 12,000+ members · Free forever</span>
          <h2 className={styles.finaleH}>
            Your best shape is<br />
            <span className={styles.finaleAccent}>one decision away.</span>
          </h2>
          <p className={styles.finaleP}>No credit card. No trial. No hidden charges. Just results.</p>
          <div className={styles.finaleActions}>
            <Link to="/signup" className={styles.finaleBtn}>
              Get started for free <span><IcoArrow /></span>
            </Link>
            <Link to="/login" className={styles.finaleLink}>Already a member? Sign in</Link>
          </div>
        </div>
      </section>

    </div>
  );
}