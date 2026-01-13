import { useState } from "react";

export interface Notification {
  id: string;
  type: "engagement" | "system" | "milestone" | "alert" | "reminder";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  platformId?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "engagement",
    title: "Post went viral!",
    message: "Your Instagram reel reached 50K views in 24 hours",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    platformId: "instagram",
    actionUrl: "/dashboard/analytics",
  },
  {
    id: "2",
    type: "milestone",
    title: "10K Followers!",
    message: "Congratulations! You've reached 10,000 followers on TikTok",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    platformId: "tiktok",
  },
  {
    id: "3",
    type: "alert",
    title: "Account needs attention",
    message: "Your Facebook account hasn't synced in 3 days",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
    platformId: "facebook",
    actionUrl: "/dashboard/account-health",
  },
  {
    id: "4",
    type: "reminder",
    title: "Scheduled post ready",
    message: "Your YouTube video is scheduled to publish in 1 hour",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    read: true,
    platformId: "youtube",
    actionUrl: "/dashboard/scheduler",
  },
  {
    id: "5",
    type: "system",
    title: "New feature available",
    message: "AI Caption Generator now supports all 14 platforms",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
  {
    id: "6",
    type: "engagement",
    title: "High engagement detected",
    message: "Your latest X post has 200+ replies",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    read: false,
    platformId: "twitter",
    actionUrl: "/dashboard/comment-manager",
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotificationsByType = (type: Notification["type"]) => {
    return notifications.filter((n) => n.type === type);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationsByType,
  };
}
