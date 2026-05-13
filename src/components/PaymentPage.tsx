import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2, Clock } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Kind = "registration" | "transfer";

type FeeLine = { label: string; amount: number };

interface Props {
  kind: Kind;
  recordId: string;
  statusPath?: string; // optional — only registrations have a status page
}

export function PaymentPage({ kind, recordId, statusPath }: Props) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { success?: string };
  const [paying, setPaying] = useState(false);
  const table = kind === "registration" ? "registrations" : "transfers";

  const { data: record, refetch } = useQuery({
    queryKey: [table, recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", recordId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const breakdown = useMemo<FeeLine[]>(() => {
    const raw = record?.fee_breakdown;
    if (Array.isArray(raw) && raw.length > 0) return raw as FeeLine[];
    // Fallback for transfers / older records
    if (kind === "transfer" && record?.fee_amount) {
      return [{ label: "Ownership transfer fee", amount: Number(record.fee_amount) }];
    }
    return [];
  }, [record, kind]);

  const total = useMemo(
    () =>
      breakdown.reduce((s, l) => s + Number(l.amount || 0), 0) ||
      Number(record?.fee_total ?? record?.fee_amount ?? 0),
    [breakdown, record],
  );

  // Handle success return
  useEffect(() => {
    if (search?.success === "true" && record?.payment_status !== "paid") {
      (async () => {
        await supabase
          .from(table)
          .update({ payment_status: "paid" })
          .eq("id", recordId);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        toast.success("Payment successful!");
        await refetch();
        if (statusPath) navigate({ to: statusPath, params: { registrationId: recordId } }); else navigate({ to: "/dashboard" });
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search?.success]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const return_url = `${window.location.origin}${window.location.pathname}?success=true`;
      const body: Record<string, unknown> = { return_url };
      body[`${kind}_id`] = recordId;
      const { data, error } = await supabase.functions.invoke("create-stripe-checkout", { body });
      if (error) throw error;
      const checkoutUrl = (data as { checkout_url?: string })?.checkout_url;
      if (!checkoutUrl) throw new Error("No checkout_url returned");
      window.location.href = checkoutUrl;
    } catch (err: any) {
      toast.error(err.message ?? "Payment failed");
      setPaying(false);
    }
  };

  const handlePayLater = () => {
    toast("Saved — payment is pending", {
      description: "You can complete payment from your dashboard later.",
    });
    navigate({ to: "/dashboard" });
  };

  const isPaid = record?.payment_status === "paid";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-3xl text-primary">
        {kind === "registration" ? "Registration Payment" : "Transfer Payment"}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-primary">
            <CreditCard className="mr-2 inline h-5 w-5" />
            Fee Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Item</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.length === 0 ? (
                  <tr><td className="px-3 py-3 text-muted-foreground" colSpan={2}>No fee items.</td></tr>
                ) : breakdown.map((l, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{l.label}</td>
                    <td className="px-3 py-2 text-right">${Number(l.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-muted/30">
                <tr>
                  <td className="px-3 py-3 font-serif text-base">Total</td>
                  <td className="px-3 py-3 text-right font-serif text-xl text-primary">
                    ${total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {isPaid ? (
            <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              ✓ Payment received. Thank you.
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Stripe Checkout integration coming soon. The button below currently mocks a successful payment.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handlePay}
              disabled={paying || isPaid}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPaid ? "Paid" : "Pay Now"}
            </Button>
            {!isPaid && (
              <Button variant="outline" onClick={handlePayLater}>
                <Clock className="mr-2 h-4 w-4" />
                Pay Later
              </Button>
            )}
            {statusPath && kind === "registration" && (
              <Button asChild variant="ghost">
                <Link to={statusPath} params={{ registrationId: recordId }}>View Status →</Link>
              </Button>
            )}
          </div>
          <p className="text-xs font-mono text-muted-foreground">ID: {recordId}</p>
        </CardContent>
      </Card>
    </div>
  );
}
