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
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Reg = {
  id: string;
  applicant_id: string;
  horse_id: string | null;
  horse_name: string | null;
  type: string | null;
  status: string;
  birth_date: string | null;
  sex: string | null;
  color: string | null;
  birth_country: string | null;
  microchip_number: string | null;
  dna_case_number: string | null;
  sire_id: string | null;
  dam_id: string | null;
  sire_name: string | null;
  dam_name: string | null;
  foreign_registry_name: string | null;
  foreign_registration_number: string | null;
  breeder_name: string | null;
  breeder_contact: string | null;
  stallion_owner_name: string | null;
  stallion_owner_contact: string | null;
  markings_description: string | null;
  no_markings: boolean;
  fee_total: number | null;
  payment_status: string;
  ai_screening_score: number | null;
  ai_screening_notes: string | null;
  ai_screening_result: { issues?: Array<{ severity: string; message: string }> } | null;
  reviewer_notes: string | null;
  submitted_at: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_app/admin/registrations/$registrationId")({
  head: () => ({ meta: [{ title: "Review Registration — EquestRai" }] }),
  component: AdminRegistrationDetail,
});

function severityIcon(sev: string) {
  if (sev === "critical") return <AlertCircle className="h-4 w-4 text-rose-600" />;
  if (sev === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <Info className="h-4 w-4 text-blue-500" />;
}

function aiBadge(score: number | null) {
  if (score == null) return <Badge variant="secondary">Not screened</Badge>;
  if (score > 90) return <Badge className="bg-emerald-600">AI Score {score.toFixed(0)}</Badge>;
  if (score >= 70) return <Badge className="bg-amber-500">AI Score {score.toFixed(0)}</Badge>;
  return <Badge className="bg-rose-600">AI Score {score.toFixed(0)}</Badge>;
}

function AdminRegistrationDetail() {
  const { checking, user } = useStaffGuard();
  const { registrationId } = Route.useParams();
  const navigate = useNavigate();

  const [reg, setReg] = useState<Reg | null>(null);
  const [applicant, setApplicant] = useState<{ full_name: string | null; phone: string | null; farm_name: string | null } | null>(null);
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; photo_type: string | null }>>([]);
  const [docs, setDocs] = useState<Array<{ id: string; url: string; name: string; document_type: string | null }>>([]);
  const [horse, setHorse] = useState<{ markings_image_url: string | null; sire_id: string | null; dam_id: string | null; sire_name: string | null; dam_name: string | null } | null>(null);
  const [activity, setActivity] = useState<Array<{ id: string; action: string; actor_name: string | null; created_at: string; metadata: Record<string, unknown> }>>([]);
  const [loading, setLoading] = useState(true);
  const [enlarged, setEnlarged] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<null | "needs_info" | "rejected">(null);
  const [actionNote, setActionNote] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const { data: r } = await supabase.from("registrations").select("*").eq("id", registrationId).single();
    if (!r) { setLoading(false); return; }
    setReg(r as Reg);

    const [{ data: prof }, { data: ph }, horseRes] = await Promise.all([
      supabase.from("profiles").select("full_name, phone, farm_name").eq("user_id", r.applicant_id).maybeSingle(),
      supabase.from("horse_photos").select("id, url, photo_type").eq("registration_id", registrationId),
      r.horse_id
        ? supabase.from("horses").select("markings_image_url, sire_id, dam_id, sire_name, dam_name").eq("id", r.horse_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setApplicant(prof);
    setPhotos((ph ?? []) as typeof photos);
    setHorse(horseRes.data as typeof horse);

    if (r.horse_id) {
      const { data: fd } = await supabase.from("foreign_documents").select("id, url, name, document_type").eq("horse_id", r.horse_id);
      setDocs((fd ?? []) as typeof docs);
    }

    const { data: act } = await supabase
      .from("activity_log")
      .select("id, action, actor_name, created_at, metadata")
      .eq("entity_type", "registration")
      .eq("entity_id", registrationId)
      .order("created_at", { ascending: false })
      .limit(50);
    setActivity((act ?? []) as typeof activity);

    setLoading(false);
  };

  useEffect(() => {
    if (!checking) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, registrationId]);

  const logActivity = async (action: string, metadata: Record<string, unknown> = {}) => {
    if (!user) return;
    const { data: prof } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
    await supabase.from("activity_log").insert({
      actor_id: user.id,
      actor_name: prof?.full_name ?? user.email ?? "Staff",
      action,
      entity_type: "registration",
      entity_id: registrationId,
      metadata,
    });
  };

  const notify = async (title: string, body: string) => {
    if (!reg) return;
    await supabase.from("notifications").insert({
      user_id: reg.applicant_id,
      title,
      body,
      link: `/register/${reg.id}/status`,
    });
  };

  const setStatus = async (newStatus: string, note?: string) => {
    if (!reg) return;
    setBusy(true);
    const update: Record<string, unknown> = { status: newStatus };
    if (note !== undefined) update.reviewer_notes = note;
    if (newStatus === "approved" && reg.horse_id) {
      await supabase.from("horses").update({ status: "approved" }).eq("id", reg.horse_id);
    }
    const { error } = await supabase.from("registrations").update(update).eq("id", reg.id);
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    await logActivity(`status_${newStatus}`, note ? { note } : {});
    const messages: Record<string, [string, string]> = {
      approved: ["Registration approved", `${reg.horse_name ?? "Your horse"} has been approved. Your certificate is being prepared.`],
      needs_info: ["More information needed", note ?? "Staff has requested additional information."],
      pending_board: ["Sent to board review", "Your registration has been escalated to the board for review."],
      rejected: ["Registration rejected", note ?? "Your registration has been rejected."],
    };
    const m = messages[newStatus];
    if (m) await notify(m[0], m[1]);
    toast.success(`Marked as ${newStatus.replace(/_/g, " ")}`);
    setActionDialog(null);
    setActionNote("");
    setBusy(false);
    void refresh();
  };

  if (checking || loading || !reg) return <Skeleton className="h-96 w-full" />;

  const issues = reg.ai_screening_result?.issues ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/registrations" search={{ status: "all" }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to queue
          </Link>
          <h1 className="mt-1 text-3xl font-semibold">{reg.horse_name ?? "Untitled Registration"}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{reg.status.replace(/_/g, " ")}</Badge>
            <Badge variant="outline">{reg.type}</Badge>
            {aiBadge(reg.ai_screening_score)}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <Card>
        <CardContent className="flex flex-wrap gap-2 pt-6">
          <Button onClick={() => setStatus("approved")} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
          </Button>
          <Button variant="outline" onClick={() => setActionDialog("needs_info")} disabled={busy}>Request More Info</Button>
          <Button variant="outline" onClick={() => setStatus("pending_board")} disabled={busy}>Send to Board</Button>
          <Button variant="destructive" onClick={() => setActionDialog("rejected")} disabled={busy}>Reject</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: submitted data */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Horse Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Name" value={reg.horse_name} />
              <Field label="Type" value={reg.type} />
              <Field label="Birth Date" value={reg.birth_date} />
              <Field label="Sex" value={reg.sex} />
              <Field label="Color" value={reg.color} />
              <Field label="Birth Country" value={reg.birth_country} />
              <Field label="Microchip #" value={reg.microchip_number} />
              <Field label="DNA Case #" value={reg.dna_case_number} />
              {reg.foreign_registry_name && <Field label="Foreign Registry" value={reg.foreign_registry_name} />}
              {reg.foreign_registration_number && <Field label="Foreign Reg #" value={reg.foreign_registration_number} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Parentage</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Sire" value={reg.sire_name} />
              <Field label="Dam" value={reg.dam_name} />
              <Field label="Breeder" value={reg.breeder_name} />
              <Field label="Breeder Contact" value={reg.breeder_contact} />
              <Field label="Stallion Owner" value={reg.stallion_owner_name} />
              <Field label="Stallion Owner Contact" value={reg.stallion_owner_contact} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Applicant</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Name" value={applicant?.full_name} />
              <Field label="Phone" value={applicant?.phone} />
              <Field label="Farm" value={applicant?.farm_name} />
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader><CardTitle>Photos</CardTitle></CardHeader>
            <CardContent>
              {photos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No photos uploaded.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {photos.map((p) => (
                    <button key={p.id} onClick={() => setEnlarged(p.url)} className="group relative">
                      <img src={p.url} alt={p.photo_type ?? "Photo"} className="h-32 w-full rounded border object-cover transition group-hover:opacity-80" />
                      {p.photo_type && (
                        <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                          {p.photo_type}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Markings */}
          <Card>
            <CardHeader><CardTitle>Markings</CardTitle></CardHeader>
            <CardContent>
              {reg.no_markings ? (
                <p className="text-sm text-muted-foreground">No markings declared.</p>
              ) : (
                <>
                  {reg.markings_description && <p className="mb-3 text-sm">{reg.markings_description}</p>}
                  {horse?.markings_image_url && (
                    <img src={horse.markings_image_url} alt="Markings diagram" className="max-h-80 rounded border" />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Pedigree */}
          <Card>
            <CardHeader><CardTitle>Pedigree</CardTitle></CardHeader>
            <CardContent>
              <PedigreeTree
                self={{ name: reg.horse_name, sire_name: reg.sire_name, dam_name: reg.dam_name }}
              />
            </CardContent>
          </Card>

          {/* Foreign documents */}
          {docs.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Foreign Documents</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {docs.map((d) => (
                  <a key={d.id} href={d.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded border p-2 text-sm hover:bg-muted">
                    <span>{d.name}</span>
                    {d.document_type && <Badge variant="outline">{d.document_type}</Badge>}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: AI screening */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Screening</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiBadge(reg.ai_screening_score)}
              {reg.ai_screening_notes && <p className="text-sm text-muted-foreground">{reg.ai_screening_notes}</p>}
              {issues.length > 0 ? (
                <ul className="space-y-2">
                  {issues.map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2 rounded border p-2 text-sm">
                      <span className="mt-0.5">{severityIcon(i.severity)}</span>
                      <span>{i.message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No issues flagged.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <div>Status: <Badge variant="outline">{reg.payment_status}</Badge></div>
              {reg.fee_total != null && <div className="mt-1">Total: ${Number(reg.fee_total).toFixed(2)}</div>}
            </CardContent>
          </Card>

          {reg.reviewer_notes && (
            <Card>
              <CardHeader><CardTitle>Reviewer Notes</CardTitle></CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">{reg.reviewer_notes}</CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="divide-y">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{a.action}</Badge>
                    {a.actor_name && <span>{a.actor_name}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Enlarged photo */}
      <Dialog open={enlarged !== null} onOpenChange={(o) => !o && setEnlarged(null)}>
        <DialogContent className="max-w-3xl">
          {enlarged && <img src={enlarged} alt="Enlarged" className="w-full rounded" />}
        </DialogContent>
      </Dialog>

      {/* Note dialog */}
      <Dialog open={actionDialog !== null} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog === "needs_info" ? "Request More Information" : "Reject Registration"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            placeholder={actionDialog === "needs_info" ? "What information is needed?" : "Reason for rejection"}
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              onClick={() => actionDialog && setStatus(actionDialog, actionNote)}
              disabled={busy || !actionNote.trim()}
              variant={actionDialog === "rejected" ? "destructive" : "default"}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}

function PedigreeTree({ self }: { self: { name: string | null; sire_name: string | null; dam_name: string | null } }) {
  return (
    <div className="flex items-center gap-4 overflow-x-auto">
      <div className="rounded border bg-muted px-3 py-2 text-sm font-semibold">{self.name ?? "—"}</div>
      <div className="flex flex-col gap-2">
        <div className="rounded border px-3 py-2 text-sm">Sire: {self.sire_name ?? "—"}</div>
        <div className="rounded border px-3 py-2 text-sm">Dam: {self.dam_name ?? "—"}</div>
      </div>
    </div>
  );
}
