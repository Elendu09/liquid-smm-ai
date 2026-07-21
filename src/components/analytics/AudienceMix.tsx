import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users } from "lucide-react";
import { useGuest } from "@/hooks/useGuest";
import { EmptyState } from "@/components/shared/EmptyState";

const AGE_DATA = [
  { name: "18-24", value: 28, color: "hsl(var(--primary))" },
  { name: "25-34", value: 41, color: "#10b981" },
  { name: "35-44", value: 18, color: "#f59e0b" },
  { name: "45-54", value: 9, color: "#ec4899" },
  { name: "55+", value: 4, color: "#8b5cf6" },
];

const GENDER = [
  { label: "Female", value: 58 },
  { label: "Male", value: 39 },
  { label: "Other", value: 3 },
];

const GEO = [
  { label: "United States", value: 42 },
  { label: "United Kingdom", value: 14 },
  { label: "Canada", value: 9 },
  { label: "Australia", value: 7 },
  { label: "Germany", value: 6 },
];

export function AudienceMix() {
  return (
    <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
      <header className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold">Audience mix</h3>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Age distribution</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={AGE_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                  {AGE_DATA.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v}%`, "Share"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            {AGE_DATA.map((a) => (
              <div key={a.name} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm" style={{ background: a.color }} />
                <span className="text-muted-foreground">{a.name}</span>
                <span className="ml-auto tabular-nums">{a.value}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Gender</p>
            <div className="flex h-6 rounded-md overflow-hidden">
              {GENDER.map((g, i) => (
                <div
                  key={g.label}
                  className="flex items-center justify-center text-[10px] font-medium text-primary-foreground"
                  style={{
                    width: `${g.value}%`,
                    background: ["hsl(var(--primary))", "#8b5cf6", "#64748b"][i],
                  }}
                >
                  {g.value > 10 ? `${g.label} ${g.value}%` : ""}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Top countries</p>
            <ul className="space-y-1.5">
              {GEO.map((g) => (
                <li key={g.label} className="flex items-center gap-2 text-xs">
                  <span className="w-28 truncate">{g.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${(g.value / 42) * 100}%` }} />
                  </div>
                  <span className="tabular-nums w-8 text-right text-muted-foreground">{g.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
