import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/register")({
  head: () => ({ meta: [{ title: "Register a Horse — EquestRai" }, { name: "description", content: "Submit a new horse registration." }] }),
  component: () => (
    <PagePlaceholder
      title="Register a Horse"
      description="Submit a new IALHA registration with parentage, breed, and ownership details."
    />
  ),
});
