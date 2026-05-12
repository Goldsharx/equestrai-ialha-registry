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
import { LanguageToggle } from "@/components/LanguageToggle";
import { Toaster } from "@/components/ui/sonner";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Login — Equestrai" },
      { name: "description", content: "Log in to your IALHA Equestrai account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const target = redirect && redirect.startsWith("/") ? redirect : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [magicSubmitting, setMagicSubmitting] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: target });
  }, [session, navigate, target]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = z
      .object({
        email: z.string().trim().email(t("invalidEmail")),
        password: z.string().min(1, t("requiredField")),
      })
      .safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: target });
  };

  const handleMagicLink = async () => {
    const parsed = z.string().trim().email(t("invalidEmail")).safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setMagicSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setMagicSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("linkSent"));
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-primary px-4 py-12">
      <div className="absolute right-4 top-4 z-10">
        <LanguageToggle />
      </div>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, var(--gold), transparent 50%), radial-gradient(circle at 80% 80%, var(--gold), transparent 50%)",
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-accent/20 bg-card p-8 shadow-2xl">
        <Link to="/" className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary font-heading text-lg font-bold text-accent">
            I
          </div>
          <span className="font-heading text-xl font-semibold text-primary">Equestrai</span>
        </Link>

        <h1 className="mt-6 text-center font-heading text-2xl text-primary">
          {t("welcomeBack")}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">{t("loginSubtitle")}</p>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? t("loggingIn") : t("login")}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleMagicLink}
          disabled={magicSubmitting}
          className="w-full border-accent/40 text-foreground hover:border-accent hover:bg-accent/10"
        >
          {magicSubmitting ? t("sendingLink") : t("magicLink")}
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link to="/signup" className="font-semibold text-primary underline-offset-4 hover:text-accent-foreground hover:underline">
            {t("signup")}
          </Link>
        </p>
      </div>
      <Toaster />
    </div>
  );
}
