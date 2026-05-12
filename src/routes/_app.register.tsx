import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ChevronRight, Loader2, Search, Upload } from "lucide-react";
import { useUser } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
};

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
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(EMPTY);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }));

  const persist = async (next: WizardData) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        applicant_id: user.id,
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
      };
      if (registrationId) {
        const { error } = await supabase
          .from("registrations")
          .update(payload)
          .eq("id", registrationId);
        if (error) throw error;
      } else {
        const { data: row, error } = await supabase
          .from("registrations")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setRegistrationId(row.id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save draft");
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    await persist(data);
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

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

      {step >= 4 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Step {step}: {STEPS[step - 1].label} — coming next.
          </CardContent>
        </Card>
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
              "rounded-lg border-2 bg-card p-6 text-left transition-all hover:border-secondary hover:shadow-md",
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
                className={cn("justify-start text-left font-normal", !data.birth_date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.birth_date ? format(data.birth_date, "PPP") : "Pick a date"}
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
          <Button id={`p-${label}`} variant="outline" className="justify-start font-normal">
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
}: {
  userId: string | undefined;
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const path = `${userId}/foreign-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file, {
        upsert: false,
      });
      if (error) throw error;
      onChange(path);
      toast.success("Document uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Foreign Registry Certificate</Label>
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" disabled={uploading}>
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading…" : "Choose file"}
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
        {value && (
          <span className="truncate text-xs text-muted-foreground">{value.split("/").pop()}</span>
        )}
      </div>
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
