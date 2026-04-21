import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import styles from "./Landing.module.css";
import { CheckCircle2, User, Camera, Bell, Star, ArrowRight, Zap, Smartphone, UserPlus, Dumbbell, TrendingUp } from "lucide-react";
import BackgroundVideo from "../../../components/BackgroundVideo/BackgroundVideo";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
};

export default function LandingPage() {
  const heroRef = useRef(null);
  const featRef = useRef(null);
  const howRef = useRef(null);
  const { scrollYProgress: heroOuterScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroImgY = useTransform(heroOuterScroll, [0, 1], [0, 120]);
  const heroTextY = useTransform(heroOuterScroll, [0, 1], [0, -40]);
  const heroBadgeY = useTransform(heroOuterScroll, [0, 1], [0, -80]);
  const { scrollYProgress: featScroll } = useScroll({
    target: featRef,
    offset: ["start end", "end start"]
  });
  const featH2Y = useTransform(featScroll, [0, 0.5], [60, 0]);
  const bento1Y = useTransform(featScroll, [0.1, 0.8], [140, -40]); 
  const bento2Y = useTransform(featScroll, [0.15, 0.85], [180, 20]); 
  const bento3Y = useTransform(featScroll, [0.2, 0.9], [100, -60]); 
  const bento4Y = useTransform(featScroll, [0.25, 0.95], [200, -20]); 

  const { scrollYProgress: howScroll } = useScroll({
    target: howRef,
    offset: ["start 70%", "end 80%"]
  });
  const lineScale = useTransform(howScroll, [0, 1], [0, 1]);

  return (
    <div className={styles.page}>
      <BackgroundVideo src="https://res.cloudinary.com/dir5oumz5/video/upload/v1775957129/auth_bg_duj78f.mp4" opacity={0.3} />

      <div className={styles.contentWrapper}>

        {/* ── NAV ── */}
        <nav className={styles.nav}>
          <div className={`${styles.inner} ${styles.navInner}`}>
            <Link to="/" className={styles.logo}>
              <div className={styles.logoIcon} />
              FitMitra
            </Link>
            <ul className={styles.navLinks}>
              <li><a href="#home">Home</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#community">How it Works</a></li>
            </ul>
            <div className={styles.navRight}>
              <Link to="/login" className={styles.btnOutline}>Log In</Link>
              <Link to="/signup" className={styles.btnPrimary}>Get Started</Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className={styles.hero} id="home" ref={heroRef}>
          <div className={`${styles.inner} ${styles.heroInner}`}>
            <motion.div
              style={{ y: heroTextY }}
              className={styles.heroLeft}
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div variants={fadeUp} style={{ y: heroBadgeY }} className={styles.heroBadge}>
                <Zap size={12} />
                #1 Smart Fitness Platform
              </motion.div>

              <motion.h1 variants={fadeUp} className={styles.heroH}>
                { "Train Smarter,".split(" ").map((w,i) => (
                  <motion.span key={i} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.1 + 0.5}} style={{display:'inline-block', marginRight:'0.3rem'}}>{w}</motion.span>
                ))}
                <span className={styles.accent}>
                  { "Live Better.".split(" ").map((w,i) => (
                    <motion.span key={i} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.1 + 0.8}} style={{display:'inline-block', marginRight:'0.3rem'}}>{w}</motion.span>
                  ))}
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className={styles.heroP}>
                Personalized workouts, AI-powered plans, and community support — all in one premium fitness experience.
              </motion.p>

              <motion.div variants={fadeUp} className={styles.heroActions}>
                <Link to="/signup" className={styles.btnPrimary}>
                  Start for Free <ArrowRight size={16} />
                </Link>
                <Link to="/login" className={styles.btnOutline}>
                  Sign In
                </Link>
              </motion.div>
            </motion.div>

            <div className={styles.heroRight}>
              <motion.img
                style={{ y: heroImgY }}
                src="https://res.cloudinary.com/dir5oumz5/image/upload/v1776733193/dark_mockup_kbm8bi.png"
                alt="FitMitra App Mockup"
                className={styles.heroImage}
              />
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className={styles.features} id="features" ref={featRef}>
          <div className={styles.inner}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
            >
              <motion.div variants={fadeUp} className={styles.sectionTag}>
                <Zap size={12} /> Our Features
              </motion.div>
              <motion.h2 variants={fadeUp} style={{ y: featH2Y }} className={styles.sectionH}>
                Everything you need to crush your goals
              </motion.h2>
              <motion.p variants={fadeUp} className={styles.sectionP}>
                Built for athletes at every level — from beginners to pros, FitMitra adapts to you.
              </motion.p>

              <motion.div className={styles.bentoGrid}>
                {/* LARGE FEATURE */}
                <motion.div variants={fadeUp} style={{ y: bento1Y }} className={`${styles.bentoCard} ${styles.bentoMain}`}>
                  <div className={styles.featIconWrap}><User size={24} /></div>
                  <h3 className={styles.featTitle}>AI-Personalized Journey</h3>
                  <p className={styles.featText}>Our proprietary algorithms adapt your workout plan daily based on heart rate, recovery metrics, and performance trends. It's like having a world-class coach in your pocket 24/7.</p>
                  <div className={styles.bentoGraphic}>
                    <div className={styles.pulseRing} />
                    <TrendingUp size={120} color="var(--neon)" opacity={0.15} />
                  </div>
                </motion.div>

                {/* SENSORS */}
                <motion.div variants={fadeUp} style={{ y: bento2Y }} className={styles.bentoCard}>
                  <div className={styles.featIconWrap}><Camera size={24} /></div>
                  <h3 className={styles.featTitle}>Progress Monitoring</h3>
                  <p className={styles.featText}>Real-time tracking of every rep, calorie, and heartbeat with stunning visuals.</p>
                </motion.div>

                {/* STATS INTEGRATED */}
                <motion.div variants={fadeUp} style={{ y: bento3Y }} className={`${styles.bentoCard} ${styles.bentoStats}`}>
                  <div className={styles.statMini}>
                    <span className={styles.statNum}>100K+</span>
                    <span className={styles.statLabel}>Global Athletes</span>
                  </div>
                  <div className={styles.avatarMiniRow}>
                    {[
                      { i: 'KM', c: '#FF5C1A' }, { i: 'SR', c: '#8b5cf6' },
                      { i: 'JP', c: '#00C8E0' }, { i: 'AP', c: '#CCFF00' }
                    ].map(({ i, c }) => (
                      <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', marginLeft: '-12px', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#0b0d17' }}>{i}</div>
                    ))}
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', marginLeft: '-12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800 }}>+99K</div>
                  </div>
                </motion.div>

                {/* WIDE FOOTER FEATURE */}
                <motion.div variants={fadeUp} style={{ y: bento4Y }} className={`${styles.bentoCard} ${styles.bentoWide}`}>
                   <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                      <div className={styles.featIconWrap}><Bell size={24} /></div>
                      <div>
                        <h3 className={styles.featTitle}>Dynamic Community</h3>
                        <p className={styles.featText}>Connect with thousands of motivated members. Share achievements, join challenges, and stay accountable with real-time feedback.</p>
                      </div>
                   </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className={styles.how} id="community" ref={howRef}>
          <div className={styles.inner}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className={styles.howHeader}
            >
              <div className={styles.sectionTag} style={{ justifyContent: 'center' }}><Zap size={12} /> How To Start</div>
              <h2 className={styles.sectionH} style={{ margin: '0 auto', textAlign: 'center' }}>
                Getting started is simple
              </h2>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                {[
                  { i: 'AR', c: '#FF5C1A' }, { i: 'PK', c: '#8b5cf6' }, { i: 'SM', c: '#00C8E0' }
                ].map(({ i, c }, idx) => (
                  <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', marginLeft: idx === 0 ? 0 : -12, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#0b0d17' }}>{i}</div>
                ))}
              </div>
              <p style={{ textAlign: 'center', maxWidth: 480, margin: '1rem auto 0' }}>
                Four steps to a fitter, stronger and healthier you.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
              className={styles.howTimeline}
            >
              {[
                { icon: <Smartphone size={32} />, title: "Sign Up", text: "Create your free account" },
                { icon: <UserPlus size={32} />, title: "Profile", text: "Set your AI fitness goals" },
                { icon: <Dumbbell size={32} />, title: "Train", text: "Follow guided sessions" },
                { icon: <TrendingUp size={32} />, title: "Evolve", text: "Track growth & reach pro" },
              ].map((s, i) => (
                <motion.div key={i} variants={fadeUp} className={styles.howStep}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepNum}>{i + 1}</div>
                    <div className={styles.stepLine}>
                       <motion.div 
                        className={styles.lineFill} 
                        style={{ scaleX: lineScale, transformOrigin: 'left' }} 
                       />
                    </div>
                  </div>
                  <div className={styles.stepBody}>
                    <div className={styles.stepIcon}>{s.icon}</div>
                    <h4 className={styles.howTitle}>{s.title}</h4>
                    <p className={styles.howText}>{s.text}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className={styles.cta}>
          <div className={styles.inner}>
            <motion.div
              className={styles.ctaBox}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className={styles.ctaH}>Ready to Transform?</h2>
              <p className={styles.ctaP}>
                Join 100,000+ people achieving their fitness goals with FitMitra. Start free — no credit card required.
              </p>
              <div className={styles.ctaActions}>
                <Link to="/signup" className={styles.btnPrimary}>
                  Start for Free <ArrowRight size={16} />
                </Link>
                <Link to="/login" className={styles.btnOutline}>I already have an account</Link>
              </div>
              <div className={styles.avatarStack}>
                <div className={styles.avatarRow}>
                  {[
                    { i: 'AR', c: '#FF5C1A' }, { i: 'PK', c: '#8b5cf6' },
                    { i: 'SM', c: '#00C8E0' }, { i: 'RJ', c: '#CCFF00' }, { i: 'VT', c: '#ef4444' }
                  ].map(({ i, c }) => (
                    <div key={i} style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', marginLeft: '-14px', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#0b0d17', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>{i}</div>
                  ))}
                </div>
                <span className={styles.avatarText}>Join 100K+ members today</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className={styles.footer}>
          <div className={styles.inner}>
            <div className={styles.footerGrid}>
              <div className={styles.footerCol}>
                <Link to="/" className={styles.footerLogo}>
                  <div className={styles.logoIcon} /> FitMitra
                </Link>
                <p className={styles.footerDesc}>Smarter training, data-driven fitness for everyone, everywhere.</p>
                <div className={styles.footerSocials}>
                  <a href="#" className={styles.socialIcon}>IG</a>
                  <a href="#" className={styles.socialIcon}>IN</a>
                  <a href="#" className={styles.socialIcon}>FB</a>
                  <a href="#" className={styles.socialIcon}>X</a>
                </div>
              </div>
              <div className={styles.footerCol}>
                <h4>Company</h4>
                <a href="#">About</a>
                <a href="#">Community</a>
                <a href="#">Blog</a>
              </div>
              <div className={styles.footerCol}>
                <h4>Contact</h4>
                <a href="#">Email</a>
                <a href="#">Customer Service</a>
                <a href="#">FAQ</a>
              </div>
              <div className={styles.footerCol}>
                <h4>Policy</h4>
                <a href="#">Terms of service</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Legal</a>
              </div>
              <div className={styles.footerCol}>
                <h4>Career</h4>
                <a href="#">Hiring</a>
                <a href="#">Internship</a>
                <a href="#">Meet Our Team</a>
              </div>
            </div>
            <div className={styles.footerBottom}>
              Copyright © 2026 FitMitra. All Rights Reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}