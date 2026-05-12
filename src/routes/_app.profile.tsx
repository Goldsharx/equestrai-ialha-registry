import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — EquestRai" }, { name: "description", content: "Manage your IALHA member profile." }] }),
  component: () => (
    <PagePlaceholder
      title="Profile"
      description="Update your contact information, member preferences, and account security."
    />
  ),
});
