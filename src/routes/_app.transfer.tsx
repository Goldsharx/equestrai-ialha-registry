import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, Loader2, Search } from "lucide-react";
import { useUser } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/transfer")({
  head: () => ({
    meta: [
      { title: "Transfer Ownership — EquestRai" },
      { name: "description", content: "Transfer horse ownership between IALHA members." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    horse: typeof search.horse === "string" ? search.horse : undefined,
  }),
  component: TransferWizardPage,
});

const STEPS = ["Select Horse", "Buyer", "Details", "Review & Pay"] as const;

type BuyerProfile = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address_line1: string | null;
};

type WizardData = {
  horse_id: string | null;
  buyer_id: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_address: string;
  sale_date: Date;
  is_gelded_at_transfer: boolean;
  notes: string;
  terms_accepted: boolean;
};

function TransferWizardPage() {
  const user = useUser();
  const navigate = useNavigate();
  const search = useSearch({ from: "/_app/transfer" });
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<WizardData>({
    horse_id: search.horse ?? null,
    buyer_id: null,
    buyer_name: "",
    buyer_email: "",
    buyer_phone: "",
    buyer_address: "",
    sale_date: new Date(),
    is_gelded_at_transfer: false,
    notes: "",
    terms_accepted: false,
  });

  const update = (patch: Partial<WizardData>) => setData((p) => ({ ...p, ...patch }));

  // User's approved horses
  const { data: horses = [] } = useQuery({
    queryKey: ["my-approved-horses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("horses")
        .select("id,name,registration_number,breed,sex,color,status")
        .eq("current_owner_id", user!.id)
        .eq("status", "approved")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedHorse = horses.find((h) => h.id === data.horse_id);

  // Transfer fee
  const { data: fee } = useQuery({
    queryKey: ["fee", "TRANSFER"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_schedule")
        .select("amount,currency,description")
        .eq("code", "TRANSFER")
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const canNext = useMemo(() => {
    if (step === 0) return !!data.horse_id;
    if (step === 1) {
      if (data.buyer_id) return true;
      return data.buyer_name.trim().length > 0 && /\S+@\S+\.\S+/.test(data.buyer_email);
    }
    if (step === 2) return !!data.sale_date;
    if (step === 3) return data.terms_accepted;
    return false;
  }, [step, data]);

  const handleSubmit = async () => {
    if (!user || !data.horse_id) return;
    setSubmitting(true);
    try {
      const { data: row, error } = await supabase
        .from("transfers")
        .insert({
          horse_id: data.horse_id,
          from_owner_id: user.id,
          to_owner_id: data.buyer_id,
          to_owner_name: data.buyer_name || null,
          buyer_email: data.buyer_email || null,
          buyer_phone: data.buyer_phone || null,
          buyer_address: data.buyer_address || null,
          sale_date: format(data.sale_date, "yyyy-MM-dd"),
          is_gelded_at_transfer: data.is_gelded_at_transfer,
          notes: data.notes || null,
          fee_amount: fee?.amount ?? null,
          status: "draft",
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Transfer draft created");
      navigate({ to: "/transfer/$transferId/pay", params: { transferId: row.id } });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create transfer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-primary">Transfer Ownership</h1>
        <p className="text-sm text-muted-foreground">Transfer a registered horse to a new owner.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                i < step && "border-secondary bg-secondary text-secondary-foreground",
                i === step && "border-secondary bg-secondary text-secondary-foreground ring-2 ring-secondary/30",
                i > step && "border-muted bg-background text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className="hidden text-xs font-medium sm:block">{label}</div>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-primary">Step {step + 1}: {STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 && <StepSelectHorse horses={horses} data={data} update={update} selectedHorse={selectedHorse} />}
          {step === 1 && <StepBuyer data={data} update={update} />}
          {step === 2 && <StepDetails data={data} update={update} fee={fee} />}
          {step === 3 && <StepReview data={data} update={update} fee={fee} selectedHorse={selectedHorse} />}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            disabled={!canNext || submitting}
            onClick={handleSubmit}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit & Pay
          </Button>
        )}
      </div>
    </div>
  );
}

function StepSelectHorse({
  horses,
  data,
  update,
  selectedHorse,
}: {
  horses: any[];
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  selectedHorse: any;
}) {
  if (horses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You don't have any approved horses available to transfer.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Horse</Label>
        <Select value={data.horse_id ?? ""} onValueChange={(v) => update({ horse_id: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a horse" />
          </SelectTrigger>
          <SelectContent>
            {horses.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.name} {h.registration_number ? `— ${h.registration_number}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedHorse && (
        <Card className="bg-muted/30">
          <CardContent className="grid grid-cols-2 gap-3 p-4 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {selectedHorse.name}</div>
            <div><span className="text-muted-foreground">Reg #:</span> {selectedHorse.registration_number ?? "—"}</div>
            <div><span className="text-muted-foreground">Breed:</span> {selectedHorse.breed ?? "—"}</div>
            <div><span className="text-muted-foreground">Sex:</span> {selectedHorse.sex ?? "—"}</div>
            <div><span className="text-muted-foreground">Color:</span> {selectedHorse.color ?? "—"}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepBuyer({ data, update }: { data: WizardData; update: (p: Partial<WizardData>) => void }) {
  const [query, setQuery] = useState("");
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["buyer-search", query],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const q = `%${query.trim()}%`;
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id,full_name,phone,address_line1")
        .or(`full_name.ilike.${q}`)
        .limit(8);
      if (error) throw error;
      return (data ?? []) as BuyerProfile[];
    },
  });

  const selectBuyer = (p: BuyerProfile) => {
    update({
      buyer_id: p.user_id,
      buyer_name: p.full_name ?? "",
      buyer_phone: p.phone ?? "",
      buyer_address: p.address_line1 ?? "",
    });
    setQuery("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Search existing members</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Type a name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {isFetching && <p className="text-xs text-muted-foreground">Searching…</p>}
        {results.length > 0 && (
          <div className="overflow-hidden rounded-md border">
            {results.map((r) => (
              <button
                key={r.user_id}
                type="button"
                onClick={() => selectBuyer(r)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span>{r.full_name ?? "Unnamed"}</span>
                {data.buyer_id === r.user_id && <Check className="h-4 w-4 text-secondary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
        If the buyer is not an IALHA member, they can create an account after the transfer.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Buyer name *</Label>
          <Input value={data.buyer_name} onChange={(e) => update({ buyer_name: e.target.value, buyer_id: null })} />
        </div>
        <div className="space-y-2">
          <Label>Buyer email *</Label>
          <Input type="email" value={data.buyer_email} onChange={(e) => update({ buyer_email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Buyer phone</Label>
          <Input value={data.buyer_phone} onChange={(e) => update({ buyer_phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Buyer address</Label>
          <Input value={data.buyer_address} onChange={(e) => update({ buyer_address: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

function StepDetails({
  data,
  update,
  fee,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  fee: any;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Sale date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[260px] justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(data.sale_date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={data.sale_date}
              onSelect={(d) => d && update({ sale_date: d })}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <label className="flex items-start gap-3">
        <Checkbox
          checked={data.is_gelded_at_transfer}
          onCheckedChange={(v) => update({ is_gelded_at_transfer: v === true })}
        />
        <span className="text-sm">Was this horse gelded at or before the time of sale?</span>
      </label>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea value={data.notes} onChange={(e) => update({ notes: e.target.value })} rows={3} />
      </div>

      <Card className="bg-muted/30">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">{fee?.description ?? "Transfer Fee"}</p>
            <p className="text-xs text-muted-foreground">Standard IALHA member rate</p>
          </div>
          <p className="font-serif text-xl text-primary">
            ${Number(fee?.amount ?? 0).toFixed(2)} {fee?.currency ?? "USD"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StepReview({
  data,
  update,
  fee,
  selectedHorse,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  fee: any;
  selectedHorse: any;
}) {
  return (
    <div className="space-y-5">
      <Section title="Horse">
        <Row label="Name" value={selectedHorse?.name} />
        <Row label="Reg #" value={selectedHorse?.registration_number} />
        <Row label="Breed" value={selectedHorse?.breed} />
      </Section>
      <Section title="Buyer">
        <Row label="Name" value={data.buyer_name} />
        <Row label="Email" value={data.buyer_email} />
        <Row label="Phone" value={data.buyer_phone} />
        <Row label="Address" value={data.buyer_address} />
        <Row label="Member" value={data.buyer_id ? "Yes (existing IALHA member)" : "No"} />
      </Section>
      <Section title="Transfer">
        <Row label="Sale date" value={format(data.sale_date, "PPP")} />
        <Row label="Gelded at sale" value={data.is_gelded_at_transfer ? "Yes" : "No"} />
        <Row label="Fee" value={`$${Number(fee?.amount ?? 0).toFixed(2)} ${fee?.currency ?? "USD"}`} />
      </Section>

      <label className="flex items-start gap-3 rounded-md border p-3">
        <Checkbox
          checked={data.terms_accepted}
          onCheckedChange={(v) => update({ terms_accepted: v === true })}
        />
        <span className="text-sm">
          I certify I am the legal owner of this horse and authorize this transfer.
        </span>
      </label>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-serif text-lg text-primary">{title}</h3>
      <div className="space-y-1 rounded-md border bg-muted/20 p-3 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </div>
  );
}
