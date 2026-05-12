import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat — EquestRai" }, { name: "description", content: "Message other IALHA members." }] }),
  component: () => (
    <PagePlaceholder
      title="Chat"
      description="Connect with other breeders, owners, and IALHA staff."
    />
  ),
});
