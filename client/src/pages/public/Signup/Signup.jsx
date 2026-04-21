import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { User, Mail, Lock, Loader2, Aperture, Eye, EyeOff, ArrowLeft } from "lucide-react";
import styles from "./Signup.module.css";
import BackgroundVideo from "../../../components/BackgroundVideo/BackgroundVideo";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: "" }));
    if (error) clearError();
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Username is required";
    else if (formData.name.trim().length < 2) errors.name = "Username must be at least 2 characters";
    
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = "Email is invalid";
    
    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 8) errors.password = "Password must be at least 8 characters";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      setValidationErrors({ terms: "You must agree to the terms to continue." });
      return;
    }
    if (!validate()) return;
    
    try {
      const result = await signup(formData.name, formData.email, formData.password);
      navigate("/verify-email", {
        state: {
          email: formData.email,
          message: result?.message || "Account created. Please verify your email.",
        },
      });
    } catch (err) {
      console.error("Signup error:", err);
    }
  };

  return (
    <div className={styles.page}>
      <BackgroundVideo src="/videos/auth_bg.mp4" opacity={0.3} />
      <Link to="/" className={styles.backBtn}>
        <ArrowLeft size={18} />
        <span>Back to Home</span>
      </Link>



      
      <div className={styles.pageInner}>
        {/* LEFT COLUMN: HERO TEXT */}
        <div className={styles.heroCol}>
          <div className={styles.heroTag}>Start Your Journey</div>
          <h1 className={styles.heroTitle}>Build a Better You.</h1>
          <p className={styles.heroDesc}>
            Join thousands of others transforming their bodies and minds. 
            Get guided workouts, expert nutrition plans, and daily motivation all in one place.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.statVal}>10k+</span>
              <span className={styles.statLbl}>Active Users</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.statVal}>500+</span>
              <span className={styles.statLbl}>Guided Plans</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN FORM */}
        <main className={styles.main}>
          <div className={styles.card}>
            <div className={styles.iconWrap}>
              <Aperture size={32} />
            </div>
            <h2 className={styles.cardTitle}>Create Account</h2>
            <p className={styles.cardSubtitle}>Start your fitness journey today and build a better you.</p>
            
            {error && <div className={styles.globalError}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Username */}
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Username</label>
                <div className={styles.inputWrap}>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Choose a username"
                    className={`${styles.input} ${validationErrors.name ? styles.inputError : ""}`}
                  />
                  <User size={16} className={styles.inputIcon} style={{ pointerEvents: 'none' }} />
                </div>
                {validationErrors.name && <p className={styles.errorText}>{validationErrors.name}</p>}
              </div>

              {/* Email */}
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email Address</label>
                <div className={styles.inputWrap}>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Enter your email"
                    className={`${styles.input} ${validationErrors.email ? styles.inputError : ""}`}
                  />
                  <Mail size={16} className={styles.inputIcon} style={{ pointerEvents: 'none' }} />
                </div>
                {validationErrors.email && <p className={styles.errorText}>{validationErrors.email}</p>}
              </div>

              {/* Password */}
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <div className={styles.inputWrap}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="••••••••"
                    className={`${styles.input} ${validationErrors.password ? styles.inputError : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.inputIcon}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {validationErrors.password && <p className={styles.errorText}>{validationErrors.password}</p>}
              </div>

              <div className={styles.optionsRow}>
                <div className={styles.checkboxWrap}>
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (validationErrors.terms) setValidationErrors(prev => ({ ...prev, terms: "" }));
                    }}
                    disabled={isLoading}
                    className={styles.checkbox}
                  />
                  <label htmlFor="terms" className={styles.checkboxLabel}>
                    I agree to the terms
                  </label>
                </div>
              </div>
              {validationErrors.terms && <p style={{marginTop: '-0.5rem'}} className={styles.errorText}>{validationErrors.terms}</p>}

              <button type="submit" disabled={isLoading} className={styles.submitBtn}>
                 {isLoading ? <Loader2 size={18} className={styles.spin} /> : "Sign Up"}
              </button>

              <p className={styles.authHint}>
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}