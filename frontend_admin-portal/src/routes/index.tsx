import { createFileRoute } from "@tanstack/react-router";
import {
  MessageSquare,
  Ticket,
  CheckCircle2,
  BookOpen,
  Database,
  Cpu,
  ListChecks,
  Sparkles,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { KpiCard, PageHeader, SectionCard, StatusBadge } from "@/components/admin-ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — Nexus Knowledge" }],
  }),
  component: DashboardPage,
});

const queryTrend = [
  { day: "Mon", value: 320 },
  { day: "Tue", value: 412 },
  { day: "Wed", value: 388 },
  { day: "Thu", value: 502 },
  { day: "Fri", value: 478 },
  { day: "Sat", value: 210 },
  { day: "Sun", value: 180 },
];

const ticketTrend = [
  { day: "Mon", resolved: 24, opened: 30 },
  { day: "Tue", resolved: 32, opened: 28 },
  { day: "Wed", resolved: 28, opened: 34 },
  { day: "Thu", resolved: 40, opened: 36 },
  { day: "Fri", resolved: 36, opened: 30 },
  { day: "Sat", resolved: 14, opened: 12 },
  { day: "Sun", resolved: 10, opened: 8 },
];

const kbGrowth = [
  { month: "Jan", docs: 420 },
  { month: "Feb", docs: 482 },
  { month: "Mar", docs: 540 },
  { month: "Apr", docs: 612 },
  { month: "May", docs: 695 },
  { month: "Jun", docs: 780 },
];

const recent = [
  { q: "How to reset access card?", status: "Resolved", date: "2026-06-21", admin: "A. Smith" },
  { q: "Turbine vibration thresholds", status: "In Progress", date: "2026-06-21", admin: "R. Mehta" },
  { q: "HR leave policy clarification", status: "Resolved", date: "2026-06-20", admin: "L. Chen" },
  { q: "Coal handling shutdown SOP", status: "Escalated", date: "2026-06-20", admin: "M. Patel" },
  { q: "Compliance reporting cadence", status: "Open", date: "2026-06-19", admin: "Unassigned" },
];

const gaps = [
  { topic: "FGD operating parameters (2025 update)", count: 42, type: "Unanswered" },
  { topic: "New leave encashment policy", count: 31, type: "Emerging" },
  { topic: "ISO 55001 alignment procedures", count: 22, type: "Missing" },
  { topic: "Cybersecurity incident reporting", count: 18, type: "Emerging" },
];

const chartTheme = {
  grid: "var(--color-border)",
  axis: "var(--color-muted-foreground)",
  primary: "var(--color-primary)",
};

function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Operational overview of queries, tickets, and knowledge health."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={MessageSquare} label="Total Queries" value="12,480" trend={{ value: 8.4 }} description="Last 30 days" delay={0} />
        <KpiCard icon={Ticket} label="Pending Tickets" value="184" trend={{ value: 2.1, positive: false }} description="Across all queues" delay={0.05} />
        <KpiCard icon={CheckCircle2} label="Resolved Tickets" value="1,920" trend={{ value: 12.3 }} description="This month" delay={0.1} />
        <KpiCard icon={BookOpen} label="Knowledge Articles" value="780" trend={{ value: 5.6 }} description="Active in index" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 sm:mt-6">
        <SectionCard title="Daily Query Trends" description="User questions submitted to AI" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={queryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="day" stroke={chartTheme.axis} fontSize={12} />
                <YAxis stroke={chartTheme.axis} fontSize={12} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Line type="monotone" dataKey="value" stroke={chartTheme.primary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="System Health">
          <ul className="space-y-3 text-sm">
            <HealthRow icon={Database} label="Database" status="Healthy" />
            <HealthRow icon={Cpu} label="Knowledge Processing" status="Healthy" />
            <HealthRow icon={ListChecks} label="Ticket Queue" status="Backlog: 184" warn />
          </ul>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 sm:mt-6">
        <SectionCard title="Ticket Resolution Trends">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="day" stroke={chartTheme.axis} fontSize={12} />
                <YAxis stroke={chartTheme.axis} fontSize={12} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Bar dataKey="opened" fill="var(--color-accent-foreground)" radius={[4, 4, 0, 0]} opacity={0.4} />
                <Bar dataKey="resolved" fill={chartTheme.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Knowledge Growth">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kbGrowth}>
                <defs>
                  <linearGradient id="kbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="month" stroke={chartTheme.axis} fontSize={12} />
                <YAxis stroke={chartTheme.axis} fontSize={12} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border)" }} />
                <Area type="monotone" dataKey="docs" stroke={chartTheme.primary} strokeWidth={2} fill="url(#kbGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 sm:mt-6">
        <SectionCard title="Recent Activity" className="lg:col-span-2">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 px-3 font-medium">Query</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="py-2.5 px-3 text-foreground">{r.q}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={r.status} /></td>
                    <td className="py-2.5 px-3 text-muted-foreground">{r.date}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{r.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Knowledge Gap Insights" description="AI-driven recommendations">
          <ul className="space-y-3">
            {gaps.map((g, i) => (
              <li key={i} className="flex items-start gap-3 p-2.5 rounded-md border border-border">
                <div className="h-7 w-7 shrink-0 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  {g.type === "Unanswered" ? <AlertTriangle className="h-3.5 w-3.5" /> : g.type === "Emerging" ? <TrendingUp className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{g.topic}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{g.type} • {g.count} mentions</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

function HealthRow({ icon: Icon, label, status, warn }: { icon: any; label: string; status: string; warn?: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-foreground">{label}</span>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${warn ? "bg-warning/15 text-warning-foreground" : "bg-success/10 text-success"}`}>
        {status}
      </span>
    </li>
  );
}
