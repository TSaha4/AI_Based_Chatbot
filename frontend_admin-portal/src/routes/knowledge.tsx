import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  RefreshCw,
  Download,
  RotateCw,
  FileText,
  Layers,
  CloudUpload,
} from "lucide-react";
import { KpiCard, PageHeader, SectionCard } from "@/components/admin-ui";
import { fetchAdminOverview, uploadKnowledgePdf, type AdminOverviewResponse } from "@/lib/backend-api";

export const Route = createFileRoute("/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge Base Management - NTPC Control Center" }] }),
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

function KnowledgePage() {
  const [dragOver, setDragOver] = useState(false);
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const knowledgeCount = overview?.knowledge_base_count ?? 0;
  const chunkCount = overview?.collections.knowledge_chunks ?? 0;

  const refreshOverview = () => {
    fetchAdminOverview().then(setOverview).catch(() => setOverview(null));
  };

  useEffect(() => {
    refreshOverview();
  }, []);

  const uploadFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF uploads are supported by the backend.");
      return;
    }
    setUploading(true);
    try {
      const topicName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      const result = await uploadKnowledgePdf(file, topicName);
      toast.success("PDF stored in MongoDB", { description: `${result.chunks_stored} chunks added to knowledge_chunks.` });
      refreshOverview();
    } catch {
      toast.error("PDF upload failed", { description: "Check backend and MongoDB connectivity." });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="stagger-soft mx-auto w-full max-w-[1600px] p-4 sm:p-6">
      <PageHeader title="Knowledge Base Management" subtitle="Manage organizational knowledge used by the AI system.">
        <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer">
          <Upload className="h-3.5 w-3.5" /> Upload
        </button>
        <button onClick={() => toast("Reprocessing started")} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-input rounded-md hover:bg-muted cursor-pointer">
          <RotateCw className="h-3.5 w-3.5" /> Reprocess
        </button>
        <button onClick={() => toast("Metadata exported")} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-input rounded-md hover:bg-muted cursor-pointer">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
        <button onClick={() => toast.success("Knowledge base synced")} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-input rounded-md hover:bg-muted cursor-pointer">
          <RefreshCw className="h-3.5 w-3.5" /> Sync
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <KpiCard icon={FileText} label="Knowledge Records" value={knowledgeCount.toString()} delay={0} />
        <KpiCard icon={Layers} label="PDF Chunks" value={chunkCount.toString()} delay={0.05} />
      </div>

      <div className="mt-4 sm:mt-6">
        <SectionCard title="Upload Documents" description="PDF, DOCX, or TXT up to 50MB">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
            className={`flex flex-col items-center justify-center text-center border-2 border-dashed rounded-md py-10 px-4 transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
            }`}
          >
            <CloudUpload className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">Drag and drop files here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse from your device</p>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => uploadFiles(event.target.files)} />
            <button onClick={() => inputRef.current?.click()} disabled={uploading} className="mt-4 inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-60 cursor-pointer">
              {uploading ? "Uploading" : "Browse files"}
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
      </div>
    </div>
  );
}
