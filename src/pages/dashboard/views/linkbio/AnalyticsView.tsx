import { BarChart3, TrendingUp, MousePointerClick, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const mockLinks = [
  { title: "Shop My Favorites", clicks: 1247, ctr: 32.4, change: 12.1 },
  { title: "Latest YouTube Video", clicks: 892, ctr: 24.6, change: 5.8 },
  { title: "Join My Newsletter", clicks: 534, ctr: 14.8, change: -2.3 },
  { title: "Book a Consultation", clicks: 321, ctr: 8.9, change: 18.7 },
  { title: "My Portfolio", clicks: 226, ctr: 6.3, change: 3.1 },
];

const stats = [
  { label: "Total clicks (30d)", value: "3,220", icon: MousePointerClick, delta: "+14.2%" },
  { label: "Unique visitors", value: "1,894", icon: Users, delta: "+8.5%" },
  { label: "Avg. CTR", value: "17.4%", icon: TrendingUp, delta: "+2.1pp" },
  { label: "Top link CTR", value: "32.4%", icon: BarChart3, delta: "Shop My Favorites" },
];

export default function AnalyticsView() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                    {s.label}
                  </p>
                  <p className="text-xl font-bold mt-1.5">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">{s.delta}</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top links */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Top links (last 30 days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {mockLinks.map((l, i) => (
              <div key={l.title} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-muted text-[11px] font-bold flex items-center justify-center text-muted-foreground shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium truncate">{l.title}</span>
                </div>
                <div className="flex items-center gap-4 text-xs shrink-0">
                  <span className="text-muted-foreground">{l.clicks.toLocaleString()} clicks</span>
                  <span className="font-medium">{l.ctr}%</span>
                  <span
                    className={cn(
                      "font-semibold w-14 text-right",
                      l.change >= 0 ? "text-emerald-500" : "text-rose-500",
                    )}
                  >
                    {l.change >= 0 ? "+" : ""}
                    {l.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Analytics shown here are illustrative. Real click tracking activates once your bio page is
        published to a live URL.
      </p>
    </div>
  );
}
