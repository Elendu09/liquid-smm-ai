import { useState } from "react";
import { Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate, Link } from "react-router-dom";
import { changelogEntries } from "@/data/changelog";

interface NotificationBellProps {
  collapsed?: boolean;
}

export function NotificationBell({ collapsed }: NotificationBellProps) {
  const [tab, setTab] = useState<"inbox" | "news">("inbox");
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getTypeColor = (type: typeof notifications[0]["type"]) => {
    switch (type) {
      case "engagement":
        return "bg-green-500/10 text-green-500";
      case "milestone":
        return "bg-yellow-500/10 text-yellow-500";
      case "alert":
        return "bg-red-500/10 text-red-500";
      case "reminder":
        return "bg-blue-500/10 text-blue-500";
      case "system":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          data-tour="notifications"
          aria-label="Notifications"
          className={cn(
            "relative",
            collapsed ? "h-10 w-10" : "w-full justify-start gap-3"
          )}
        >
          <Bell className="h-4 w-4" />
          {!collapsed && <span>Notifications</span>}
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white",
                collapsed ? "right-0 top-0" : "right-2"
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[22rem] p-0 overflow-hidden" align={collapsed ? "center" : "start"}>
        <div className="flex items-center gap-1 p-1.5 border-b border-border/60 bg-muted/30">
          {(["inbox", "news"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                tab === k
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {k === "inbox" ? "Inbox" : "What's new"}
            </button>
          ))}
        </div>

        {tab === "inbox" ? (
          <>
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <h4 className="text-sm font-semibold">Notifications</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 text-xs text-muted-foreground"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-[320px]">
              {notifications.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        !notification.read && "bg-primary/5",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {notification.platformId ? (
                          <div className="mt-0.5 h-8 w-8 rounded-full bg-muted/50 p-1.5">
                            <PlatformIcon platform={notification.platformId} size="md" />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full",
                              getTypeColor(notification.type),
                            )}
                          >
                            <Bell className="h-4 w-4" />
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium leading-none">{notification.title}</p>
                            {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => navigate("/dashboard/notifications")}
              >
                View all notifications
              </Button>
            </div>
          </>
        ) : (
          <>
            <ScrollArea className="h-[380px]">
              <div className="divide-y">
                {changelogEntries.slice(0, 8).map((e, i) => (
                  <Link
                    key={e.id}
                    to="/changelog"
                    className="block px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <p className="text-sm font-semibold leading-tight">{e.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{e.summary}</p>
                    {i === 0 && (
                      <div className="mt-3 flex h-28 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-br from-primary/25 via-accent/20 to-primary/10">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <p className="mt-2 text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(e.date), { addSuffix: true })}
                    </p>
                  </Link>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-2">
              <Button variant="ghost" className="w-full text-sm" onClick={() => navigate("/changelog")}>
                View full changelog
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
