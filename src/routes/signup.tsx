import { useEffect, useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — Equestrai" },
      { name: "description", content: "Create your IALHA Equestrai account." },
    ],
  }),
  component: SignupPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  farm_name: z.string().trim().max(120).optional().or(z.literal("")),
  address_line1: z.string().trim().max(200).optional().or(z.literal("")),
  address_line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  zip: z.string().trim().max(20).optional().or(z.literal("")),
  preferred_language: z.enum(["en", "es"]),
});

type SignupValues = z.infer<typeof signupSchema>;

function SignupPage() {
  const { t, lang, setLang } = useLanguage();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<SignupValues>({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    farm_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    preferred_language: lang,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  const update = <K extends keyof SignupValues>(key: K, value: SignupValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { email, password, ...meta } = parsed.data;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: meta,
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Welcome email — placeholder; real integration coming later.
    console.info("[welcome-email] queued for", email);
    toast.success("Welcome to Equestrai!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative min-h-screen bg-primary px-4 py-12">
      <div className="absolute right-4 top-4 z-10">
        <LanguageToggle />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 10%, var(--gold), transparent 55%), radial-gradient(circle at 70% 90%, var(--gold), transparent 55%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-2xl rounded-2xl border border-accent/20 bg-card p-8 shadow-2xl">
        <Link to="/" className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary font-heading text-lg font-bold text-accent">
            I
          </div>
          <span className="font-heading text-xl font-semibold text-primary">Equestrai</span>
        </Link>

        <h1 className="mt-6 text-center font-heading text-2xl text-primary">
          {t("createAccount")}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">{t("signupSubtitle")}</p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <section className="space-y-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-accent-foreground">
              {t("contactInfo")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="full_name" label={t("fullName") + " *"}>
                <Input id="full_name" value={values.full_name} onChange={(e) => update("full_name", e.target.value)} required />
              </Field>
              <Field id="email" label={t("email") + " *"}>
                <Input id="email" type="email" autoComplete="email" value={values.email} onChange={(e) => update("email", e.target.value)} required />
              </Field>
              <Field id="password" label={t("password") + " *"}>
                <Input id="password" type="password" autoComplete="new-password" value={values.password} onChange={(e) => update("password", e.target.value)} required />
              </Field>
              <Field id="phone" label={t("phone")}>
                <Input id="phone" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => update("phone", e.target.value)} />
              </Field>
              <Field id="farm_name" label={t("farmName")} className="sm:col-span-2">
                <Input id="farm_name" value={values.farm_name} onChange={(e) => update("farm_name", e.target.value)} />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-accent-foreground">
              {t("addressInfo")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="address_line1" label={t("addressLine1")} className="sm:col-span-2">
                <Input id="address_line1" value={values.address_line1} onChange={(e) => update("address_line1", e.target.value)} />
              </Field>
              <Field id="address_line2" label={t("addressLine2")} className="sm:col-span-2">
                <Input id="address_line2" value={values.address_line2} onChange={(e) => update("address_line2", e.target.value)} />
              </Field>
              <Field id="city" label={t("city")}>
                <Input id="city" value={values.city} onChange={(e) => update("city", e.target.value)} />
              </Field>
              <Field id="state" label={t("state")}>
                <Input id="state" value={values.state} onChange={(e) => update("state", e.target.value)} />
              </Field>
              <Field id="zip" label={t("zip")} className="sm:col-span-2">
                <Input id="zip" value={values.zip} onChange={(e) => update("zip", e.target.value)} />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-accent-foreground">
              {t("accountInfo")}
            </h2>
            <Field id="preferred_language" label={t("preferredLanguage")}>
              <Select
                value={values.preferred_language}
                onValueChange={(v) => {
                  update("preferred_language", v as "en" | "es");
                  setLang(v as "en" | "es");
                }}
              >
                <SelectTrigger id="preferred_language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("english")}</SelectItem>
                  <SelectItem value="es">{t("spanish")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </section>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {submitting ? t("creatingAccount") : t("signup")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:text-accent-foreground hover:underline">
              {t("login")}
            </Link>
          </p>
        </form>
      </div>
      <Toaster />
    </div>
  );
}

function Field({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"space-y-2 " + (className ?? "")}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
