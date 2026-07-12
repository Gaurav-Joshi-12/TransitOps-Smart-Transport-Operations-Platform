import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const hasSession = !!localStorage.getItem("transitops_user");
      throw redirect({ to: hasSession ? "/dashboard" : "/login" });
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
