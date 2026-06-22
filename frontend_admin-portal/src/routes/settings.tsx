import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, SectionCard, StatusBadge } from "@/components/admin-ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "System Settings — Nexus Knowledge" }] }),
  component: SettingsPage,
});

const auditLogs = [
  { event: "Confidence threshold updated to 0.75", user: "A. Smith", time: "2026-06-22 09:42", status: "Completed" },
  { event: "Knowledge base sync triggered", user: "R. Mehta", time: "2026-06-21 17:10", status: "Completed" },
  { event: "User access revoked: tmp.contractor", user: "A. Smith", time: "2026-06-21 11:20", status: "Completed" },
  { event: "AI response template modified", user: "L. Chen", time: "2026-06-20 14:05", status: "Completed" },
];

function SettingsPage() {
  const [confidence, setConfidence] = useState([75]);
  const [escalation, setEscalation] = useState([60]);

  const save = (label: string) => toast.success(`${label} saved`);

  return (
    <div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6">
      <PageHeader title="System Settings" subtitle="Configure organization, AI, and security preferences." />

      <Tabs defaultValue="general">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="bg-muted">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ai">AI Configuration</TabsTrigger>
            <TabsTrigger value="kb">Knowledge Base</TabsTrigger>
            <TabsTrigger value="notif">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-4">
          <SectionCard title="Organization">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Organization Name" defaultValue="Nexus Power Corporation" />
              <Field label="System Name" defaultValue="Nexus Knowledge Portal" />
              <Field label="Contact Email" type="email" defaultValue="admin@nexus.local" />
              <Field label="Time Zone" defaultValue="Asia/Kolkata (UTC+5:30)" />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => save("General settings")} className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save changes</button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <SectionCard title="AI Behavior">
            <div className="space-y-6">
              <SliderRow label="Confidence Threshold" desc="Below this score, AI response is flagged for review." value={confidence} setValue={setConfidence} suffix="%" />
              <SliderRow label="Ticket Escalation Threshold" desc="Auto-escalate when confidence drops below this value." value={escalation} setValue={setEscalation} suffix="%" />
              <ToggleRow label="Include Source Citations" desc="Append source documents to AI responses." />
              <ToggleRow label="Conservative Mode" desc="Avoid speculative answers when context is partial." defaultChecked />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => save("AI configuration")} className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save changes</button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="kb" className="mt-4">
          <SectionCard title="Knowledge Base">
            <div className="space-y-6">
              <ToggleRow label="Auto Learning" desc="Continuously train embeddings from resolved tickets." defaultChecked />
              <ToggleRow label="Nightly Reprocessing" desc="Reprocess documents during off-peak hours." defaultChecked />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Embedding Model" defaultValue="text-embedding-3-large" />
                <Field label="Chunk Size (tokens)" defaultValue="512" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => save("Knowledge base settings")} className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save changes</button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="notif" className="mt-4">
          <SectionCard title="Notifications">
            <div className="space-y-4">
              <ToggleRow label="Email Alerts" desc="Send daily summary to admins." defaultChecked />
              <ToggleRow label="Ticket Notifications" desc="Notify on new and escalated tickets." defaultChecked />
              <ToggleRow label="Processing Notifications" desc="Notify when document processing completes." />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => save("Notification settings")} className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save changes</button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <SectionCard title="Account Security">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Current Password" type="password" />
              <Field label="New Password" type="password" />
              <Field label="Session Timeout (minutes)" defaultValue="30" />
              <Field label="Allowed IP Ranges" defaultValue="10.0.0.0/8, 192.168.0.0/16" />
            </div>
            <div className="mt-6">
              <p className="text-sm font-semibold mb-2">User Access Controls</p>
              <div className="space-y-2">
                <ToggleRow label="Require MFA for Admins" defaultChecked />
                <ToggleRow label="Enforce SSO" defaultChecked />
                <ToggleRow label="Restrict KB upload to Admins" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => save("Security settings")} className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Update</button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <SectionCard title="Recent Configuration Changes" description="Last 30 days">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 px-3 font-medium">Event</th>
                    <th className="py-2 px-3 font-medium">User</th>
                    <th className="py-2 px-3 font-medium">Time</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((l, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="py-2.5 px-3 text-foreground">{l.event}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{l.user}</td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs">{l.time}</td>
                      <td className="py-2.5 px-3"><StatusBadge status={l.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        className="h-9 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}

function ToggleRow({ label, desc, defaultChecked }: { label: string; desc?: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function SliderRow({ label, desc, value, setValue, suffix = "" }: { label: string; desc?: string; value: number[]; setValue: (v: number[]) => void; suffix?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className="text-sm font-mono text-primary">{value[0]}{suffix}</span>
      </div>
      {desc && <p className="text-xs text-muted-foreground mb-3">{desc}</p>}
      <Slider value={value} onValueChange={setValue} min={0} max={100} step={5} />
    </div>
  );
}
