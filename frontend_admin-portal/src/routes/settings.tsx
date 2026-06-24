import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/admin-ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "System Settings - NTPC Control Center" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const save = (label: string) => toast.success(`${label} saved`);

  return (
    <div className="stagger-soft mx-auto w-full max-w-[1200px] p-4 sm:p-6">
      <PageHeader title="System Settings" subtitle="Configure organization, appearance, and security preferences." />

      <Tabs defaultValue="general">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="bg-muted">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="kb">Knowledge Base</TabsTrigger>
            <TabsTrigger value="notif">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-4">
          <SectionCard title="Organization">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Organization Name" defaultValue="NTPC Power Operations" />
              <Field label="System Name" defaultValue="NTPC Admin Portal" />
              <Field label="Contact Email" type="email" defaultValue="admin@ntpc.local" />
              <Field label="Time Zone" defaultValue="Asia/Kolkata (UTC+5:30)" />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => save("General settings")} className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer">Save changes</button>
            </div>
          </SectionCard>

          <SectionCard title="Appearance" className="mt-6">
            <div>
              <p className="text-sm font-medium text-foreground">Portal Theme</p>
              <p className="text-xs text-muted-foreground mt-0.5">Choose how NTPC Control Center looks to you.</p>
              <div className="mt-4 grid grid-cols-2 gap-4 max-w-md">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all cursor-pointer ${
                    theme === "light"
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className="text-sm font-semibold">Light Mode</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all cursor-pointer ${
                    theme === "dark"
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className="text-sm font-semibold">Dark Mode</span>
                </button>
              </div>
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
              <button onClick={() => save("Knowledge base settings")} className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer">Save changes</button>
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
              <button onClick={() => save("Notification settings")} className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer">Save changes</button>
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
              <button onClick={() => save("Security settings")} className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer">Update</button>
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
        className="h-9 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
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
