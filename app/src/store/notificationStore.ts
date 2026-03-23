import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { demoNotifications } from '@/lib/demoData';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
}

function unreadCountFor(notifications: Notification[]) {
  return notifications.filter((notification) => !notification.read).length;
}

function reviveNotifications(notifications: Notification[]) {
  return notifications.map((notification) => ({
    ...notification,
    createdAt: new Date(notification.createdAt),
  }));
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: demoNotifications,
      unreadCount: unreadCountFor(demoNotifications),

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}`,
          createdAt: new Date(),
          read: false,
        };

        set((state) => {
          const notifications = [newNotification, ...state.notifications];
          return {
            notifications,
            unreadCount: unreadCountFor(notifications),
          };
        });
      },

      markAsRead: (notificationId: string) => {
        const { notifications } = get();
        const notification = notifications.find((n) => n.id === notificationId);

        if (notification && !notification.read) {
          set((state) => {
            const nextNotifications = state.notifications.map((item) =>
              item.id === notificationId ? { ...item, read: true } : item,
            );
            return {
              notifications: nextNotifications,
              unreadCount: unreadCountFor(nextNotifications),
            };
          });
        }
      },

      markAllAsRead: () => {
        set((state) => {
          const notifications = state.notifications.map((notification) => ({ ...notification, read: true }));
          return {
            notifications,
            unreadCount: unreadCountFor(notifications),
          };
        });
      },

      clearNotification: (notificationId: string) => {
        set((state) => {
          const notifications = state.notifications.filter((notification) => notification.id !== notificationId);
          return {
            notifications,
            unreadCount: unreadCountFor(notifications),
          };
        });
      },
    }),
    {
      name: 'soulmate-notifications',
      version: 1,
      partialize: (state) => ({
        notifications: state.notifications,
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<NotificationState> | undefined;
        const notifications = reviveNotifications(state?.notifications ?? currentState.notifications);

        return {
          ...currentState,
          notifications,
          unreadCount: unreadCountFor(notifications),
        };
      },
    },
  ),
);
