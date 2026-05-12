import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/transfer/$transferId/pay")({
  head: () => ({ meta: [{ title: "Transfer Payment — EquestRai" }] }),
  component: TransferPayPage,
});

function TransferPayPage() {
  const { transferId } = useParams({ from: "/_app/transfer/$transferId/pay" });

  const { data: transfer } = useQuery({
    queryKey: ["transfer", transferId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfers")
        .select("id,to_owner_name,fee_amount,status,sale_date")
        .eq("id", transferId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-3xl text-primary">Complete Transfer Payment</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-primary">
            <CreditCard className="mr-2 inline h-5 w-5" />
            Transfer to {transfer?.to_owner_name ?? "buyer"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Amount due:{" "}
            <span className="font-serif text-lg text-primary">
              ${Number(transfer?.fee_amount ?? 0).toFixed(2)}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Payment integration coming soon. Once paid, this transfer will go to staff
            review and the new owner will be notified.
          </p>
          <p className="text-xs font-mono text-muted-foreground">Transfer ID: {transferId}</p>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
            <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/horses">View My Horses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
