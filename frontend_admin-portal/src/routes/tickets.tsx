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
  FileText,
  Sparkles,
} from "lucide-react";
import { KpiCard, PageHeader, SectionCard, StatusBadge } from "@/components/admin-ui";
import { fetchPendingTickets, resolveTicket, BackendApiError, type TicketRecord } from "@/lib/backend-api";
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
};

function TicketsPage() {
  const [liveTickets, setLiveTickets] = useState<Ticket[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const tickets = liveTickets;

  useEffect(() => {
    let active = true;
    const load = () => fetchPendingTickets(50)
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

  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [resolving, setResolving] = useState(false);

  const loadTickets = () => {
    return fetchPendingTickets(50).then((records) => {
      setLiveTickets(records.map(mapTicketRecord));
      setLoadError(null);
    });
  };

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (priority !== "all" && t.priority !== priority) return false;
      if (status !== "all" && t.status !== status) return false;
      if (search && !t.question.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, priority, status, tickets]);

  const selected = tickets.find((t) => t.id === selectedId) ?? tickets[0] ?? null;
  const pendingTickets = tickets.filter((t) => t.status === "Pending").length;
  const escalatedTickets = tickets.filter((t) => t.status === "Escalated").length;

  useEffect(() => {
    if (tickets.length === 0) {
      return;
    }
    const selectedTicket = tickets.find((t) => t.id === selectedId);
    if (!selectedTicket) {
      setSelectedId(tickets[0].id);
      setDraft("");
    }
  }, [tickets, selectedId]);

  const onSelect = (id: string) => {
    setSelectedId(id);
    const t = tickets.find((x) => x.id === id);
    setDraft("");
  };

  const onResolve = async () => {
    if (!selected || selected.status !== "Pending" || !draft.trim() || resolving) return;
    setResolving(true);
    try {
      const result = await resolveTicket(selected.id, draft.trim());
      await loadTickets();
      toast.success("Ticket resolved", {
        description: result.email_sent ? "User emailed and answer added to retrieval." : "Answer added to retrieval. Email skipped.",
      });
    } catch {
      toast.error("Resolve failed", { description: selected.id });
    } finally {
      setResolving(false);
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
        <KpiCard icon={CheckCircle2} label="Loaded Queue" value={tickets.length.toString()} trend={{ value: 0 }} delay={0.05} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mt-4 sm:mt-6">
        <SectionCard title="Ticket Queue" className="xl:col-span-3">
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID or question..."
                className="w-full h-9 pl-9 pr-3 text-sm bg-muted/60 border border-transparent rounded-md focus:bg-background focus:border-input focus:outline-none focus:ring-2 focus:ring-ring/30"
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

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 px-3 font-medium">Ticket ID</th>
                  <th className="py-2 px-3 font-medium">Question</th>
                  <th className="py-2 px-3 font-medium">Priority</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                      t.id === selectedId ? "bg-primary/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-xs text-primary">{t.id}</td>
                    <td className="py-2.5 px-3 max-w-[280px] truncate">{t.question}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={t.priority} /></td>
                    <td className="py-2.5 px-3"><StatusBadge status={t.status} /></td>
                    <td className="py-2.5 px-3 text-muted-foreground">{t.created}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No tickets match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title={selected ? `Ticket Details - ${selected.id}` : "Ticket Details"} description={selected?.question ?? "Select a pending ticket."} className="xl:col-span-2">
          {!selected ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No pending tickets in MongoDB.</div>
          ) : (
          <div className="space-y-4">
            <DetailBlock icon={Sparkles} label="AI Retrieval Summary">{selected.aiSummary}</DetailBlock>
            <DetailBlock icon={TicketIcon} label="User Metadata">
              <p className="text-sm text-muted-foreground">{selected.email ?? "No email"} - {selected.created}</p>
            </DetailBlock>
            <DetailBlock icon={BookOpenCheck} label="Suggested AI Response">
              <p className="text-sm text-muted-foreground">{selected.aiResponse || "No response generated - confidence below threshold."}</p>
            </DetailBlock>
            <DetailBlock icon={FileText} label="Related Knowledge Documents">
              <ul className="text-sm space-y-1">
                {selected.related.map((r) => (
                  <li key={r} className="text-primary hover:underline cursor-pointer">{r}</li>
                ))}
              </ul>
            </DetailBlock>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Admin Response
              </label>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={5}
                className="mt-2 w-full text-sm p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="Compose a verified response..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toast.success("Draft saved")}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-input rounded-md hover:bg-muted"
              >
                <Save className="h-3.5 w-3.5" /> Save Draft
              </button>
              <button
                onClick={onResolve}
                disabled={!draft.trim() || resolving || selected.status !== "Pending"}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <Send className="h-3.5 w-3.5" /> {resolving ? "Resolving" : "Resolve"}
              </button>
              <button
                onClick={() => toast("Ticket escalated to SME", { description: selected.id })}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-input rounded-md hover:bg-muted"
              >
                <ArrowUpCircle className="h-3.5 w-3.5" /> Escalate
              </button>
              <button
                onClick={() => toast.success("Knowledge Base Updated Successfully", { description: "Answer added to Knowledge Base" })}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-input rounded-md hover:bg-muted"
              >
                <BookOpenCheck className="h-3.5 w-3.5" /> Add to KB
              </button>
            </div>
          </div>
          )}
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
    created: new Date(record.created_at).toISOString().slice(0, 10),
    aiSummary: `Pending MongoDB ticket${record.email ? ` for ${record.email}` : ""}.`,
    aiResponse: status === "Resolved" ? "Marked resolved from the admin portal." : "Awaiting admin review.",
    related: record.session_id ? [`Session ${record.session_id}`] : ["MongoDB tickets collection"],
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

function DetailBlock({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}
