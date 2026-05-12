import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ChevronRight, Loader2, Search, Trash2, Upload } from "lucide-react";
import { useUser } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/register")({
  head: () => ({
    meta: [
      { title: "Register a Horse — EquestRai" },
      { name: "description", content: "Submit a new IALHA horse registration." },
    ],
  }),
  component: RegisterWizardPage,
});

type RegistrationType = "purebred_ialha" | "purebred_foreign" | "half_bred";

type WizardData = {
  type: RegistrationType | null;
  name_choice_1: string;
  name_choice_2: string;
  name_choice_3: string;
  birth_date: Date | null;
  sex: string;
  color: string;
  birth_country: string;
  microchip_number: string;
  dna_case_number: string;
  sire_id: string | null;
  sire_name: string;
  dam_id: string | null;
  dam_name: string;
  foreign_registry_name: string;
  foreign_registration_number: string;
  foreign_document_path: string | null;
  breeder_name: string;
  breeder_contact: string;
  stallion_owner_name: string;
  stallion_owner_contact: string;
  markings_description: string;
  no_markings: boolean;
  add_ons: string[];
  terms_accepted: boolean;
};

const EMPTY: WizardData = {
  type: null,
  name_choice_1: "",
  name_choice_2: "",
  name_choice_3: "",
  birth_date: null,
  sex: "",
  color: "",
  birth_country: "US",
  microchip_number: "",
  dna_case_number: "",
  sire_id: null,
  sire_name: "",
  dam_id: null,
  dam_name: "",
  foreign_registry_name: "",
  foreign_registration_number: "",
  foreign_document_path: null,
  breeder_name: "",
  breeder_contact: "",
  stallion_owner_name: "",
  stallion_owner_contact: "",
  markings_description: "",
  no_markings: false,
  add_ons: [],
  terms_accepted: false,
};

const PHOTO_SLOTS: { code: string; label: string; required: boolean }[] = [
  { code: "left", label: "Left Side", required: true },
  { code: "right", label: "Right Side", required: true },
  { code: "front", label: "Front", required: true },
  { code: "rear", label: "Rear", required: true },
  { code: "brand", label: "Brand", required: false },
  { code: "other", label: "Other", required: false },
];

const ADDONS = [
  { code: "addon_dna_kit", label: "DNA Kit", amount: 50 },
  { code: "addon_microchip", label: "Microchip", amount: 75 },
  { code: "addon_expedited", label: "Expedited Processing", amount: 100 },
];

const STEPS = [
  { id: 1, label: "Type" },
  { id: 2, label: "Horse Details" },
  { id: 3, label: "Parentage" },
  { id: 4, label: "Photos & Markings" },
  { id: 5, label: "Review & Submit" },
];

const COLORS = ["Bay", "Black", "Gray", "Chestnut", "Palomino", "Buckskin", "Dun", "Cremello", "Perlino", "Other"];

