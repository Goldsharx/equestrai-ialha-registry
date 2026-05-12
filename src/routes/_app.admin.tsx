import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — EquestRai" }, { name: "description", content: "IALHA administration tools." }] }),
  component: () => (
    <PagePlaceholder
      title="Admin"
      description="Internal tools for IALHA staff to review registrations, transfers, and member accounts."
    />
  ),
});
