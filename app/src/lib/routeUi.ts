import { matchPath, useLocation } from 'react-router-dom';

export type MobileNavMode = 'shown' | 'hidden';

export interface RouteUiConfig {
  title: string;
  mobileNavMode: MobileNavMode;
}

interface RouteUiPattern extends RouteUiConfig {
  pattern: string;
  end?: boolean;
}

const routeUiPatterns: RouteUiPattern[] = [
  { pattern: '/', title: 'Soulmate | Modern Indian Matchmaking', mobileNavMode: 'hidden' },
  { pattern: '/login', title: 'Sign In | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/forgot-password', title: 'Forgot Password | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/register', title: 'Create Matrimony Profile | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/rules', title: 'Soulmate Code | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/privacy', title: 'Privacy Policy | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/terms', title: 'Terms of Service | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/help', title: 'Help Center | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/verify-email', title: 'Verify Email | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/reset-password', title: 'Reset Password | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/pricing', title: 'Membership Plans | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/success-stories', title: 'Success Stories | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/dashboard', title: 'Home | Soulmate', mobileNavMode: 'shown' },
  { pattern: '/discover', title: 'Introductions | Soulmate', mobileNavMode: 'shown' },
  { pattern: '/matches', title: 'Connections | Soulmate', mobileNavMode: 'shown' },
  { pattern: '/chat/:matchId', title: 'Inbox | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/chat', title: 'Inbox | Soulmate', mobileNavMode: 'shown' },
  { pattern: '/profile/edit', title: 'Edit Profile | Soulmate', mobileNavMode: 'hidden' },
  { pattern: '/profile/:userId', title: 'Member Profile | Soulmate', mobileNavMode: 'shown' },
  { pattern: '/profile', title: 'My Profile | Soulmate', mobileNavMode: 'shown' },
  { pattern: '/search', title: 'Partner Search | Soulmate', mobileNavMode: 'shown' },
  { pattern: '/settings', title: 'Account Settings | Soulmate', mobileNavMode: 'shown' },
  { pattern: '/notifications', title: 'Alerts | Soulmate', mobileNavMode: 'shown' },
];

const defaultRouteUi: RouteUiConfig = {
  title: 'Soulmate | Modern Indian Matchmaking',
  mobileNavMode: 'hidden',
};

export function getRouteUi(pathname: string): RouteUiConfig {
  const matchedRoute = routeUiPatterns.find((route) =>
    matchPath({ path: route.pattern, end: route.end ?? true }, pathname),
  );

  return matchedRoute ?? defaultRouteUi;
}

export function useRouteUi() {
  const location = useLocation();
  return getRouteUi(location.pathname);
}
