import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { buildPathWithRedirect, buildPendingVerificationPath, locationToRedirectPath } from '@/lib/authRedirect';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, pendingVerificationEmail, requiresEmailVerification, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7efe4]">
        <Loader2 className="w-8 h-8 animate-spin text-[#b84f45]" />
      </div>
    );
  }

  if (requiresEmailVerification) {
    const email = pendingVerificationEmail ?? user?.email ?? '';
    return <Navigate to={buildPendingVerificationPath(email, locationToRedirectPath(location))} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to={buildPathWithRedirect('/login', locationToRedirectPath(location))} replace />;
  }

  return <Outlet />;
}
