import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useEffect, type ReactElement } from 'react';
import { useRouteUi } from '@/lib/routeUi';
import { buildPendingVerificationPath, getRedirectFromSearchParams } from '@/lib/authRedirect';
import { Loader2 } from 'lucide-react';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import RegisterPage from '@/pages/RegisterPage';
import Dashboard from '@/pages/Dashboard';
import Discover from '@/pages/Discover';
import Matches from '@/pages/Matches';
import Chat from '@/pages/Chat';
import Profile from '@/pages/Profile';
import EditProfile from '@/pages/EditProfile';
import Search from '@/pages/Search';
import Settings from '@/pages/Settings';
import SuccessStories from '@/pages/SuccessStories';
import Notifications from '@/pages/Notifications';
import RulesPage from '@/pages/RulesPage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import HelpPage from '@/pages/HelpPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';

// Components
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from '@/components/ScrollToTop';
import { Toaster } from 'sonner';

import './App.css';

function RouteUiController() {
  const routeUi = useRouteUi();

  useEffect(() => {
    document.title = routeUi.title;
  }, [routeUi.title]);

  return null;
}

function PublicOnlyRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, pendingVerificationEmail, requiresEmailVerification } = useAuthStore();
  const [searchParams] = useSearchParams();
  const redirectTo = getRedirectFromSearchParams(searchParams);

  if (requiresEmailVerification && pendingVerificationEmail) {
    return <Navigate to={buildPendingVerificationPath(pendingVerificationEmail, redirectTo)} replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

function App() {
  const { isAuthenticated, isLoading: _isLoading, isInitialized, initialize, pendingVerificationEmail, requiresEmailVerification } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Router is always mounted so navigate() works during async auth actions (login, register).
  // The spinner is rendered INSIDE the Router to preserve the navigation context.
  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-center" expand={false} richColors closeButton />
      <RouteUiController />
      {!isInitialized ? (
        <div className="flex h-screen items-center justify-center bg-[#f8f1e7]">
          <Loader2 className="h-8 w-8 animate-spin text-[#b84f45]" />
        </div>
      ) : (
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              requiresEmailVerification && pendingVerificationEmail ? (
                <Navigate to={buildPendingVerificationPath(pendingVerificationEmail, '/dashboard')} replace />
              ) : isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage />
              )
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPasswordPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/chat/:matchId?" element={<Chat />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/profile/:userId?" element={<Profile />} />
              <Route path="/search" element={<Search />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
