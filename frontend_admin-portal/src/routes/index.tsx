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
  ChevronDown,
  ChevronUp,
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
import { fetchAdminOverview, fetchTickets, BackendApiError, type AdminOverviewResponse, type TicketRecord } from "@/lib/backend-api";

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
        <div className="lg:col-span-2">
          <ResolvedTicketsList />
        </div>

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

function ResolvedTicketsList() {
  const [resolvedTickets, setResolvedTickets] = useState<TicketRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchTickets(30, "resolved")
        .then((data) => {
          if (active) {
            setResolvedTickets(data.filter(t => t.status.toLowerCase() === "resolved"));
          }
        })
        .catch((err) => console.log("Mongo snapshot resolved tickets not loaded yet"));
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SectionCard title="Resolved Questions" description="Browse and inspect resolved employee escalations.">
      <div className="space-y-3">
        {resolvedTickets.map((t) => {
          const isExpanded = expandedId === t.ticket_id;
          return (
            <div
              key={t.ticket_id}
              className="rounded-lg border border-border bg-card hover:border-primary/20 transition-all overflow-hidden"
            >
              {/* Header / Collapsed view */}
              <div
                onClick={() => toggleExpand(t.ticket_id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-primary font-semibold">{t.ticket_id}</span>
                    <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground truncate">{t.question}</p>
                </div>
                <button className="text-muted-foreground ml-3 shrink-0 cursor-pointer">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/10 p-4 space-y-4 animate-soft-rise text-left">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Question</h4>
                    <p className="mt-1 text-sm text-foreground">{t.question}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Complete Answer</h4>
                    <p className="mt-1 text-sm text-foreground bg-muted/40 p-3 rounded-md border border-border whitespace-pre-wrap leading-relaxed">
                      {t.answer || "No logged answer details."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-border/50 text-xs">
                    <div>
                      <span className="font-semibold text-muted-foreground block uppercase tracking-wider">User Email</span>
                      <span className="text-foreground">{t.email || "No email provided"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-muted-foreground block uppercase tracking-wider">Raised Time</span>
                      <span className="text-foreground">{new Date(t.created_at).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-muted-foreground block uppercase tracking-wider">Resolved Time</span>
                      <span className="text-foreground">{t.resolved_at ? new Date(t.resolved_at).toLocaleString() : "N/A"}</span>
                    </div>
                  </div>
                  {t.resolved_by && (
                    <div className="pt-2 text-xs">
                      <span className="font-semibold text-muted-foreground inline-block uppercase tracking-wider mr-1.5">Resolved By:</span>
                      <span className="text-foreground font-medium">{t.resolved_by}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {resolvedTickets.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg bg-muted/10">
            No resolved questions in MongoDB yet.
          </div>
        )}
      </div>
    </SectionCard>
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
