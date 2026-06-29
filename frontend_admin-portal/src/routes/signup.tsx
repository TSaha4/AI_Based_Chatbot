import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { signupAdmin } from "@/lib/backend-api";
import { NtpcLogo } from "../components/ntpc-logo";
import { User, Building, Landmark, Mail, Lock, ArrowRight, UserPlus } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Signup - NTPC Control Center" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Step 1 states
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [gmail, setGmail] = useState("");

  // Step 2 states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);

  const handleNextStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName.trim() || !department.trim() || !employeeId.trim() || !gmail.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (!gmail.toLowerCase().endsWith("@gmail.com") && !gmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setStep(2);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error("Please enter and confirm your password.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await signupAdmin({
        name: fullName.trim(),
        department: department.trim(),
        employee_id: employeeId.trim(),
        email: gmail.trim().toLowerCase(),
        password: password,
      });
      toast.success("Account created successfully! Please sign in.");
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err.message || "Signup failed. Please try again.");
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
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 1 ? "Step 1: Admin details registration" : "Step 2: Create a secure password"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tanmoy Saha"
                className="h-10 w-full px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" /> Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Operations / HR / SME"
                className="h-10 w-full px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5" /> Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP12345"
                className="h-10 w-full px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Official Gmail
              </label>
              <input
                type="email"
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
                placeholder="name@gmail.com"
                className="h-10 w-full px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 h-10 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors cursor-pointer"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Create Password
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 w-full px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/2 h-10 px-4 text-sm border border-input rounded-md hover:bg-muted text-foreground font-medium transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 flex items-center justify-center gap-2 h-10 px-4 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors cursor-pointer disabled:opacity-60"
              >
                <UserPlus className="h-4 w-4" /> {loading ? "Signing Up..." : "Sign Up"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
