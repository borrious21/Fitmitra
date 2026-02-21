import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext"; // ✅ ADD THIS

// Pages
import Landing from "./pages/public/Landing/Landing";
import Login from "./pages/public/Login/Login";
import VerifyEmail from "./pages/public/VerifyEmail/VerifyEmail"; // ✅ ADD THIS

function NotFound() {
  return <h1>404 - Page Not Found</h1>;
}

function App() {
  return (
    <AuthProvider> {/* ✅ FIX */}
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} /> 
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;