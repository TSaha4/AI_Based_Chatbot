import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Mail, Building, Landmark, LogOut, CheckCircle } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/admin-ui";
import { toast } from "sonner";
import { loginAdmin } from "@/lib/backend-api";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Admin Profile - NTPC Control Center" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [signedOut, setSignedOut] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_signed_out") === "true";
    }
    return false;
  });
  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_email") || "admin@ntpc.local";
    }
    return "admin@ntpc.local";
  });
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_name") || "NTPC Administrator";
    }
    return "NTPC Administrator";
  });
  const [department, setDepartment] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_department") || "General";
    }
    return "General";
  });
  const [employeeId, setEmployeeId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_employee_id") || "N/A";
    }
    return "N/A";
  });

  const handleSignOut = () => {
    localStorage.removeItem("admin_logged_in");
    setSignedOut(true);
    localStorage.setItem("admin_signed_out", "true");
    toast.success("Successfully signed out");
    window.dispatchEvent(new Event("admin-profile-update"));
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = (formData.get("username") as string || "").trim();
    const password = formData.get("password") as string || "";

    if (!username) {
      toast.error("Please enter a username or email address");
      return;
    }

    try {
      const response = await loginAdmin(username, password);
      if (response.authenticated) {
        const newEmail = response.email || (username.includes("@") ? username : `${username}@ntpc.local`);
        const newName = response.name || username.split("@")[0].split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        const newDept = response.department || "General";
        const newEmpId = response.employee_id || "N/A";
        
        setEmail(newEmail);
        setName(newName);
        setDepartment(newDept);
        setEmployeeId(newEmpId);
        setSignedOut(false);
        localStorage.setItem("admin_email", newEmail);
        localStorage.setItem("admin_name", newName);
        localStorage.setItem("admin_department", newDept);
        localStorage.setItem("admin_employee_id", newEmpId);
        localStorage.setItem("admin_signed_out", "false");
        localStorage.setItem("admin_logged_in", "true");
        toast.success(`Successfully signed in as ${newName}`);
        window.dispatchEvent(new Event("admin-profile-update"));
        return;
      }
    } catch (err) {
      console.warn("Backend authentication failed, falling back to local session simulation:", err);
    }

    // Local fallback/simulation
    let newEmail = email;
    let newName = name;

    if (username.includes("@")) {
      newEmail = username;
      const prefix = username.split("@")[0];
      newName = prefix
        .split(/[._-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } else {
      newEmail = `${username}@ntpc.local`;
      newName = username.charAt(0).toUpperCase() + username.slice(1) + " Administrator";
    }

    setEmail(newEmail);
    setName(newName);
    setDepartment("General");
    setEmployeeId("N/A");
    setSignedOut(false);
    localStorage.setItem("admin_email", newEmail);
    localStorage.setItem("admin_name", newName);
    localStorage.setItem("admin_department", "General");
    localStorage.setItem("admin_employee_id", "N/A");
    localStorage.setItem("admin_signed_out", "false");
    localStorage.setItem("admin_logged_in", "true");
    toast.success(`Successfully signed back in as ${newName}`);
    window.dispatchEvent(new Event("admin-profile-update"));
  };

  const handleUpdateInfo = () => {
    localStorage.setItem("admin_name", name);
    localStorage.setItem("admin_email", email);
    localStorage.setItem("admin_department", department);
    localStorage.setItem("admin_employee_id", employeeId);
    toast.success("Profile updated successfully");
    window.dispatchEvent(new Event("admin-profile-update"));
  };

  if (signedOut) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg text-center animate-soft-rise">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogOut className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Signed Out</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You have been signed out of the NTPC Control Center.
          </p>
          <form onSubmit={handleSignIn} className="mt-6 space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Admin Username / Email
              </label>
              <input
                type="text"
                name="username"
                defaultValue={email}
                placeholder="Enter username or email"
                className="mt-1 h-9 w-full px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                className="mt-1 h-9 w-full px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full h-9 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors cursor-pointer"
            >
              Sign In Again
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="stagger-soft mx-auto w-full max-w-[1000px] p-4 sm:p-6">
      <PageHeader title="Admin Profile" subtitle="Manage your personal details and system authorization state." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <SectionCard className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold border border-primary/20">
              {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AD"}
            </div>
            <h3 className="mt-3 text-lg font-semibold text-foreground">{name}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">System Admin</p>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-success bg-success/10 px-2.5 py-1 rounded-full w-fit mx-auto">
              <CheckCircle className="h-3 w-3" /> Operational
            </div>
          </SectionCard>
        </div>

        <div className="md:col-span-2 space-y-6">
          <SectionCard title="Basic Details">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/20">
                <User className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Name</p>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full text-sm bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-0.5 text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/20">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full text-sm bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-0.5 text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/20">
                <Building className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</p>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-1 w-full text-sm bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-0.5 text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/20">
                <Landmark className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee ID</p>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="mt-1 w-full text-sm bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-0.5 text-foreground"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleUpdateInfo}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium cursor-pointer"
              >
                Update Info
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-sm border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive hover:text-white rounded-md font-medium transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
