import { createFileRoute, useParams } from "@tanstack/react-router";
import { PaymentPage } from "@/components/PaymentPage";

export const Route = createFileRoute("/_app/register/$registrationId/pay")({
  head: () => ({ meta: [{ title: "Payment — EquestRai" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    success: typeof s.success === "string" ? s.success : undefined,
  }),
  component: () => {
    const { registrationId } = useParams({ from: "/_app/register/$registrationId/pay" });
    return (
      <PaymentPage
        kind="registration"
        recordId={registrationId}
        statusPath="/register/$registrationId/status"
      />
    );
  },
});
