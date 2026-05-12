import { createFileRoute } from "@tanstack/react-router";
import { RegisterWizardPage } from "@/components/RegisterWizardPage";

export const Route = createFileRoute("/_app/register")({
  head: () => ({
    meta: [
      { title: "Register a Horse — EquestRai" },
      { name: "description", content: "Submit a new IALHA horse registration." },
    ],
  }),
  component: RegisterWizardPage,
});
