import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { fetchAdminOverview, BackendApiError, type AdminOverviewResponse } from "@/lib/backend-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Admin Dashboard - NTPC Control Center" }],
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
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => fetchAdminOverview()
      .then((data) => {
        if (active) {
          setOverview(data);
          setOverviewError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setOverviewError(
            err instanceof BackendApiError
              ? err.message
              : "Live Mongo snapshot unavailable",
          );
        }
      });
    load();
    const id = window.setInterval(load, 15000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const collectionCount = overview?.collections ?? {};
  const totalKnowledgeDocs = overview?.knowledge_base_count ?? (collectionCount.knowledge_chunks ?? 0) + (collectionCount.admin_resolutions ?? 0);
  const activeResponses = collectionCount.response_cache ?? 0;
  const topicAliases = collectionCount.topic_aliases ?? 0;
  const queryRecords = overview?.analytics_count ?? collectionCount.query_analytics ?? 0;
  const ticketRecords = overview?.total_tickets ?? collectionCount.tickets ?? 0;
  const pendingTickets = overview?.pending_tickets ?? 0;
  const resolvedTickets = overview?.resolved_tickets ?? 0;

  return (
    <div className="stagger-soft mx-auto w-full max-w-[1600px] p-4 sm:p-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Operational overview of queries, tickets, and knowledge health."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={MessageSquare} label="Total Queries" value={queryRecords.toString()} trend={{ value: 0 }} description="Mongo query_analytics" delay={0} />
        <KpiCard icon={Ticket} label="Pending Tickets" value={pendingTickets.toString()} trend={{ value: 0, positive: pendingTickets === 0 }} description="tickets.status = pending" delay={0.05} />
        <KpiCard icon={CheckCircle2} label="Resolved Tickets" value={resolvedTickets.toString()} trend={{ value: 0 }} description="tickets.status = resolved" delay={0.1} />
        <KpiCard icon={BookOpen} label="Knowledge Articles" value={totalKnowledgeDocs.toString()} trend={{ value: 0 }} description="knowledge + learned answers" delay={0.15} />
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
                {(overview?.recent_tickets ?? []).map((r) => (
                  <tr key={r.ticket_id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="py-2.5 px-3 text-foreground">{r.question}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={formatStatus(r.status)} /></td>
                    <td className="py-2.5 px-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{r.email ?? "Unassigned"}</td>
                  </tr>
                ))}
                {(overview?.recent_tickets ?? []).length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No live ticket activity yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard title="System Health">
            <ul className="space-y-3 text-sm">
              <HealthRow icon={Database} label="Database" status={overview?.health.database === "ok" ? "Healthy" : "Unavailable"} warn={overview?.health.database !== "ok"} />
              <HealthRow icon={Cpu} label="Knowledge Processing" status={overview?.health.services.nlp ?? "Healthy"} />
              <HealthRow icon={ListChecks} label="Ticket Queue" status={`Backlog: ${ticketRecords}`} warn={ticketRecords > 0} />
            </ul>
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
    </div>
  );
}

function formatStatus(status: string) {
  const value = status.toLowerCase();
  if (value.includes("resolv")) return "Resolved";
  if (value.includes("progress")) return "In Progress";
  if (value.includes("escalat")) return "Escalated";
  return "Pending";
}

function LiveStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-background/60 p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
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
