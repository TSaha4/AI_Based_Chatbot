import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { loginAdmin } from "@/lib/backend-api";
import { NtpcLogo } from "../components/ntpc-logo";
import { Mail, Lock, LogIn } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login - NTPC Control Center" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginAdmin(username.trim(), password);
      if (response.authenticated) {
        localStorage.setItem("admin_logged_in", "true");
        localStorage.setItem("admin_email", response.email || username);
        localStorage.setItem("admin_name", response.name || "NTPC Administrator");
        localStorage.setItem("admin_department", response.department || "General");
        localStorage.setItem("admin_employee_id", response.employee_id || "N/A");
        localStorage.setItem("admin_signed_out", "false");
        
        toast.success(`Welcome back, ${response.name || "Administrator"}!`);
        window.dispatchEvent(new Event("admin-profile-update"));
        navigate({ to: "/" });
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-4 py-8 animate-soft-rise">
      <div className="w-full rounded-2xl border border-border bg-card/90 px-6 py-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center text-center">
          <div className="animate-logo-breathe flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <NtpcLogo className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">NTPC Control Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage AI knowledge & support tickets</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email or Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin@ntpc.co.in"
              className="h-10 w-full px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 w-full px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-10 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors cursor-pointer disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" /> {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Don't have an admin account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-semibold">
            Create one here
          </Link>
        </div>
      </div>
    </div>
  );
}
