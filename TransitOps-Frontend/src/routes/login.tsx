import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/api";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window !== "undefined" && localStorage.getItem("transitops_user")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("fleet@transitops.io");
  const [password, setPassword] = useState("demo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accounts = authService.availableAccounts();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome, ${u.name}`);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black lg:block">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,var(--color-primary)_0,transparent_40%),radial-gradient(circle_at_80%_60%,#0ea5e9_0,transparent_40%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
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
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Access your operations console.
            </p>
          </div>
          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <div className="rounded-md border border-border/60 bg-muted/30 p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Demo accounts (any password)
            </div>
            <div className="space-y-1">
              {accounts.map((a) => (
                <button
                  type="button"
                  key={a.email}
                  onClick={() => setEmail(a.email)}
                  className="flex w-full items-center justify-between rounded px-2 py-1 text-xs hover:bg-accent"
                >
                  <span className="font-mono">{a.email}</span>
                  <span className="text-muted-foreground">{a.role.replace("_", " ")}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
