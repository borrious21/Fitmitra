import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

// Pages
import Landing            from "./pages/public/Landing/Landing";
import Signup             from "./pages/public/Signup/Signup";
import Login              from "./pages/public/Login/Login";
import VerifyEmail        from "./pages/public/VerifyEmail/VerifyEmail";
import VerifyEmailPending from "./pages/public/VerifyPendingEmail/VerifyPendingEmail";
import ResetPassword      from "./pages/public/ResetPassword/ResetPassword";
import ForgotPassword     from "./pages/public/ForgotPassword/ForgotPassword";
import NotFound           from "./pages/public/Notfound/NotFound";
import CheckEmail         from "./pages/public/CheckEmail/CheckEmail";
import ContactSupport     from "./pages/public/Support/Support";
import Onboarding         from "./pages/protected/Onboarding/Onboarding";
import Dashboard          from "./pages/protected/Dashboard/Dashboard";
import Profile            from "./pages/protected/profile/Profile";
import Plans              from "./pages/protected/Dashboard/Plans/Plans";
import LogMeal            from "./pages/protected/Dashboard/Logmeal/Logmeal";
import Workout            from "./pages/protected/Dashboard/workout/workout";
import Progress           from "./pages/protected/Dashboard/Progress/Progress";
import MealPlanner        from "./pages/protected/Dashboard/MealPlanner/Mealplanner";

import AdminLayout        from "./pages/protected/Admin/AdminLayout/AdminLayout";  
import AdminDashboard     from "./pages/protected/Admin/AdminDashboard";
import AdminUsers         from "./pages/protected/Admin/Sections/AdminUsers/AdminUsers";
import AdminMeals      from "./pages/protected/Admin/Sections/AdminMeals/AdminMeals";
import AdminExercises  from "./pages/protected/Admin/Sections/AdminExercises/AdminExercises";
import AdminPlans      from "./pages/protected/Admin/Sections/AdminPlans/AdminPlans";
import AdminLogs       from "./pages/protected/Admin/Sections/AdminLogs/AdminLogs";
import AdminAnalytics  from "./pages/protected/Admin/Sections/AdminAnalytics/AdminAnalytics";
import AdminNotifications from "./pages/protected/Admin/Sections/AdminNotification/AdminNotfications";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* ── Public ─────────────────────────────────────────────────── */}
            <Route path="/"                      element={<Landing />} />
            <Route path="/signup"                element={<Signup />} />
            <Route path="/login"                 element={<Login />} />
            <Route path="/verify-email"          element={<VerifyEmail />} />
            <Route path="/verify-pending-email"  element={<VerifyEmailPending />} />
            <Route path="/reset-password"        element={<ResetPassword />} />
            <Route path="/forgot-password"       element={<ForgotPassword />} />
            <Route path="/404"                   element={<NotFound />} />
            <Route path="/check-email"           element={<CheckEmail />} />
            <Route path="/contact-support"       element={<ContactSupport />} />

            {/* ── Admin — nested inside AdminLayout (sidebar persists) ──── */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index          element={<AdminDashboard />} />
              <Route path="users"   element={<AdminUsers />} />
              {<Route path="meals"         element={<AdminMeals />} /> }
              {<Route path="exercises"     element={<AdminExercises />} /> }
              {<Route path="plans"         element={<AdminPlans />} /> }
              {<Route path="logs"          element={<AdminLogs />} /> }
              {<Route path="analytics"     element={<AdminAnalytics />} /> }
              {<Route path="notifications" element={<AdminNotifications />} /> }
            </Route>

            {/* ── Protected user routes ───────────────────────────────────── */}
            <Route path="/onboarding" element={<ProtectedRoute allowOnboarding={true}><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/plans"      element={<ProtectedRoute><Plans /></ProtectedRoute>} />
            <Route path="/meal-plan"  element={<ProtectedRoute><MealPlanner /></ProtectedRoute>} />
            <Route path="/log-meal"   element={<ProtectedRoute><LogMeal /></ProtectedRoute>} />
            <Route path="/workout"    element={<ProtectedRoute><Workout /></ProtectedRoute>} />
            <Route path="/progress"   element={<ProtectedRoute><Progress /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;