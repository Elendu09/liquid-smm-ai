import { useState } from "react";
import { Calendar, Clock, Plus, Instagram, Youtube, Twitter, Facebook, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const mockScheduledPosts = [
  { id: 1, day: 3, time: "09:00", platform: "instagram", title: "Product Launch", color: "from-pink-500 to-orange-500" },
  { id: 2, day: 5, time: "14:00", platform: "youtube", title: "Tutorial Video", color: "from-red-500 to-red-600" },
  { id: 3, day: 8, time: "10:30", platform: "twitter", title: "Thread Post", color: "from-blue-400 to-blue-500" },
  { id: 4, day: 10, time: "16:00", platform: "instagram", title: "Behind Scenes", color: "from-pink-500 to-orange-500" },
  { id: 5, day: 12, time: "11:00", platform: "facebook", title: "Community Q&A", color: "from-blue-600 to-blue-700" },
  { id: 6, day: 15, time: "09:00", platform: "tiktok", title: "Trending Sound", color: "from-cyan-400 to-pink-500" },
  { id: 7, day: 18, time: "13:00", platform: "linkedin", title: "Industry Insights", color: "from-blue-700 to-blue-800" },
  { id: 8, day: 22, time: "15:00", platform: "instagram", title: "User Stories", color: "from-pink-500 to-orange-500" },
  { id: 9, day: 25, time: "10:00", platform: "youtube", title: "Live Stream", color: "from-red-500 to-red-600" },
  { id: 10, day: 28, time: "14:30", platform: "twitter", title: "Poll Post", color: "from-blue-400 to-blue-500" },
];

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case "instagram": return Instagram;
    case "youtube": return Youtube;
    case "twitter": return Twitter;
    case "facebook": return Facebook;
    default: return Globe;
  }
};

export const SmartPostScheduler = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getPostsForDay = (day: number) => {
    return mockScheduledPosts.filter((post) => post.day === day);
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 glow-blue">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Smart Post Scheduler</h3>
            <p className="text-sm text-muted-foreground">Plan and automate cross-platform posting</p>
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Schedule Post
        </Button>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h4 className="text-lg font-semibold">
          {months[month]} {year}
        </h4>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const posts = day ? getPostsForDay(day) : [];
          const isSelected = day === selectedDay;
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

          return (
            <div
              key={index}
              onClick={() => day && setSelectedDay(day)}
              className={`
                min-h-[80px] md:min-h-[100px] p-1 md:p-2 rounded-lg border transition-all cursor-pointer
                ${day ? "hover:border-primary/50" : ""}
                ${isSelected ? "border-primary bg-primary/5" : "border-border/50"}
                ${isToday ? "bg-primary/10" : ""}
              `}
            >
              {day && (
                <>
                  <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {posts.slice(0, 2).map((post) => {
                      const PlatformIcon = getPlatformIcon(post.platform);
                      return (
                        <div
                          key={post.id}
                          className={`text-[10px] md:text-xs p-1 rounded bg-gradient-to-r ${post.color} text-white truncate flex items-center gap-1`}
                        >
                          <PlatformIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate hidden md:inline">{post.title}</span>
                        </div>
                      );
                    })}
                    {posts.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{posts.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border animate-fade-in-scale">
          <h5 className="font-semibold mb-3">
            {months[month]} {selectedDay}, {year}
          </h5>
          <div className="space-y-2">
            {getPostsForDay(selectedDay).length > 0 ? (
              getPostsForDay(selectedDay).map((post) => {
                const PlatformIcon = getPlatformIcon(post.platform);
                return (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${post.color}`}>
                        <PlatformIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{post.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{post.platform}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {post.time}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No posts scheduled for this day
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "This Week", value: "12 posts" },
          { label: "This Month", value: "48 posts" },
          { label: "Platforms", value: "5 active" },
          { label: "Best Time", value: "10:00 AM" },
        ].map((stat) => (
          <div key={stat.label} className="p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-lg font-bold text-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
