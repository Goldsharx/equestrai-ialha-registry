import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

type Profile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_language: string;
  farm_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  membership_type: string | null;
  membership_expires: string | null;
  ialha_member_id: string | null;
};

const empty: Profile = {
  full_name: "",
  email: "",
  phone: "",
  preferred_language: "en",
  farm_name: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: "",
  membership_type: null,
  membership_expires: null,
  ialha_member_id: null,
};

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — EquestRai" },
      { name: "description", content: "Manage your IALHA member profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { t, setLang } = useLanguage();
  const [profile, setProfile] = useState<Profile>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) toast.error("Failed to load profile");
      else if (data) setProfile({ ...empty, ...data, email: data.email ?? user.email ?? "" });
      else setProfile({ ...empty, email: user.email ?? "" });
      setLoading(false);
    })();
  }, [user]);

  const update = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        preferred_language: profile.preferred_language,
        farm_name: profile.farm_name,
        address_line1: profile.address_line1,
        address_line2: profile.address_line2,
        city: profile.city,
        state: profile.state,
        zip: profile.zip,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(t("err.tryAgain"));
    else toast.success(t("profile.saveSuccess"));
  };

  const handleChangePassword = async () => {
    if (!profile.email) return toast.error(t("auth.email"));
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success(t("profile.resetEmailSent"));
  };

  const handleManagePayments = async () => {
    const { data, error } = await supabase.functions.invoke("stripe-customer-portal", {
      body: { return_url: window.location.origin + "/profile" },
    });
    if (error || !data?.url) {
      toast.error(t("profile.portalUnavailable"));
      return;
    }
    window.location.href = data.url as string;
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">{t("profile.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("profile.subtitle")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("profile.personalInfo")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">{t("auth.fullName")}</Label>
            <Input id="full_name" value={profile.full_name ?? ""} onChange={(e) => update("full_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" value={profile.email ?? ""} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("auth.phone")}</Label>
            <Input id="phone" value={profile.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("auth.preferredLanguage")}</Label>
            <ToggleGroup
              type="single"
              value={profile.preferred_language}
              onValueChange={(v) => {
                if (!v) return;
                update("preferred_language", v);
                if (v === "en" || v === "es") setLang(v);
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="en">EN</ToggleGroupItem>
              <ToggleGroupItem value="es">ES</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("profile.farmInfo")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="farm_name">{t("auth.farmName")}</Label>
            <Input id="farm_name" value={profile.farm_name ?? ""} onChange={(e) => update("farm_name", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address_line1">{t("auth.addressLine1")}</Label>
            <Input id="address_line1" value={profile.address_line1 ?? ""} onChange={(e) => update("address_line1", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address_line2">{t("auth.addressLine2")}</Label>
            <Input id="address_line2" value={profile.address_line2 ?? ""} onChange={(e) => update("address_line2", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">{t("auth.city")}</Label>
            <Input id="city" value={profile.city ?? ""} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">{t("auth.state")}</Label>
            <Input id="state" value={profile.state ?? ""} onChange={(e) => update("state", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">{t("auth.zip")}</Label>
            <Input id="zip" value={profile.zip ?? ""} onChange={(e) => update("zip", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("profile.membership")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("profile.membershipType")}</Label>
            <Input value={profile.membership_type ?? "—"} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.memberId")}</Label>
            <Input value={profile.ialha_member_id ?? "—"} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.expires")}</Label>
            <Input value={profile.membership_expires ?? "—"} readOnly className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("profile.security")}</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleChangePassword}>{t("btn.changePassword")}</Button>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("profile.passwordHint", { email: profile.email ?? "" })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("profile.payment")}</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleManagePayments}>{t("btn.managePayments")}</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("common.saving") : t("common.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
