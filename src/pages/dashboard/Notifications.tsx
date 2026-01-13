import { useState } from "react";
import { 
  Bell, 
  Check, 
  Trash2, 
  Filter, 
  Settings,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Calendar,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    getNotificationsByType 
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState("all");

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "engagement":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "milestone":
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case "alert":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "reminder":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "system":
        return <Bell className="h-5 w-5 text-muted-foreground" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: Notification["type"]) => {
    switch (type) {
      case "engagement":
        return <Badge className="bg-green-500/10 text-green-500">Engagement</Badge>;
      case "milestone":
        return <Badge className="bg-yellow-500/10 text-yellow-500">Milestone</Badge>;
      case "alert":
        return <Badge className="bg-red-500/10 text-red-500">Alert</Badge>;
      case "reminder":
        return <Badge className="bg-blue-500/10 text-blue-500">Reminder</Badge>;
      case "system":
        return <Badge variant="secondary">System</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : getNotificationsByType(activeTab as Notification["type"]);

  const groupedByDate = filteredNotifications.reduce((groups, notification) => {
    const date = format(notification.timestamp, "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    
    let label = format(notification.timestamp, "MMMM d, yyyy");
    if (date === today) label = "Today";
    if (date === yesterday) label = "Yesterday";
    
    if (!groups[label]) groups[label] = [];
    groups[label].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2">{unreadCount} new</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Stay updated with your account activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          { type: "all" as const, label: "All", count: notifications.length, color: "bg-primary" },
          { type: "engagement" as const, label: "Engagement", count: getNotificationsByType("engagement").length, color: "bg-green-500" },
          { type: "milestone" as const, label: "Milestones", count: getNotificationsByType("milestone").length, color: "bg-yellow-500" },
          { type: "alert" as const, label: "Alerts", count: getNotificationsByType("alert").length, color: "bg-red-500" },
          { type: "reminder" as const, label: "Reminders", count: getNotificationsByType("reminder").length, color: "bg-blue-500" },
        ].map((stat) => (
          <Card
            key={stat.type}
            className={cn(
              "cursor-pointer transition-all",
              activeTab === stat.type && "ring-2 ring-primary"
            )}
            onClick={() => setActiveTab(stat.type)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.count}</p>
                </div>
                <div className={cn("h-3 w-3 rounded-full", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {activeTab === "all" ? "All Notifications" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Notifications`}
            </CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDate).map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
                  <div className="space-y-2">
                    {items.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                          !notification.read && "bg-primary/5 border-primary/20"
                        )}
                      >
                        <div className="shrink-0">
                          {notification.platformId ? (
                            <div className="h-10 w-10 rounded-full bg-muted p-2">
                              <PlatformIcon platformId={notification.platformId} size="md" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              {getTypeIcon(notification.type)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{notification.title}</p>
                                {!notification.read && (
                                  <span className="h-2 w-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{notification.message}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {getTypeBadge(notification.type)}
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
