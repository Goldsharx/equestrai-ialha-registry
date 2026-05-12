import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/register/$registrationId/pay")({
  head: () => ({ meta: [{ title: "Payment — EquestRai" }] }),
  component: PayPage,
});

function PayPage() {
  const { registrationId } = useParams({ from: "/_app/register/$registrationId/pay" });

  const { data: reg } = useQuery({
    queryKey: ["registration", registrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("id,horse_name,type,status")
        .eq("id", registrationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-3xl text-primary">Complete Payment</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-primary">
            <CreditCard className="mr-2 inline h-5 w-5" />
            Payment for {reg?.horse_name ?? "your registration"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Payment integration coming soon. Your draft registration has been saved
            and will be submitted once payment is processed.
          </p>
          <p className="text-xs font-mono text-muted-foreground">Reg ID: {registrationId}</p>
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
