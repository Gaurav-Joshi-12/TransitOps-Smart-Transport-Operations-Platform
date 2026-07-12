import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Truck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/api";

export const Route = createFileRoute("/register")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window !== "undefined" && localStorage.getItem("transitops_user")) {
      // Don't throw redirect here — let the component handle it so AuthProvider has time to init
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("FLEET_MANAGER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // If already logged in, redirect
  if (user) {
    navigate({ to: "/dashboard" });
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { user: u } = await authService.register(name, email, password, role);
      toast.success(`Welcome to TransitOps, ${u.name}!`);
      // Update global auth state to trigger redirect and nav updates
      navigate({ to: "/dashboard" });
      window.location.reload(); // Hard reload to fetch new role's data cleanly
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left panel */}
      <div className="relative hidden overflow-hidden bg-slate-950 lg:block">
        {/* Background Image */}
        <div className="absolute inset-0 bg-[url('/images/login-bg.png')] bg-cover bg-center bg-no-repeat" />
        
        {/* Dark overlay for readability and vignette effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
        <div className="absolute inset-0 bg-black/30" />
        
        <div className="relative flex h-full flex-col justify-between p-12 z-10">
          <div className="flex items-center gap-2 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">TransitOps</div>
              <div className="text-[10px] uppercase tracking-widest text-white/60">Fleet Control</div>
            </div>
          </div>
          <div className="text-white">
            <h2 className="text-3xl font-semibold leading-tight">
              Command your fleet.<br />From dispatch to dollar.
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/70">
              Real-time visibility across vehicles, drivers, trips and operational cost — built for the people who keep things moving.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { label: "Vehicles tracked", value: "50+" },
                { label: "Roles supported", value: "4" },
                { label: "Trip statuses", value: "4" },
                { label: "Live exports", value: "CSV" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="mt-0.5 text-xs text-white/60">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center bg-background p-6 overflow-y-auto">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5 my-8">
          <div>
            <h1 className="text-2xl font-semibold">Register</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create your operations account.</p>
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@transitops.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="FLEET_MANAGER">Fleet Manager</option>
              <option value="DRIVER">Driver</option>
              <option value="SAFETY_OFFICER">Safety Officer</option>
              <option value="FINANCIAL_ANALYST">Financial Analyst</option>
            </select>
            <p className="text-xs text-muted-foreground pt-1">
              Note: Self-selection of roles is for demonstration purposes.
            </p>
          </div>

          <Button type="submit" className="w-full mt-2" disabled={busy}>
            {busy ? "Creating account…" : "Register"}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
