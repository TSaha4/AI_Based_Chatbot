import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  RefreshCw,
  Download,
  RotateCw,
  FileText,
  Eye,
  Trash2,
  Database,
  Layers,
  CheckCircle2,
  Activity,
  CloudUpload,
} from "lucide-react";
import { KpiCard, PageHeader, SectionCard, StatusBadge } from "@/components/admin-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge Base Management — Nexus Knowledge" }] }),
  component: KnowledgePage,
});

const categories = [
  "Safety Documentation",
  "Technical Manuals",
  "HR Policies",
  "Compliance",
  "Maintenance Procedures",
  "Operational Guidelines",
];

const documents = [
  { name: "FGD Operations Manual v4.2.pdf", category: "Technical Manuals", date: "2026-06-20", chunks: 248, status: "Active", last: "2026-06-20" },
  { name: "HR Leave Policy 2024.docx", category: "HR Policies", date: "2026-06-18", chunks: 36, status: "Active", last: "2026-06-18" },
  { name: "Safety Bulletin 2024-08.pdf", category: "Safety Documentation", date: "2026-06-15", chunks: 12, status: "Active", last: "2026-06-15" },
  { name: "ISO 55001 Compliance Guide.pdf", category: "Compliance", date: "2026-06-12", chunks: 142, status: "Pending", last: "—" },
  { name: "Turbine Maintenance Procedures v3.docx", category: "Maintenance Procedures", date: "2026-06-10", chunks: 88, status: "Active", last: "2026-06-10" },
  { name: "Coal Handling Operational Guidelines.pdf", category: "Operational Guidelines", date: "2026-06-08", chunks: 64, status: "Draft", last: "—" },
];

const activity = [
  { msg: "Reprocessed 12 documents in Technical Manuals", time: "12m ago" },
  { msg: "Embeddings refreshed for HR Policies", time: "1h ago" },
  { msg: "New document uploaded: Safety Bulletin 2024-08", time: "3h ago" },
  { msg: "Sync completed with central repository", time: "Yesterday" },
];

function KnowledgePage() {
  const [category, setCategory] = useState("all");
  const [dragOver, setDragOver] = useState(false);

  const filtered = category === "all" ? documents : documents.filter((d) => d.category === category);

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6">
      <PageHeader title="Knowledge Base Management" subtitle="Manage organizational knowledge used by the AI system.">
        <button onClick={() => toast.success("Upload dialog opened")} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          <Upload className="h-3.5 w-3.5" /> Upload
        </button>
        <button onClick={() => toast("Reprocessing started")} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-input rounded-md hover:bg-muted">
          <RotateCw className="h-3.5 w-3.5" /> Reprocess
        </button>
        <button onClick={() => toast("Metadata exported")} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-input rounded-md hover:bg-muted">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
        <button onClick={() => toast.success("Knowledge base synced")} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-input rounded-md hover:bg-muted">
          <RefreshCw className="h-3.5 w-3.5" /> Sync
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={FileText} label="Total Documents" value="780" delay={0} />
        <KpiCard icon={Layers} label="Total Chunks" value="48,212" delay={0.05} />
        <KpiCard icon={Database} label="Embedding Coverage" value="98.4%" trend={{ value: 1.2 }} delay={0.1} />
        <KpiCard icon={CheckCircle2} label="Processing Success" value="99.1%" trend={{ value: 0.4 }} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 sm:mt-6">
        <SectionCard title="Upload Documents" description="PDF, DOCX, or TXT up to 50MB" className="lg:col-span-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); toast.success("Files queued for upload"); }}
            className={`flex flex-col items-center justify-center text-center border-2 border-dashed rounded-md py-10 px-4 transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
            }`}
          >
            <CloudUpload className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">Drag and drop files here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse from your device</p>
            <button onClick={() => toast.success("File picker opened")} className="mt-4 inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Browse files
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span key={c} className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-accent text-accent-foreground">
                {c}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Processing Activity">
          <ul className="space-y-3">
            {activity.map((a, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Activity className="h-3.5 w-3.5 text-primary mt-1 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{a.msg}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Documents"
        description={`${filtered.length} of ${documents.length} documents`}
        action={
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="All categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        }
        className="mt-4 sm:mt-6"
      >
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 px-3 font-medium">File Name</th>
                <th className="py-2 px-3 font-medium">Category</th>
                <th className="py-2 px-3 font-medium">Uploaded</th>
                <th className="py-2 px-3 font-medium">Chunks</th>
                <th className="py-2 px-3 font-medium">Status</th>
                <th className="py-2 px-3 font-medium">Last Processed</th>
                <th className="py-2 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.name} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="py-2.5 px-3 flex items-center gap-2 text-foreground"><FileText className="h-3.5 w-3.5 text-muted-foreground" />{d.name}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{d.category}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{d.date}</td>
                  <td className="py-2.5 px-3 tabular-nums">{d.chunks}</td>
                  <td className="py-2.5 px-3"><StatusBadge status={d.status} /></td>
                  <td className="py-2.5 px-3 text-muted-foreground">{d.last}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex gap-1">
                      <IconBtn label="View"><Eye className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn label="Download"><Download className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn label="Reprocess"><RotateCw className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn label="Delete" danger><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function IconBtn({ children, label, danger }: { children: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <button
      title={label}
      onClick={() => toast(`${label} action triggered`)}
      className={`p-1.5 rounded-md hover:bg-muted ${danger ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
