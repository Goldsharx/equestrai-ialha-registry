import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — EquestRai" }, { name: "description", content: "Your IALHA registry notifications." }] }),
  component: () => (
    <PagePlaceholder
      title="Notifications"
      description="Registration updates, transfer requests, and messages from the IALHA office."
    />
  ),
});
