import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Truck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/api";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window !== "undefined" && localStorage.getItem("transitops_user")) {
      // Don't throw redirect here — let the component handle it so AuthProvider has time to init
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const accounts = authService.availableAccounts();

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  if (user) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}!`);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError("Invalid credentials. Please check your email and password.");
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
      <div className="flex items-center justify-center bg-background p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Access your operations console.</p>
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@transitops.com"
              required
              autoFocus
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
                placeholder="Enter password"
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

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <div className="rounded-md border border-border/60 bg-muted/30 p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Demo accounts — password: <code className="text-foreground">password</code>
            </div>
            <div className="space-y-1">
              {accounts.map((a) => (
                <button
                  type="button"
                  key={a.email}
                  onClick={() => { setEmail(a.email); setPassword("password"); }}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-accent transition-colors"
                >
                  <span className="font-mono">{a.email}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {a.role.replace(/_/g, " ")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
