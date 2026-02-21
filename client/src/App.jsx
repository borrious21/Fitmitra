import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Pages
import Landing from "../pages/public/LandingPage/Landing";
import Login from "../pages/public/Login/Login";
import Signup from "../pages/public/signup/Signup";
import ForgotPassword from "../pages/public/ForgotPassword/Forgotpassword";
import ResetPassword from "../pages/public/ResetPassword/Resetpassword";
import VerifyEmail from "../pages/public/Verifyemail/Verifyemail";
import VerifyEmailPending from "../pages/public/VerifyPendingEmail/verifyemailpending";
import NotFound from "../pages/public/NotFound";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public / Auth Pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email-pending" element={<VerifyEmailPending />} />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
