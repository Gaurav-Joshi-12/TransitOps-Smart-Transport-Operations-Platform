import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@/lib/types";
import { authService } from "@/services/api";
import { useStore } from "@/lib/store";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.currentUser);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    authService.restore();
    setReady(true);
  }, []);
  const value: AuthCtx = {
    user,
    ready,
    login: async (email, password) => {
      const r = await authService.login(email, password);
      return r.user;
    },
    logout: () => authService.logout(),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
}
