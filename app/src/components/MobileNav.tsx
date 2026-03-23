import { NavLink, useLocation } from 'react-router-dom';
import { Heart, LayoutDashboard, MessageCircle, Search, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

const mobileNavItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Heart, label: 'Intros', path: '/discover', badgeKey: 'discover' },
  { icon: MessageCircle, label: 'Inbox', path: '/chat', badgeKey: 'chat' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { profiles, interestRequests } = useChatStore();
  const currentUserId = user?.id ?? '';
  const pendingInterestCount = interestRequests.filter(
    (request) => request.toUserId === currentUserId && request.status === 'pending',
  ).length;
  const unreadMessageCount = 0; // unread count is tracked per-match in messages state; keep simple for nav badge
  const badgeMap: Record<string, number> = {
    discover: profiles.length,
    chat: unreadMessageCount + pendingInterestCount,
  };
  const isItemActive = (path: string) => {
    if (path === '/chat') {
      return location.pathname.startsWith('/chat') || location.pathname.startsWith('/matches');
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <nav className="mobile-dock safe-area-pb fixed inset-x-2 bottom-0 z-50 lg:hidden sm:inset-x-3">
      <div className="glass-card mx-auto max-w-[30rem] rounded-[24px] px-1.5 py-1.5 sm:max-w-[32rem] sm:rounded-[30px] sm:px-2 sm:py-2">
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={() =>
              `flex min-h-[3.7rem] flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 py-1.5 sm:min-h-[4.1rem] sm:gap-1 sm:rounded-[20px] sm:px-1.5 sm:py-2 ${
                isItemActive(item.path)
                  ? 'bg-[#1f2330] text-white shadow-lg shadow-[#1f2330]/12'
                  : 'text-[#6c6256]'
              }`
            }
          >
            <div className="relative">
              <item.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              {item.badgeKey && badgeMap[item.badgeKey] > 0 && (
                <span className="absolute -right-2 -top-1.5 flex min-h-[1.05rem] min-w-[1.05rem] items-center justify-center rounded-full bg-[#d26852] px-1 text-[0.58rem] font-bold text-white sm:-right-2.5 sm:-top-2 sm:min-h-[1.2rem] sm:min-w-[1.2rem] sm:text-[0.62rem]">
                  {badgeMap[item.badgeKey] > 9 ? '9+' : badgeMap[item.badgeKey]}
                </span>
              )}
            </div>
            <span className="text-[0.64rem] font-medium tracking-[0.01em] sm:text-[0.7rem]">{item.label}</span>
          </NavLink>
        ))}
        </div>
      </div>
    </nav>
  );
}
