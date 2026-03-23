import { Link } from 'react-router-dom';
import { BadgeCheck, Bell, Check, Eye, Heart, MessageCircle, Shield, Sparkles, Star, Trash2 } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';

const iconMap = {
  match: { icon: Heart, bg: 'bg-[#fff2ee]', color: 'text-[#b84f45]' },
  like: { icon: Sparkles, bg: 'bg-[#fff2ee]', color: 'text-[#b84f45]' },
  message: { icon: MessageCircle, bg: 'bg-[#e8f1ed]', color: 'text-[#4b7165]' },
  system: { icon: Bell, bg: 'bg-[#f3e5d6]', color: 'text-[#8c7c6c]' },
  visitor: { icon: Eye, bg: 'bg-[#f4ecff]', color: 'text-[#7a5da5]' },
  interest: { icon: Star, bg: 'bg-[#fff6e7]', color: 'text-[#c08a45]' },
  verification: { icon: BadgeCheck, bg: 'bg-[#eaf5ef]', color: 'text-[#4b7165]' },
  shortlist: { icon: Shield, bg: 'bg-[#f4ecff]', color: 'text-[#7a5da5]' },
};

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, clearNotification } = useNotificationStore();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const visitorNotifications = notifications.filter((notification) => notification.type === 'visitor');
  const interestNotifications = notifications.filter((notification) => notification.type === 'interest' || notification.type === 'match');

  if (notifications.length === 0) {
    return (
      <div className="glass-card flex min-h-[72vh] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f3e5d6] text-[#b84f45]">
          <Bell className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-5xl text-[#1f2330]">You’re all caught up.</h1>
        <p className="mt-3 max-w-lg text-base leading-8 text-[#62584d]">New interests, visitors, matches, and trust updates will show up here as they happen.</p>
        <Link to="/discover" className="btn-primary mt-8">
          Browse profiles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 sm:space-y-6">
      <section className="glass-card p-4 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Alerts</span>
            <h1 className="mt-4 text-[clamp(2.45rem,10vw,4.8rem)] text-[#1f2330] sm:mt-5">Everything that deserves a response.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#62584d] sm:mt-4 sm:text-lg sm:leading-8">
              Your timeline includes visitors, incoming interests, trust updates, and connection actions, not just messages.
            </p>
          </div>

          <button onClick={markAllAsRead} className="btn-secondary justify-center">
            Mark all as read
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-3">
          <div className="surface-muted p-3.5 sm:p-4">
            <p className="text-sm text-[#62584d]">Unread</p>
            <p className="mt-2 text-4xl text-[#1f2330]">{unreadNotifications.length}</p>
          </div>
          <div className="surface-muted p-3.5 sm:p-4">
            <p className="text-sm text-[#62584d]">Visitor alerts</p>
            <p className="mt-2 text-4xl text-[#1f2330]">{visitorNotifications.length}</p>
          </div>
          <div className="surface-muted p-3.5 sm:p-4">
            <p className="text-sm text-[#62584d]">Interest activity</p>
            <p className="mt-2 text-4xl text-[#1f2330]">{interestNotifications.length}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {notifications.map((notification) => {
          const { icon: Icon, bg, color } = iconMap[notification.type];

          return (
            <article key={notification.id} className={`glass-card p-4 sm:p-6 ${notification.read ? '' : 'ring-1 ring-[#b84f45]/10'}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bg} ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl text-[#1f2330]">{notification.title}</h2>
                      <p className="mt-1 text-sm leading-7 text-[#62584d]">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && <span className="chip bg-[#fff2ee] text-[#b84f45]">Unread</span>}
                      <span className="text-xs uppercase tracking-[0.2em] text-[#8c7c6c]">{formatTime(notification.createdAt)}</span>
                    </div>
                  </div>

                  {notification.href && (
                    <Link to={notification.href} className="btn-ghost mt-4 px-0">
                      Open related screen
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start">
                  {!notification.read && (
                    <button onClick={() => markAsRead(notification.id)} className="btn-secondary px-4 py-3">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => clearNotification(notification.id)} className="btn-secondary px-4 py-3 text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
