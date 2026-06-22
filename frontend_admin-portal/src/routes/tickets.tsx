import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/tickets")({
  head: () => ({ meta: [{ title: "Ticket Management — Nexus Knowledge" }] }),
  component: TicketsPage,
});

type Ticket = {
  id: string;
  question: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Escalated" | "Resolved";
  created: string;
  aiSummary: string;
  aiResponse: string;
  related: string[];
};

const tickets: Ticket[] = [
  { id: "TKT-2049", question: "What is the latest FGD operating parameter range for Unit 4?", priority: "High", status: "Open", created: "2026-06-22", aiSummary: "Retrieved 3 chunks from Operations Manual v4.2, low confidence on Unit 4 specifics.", aiResponse: "Based on the Operations Manual, the FGD parameters typically range from ... However, Unit 4 specific updates from 2025 are not present in the index.", related: ["Operations Manual v4.2", "FGD SOP 2023"] },
  { id: "TKT-2048", question: "How do I file a leave encashment request under the new policy?", priority: "Medium", status: "In Progress", created: "2026-06-22", aiSummary: "Matched HR Policy 2024 sections 4.2-4.5.", aiResponse: "Submit Form HR-LE-12 via the employee self-service portal under Leave > Encashment.", related: ["HR Policy 2024", "Self-Service Portal Guide"] },
  { id: "TKT-2047", question: "Turbine vibration alarm thresholds for maintenance?", priority: "High", status: "Escalated", created: "2026-06-21", aiSummary: "Insufficient data — needs SME review.", aiResponse: "", related: ["Maintenance Procedures v3"] },
  { id: "TKT-2046", question: "Coal handling emergency shutdown SOP location?", priority: "Critical", status: "Open", created: "2026-06-21", aiSummary: "Found reference in Safety Bulletin 2024-08.", aiResponse: "Refer to Safety Bulletin 2024-08, section 3.1 for the emergency shutdown sequence.", related: ["Safety Bulletin 2024-08"] },
  { id: "TKT-2045", question: "How to register for ISO 55001 internal audit training?", priority: "Low", status: "Resolved", created: "2026-06-20", aiSummary: "Resolved via LMS link.", aiResponse: "Register through the LMS at learning.nexus/iso55001.", related: ["Compliance Training Catalog"] },
  { id: "TKT-2044", question: "Cybersecurity incident reporting timeline?", priority: "Medium", status: "Open", created: "2026-06-20", aiSummary: "Pulled from IT Security Policy 2025.", aiResponse: "Report within 1 hour to the SOC at soc@nexus.local.", related: ["IT Security Policy 2025"] },
];

function TicketsPage() {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string>(tickets[0].id);
  const [draft, setDraft] = useState(tickets[0].aiResponse);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (priority !== "all" && t.priority !== priority) return false;
      if (status !== "all" && t.status !== status) return false;
      if (search && !t.question.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, priority, status]);

  const selected = tickets.find((t) => t.id === selectedId) ?? tickets[0];

  const onSelect = (id: string) => {
    setSelectedId(id);
    const t = tickets.find((x) => x.id === id);
    setDraft(t?.aiResponse ?? "");
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6">
      <PageHeader title="Ticket Management" subtitle="Triage and resolve unresolved AI queries." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={TicketIcon} label="Open Tickets" value="184" trend={{ value: 4.2, positive: false }} delay={0} />
        <KpiCard icon={CheckCircle2} label="Resolved Today" value="42" trend={{ value: 12 }} delay={0.05} />
        <KpiCard icon={Clock} label="Avg. Resolution" value="3h 12m" trend={{ value: 8 }} delay={0.1} />
        <KpiCard icon={AlertTriangle} label="Escalated" value="14" trend={{ value: 1.5, positive: false }} delay={0.15} />
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
                <SelectItem value="Open">Open</SelectItem>
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

        <SectionCard
          title={`Ticket Details — ${selected.id}`}
          description={selected.question}
          className="xl:col-span-2"
        >
          <div className="space-y-4">
            <DetailBlock icon={Sparkles} label="AI Retrieval Summary">{selected.aiSummary}</DetailBlock>
            <DetailBlock icon={BookOpenCheck} label="Suggested AI Response">
              <p className="text-sm text-muted-foreground">{selected.aiResponse || "No response generated — confidence below threshold."}</p>
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
                onClick={() => toast.success("Ticket resolved", { description: selected.id })}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <Send className="h-3.5 w-3.5" /> Resolve
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
        </SectionCard>
      </div>
    </div>
  );
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
