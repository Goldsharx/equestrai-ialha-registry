import { createFileRoute, useParams } from "@tanstack/react-router";
import { RegisterWizardPage } from "./_app.register";

export const Route = createFileRoute("/_app/register/$registrationId/edit")({
  head: () => ({ meta: [{ title: "Continue Registration — EquestRai" }] }),
  component: EditRegistrationPage,
});

function EditRegistrationPage() {
  const { registrationId } = useParams({ from: "/_app/register/$registrationId/edit" });
  return <RegisterWizardPage initialRegistrationId={registrationId} />;
}
