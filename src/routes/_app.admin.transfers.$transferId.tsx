import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffGuard } from "@/hooks/useStaffGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Transfer = {
  id: string;
  horse_id: string;
  from_owner_id: string | null;
  to_owner_id: string | null;
  from_owner_name: string | null;
  to_owner_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_address: string | null;
  sale_date: string | null;
  notes: string | null;
  is_gelded_at_transfer: boolean;
  status: string;
  payment_status: string;
  fee_amount: number | null;
};

export const Route = createFileRoute("/_app/admin/transfers/$transferId")({
  head: () => ({ meta: [{ title: "Review Transfer — EquestRai" }] }),
  component: AdminTransferDetail,
});

function AdminTransferDetail() {
  const { checking, user } = useStaffGuard();
  const { transferId } = Route.useParams();
  const [t, setT] = useState<Transfer | null>(null);
  const [horse, setHorse] = useState<{ name: string; registration_number: string | null; current_owner_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.from("transfers").select("*").eq("id", transferId).single();
    if (data) {
      setT(data as Transfer);
      const { data: h } = await supabase.from("horses").select("name, registration_number, current_owner_id").eq("id", data.horse_id).maybeSingle();
      setHorse(h);
    }
    setLoading(false);
  };

  useEffect(() => { if (!checking) void refresh(); /* eslint-disable-next-line */ }, [checking, transferId]);

  const log = async (action: string, metadata: Record<string, string> = {}) => {
    if (!user) return;
    const { data: prof } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
    await supabase.from("activity_log").insert({
      actor_id: user.id,
      actor_name: prof?.full_name ?? user.email ?? "Staff",
      action, entity_type: "transfer", entity_id: transferId, metadata,
    });
  };

  const notify = async (uid: string | null, title: string, body: string) => {
    if (!uid) return;
    await supabase.from("notifications").insert({ user_id: uid, title, body, link: `/horses/${t?.horse_id}` });
  };

  const approve = async () => {
    if (!t || !horse) return;
    setBusy(true);
    if (t.to_owner_id) {
      const { error: hErr } = await supabase.from("horses").update({ current_owner_id: t.to_owner_id }).eq("id", t.horse_id);
      if (hErr) { toast.error(hErr.message); setBusy(false); return; }
    }
    const update: { status: string; is_gelded_at_transfer?: boolean } = { status: "approved" };
    const { error } = await supabase.from("transfers").update(update).eq("id", t.id);
    if (error) { toast.error(error.message); setBusy(false); return; }
    if (t.is_gelded_at_transfer) {
      await supabase.from("horses").update({ sex: "gelding" }).eq("id", t.horse_id);
    }
    await log("approved");
    await notify(t.from_owner_id, "Transfer approved", `Transfer of ${horse.name} approved.`);
    await notify(t.to_owner_id, "Transfer approved", `You are now the registered owner of ${horse.name}.`);
    toast.success("Transfer approved");
    setBusy(false);
    void refresh();
  };

  const reject = async () => {
    if (!t) return;
    setBusy(true);
    const { error } = await supabase.from("transfers").update({ status: "rejected" }).eq("id", t.id);
    if (error) { toast.error(error.message); setBusy(false); return; }
    await log("rejected", { note: rejectNote });
    await notify(t.from_owner_id, "Transfer rejected", rejectNote || "Your transfer was rejected.");
    toast.success("Transfer rejected");
    setRejectOpen(false); setRejectNote(""); setBusy(false);
    void refresh();
  };

  if (checking || loading || !t) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <Link to="/admin/transfers" search={{ status: "all" }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to transfers
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">Transfer: {horse?.name ?? "—"}</h1>
        <div className="mt-1 flex gap-2">
          <Badge variant="outline">{t.status}</Badge>
          <Badge variant="outline">Payment: {t.payment_status}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="flex gap-2 pt-6">
          <Button onClick={approve} disabled={busy || t.status === "approved"} className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve & Transfer Ownership
          </Button>
          <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={busy}>Reject</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Seller</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {t.from_owner_name ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Buyer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {t.to_owner_name ?? "—"}</div>
            <div><span className="text-muted-foreground">Email:</span> {t.buyer_email ?? "—"}</div>
            <div><span className="text-muted-foreground">Phone:</span> {t.buyer_phone ?? "—"}</div>
            <div><span className="text-muted-foreground">Address:</span> {t.buyer_address ?? "—"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div><span className="text-muted-foreground">Horse:</span> {horse?.name} ({horse?.registration_number ?? "no reg #"})</div>
          <div><span className="text-muted-foreground">Sale Date:</span> {t.sale_date ? new Date(t.sale_date).toLocaleDateString() : "—"}</div>
          <div><span className="text-muted-foreground">Gelded at transfer:</span> {t.is_gelded_at_transfer ? "Yes" : "No"}</div>
          <div><span className="text-muted-foreground">Fee:</span> ${Number(t.fee_amount ?? 0).toFixed(2)}</div>
          {t.notes && <div className="mt-2"><span className="text-muted-foreground">Notes:</span> {t.notes}</div>}
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Transfer</DialogTitle></DialogHeader>
          <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason" rows={5} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={reject} disabled={busy || !rejectNote.trim()}>Confirm Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
