import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Ticket as TicketIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Send,
  Save,
  ArrowUpCircle,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { KpiCard, PageHeader, SectionCard, StatusBadge } from "@/components/admin-ui";
import { fetchTickets, resolveTicket, BackendApiError, type TicketRecord } from "@/lib/backend-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/tickets")({
  head: () => ({ meta: [{ title: "Ticket Management - NTPC Control Center" }] }),
  component: TicketsPage,
});

type Ticket = {
  id: string;
  question: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "In Progress" | "Escalated" | "Resolved";
  created: string;
  email: string | null;
  aiSummary: string;
  aiResponse: string;
  related: string[];
  answer?: string;
  resolvedBy?: string;
};

function TicketsPage() {
  const [liveTickets, setLiveTickets] = useState<Ticket[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadTickets = () => {
    return fetchTickets(50).then((records) => {
      setLiveTickets(records.map(mapTicketRecord));
      setLoadError(null);
    });
  };

  useEffect(() => {
    let active = true;
    const load = () => fetchTickets(50)
      .then((records) => {
        if (active) {
          setLiveTickets(records.map(mapTicketRecord));
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (active) {
          const message =
            err instanceof BackendApiError
              ? err.message
              : "Live Mongo ticket queue unavailable";
          setLoadError(message);
        }
      });
    load();
    const id = window.setInterval(load, 10000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const filtered = useMemo(() => {
    return liveTickets.filter((t) => {
      if (priority !== "all" && t.priority !== priority) return false;
      if (status !== "all" && t.status !== status) return false;
      if (search && !t.question.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, priority, status, liveTickets]);

  const pendingTickets = liveTickets.filter((t) => t.status === "Pending").length;
  const resolvedCount = liveTickets.filter((t) => t.status === "Resolved").length;

  const onResolve = async (ticketId: string) => {
    const draftText = drafts[ticketId] || "";
    if (!draftText.trim()) {
      toast.error("Please enter a response before resolving.");
      return;
    }
    setResolvingId(ticketId);
    try {
      const result = await resolveTicket(ticketId, draftText.trim());
      await loadTickets();
      toast.success("Ticket resolved", {
        description: result.email_sent ? "User emailed and answer added to retrieval." : "Answer added to retrieval. Email skipped.",
      });
      setDrafts(prev => {
        const copy = { ...prev };
        delete copy[ticketId];
        return copy;
      });
      setExpandedId(null);
    } catch {
      toast.error("Resolve failed", { description: ticketId });
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="stagger-soft mx-auto w-full max-w-[1600px] p-4 sm:p-6">
      <PageHeader
        title="Ticket Management"
        subtitle={loadError ?? "Triage and resolve unresolved AI queries."}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <KpiCard icon={TicketIcon} label="Pending Tickets" value={pendingTickets.toString()} trend={{ value: 0 }} delay={0} />
        <KpiCard icon={CheckCircle2} label="Resolved Tickets" value={resolvedCount.toString()} trend={{ value: 0 }} delay={0.05} />
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4 sm:mt-6">
        <SectionCard title="Ticket Queue">
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID or question..."
                className="w-full h-9 pl-9 pr-3 text-sm bg-muted/60 border border-transparent rounded-md focus:bg-background focus:border-input focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-9 w-full sm:w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Escalated">Escalated</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 mt-4">
            {filtered.map((t) => {
              const isExpanded = expandedId === t.id;
              const draftValue = drafts[t.id] || "";
              
              return (
                <div
                  key={t.id}
                  className={`rounded-lg border transition-all overflow-hidden ${
                    isExpanded ? "border-primary bg-card/60 shadow-md" : "border-border bg-card hover:border-primary/20"
                  }`}
                >
                  {/* Collapsed Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-muted/30 gap-2 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-primary font-semibold">{t.id}</span>
                        <span className="text-xs text-muted-foreground">{t.created}</span>
                        <StatusBadge status={t.priority} />
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-foreground truncate">{t.question}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-start">
                      <span className="text-xs text-muted-foreground">{t.email || "Unassigned"}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/10 p-4 space-y-4 animate-soft-rise text-left">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Full Question</span>
                            <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{t.question}</p>
                          </div>
                          
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">User Metadata</span>
                            <p className="mt-1 text-sm text-foreground">
                              Email: <span className="font-medium text-primary">{t.email || "No email provided"}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">Raised time: {t.created}</p>
                          </div>

                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Related Information</span>
                            <ul className="mt-1 text-sm space-y-1">
                              {t.related.map((r) => (
                                <li key={r} className="text-xs text-primary font-medium">{r}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">AI Retrieval Summary</span>
                            <p className="mt-1 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border border-border leading-relaxed">{t.aiSummary}</p>
                          </div>

                          {t.status === "Resolved" ? (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Resolution Details</span>
                              <div className="p-3 bg-emerald-500/5 border border-emerald-500/25 rounded-md text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                {t.answer || "No answer text saved."}
                              </div>
                              {t.resolvedBy && (
                                <p className="text-xs text-muted-foreground">
                                  Resolved by: <span className="font-medium text-foreground">{t.resolvedBy}</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Admin Response</span>
                              <textarea
                                value={draftValue}
                                onChange={(e) => setDrafts(prev => ({ ...prev, [t.id]: e.target.value }))}
                                rows={4}
                                className="w-full text-sm p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
                                placeholder="Compose a verified response to resolve this ticket..."
                              />
                              
                              <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                  onClick={() => onResolve(t.id)}
                                  disabled={!draftValue.trim() || resolvingId === t.id}
                                  className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer disabled:opacity-60"
                                >
                                  <Send className="h-3.5 w-3.5" /> {resolvingId === t.id ? "Resolving..." : "Resolve"}
                                </button>
                                <button
                                  onClick={() => toast.success("Draft saved")}
                                  className="inline-flex items-center gap-1.5 h-9 px-3 text-xs border border-input rounded-md hover:bg-muted text-foreground cursor-pointer"
                                >
                                  <Save className="h-3.5 w-3.5" /> Save Draft
                                </button>
                                <button
                                  onClick={() => toast("Ticket escalated to SME", { description: t.id })}
                                  className="inline-flex items-center gap-1.5 h-9 px-3 text-xs border border-input rounded-md hover:bg-muted text-foreground cursor-pointer"
                                >
                                  <ArrowUpCircle className="h-3.5 w-3.5" /> Escalate
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg bg-muted/15">
                No tickets match your filters.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function mapTicketRecord(record: TicketRecord): Ticket {
  const status = normalizeStatus(record.status);
  return {
    id: record.ticket_id,
    question: record.question,
    email: record.email,
    priority: inferPriority(record.question),
    status,
    created: new Date(record.created_at).toLocaleString(),
    aiSummary: `Pending MongoDB ticket${record.email ? ` for ${record.email}` : ""}.`,
    aiResponse: status === "Resolved" ? "Marked resolved from the admin portal." : "Awaiting admin review.",
    related: record.session_id ? [`Session ${record.session_id}`] : ["MongoDB tickets collection"],
    answer: record.answer ?? undefined,
    resolvedBy: record.resolved_by ?? undefined,
  };
}

function inferPriority(question: string): Ticket["priority"] {
  const text = question.toLowerCase();
  if (text.includes("urgent") || text.includes("critical") || text.includes("safety")) return "Critical";
  if (text.includes("vibration") || text.includes("shutdown") || text.includes("alarm")) return "High";
  if (text.includes("policy") || text.includes("leave") || text.includes("hr")) return "Medium";
  return "Low";
}

function normalizeStatus(status: string): Ticket["status"] {
  const text = status.toLowerCase();
  if (text.includes("progress")) return "In Progress";
  if (text.includes("escalat")) return "Escalated";
  if (text.includes("resolv")) return "Resolved";
  return "Pending";
}
