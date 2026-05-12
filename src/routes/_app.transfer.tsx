import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/transfer")({
  head: () => ({ meta: [{ title: "Transfer Ownership — EquestRai" }, { name: "description", content: "Transfer horse ownership." }] }),
  component: () => (
    <PagePlaceholder
      title="Transfer Ownership"
      description="Initiate and track ownership transfers between IALHA members."
    />
  ),
});
