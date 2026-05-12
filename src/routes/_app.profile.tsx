import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    if (error) toast.error("Failed to save: " + error.message);
    else toast.success("Profile saved");
  };

  const handleChangePassword = async () => {
    if (!profile.email) return toast.error("Missing email");
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  };

  const handleManagePayments = async () => {
    const { data, error } = await supabase.functions.invoke("stripe-customer-portal", {
      body: { return_url: window.location.origin + "/profile" },
    });
    if (error || !data?.url) {
      toast.error("Payment portal is not available yet.");
      return;
    }
    window.location.href = data.url as string;
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your contact info and account settings.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" value={profile.full_name ?? ""} onChange={(e) => update("full_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email ?? ""} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={profile.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Preferred Language</Label>
            <ToggleGroup
              type="single"
              value={profile.preferred_language}
              onValueChange={(v) => v && update("preferred_language", v)}
              className="justify-start"
            >
              <ToggleGroupItem value="en">EN</ToggleGroupItem>
              <ToggleGroupItem value="es">ES</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Farm Info</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="farm_name">Farm Name</Label>
            <Input id="farm_name" value={profile.farm_name ?? ""} onChange={(e) => update("farm_name", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input id="address_line1" value={profile.address_line1 ?? ""} onChange={(e) => update("address_line1", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input id="address_line2" value={profile.address_line2 ?? ""} onChange={(e) => update("address_line2", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={profile.city ?? ""} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" value={profile.state ?? ""} onChange={(e) => update("state", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" value={profile.zip ?? ""} onChange={(e) => update("zip", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Membership</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Membership Type</Label>
            <Input value={profile.membership_type ?? "—"} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Member ID</Label>
            <Input value={profile.ialha_member_id ?? "—"} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Expires</Label>
            <Input value={profile.membership_expires ?? "—"} readOnly className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleChangePassword}>Change Password</Button>
          <p className="mt-2 text-xs text-muted-foreground">We'll email a secure reset link to {profile.email}.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleManagePayments}>Manage Payment Methods</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
