import { NavLink } from 'react-router-dom';
import {
  type LucideIcon,
  LayoutDashboard,
  Heart,
  HeartHandshake,
  MessageCircle,
  User,
  Search,
  Settings,
  LogOut,
  Bell
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useChatStore } from '@/store/chatStore';

const primaryNavItems = [
  { icon: LayoutDashboard, label: 'Home', helper: 'Overview and daily actions', path: '/dashboard' },
  { icon: Heart, label: 'Introductions', helper: 'Daily serious profiles', path: '/discover', badgeKey: 'discover' },
  { icon: HeartHandshake, label: 'Connections', helper: 'Accepted interests', path: '/matches', badgeKey: 'matches' },
  { icon: Search, label: 'Partner Search', helper: 'Detailed filters', path: '/search' },
  { icon: MessageCircle, label: 'Inbox', helper: 'Messages and replies', path: '/chat', badgeKey: 'messages' },
] as const;

const secondaryNavItems = [
  { icon: User, label: 'My Profile', helper: 'Photos, family, and preferences', path: '/profile' },
  { icon: Bell, label: 'Alerts', helper: 'Visitors, interests, and trust', path: '/notifications', badgeKey: 'notifications' },
  { icon: Settings, label: 'Settings', helper: 'Privacy and account rules', path: '/settings' },
] as const;

type NavItem = {
  icon: LucideIcon;
  label: string;
  helper: string;
  path: string;
  badgeKey?: string;
};

export default function Sidebar() {
  const { logout, user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { profiles, matches, interestRequests } = useChatStore();
  const firstName = user?.name?.split(' ')[0] ?? 'Guest';
  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'SG';
  const currentUserId = user?.id ?? '';
  const pendingInterestCount = interestRequests.filter(
    (request) => request.toUserId === currentUserId && request.status === 'pending',
  ).length;
  const badgeMap: Record<string, number> = {
    discover: profiles.length,
    matches: matches.length,
    messages: pendingInterestCount,
    notifications: unreadCount,
  };

  const renderNavItems = (items: readonly NavItem[]) =>
    items.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-2xl px-4 py-2.5 transition-all ${
            isActive
              ? 'bg-[#1f2330] text-white shadow-lg shadow-[#1f2330]/12'
              : 'text-[#6c6256] hover:bg-white/80 hover:text-[#1f2330]'
          }`
        }
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{item.label}</p>
          <p className={`truncate text-xs leading-4 ${item.badgeKey && badgeMap[item.badgeKey] > 0 ? 'opacity-80' : 'opacity-60'}`}>
            {item.helper}
          </p>
        </div>
        {item.badgeKey && badgeMap[item.badgeKey] > 0 && (
          <span className="ml-auto rounded-full bg-[#d26852] px-2 py-0.5 text-xs font-bold text-white">
            {badgeMap[item.badgeKey]}
          </span>
        )}
      </NavLink>
    ));

  return (
    <aside className="fixed bottom-4 left-5 top-4 z-40 hidden w-[272px] lg:block">
      <div className="glass-card flex h-full flex-col overflow-hidden p-3.5">
        <NavLink to="/dashboard" className="flex items-center gap-3 px-2 py-1.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d78a61] to-[#b84f45] text-white shadow-lg shadow-[#b84f45]/20">
            <Heart className="h-6 w-6 fill-white" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-[#1f2330]">Soulmate</p>
            <p className="text-xs uppercase tracking-[0.24em] text-[#7a6b5d]">Modern Indian matchmaking</p>
          </div>
        </NavLink>

        <div className="surface-muted mt-3 flex items-center gap-3 p-3.5">
          <div className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl bg-[#1f2330] text-sm font-bold text-white">
            {user?.photos?.[0] ? (
              <img
                src={user.photos[0]}
                alt={user.name}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#1f2330]">{firstName}</p>
            <p className="truncate text-sm text-[#7a6b5d]">Member</p>
          </div>
        </div>

        <nav className="scrollbar-none mt-4 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
          <div>
            <p className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7c6c]">Matchmaking</p>
            <div className="space-y-1.5">{renderNavItems(primaryNavItems)}</div>
          </div>

          <div className="pt-3">
            <p className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7c6c]">Account</p>
            <div className="space-y-1.5">{renderNavItems(secondaryNavItems)}</div>
          </div>
        </nav>

        <div className="soft-divider my-3" />

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-[#6c6256] hover:bg-[#fff7f2] hover:text-[#b84f45]"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
