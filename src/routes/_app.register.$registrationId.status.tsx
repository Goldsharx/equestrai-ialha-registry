import { useEffect } from "react";
import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Circle, Clock, AlertTriangle, FileSignature, CreditCard, Sparkles, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/register/$registrationId/status")({
  head: () => ({ meta: [{ title: "Registration Status — EquestRai" }] }),
  component: StatusPage,
});

const PIPELINE = [
  { key: "draft", label: "Draft" },
  { key: "signatures", label: "Signatures" },
  { key: "payment", label: "Payment" },
  { key: "submitted", label: "Submitted" },
  { key: "in_review", label: "In Review" },
  { key: "approved", label: "Approved" },
] as const;

function deriveStep(reg: any, signatures: any[]): number {
  if (!reg) return 0;
  if (reg.status === "approved") return 5;
  if (reg.status === "in_review") return 4;
  if (reg.status === "submitted" || reg.submitted_at) return 3;
  if (reg.payment_status === "paid") return 2;
  const allSigned = signatures.length > 0 && signatures.every((s) => s.status === "signed");
  if (allSigned) return 1;
  return 0;
}

function StatusPage() {
  const { registrationId } = useParams({ from: "/_app/register/$registrationId/status" });
  const qc = useQueryClient();

  const { data: reg } = useQuery({
    queryKey: ["registration-status", registrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("id", registrationId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: signatures = [] } = useQuery({
    queryKey: ["registration-signatures", registrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signatures")
        .select("*")
        .eq("registration_id", registrationId);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`registration-${registrationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations", filter: `id=eq.${registrationId}` },
        () => qc.invalidateQueries({ queryKey: ["registration-status", registrationId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "signatures", filter: `registration_id=eq.${registrationId}` },
        () => qc.invalidateQueries({ queryKey: ["registration-signatures", registrationId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [registrationId, qc]);

  const step = deriveStep(reg, signatures);
  const score = reg?.ai_screening_score != null ? Number(reg.ai_screening_score) : null;
  const scoreColor =
    score == null ? "" : score > 90 ? "bg-emerald-600" : score >= 70 ? "bg-amber-500" : "bg-destructive";

  const timelines = [
    "Drafts can be submitted as soon as all signatures are collected and payment is complete.",
    "Most signatures are collected within 1–3 business days.",
    "Payment is processed instantly. Submission usually follows within minutes.",
    "Submitted applications enter the review queue within 1 business day.",
    "Standard review takes 5–10 business days. Expedited review takes 1–3 business days.",
    "This registration is approved. Your certificate will be available shortly.",
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-primary">Registration Status</h1>
          <p className="text-sm text-muted-foreground">
            {reg?.horse_name || reg?.name_choice_1 || "Untitled"} · ID {registrationId.slice(0, 8)}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      {/* Pipeline */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            {PIPELINE.map((s, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <div key={s.key} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                        done && "border-emerald-600 bg-emerald-600 text-white",
                        current && "border-secondary bg-secondary text-secondary-foreground ring-4 ring-secondary/20",
                        !done && !current && "border-muted bg-background text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="h-5 w-5" /> : <Circle className="h-3 w-3 fill-current" />}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        current && "text-secondary",
                        done && "text-emerald-700 dark:text-emerald-400",
                        !done && !current && "text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <div
                      className={cn(
                        "mx-2 h-0.5 flex-1 transition-colors",
                        i < step ? "bg-emerald-600" : "bg-muted",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detail cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Signatures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-primary">
              <FileSignature className="h-5 w-5" /> Signature Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {signatures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No signatures required.</p>
            ) : (
              <ul className="space-y-2">
                {signatures.map((s: any) => (
                  <li key={s.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <div>
                      <p className="font-medium">{s.signer_name}</p>
                      <p className="text-xs text-muted-foreground">{s.role}</p>
                    </div>
                    <SigBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-primary">
              <CreditCard className="h-5 w-5" /> Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              {reg?.payment_status === "paid" ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600">Paid</Badge>
              ) : (
                <Badge variant="outline">Unpaid</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Amount</span>
              <span className="font-serif text-lg text-primary">
                ${Number(reg?.fee_total ?? 0).toFixed(2)}
              </span>
            </div>
            {reg?.payment_status !== "paid" && (
              <Button asChild size="sm" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link to="/register/$registrationId/pay" params={{ registrationId }}>
                  Complete Payment
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* AI Screening */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-primary">
              <Sparkles className="h-5 w-5" /> AI Screening
            </CardTitle>
          </CardHeader>
          <CardContent>
            {score == null ? (
              <p className="text-sm text-muted-foreground">Screening will run after submission.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-md px-3 py-1 text-sm font-semibold text-white", scoreColor)}>
                    {Math.round(score)}/100
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {score > 90 ? "Excellent" : score >= 70 ? "Needs review" : "Issues detected"}
                  </span>
                </div>
                {reg?.ai_screening_notes && (
                  <p className="text-sm text-muted-foreground">{reg.ai_screening_notes}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviewer notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-primary">
              <MessageSquare className="h-5 w-5" /> Reviewer Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reg?.reviewer_notes ? (
              <p className="whitespace-pre-wrap text-sm">{reg.reviewer_notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No reviewer notes yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">Estimated Timeline</p>
            <p className="text-muted-foreground">{timelines[step]}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SigBadge({ status }: { status: string }) {
  if (status === "signed")
    return <Badge className="bg-emerald-600 hover:bg-emerald-600"><Check className="mr-1 h-3 w-3" />Signed</Badge>;
  if (status === "declined")
    return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Declined</Badge>;
  return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
}
