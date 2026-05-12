import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EquestRai" }, { name: "description", content: "Your IALHA registry dashboard." }] }),
  component: () => (
    <PagePlaceholder
      title="Dashboard"
      description="Your stable at a glance: registered horses, pending transfers, and recent activity."
    />
  ),
});
