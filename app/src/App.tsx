import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState, type ReactElement } from 'react';
import { useRouteUi } from '@/lib/routeUi';
import { buildPendingVerificationPath, getRedirectFromSearchParams } from '@/lib/authRedirect';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

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
import { Toaster, toast } from 'sonner';

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

function ReactivationPrompt() {
  const navigate = useNavigate();
  const { user, requiresReactivation, reactivateAccount, logout } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!requiresReactivation || !user) {
    return null;
  }

  const handleReactivate = async () => {
    setIsSubmitting(true);
    const result = await reactivateAccount();
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.error || 'We could not reactivate your account right now.');
      return;
    }

    toast.success('Your account has been reactivated.');
    navigate('/dashboard', { replace: true });
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    await logout();
    setIsSubmitting(false);
    navigate('/?account=deactivated', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1f2330]/65 p-4 backdrop-blur-md">
      <div className="glass-card w-full max-w-lg border-none bg-white p-8 shadow-2xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#fff2ee] text-[#b84f45]">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="mt-6 text-center">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-[#b84f45]">Account Paused</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1f2330]">
            Your account is deactivated.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#62584d] sm:text-base">
            Would you like to reactivate it? Reactivating makes your profile visible again and takes you back to your dashboard.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleReactivate}
            disabled={isSubmitting}
            className="btn-primary justify-center py-4 shadow-lg shadow-[#b84f45]/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Reactivating...
              </>
            ) : (
              <>
                Reactivate account
                <RefreshCw className="h-4 w-4" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            disabled={isSubmitting}
            className="btn-secondary justify-center py-4 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Keep it deactivated
          </button>
        </div>
      </div>
    </div>
  );
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
      <ReactivationPrompt />
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
