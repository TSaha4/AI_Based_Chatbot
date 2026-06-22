import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  MessageSquare,
  Target,
  TicketCheck,
  Gauge,
  TrendingUp,
  AlertCircle,
  Sparkles,
  FileText,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { KpiCard, PageHeader, SectionCard } from "@/components/admin-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Nexus Knowledge" }] }),
  component: AnalyticsPage,
});

const ranges = ["Today", "7 days", "30 days", "90 days", "Custom"];

const queries = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  value: 200 + Math.round(Math.sin(i / 2) * 80 + i * 12),
}));

const tickets = [
  { day: "Mon", resolved: 40, escalated: 6 },
  { day: "Tue", resolved: 52, escalated: 4 },
  { day: "Wed", resolved: 48, escalated: 8 },
  { day: "Thu", resolved: 60, escalated: 5 },
  { day: "Fri", resolved: 56, escalated: 7 },
  { day: "Sat", resolved: 22, escalated: 2 },
  { day: "Sun", resolved: 18, escalated: 1 },
];

const categoriesPie = [
  { name: "Safety", value: 28 },
  { name: "Technical", value: 32 },
  { name: "HR", value: 14 },
  { name: "Compliance", value: 12 },
  { name: "Maintenance", value: 9 },
  { name: "Operations", value: 5 },
];

const pieColors = [
  "var(--color-primary)",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#bfdbfe",
  "#dbeafe",
];

const confidence = Array.from({ length: 10 }, (_, i) => ({
  bucket: `${i * 10}-${i * 10 + 10}`,
  count: Math.round(50 + Math.sin(i) * 40 + (i > 6 ? i * 30 : 0)),
}));

const growth = [
  { month: "Jan", docs: 420 }, { month: "Feb", docs: 482 }, { month: "Mar", docs: 540 },
  { month: "Apr", docs: 612 }, { month: "May", docs: 695 }, { month: "Jun", docs: 780 },
];

const insights = [
  { icon: TrendingUp, label: "Most searched", text: "FGD operating parameters" },
  { icon: AlertCircle, label: "Unresolved", text: "Cybersecurity reporting timelines" },
  { icon: Sparkles, label: "AI recommendation", text: "Add 2025 Maintenance updates" },
  { icon: FileText, label: "Top knowledge gap", text: "ISO 55001 audit procedures" },
];

const topDocs = [
  { name: "FGD Operations Manual v4.2", accesses: 1842 },
  { name: "HR Leave Policy 2024", accesses: 1320 },
  { name: "Safety Bulletin 2024-08", accesses: 998 },
  { name: "Turbine Maintenance v3", accesses: 880 },
  { name: "IT Security Policy 2025", accesses: 712 },
];

const chartTheme = {
  grid: "var(--color-border)",
  axis: "var(--color-muted-foreground)",
  primary: "var(--color-primary)",
};

function AnalyticsPage() {
  const [range, setRange] = useState("30 days");
  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6">
      <PageHeader title="Analytics Dashboard" subtitle="Monitor AI performance and knowledge effectiveness.">
        <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-md">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-sm transition-colors",
                range === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={MessageSquare} label="Total Queries" value="42,180" trend={{ value: 12.4 }} delay={0} />
        <KpiCard icon={Target} label="Answer Success Rate" value="87.6%" trend={{ value: 2.1 }} delay={0.05} />
        <KpiCard icon={TicketCheck} label="Ticket Creation Rate" value="9.8%" trend={{ value: 0.6, positive: false }} delay={0.1} />
        <KpiCard icon={Gauge} label="Avg. Confidence" value="0.82" trend={{ value: 1.5 }} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 sm:mt-6">
        <SectionCard title="Query Trends" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={queries}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="day" stroke={chartTheme.axis} fontSize={12} />
                <YAxis stroke={chartTheme.axis} fontSize={12} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Line type="monotone" dataKey="value" stroke={chartTheme.primary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Top Knowledge Categories">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoriesPie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {categoriesPie.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 sm:mt-6">
        <SectionCard title="Ticket Resolution Trends">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tickets}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="day" stroke={chartTheme.axis} fontSize={12} />
                <YAxis stroke={chartTheme.axis} fontSize={12} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="resolved" fill={chartTheme.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="escalated" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Confidence Score Distribution">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={confidence}>
                <defs>
                  <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="bucket" stroke={chartTheme.axis} fontSize={11} />
                <YAxis stroke={chartTheme.axis} fontSize={12} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Area type="monotone" dataKey="count" stroke={chartTheme.primary} strokeWidth={2} fill="url(#cf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 sm:mt-6">
        <SectionCard title="Knowledge Base Growth" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="month" stroke={chartTheme.axis} fontSize={12} />
                <YAxis stroke={chartTheme.axis} fontSize={12} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Line type="monotone" dataKey="docs" stroke={chartTheme.primary} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Insights">
          <ul className="space-y-3">
            {insights.map((i, idx) => (
              <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-md border border-border">
                <i.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{i.label}</p>
                  <p className="text-sm text-foreground mt-0.5">{i.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Top Accessed Documents" className="mt-4 sm:mt-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 px-3 font-medium">Document</th>
                <th className="py-2 px-3 font-medium text-right">Accesses</th>
                <th className="py-2 px-3 font-medium w-1/3">Trend</th>
              </tr>
            </thead>
            <tbody>
              {topDocs.map((d, i) => {
                const pct = (d.accesses / topDocs[0].accesses) * 100;
                return (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2.5 px-3 text-foreground">{d.name}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{d.accesses.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
