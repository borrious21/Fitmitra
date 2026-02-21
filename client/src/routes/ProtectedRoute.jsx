import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children, allowOnboarding = false }) => {
  const { isAuthenticated, isInitializing, user } = useContext(AuthContext);

  // Loader while checking auth
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // ✅ FIX: Normalize both camelCase and snake_case — JWT may use either
  const hasCompletedOnboarding =
    user?.hasCompletedOnboarding ?? user?.has_completed_onboarding ?? false;

  // Redirect to onboarding if user hasn't completed it
  if (!hasCompletedOnboarding && !allowOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has completed onboarding but tries to visit /onboarding, redirect to dashboard
  if (hasCompletedOnboarding && allowOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;