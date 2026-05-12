import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/_public/studbook")({
  head: () => ({
    meta: [
      { title: "Studbook — EquestRai" },
      {
        name: "description",
        content:
          "Search the official IALHA studbook of registered Andalusian and Lusitano horses.",
      },
      { property: "og:title", content: "Studbook — EquestRai" },
      {
        property: "og:description",
        content: "Search the official IALHA studbook.",
      },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PagePlaceholder
        title="Studbook"
        description="The IALHA studbook search will live here. Look up registered horses by name, registration number, breed, sire, or dam."
      />
    </div>
  ),
});
