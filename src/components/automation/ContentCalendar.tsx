import { useState } from "react";
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Instagram, Youtube, Twitter, Facebook, Film, Image, Radio, MoreHorizontal, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const contentTypes = [
  { id: "post", label: "Post", icon: Image, color: "from-blue-500 to-cyan-500" },
  { id: "story", label: "Story", icon: Film, color: "from-pink-500 to-orange-500" },
  { id: "reel", label: "Reel", icon: Film, color: "from-purple-500 to-pink-500" },
  { id: "live", label: "Live", icon: Radio, color: "from-red-500 to-orange-500" },
];

const mockContent = [
  { id: 1, day: 2, type: "post", platform: "instagram", title: "Product Launch", time: "09:00", status: "scheduled" },
  { id: 2, day: 2, type: "story", platform: "instagram", title: "BTS Content", time: "14:00", status: "draft" },
  { id: 3, day: 5, type: "reel", platform: "tiktok", title: "Tutorial Video", time: "10:30", status: "scheduled" },
  { id: 4, day: 8, type: "post", platform: "twitter", title: "Industry News", time: "11:00", status: "scheduled" },
  { id: 5, day: 10, type: "live", platform: "instagram", title: "Q&A Session", time: "18:00", status: "scheduled" },
  { id: 6, day: 12, type: "post", platform: "facebook", title: "Community Poll", time: "12:00", status: "draft" },
  { id: 7, day: 15, type: "reel", platform: "instagram", title: "Tips & Tricks", time: "15:00", status: "scheduled" },
  { id: 8, day: 18, type: "story", platform: "instagram", title: "User Stories", time: "09:00", status: "scheduled" },
  { id: 9, day: 20, type: "post", platform: "youtube", title: "Long Form Video", time: "14:00", status: "draft" },
  { id: 10, day: 25, type: "post", platform: "instagram", title: "Weekend Vibes", time: "10:00", status: "scheduled" },
];

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case "instagram": return Instagram;
    case "youtube": return Youtube;
    case "twitter": return Twitter;
    case "facebook": return Facebook;
    default: return Instagram;
  }
};

const getTypeConfig = (type: string) => {
  return contentTypes.find(t => t.id === type) || contentTypes[0];
};

export const ContentCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getContentForDay = (day: number) => mockContent.filter(c => c.day === day);

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const stats = {
    scheduled: mockContent.filter(c => c.status === "scheduled").length,
    drafts: mockContent.filter(c => c.status === "draft").length,
    posts: mockContent.filter(c => c.type === "post").length,
    reels: mockContent.filter(c => c.type === "reel").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-brand-purple/20 glow-blue">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Content Calendar</h3>
            <p className="text-sm text-muted-foreground">Plan and organize your content strategy</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Import CSV
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Scheduled", value: stats.scheduled, color: "text-brand-green" },
          { label: "Drafts", value: stats.drafts, color: "text-brand-orange" },
          { label: "Posts", value: stats.posts, color: "text-primary" },
          { label: "Reels/Stories", value: stats.reels, color: "text-brand-purple" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Content Type Legend */}
      <div className="flex flex-wrap gap-3">
        {contentTypes.map((type) => (
          <div key={type.id} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded bg-gradient-to-r ${type.color}`} />
            <span className="text-sm text-muted-foreground">{type.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="glass-card p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h4 className="text-xl font-bold">
            {months[month]} {year}
          </h4>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const content = day ? getContentForDay(day) : [];
            const isSelected = day === selectedDay;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <div
                key={index}
                onClick={() => day && setSelectedDay(day)}
                className={`
                  min-h-[100px] md:min-h-[120px] p-2 rounded-lg border transition-all cursor-pointer
                  ${day ? "hover:border-primary/50" : ""}
                  ${isSelected ? "border-primary bg-primary/5" : "border-border/50"}
                  ${isToday ? "bg-primary/10 border-primary/30" : ""}
                `}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-2 ${isToday ? "text-primary" : ""}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {content.slice(0, 3).map((item) => {
                        const typeConfig = getTypeConfig(item.type);
                        const PlatformIcon = getPlatformIcon(item.platform);
                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => setDraggedItem(item.id)}
                            onDragEnd={() => setDraggedItem(null)}
                            className={`
                              text-xs p-1.5 rounded-md bg-gradient-to-r ${typeConfig.color} text-white
                              flex items-center gap-1 cursor-grab active:cursor-grabbing
                              ${draggedItem === item.id ? "opacity-50" : ""}
                              ${item.status === "draft" ? "opacity-70" : ""}
                            `}
                          >
                            <GripVertical className="h-3 w-3 opacity-50" />
                            <PlatformIcon className="h-3 w-3 shrink-0" />
                            <span className="truncate hidden md:inline">{item.title}</span>
                          </div>
                        );
                      })}
                      {content.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{content.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-semibold">
              {months[month]} {selectedDay}, {year}
            </h5>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
          <div className="space-y-3">
            {getContentForDay(selectedDay).length > 0 ? (
              getContentForDay(selectedDay).map((item) => {
                const typeConfig = getTypeConfig(item.type);
                const PlatformIcon = getPlatformIcon(item.platform);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${typeConfig.color}`}>
                        <typeConfig.icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.title}</p>
                          <Badge variant="secondary" className="text-xs">
                            <PlatformIcon className="h-3 w-3 mr-1" />
                            {item.platform}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${item.status === "scheduled" ? "bg-brand-green/10 text-brand-green" : "bg-brand-orange/10 text-brand-orange"}`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.time} • {typeConfig.label}</p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No content scheduled for this day</p>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Content
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
