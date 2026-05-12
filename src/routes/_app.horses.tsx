import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/horses")({
  head: () => ({ meta: [{ title: "My Horses — EquestRai" }, { name: "description", content: "Manage your registered horses." }] }),
  component: () => (
    <PagePlaceholder
      title="My Horses"
      description="View and manage every horse registered under your IALHA membership."
    />
  ),
});
