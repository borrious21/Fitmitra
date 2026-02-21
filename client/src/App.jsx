import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext"; 

// Pages
import Landing from "./pages/public/Landing/Landing";
import Signup from "./pages/public/Signup/Signup";
import Login from "./pages/public/Login/Login";
import VerifyEmail from "./pages/public/VerifyEmail/VerifyEmail"; 
import VerifyEmailPending from "./pages/public/VerifyPendingEmail/VerifyPendingEmail"; 
import ResetPassword from "./pages/public/ResetPassword/ResetPassword";
import ForgotPassword from "./pages/public/ForgotPassword/ForgotPassword";
import NotFound from "./pages/public/Notfound/NotFound";
import CheckEmail from "./pages/public/CheckEmail/CheckEmail";
import ContactSupport from "./pages/public/Support/Support";

function App() {
  return (
    <AuthProvider> 
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} /> 
            <Route path="/verify-pending-email" element={<VerifyEmailPending />} /> 
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="/check-email" element={<CheckEmail />} />
            <Route path="/contact-support" element={<ContactSupport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;