function RegisterWizardPage() {
  const user = useUser();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(EMPTY);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }));

  const buildPayload = (next: WizardData) => ({
    applicant_id: user!.id,
    status: "draft" as const,
    type: next.type,
    horse_name: next.name_choice_1 || null,
    name_choice_1: next.name_choice_1 || null,
    name_choice_2: next.name_choice_2 || null,
    name_choice_3: next.name_choice_3 || null,
    birth_date: next.birth_date ? format(next.birth_date, "yyyy-MM-dd") : null,
    sex: next.sex || null,
    color: next.color || null,
    birth_country: next.birth_country || null,
    microchip_number: next.microchip_number || null,
    dna_case_number: next.dna_case_number || null,
    sire_id: next.sire_id,
    sire_name: next.sire_name || null,
    dam_id: next.dam_id,
    dam_name: next.dam_name || null,
    foreign_registry_name: next.foreign_registry_name || null,
    foreign_registration_number: next.foreign_registration_number || null,
    breeder_name: next.breeder_name || null,
    breeder_contact: next.breeder_contact || null,
    stallion_owner_name: next.stallion_owner_name || null,
    stallion_owner_contact: next.stallion_owner_contact || null,
    markings_description: next.no_markings ? "NONE" : (next.markings_description || null),
    no_markings: next.no_markings,
    add_ons: next.add_ons,
    terms_accepted: next.terms_accepted,
  });

  const persist = async (next: WizardData): Promise<string | null> => {
    if (!user?.id) return null;
    setSaving(true);
    try {
      const payload = buildPayload(next);
      if (registrationId) {
        const { error } = await supabase
          .from("registrations")
          .update(payload)
          .eq("id", registrationId);
        if (error) throw error;
        return registrationId;
      } else {
        const { data: row, error } = await supabase
          .from("registrations")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setRegistrationId(row.id);
        return row.id;
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save draft");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    await persist(data);
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSaveDraft = async () => {
    const id = await persist(data);
    if (id) toast.success("Draft saved");
  };

  const handleSubmitAndPay = async () => {
    if (!data.terms_accepted) {
      toast.error("Please accept the terms to continue");
      return;
    }
    setSubmitting(true);
    const id = await persist(data);
    setSubmitting(false);
    if (id) navigate({ to: "/register/$registrationId/pay", params: { registrationId: id } });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="font-serif text-3xl text-primary">Register a Horse</h1>
        <p className="text-sm text-muted-foreground">
          Complete each step to submit your registration to IALHA.
        </p>
      </header>

      <StepIndicator current={step} />

      {step === 1 && <StepType data={data} onSelect={async (t) => {
        const next = { ...data, type: t };
        setData(next);
        await persist(next);
        setStep(2);
      }} />}

      {step === 2 && <StepDetails data={data} update={update} />}

      {step === 3 && <StepParentage data={data} update={update} userId={user?.id} />}

      {step === 4 && (
        <StepPhotosMarkings
          data={data}
          update={update}
          userId={user?.id}
          ensureRegistration={() => persist(data)}
          registrationId={registrationId}
        />
      )}

      {step === 5 && (
        <StepReview
          data={data}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmitAndPay}
          saving={saving}
          submitting={submitting}
          update={update}
        />
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} disabled={step === 1 || saving}>
          Back
        </Button>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center text-xs text-muted-foreground">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving draft…
            </span>
          )}
          {step > 1 && step < STEPS.length && (
            <Button
              onClick={goNext}
              disabled={saving || (step === 2 && !data.name_choice_1)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Continue <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-0">
      {STEPS.map((s, idx) => {
        const isActive = current === s.id;
        const isDone = current > s.id;
        return (
          <li key={s.id} className="flex flex-1 items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  isActive && "border-secondary bg-secondary text-secondary-foreground",
                  isDone && "border-secondary bg-secondary text-secondary-foreground",
                  !isActive && !isDone && "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : s.id}
              </span>
              <span
                className={cn(
                  "hidden text-sm sm:inline",
                  isActive ? "font-semibold text-primary" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="mx-2 h-px flex-1 bg-muted-foreground/20" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepType({
  data,
  onSelect,
}: {
  data: WizardData;
  onSelect: (t: RegistrationType) => void;
}) {
  const options: { id: RegistrationType; title: string; desc: string }[] = [
    {
      id: "purebred_ialha",
      title: "Purebred (IALHA-Bred)",
      desc: "Both parents registered with IALHA.",
    },
    {
      id: "purebred_foreign",
      title: "Purebred (Foreign-Bred)",
      desc: "Horse registered with a foreign PRE/PSL registry.",
    },
    {
      id: "half_bred",
      title: "Half-Bred",
      desc: "One parent is a registered PRE, PSL, or SP.",
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {options.map((o) => {
        const active = data.type === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelect(o.id)}
            className={cn(
              "cursor-pointer rounded-lg border-2 bg-card p-6 text-left transition-all hover:border-secondary hover:shadow-md",
              active ? "border-secondary shadow-md" : "border-muted-foreground/20",
            )}
          >
            <h3 className="font-serif text-lg text-primary">{o.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{o.desc}</p>
          </button>
        );
      })}
    </div>
  );
}

function StepDetails({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-primary">Horse Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <Field label="Name Choice 1 *" htmlFor="n1">
          <Input id="n1" value={data.name_choice_1} maxLength={100}
            onChange={(e) => update({ name_choice_1: e.target.value })} />
        </Field>
        <Field label="Name Choice 2" htmlFor="n2">
          <Input id="n2" value={data.name_choice_2} maxLength={100}
            onChange={(e) => update({ name_choice_2: e.target.value })} />
        </Field>
        <Field label="Name Choice 3" htmlFor="n3">
          <Input id="n3" value={data.name_choice_3} maxLength={100}
            onChange={(e) => update({ name_choice_3: e.target.value })} />
        </Field>

        <Field label="Birth Date" htmlFor="dob">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="dob"
                variant="outline"
                className={cn(
                  "h-10 w-full justify-between text-left font-normal",
                  !data.birth_date && "text-muted-foreground",
                )}
              >
                <span>{data.birth_date ? format(data.birth_date, "PPP") : "Pick a date"}</span>
                <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={data.birth_date ?? undefined}
                onSelect={(d) => update({ birth_date: d ?? null })}
                disabled={(d) => d > new Date() || d < new Date("1950-01-01")}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </Field>

        <Field label="Sex" htmlFor="sex">
          <Select value={data.sex} onValueChange={(v) => update({ sex: v })}>
            <SelectTrigger id="sex"><SelectValue placeholder="Select sex" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="stallion">Stallion</SelectItem>
              <SelectItem value="mare">Mare</SelectItem>
              <SelectItem value="gelding">Gelding</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Color" htmlFor="color">
          <Select value={data.color} onValueChange={(v) => update({ color: v })}>
            <SelectTrigger id="color"><SelectValue placeholder="Select color" /></SelectTrigger>
            <SelectContent>
              {COLORS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Birth Country" htmlFor="bc">
          <Input id="bc" value={data.birth_country} maxLength={50}
            onChange={(e) => update({ birth_country: e.target.value })} />
        </Field>

        <Field label="Microchip Number" htmlFor="mc">
          <Input id="mc" value={data.microchip_number} maxLength={50}
            onChange={(e) => update({ microchip_number: e.target.value })} />
        </Field>

        <Field label="DNA Case Number" htmlFor="dna" hint="Required for horses born after 2010">
          <Input id="dna" value={data.dna_case_number} maxLength={50}
            onChange={(e) => update({ dna_case_number: e.target.value })} />
        </Field>
      </CardContent>
    </Card>
  );
}

function StepParentage({
  data,
  update,
  userId,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  userId: string | undefined;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-primary">Parentage</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <ParentSearch
            label="Sire"
            sex="stallion"
            value={{ id: data.sire_id, name: data.sire_name }}
            onChange={async ({ id, name, ownerId }) => {
              const patch: Partial<WizardData> = { sire_id: id, sire_name: name };
              if (ownerId) {
                const { data: prof } = await supabase
                  .from("profiles")
                  .select("full_name,phone")
                  .eq("user_id", ownerId)
                  .maybeSingle();
                if (prof) {
                  patch.stallion_owner_name = prof.full_name ?? "";
                  patch.stallion_owner_contact = prof.phone ?? "";
                }
              }
              update(patch);
            }}
          />
          <ParentSearch
            label="Dam"
            sex="mare"
            value={{ id: data.dam_id, name: data.dam_name }}
            onChange={({ id, name }) => update({ dam_id: id, dam_name: name })}
          />
        </CardContent>
      </Card>

      {data.type === "purebred_foreign" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-primary">Foreign Registry Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <Field label="Foreign Registry Name" htmlFor="frn">
              <Input id="frn" value={data.foreign_registry_name} maxLength={100}
                onChange={(e) => update({ foreign_registry_name: e.target.value })} />
            </Field>
            <Field label="Foreign Registration Number" htmlFor="frnum">
              <Input id="frnum" value={data.foreign_registration_number} maxLength={50}
                onChange={(e) => update({ foreign_registration_number: e.target.value })} />
            </Field>
            <div className="md:col-span-2">
              <ForeignDocUpload
                userId={userId}
                value={data.foreign_document_path}
                onChange={(path) => update({ foreign_document_path: path })}
                onExtract={(fields) => update(fields)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-primary">Breeder & Stallion Owner</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <BreederAutofill userId={userId} data={data} update={update} />
          <Field label="Breeder Name" htmlFor="bn">
            <Input id="bn" value={data.breeder_name} maxLength={100}
              onChange={(e) => update({ breeder_name: e.target.value })} />
          </Field>
          <Field label="Breeder Contact" htmlFor="bc2">
            <Input id="bc2" value={data.breeder_contact} maxLength={100}
              onChange={(e) => update({ breeder_contact: e.target.value })} />
          </Field>
          <Field label="Stallion Owner Name" htmlFor="son">
            <Input id="son" value={data.stallion_owner_name} maxLength={100}
              onChange={(e) => update({ stallion_owner_name: e.target.value })} />
          </Field>
          <Field label="Stallion Owner Contact" htmlFor="soc">
            <Input id="soc" value={data.stallion_owner_contact} maxLength={100}
              onChange={(e) => update({ stallion_owner_contact: e.target.value })} />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

function BreederAutofill({
  userId,
  data,
  update,
}: {
  userId: string | undefined;
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  useEffect(() => {
    if (!userId || data.breeder_name) return;
    let cancelled = false;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name,phone")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled || !prof) return;
      update({
        breeder_name: prof.full_name ?? "",
        breeder_contact: prof.phone ?? "",
      });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  return null;
}

type HorseHit = { id: string; name: string; registration_number: string | null; current_owner_id: string };

function ParentSearch({
  label,
  sex,
  value,
  onChange,
}: {
  label: string;
  sex: "stallion" | "mare";
  value: { id: string | null; name: string };
  onChange: (v: { id: string | null; name: string; ownerId?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HorseHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    setLoading(true);
    const t = setTimeout(async () => {
      let req = supabase
        .from("horses")
        .select("id,name,registration_number,current_owner_id")
        .eq("sex", sex)
        .in("breed_type", ["PRE", "PSL", "SP"])
        .limit(20);
      if (q) req = req.ilike("name", `%${q}%`);
      const { data } = await req;
      setResults((data ?? []) as HorseHit[]);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query, open, sex]);

  const display = useMemo(() => value.name || `Search ${label.toLowerCase()}…`, [value.name, label]);

  return (
    <Field label={label} htmlFor={`p-${label}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`p-${label}`}
            variant="outline"
            className="h-10 w-full justify-start font-normal"
          >
            <Search className="mr-2 h-4 w-4" /> {display}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-2" align="start">
          <Input
            placeholder="Type a name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb-2"
            autoFocus
          />
          <div className="max-h-64 overflow-auto">
            {loading ? (
              <p className="p-3 text-xs text-muted-foreground">Searching…</p>
            ) : results.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">No matches.</p>
            ) : (
              results.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    onChange({ id: h.id, name: h.name, ownerId: h.current_owner_id });
                    setOpen(false);
                  }}
                  className="flex w-full flex-col items-start rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span className="font-medium">{h.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Reg #{h.registration_number ?? "—"}
                  </span>
                </button>
              ))
            )}
          </div>
          {value.id && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-full text-xs"
              onClick={() => { onChange({ id: null, name: "" }); setOpen(false); }}
            >
              Clear selection
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </Field>
  );
}

function ForeignDocUpload({
  userId,
  value,
  onChange,
  onExtract,
}: {
  userId: string | undefined;
  value: string | null;
  onChange: (path: string | null) => void;
  onExtract: (fields: Partial<WizardData>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<Record<string, any> | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  const onFile = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const path = `${userId}/foreign-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
      if (error) throw error;
      onChange(path);
      toast.success("Document uploaded");

      // Trigger AI extraction
      setExtracting(true);
      const { data: signed } = await supabase.storage.from("documents").createSignedUrl(path, 600);
      const { data: result, error: fnErr } = await supabase.functions.invoke("ai-extract-document", {
        body: { document_id: path, file_url: signed?.signedUrl },
      });
      if (fnErr) throw fnErr;
      const fields = (result as any)?.extracted ?? {};
      setExtracted(fields);
      setConfidence(typeof fields.confidence === "number" ? fields.confidence : null);

      // Pre-fill wizard fields the user can still edit
      const patch: Partial<WizardData> = {};
      if (fields.registry_name) patch.foreign_registry_name = fields.registry_name;
      if (fields.registration_number) patch.foreign_registration_number = fields.registration_number;
      if (fields.horse_name && !fields.name_choice_1) patch.name_choice_1 = fields.horse_name;
      if (fields.sex) patch.sex = String(fields.sex).toLowerCase();
      if (fields.color) patch.color = fields.color;
      if (fields.birth_country) patch.birth_country = fields.birth_country;
      if (fields.microchip_number) patch.microchip_number = fields.microchip_number;
      if (fields.sire_name) patch.sire_name = fields.sire_name;
      if (fields.dam_name) patch.dam_name = fields.dam_name;
      if (fields.breeder_name) patch.breeder_name = fields.breeder_name;
      onExtract(patch);
      toast.success("Extracted — please verify the fields below");
    } catch (err) {
      console.error(err);
      toast.error("Upload or extraction failed");
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const confidenceBadge = () => {
    if (confidence == null) return null;
    const pct = Math.round(confidence * 100);
    const tone =
      pct >= 85 ? "bg-green-100 text-green-900 border-green-300"
      : pct >= 60 ? "bg-yellow-100 text-yellow-900 border-yellow-300"
      : "bg-destructive/10 text-destructive border-destructive/30";
    return <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", tone)}>Confidence {pct}%</span>;
  };

  return (
    <div className="space-y-3">
      <Label>Foreign Registry Certificate</Label>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" disabled={uploading || extracting}>
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading…" : extracting ? "Extracting…" : "Choose file"}
            <input
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </label>
        </Button>
        {value && <span className="truncate text-xs text-muted-foreground">{value.split("/").pop()}</span>}
        {extracting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {confidenceBadge()}
      </div>

      {extracted && (
        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          <p className="mb-2 font-semibold text-primary">AI-extracted fields (verify above)</p>
          <dl className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {Object.entries(extracted)
              .filter(([k]) => k !== "confidence")
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b py-0.5">
                  <dt className="text-muted-foreground">{k.replace(/_/g, " ")}</dt>
                  <dd className="font-medium">{v ? String(v) : "—"}</dd>
                </div>
              ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ============= Step 4: Photos & Markings =============

type PhotoRow = { id: string; url: string; photo_type: string | null };

function StepPhotosMarkings({
  data,
  update,
  userId,
  ensureRegistration,
  registrationId,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  userId: string | undefined;
  ensureRegistration: () => Promise<string | null>;
  registrationId: string | null;
}) {
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (!registrationId) return;
    (async () => {
      const { data: rows } = await supabase
        .from("horse_photos")
        .select("id,url,photo_type")
        .eq("registration_id", registrationId);
      setPhotos((rows ?? []) as PhotoRow[]);
    })();
  }, [registrationId]);

  const handleUpload = async (slot: string, file: File) => {
    if (!userId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo must be under 10MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Only JPG or PNG allowed");
      return;
    }
    setUploading(slot);
    try {
      const regId = registrationId ?? (await ensureRegistration());
      if (!regId) throw new Error("No registration");
      const ext = file.name.split(".").pop();
      const path = `${userId}/registration-${regId}/${slot}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("photos")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("photos").getPublicUrl(path);
      // Replace any existing photo for this slot in this registration
      await supabase
        .from("horse_photos")
        .delete()
        .eq("registration_id", regId)
        .eq("photo_type", slot);
      const { data: row, error: insErr } = await supabase
        .from("horse_photos")
        .insert({
          registration_id: regId,
          url: pub.publicUrl,
          photo_type: slot,
        })
        .select("id,url,photo_type")
        .single();
      if (insErr) throw insErr;
      setPhotos((prev) => [...prev.filter((p) => p.photo_type !== slot), row as PhotoRow]);
      toast.success("Photo uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (photo: PhotoRow) => {
    await supabase.from("horse_photos").delete().eq("id", photo.id);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-primary">Required Photos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload clear photos of all four sides. JPG or PNG, max 10MB each.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {PHOTO_SLOTS.map((slot) => {
              const existing = photos.find((p) => p.photo_type === slot.code);
              return (
                <PhotoSlot
                  key={slot.code}
                  slot={slot}
                  existing={existing}
                  uploading={uploading === slot.code}
                  onUpload={(f) => handleUpload(slot.code, f)}
                  onDelete={existing ? () => handleDelete(existing) : undefined}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-primary">Markings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={data.no_markings}
              onCheckedChange={(c) => update({ no_markings: !!c, markings_description: c ? "NONE" : "" })}
            />
            <span className="text-sm">This horse has no markings</span>
          </label>

          {!data.no_markings && (
            <>
              <div className="flex h-48 items-center justify-center rounded-md border-2 border-dashed border-secondary/40 bg-cream/50 text-sm text-muted-foreground">
                <div className="text-center">
                  <p className="font-serif text-lg text-primary">Digital Markings Canvas</p>
                  <p className="text-xs">Draw your horse's markings here</p>
                </div>
              </div>
              <Textarea
                placeholder="Describe markings (e.g., star on forehead, white left hind sock)…"
                value={data.markings_description}
                maxLength={1000}
                onChange={(e) => update({ markings_description: e.target.value })}
                rows={4}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PhotoSlot({
  slot,
  existing,
  uploading,
  onUpload,
  onDelete,
}: {
  slot: { code: string; label: string; required: boolean };
  existing?: PhotoRow;
  uploading: boolean;
  onUpload: (f: File) => void;
  onDelete?: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">
          {slot.label} {slot.required && <span className="text-destructive">*</span>}
        </Label>
        {existing && onDelete && (
          <button type="button" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <label className={cn(
        "relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed bg-muted/30 transition-colors hover:border-secondary",
        existing ? "border-secondary/40" : "border-muted-foreground/30",
      )}>
        {existing ? (
          <img src={existing.url} alt={slot.label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <HorseSilhouette angle={slot.code} />
                <span className="text-xs">Click to upload</span>
              </>
            )}
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

function HorseSilhouette({ angle }: { angle: string }) {
  // Minimal directional indicator
  const labels: Record<string, string> = {
    left: "← Left",
    right: "Right →",
    front: "Front",
    rear: "Rear",
    brand: "Brand",
    other: "Other",
  };
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
      {labels[angle] ?? angle}
    </div>
  );
}

// ============= Step 5: Review & Submit =============

function StepReview({
  data,
  onSaveDraft,
  onSubmit,
  saving,
  submitting,
  update,
}: {
  data: WizardData;
  onSaveDraft: () => void;
  onSubmit: () => void;
  saving: boolean;
  submitting: boolean;
  update: (p: Partial<WizardData>) => void;
}) {
  const { data: feeResp, isLoading: feeLoading } = useQuery({
    queryKey: ["calculate-fees", data.type, data.birth_date?.toISOString() ?? null, data.add_ons.join(",")],
    enabled: !!data.type,
    queryFn: async () => {
      const { data: res, error } = await supabase.functions.invoke("calculate-fees", {
        body: {
          registration_type: data.type,
          horse_birth_date: data.birth_date ? format(data.birth_date, "yyyy-MM-dd") : null,
          membership_type: "member",
          add_ons: data.add_ons,
        },
      });
      if (error) throw error;
      return res as { line_items: { label: string; amount: number }[]; total: number };
    },
  });

  const fees = (feeResp?.line_items ?? []).map((l) => ({ description: l.label, amount: Number(l.amount) }));
  const total = feeResp?.total ?? 0;

  const toggleAddon = (code: string) => {
    const next = data.add_ons.includes(code)
      ? data.add_ons.filter((c) => c !== code)
      : [...data.add_ons, code];
    update({ add_ons: next });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="font-serif text-primary">Registration Summary</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <Section title="Type">
            <SummaryRow label="Registration Type" value={prettyType(data.type)} />
          </Section>
          <Section title="Horse Details">
            <SummaryRow label="Name Choice 1" value={data.name_choice_1} />
            <SummaryRow label="Name Choice 2" value={data.name_choice_2} />
            <SummaryRow label="Name Choice 3" value={data.name_choice_3} />
            <SummaryRow label="Birth Date" value={data.birth_date ? format(data.birth_date, "PPP") : ""} />
            <SummaryRow label="Sex" value={data.sex} />
            <SummaryRow label="Color" value={data.color} />
            <SummaryRow label="Birth Country" value={data.birth_country} />
            <SummaryRow label="Microchip" value={data.microchip_number} />
            <SummaryRow label="DNA Case #" value={data.dna_case_number} />
          </Section>
          <Section title="Parentage">
            <SummaryRow label="Sire" value={data.sire_name} />
            <SummaryRow label="Dam" value={data.dam_name} />
            <SummaryRow label="Breeder" value={data.breeder_name} />
            <SummaryRow label="Stallion Owner" value={data.stallion_owner_name} />
            {data.type === "purebred_foreign" && (
              <>
                <SummaryRow label="Foreign Registry" value={data.foreign_registry_name} />
                <SummaryRow label="Foreign Reg #" value={data.foreign_registration_number} />
              </>
            )}
          </Section>
          <Section title="Markings">
            <SummaryRow
              label="Markings"
              value={data.no_markings ? "None" : (data.markings_description || "—")}
            />
          </Section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-serif text-primary">Add-ons</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {ADDONS.map((a) => (
            <label key={a.code} className="flex items-center justify-between rounded-md border p-3">
              <span className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={data.add_ons.includes(a.code)}
                  onCheckedChange={() => toggleAddon(a.code)}
                />
                {a.label}
              </span>
              <span className="text-sm font-medium">${a.amount.toFixed(2)}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-serif text-primary">Fee Breakdown</CardTitle></CardHeader>
        <CardContent>
          {feeLoading ? (
            <p className="py-4 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-3 w-3 animate-spin" />Calculating fees…</p>
          ) : (
          <table className="w-full text-sm">
            <tbody>
              {fees.length === 0 ? (
                <tr><td colSpan={2} className="py-2 text-muted-foreground">No fees configured.</td></tr>
              ) : fees.map((f, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{f.description}</td>
                  <td className="py-2 text-right">${f.amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-secondary">
                <td className="py-3 font-bold text-primary">Total</td>
                <td className="py-3 text-right text-lg font-bold text-primary">${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <label className="flex items-start gap-2">
            <Checkbox
              checked={data.terms_accepted}
              onCheckedChange={(c) => update({ terms_accepted: !!c })}
            />
            <span className="text-sm">
              I certify this information is accurate and complete.
            </span>
          </label>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={onSaveDraft} disabled={saving || submitting}>
              Save as Draft
            </Button>
            <Button
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={onSubmit}
              disabled={saving || submitting || !data.terms_accepted}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit & Pay
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-serif text-sm uppercase tracking-wide text-secondary">{title}</h3>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2">{children}</dl>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

function prettyType(t: RegistrationType | null): string {
  switch (t) {
    case "purebred_ialha": return "Purebred (IALHA-Bred)";
    case "purebred_foreign": return "Purebred (Foreign-Bred)";
    case "half_bred": return "Half-Bred";
    default: return "";
  }
}
