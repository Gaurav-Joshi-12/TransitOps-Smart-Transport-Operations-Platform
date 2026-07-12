import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/types";
import type { ReactNode } from "react";

interface RoleGuardProps {
  allow: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allow, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
