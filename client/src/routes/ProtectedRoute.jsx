import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children, allowOnboarding = false }) => {
  const { isAuthenticated, isInitializing, user } = useContext(AuthContext);
  const location = useLocation();

  if (isInitializing) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
      }}>
        <Loader2 style={{ width: 48, height: 48, animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#6b7280", fontWeight: 500 }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasOnboarded =
    user?.hasCompletedOnboarding ?? user?.has_completed_onboarding ?? false;

  // Not onboarded → send to onboarding (unless already there)
  if (!hasOnboarded && !allowOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // Already onboarded → don't let them back to /onboarding
  if (hasOnboarded && allowOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;