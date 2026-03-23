const DEFAULT_AUTH_REDIRECT = '/dashboard';

type RedirectLocation = {
  pathname?: string;
  search?: string;
  hash?: string;
};

export function sanitizeRedirectPath(redirectTo?: string | null, fallback = DEFAULT_AUTH_REDIRECT) {
  if (!redirectTo) return fallback;
  try {
    const url = new URL(redirectTo, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

export function getRedirectFromSearchParams(searchParams: URLSearchParams, fallback = DEFAULT_AUTH_REDIRECT) {
  return sanitizeRedirectPath(searchParams.get('redirect'), fallback);
}

export function locationToRedirectPath(location?: RedirectLocation | null, fallback = DEFAULT_AUTH_REDIRECT) {
  if (!location) return fallback;

  const pathname = location.pathname || fallback;
  return sanitizeRedirectPath(`${pathname}${location.search ?? ''}${location.hash ?? ''}`, fallback);
}

export function buildPathWithRedirect(pathname: string, redirectTo?: string | null) {
  const params = new URLSearchParams();
  params.set('redirect', sanitizeRedirectPath(redirectTo));
  return `${pathname}?${params.toString()}`;
}

export function buildForgotPasswordPath(email?: string | null, redirectTo?: string | null) {
  const params = new URLSearchParams();
  params.set('redirect', sanitizeRedirectPath(redirectTo));

  const normalizedEmail = email?.trim();
  if (normalizedEmail) {
    params.set('email', normalizedEmail);
  }

  return `/forgot-password?${params.toString()}`;
}

export function buildPasswordResetRedirect(redirectTo?: string | null) {
  return `${window.location.origin}${buildPathWithRedirect('/reset-password', redirectTo)}`;
}

export function buildPendingVerificationPath(email: string, redirectTo?: string | null) {
  const params = new URLSearchParams();
  params.set('mode', 'pending');
  params.set('email', email);
  params.set('redirect', sanitizeRedirectPath(redirectTo));
  return `/verify-email?${params.toString()}`;
}

export function buildEmailVerificationRedirect(redirectTo?: string | null) {
  return `${window.location.origin}${buildPathWithRedirect('/verify-email', redirectTo)}`;
}
