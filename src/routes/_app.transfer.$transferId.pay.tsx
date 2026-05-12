import { createFileRoute, useParams } from "@tanstack/react-router";
import { PaymentPage } from "@/components/PaymentPage";

export const Route = createFileRoute("/_app/transfer/$transferId/pay")({
  head: () => ({ meta: [{ title: "Transfer Payment — EquestRai" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    success: typeof s.success === "string" ? s.success : undefined,
  }),
  component: () => {
    const { transferId } = useParams({ from: "/_app/transfer/$transferId/pay" });
    return <PaymentPage kind="transfer" recordId={transferId} />;
  },
});
