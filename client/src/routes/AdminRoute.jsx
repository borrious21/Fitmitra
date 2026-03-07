import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { isAuthenticated, user, isInitializing } = useContext(AuthContext);

  if (isInitializing) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role ?? user.user_role ?? "";
  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}