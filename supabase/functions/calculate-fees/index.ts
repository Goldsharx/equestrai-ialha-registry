// Calculate registration fees based on type, age, membership, and add-ons.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  registration_type?: string;
  horse_birth_date?: string | null;
  membership_type?: string | null;
  add_ons?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const fetchFees = async () => {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/fee_schedule?select=code,description,amount&active=eq.true`,
        { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
      );
      return (await r.json()) as { code: string; description: string; amount: number }[];
    };
    const rows = await fetchFees();
    const map = new Map(rows.map((r) => [r.code, r]));

    const line_items: { code: string; label: string; amount: number }[] = [];
    const baseCode = body.registration_type ? `reg_${body.registration_type}` : null;
    if (baseCode && map.has(baseCode)) {
      const f = map.get(baseCode)!;
      let amt = Number(f.amount);
      if (body.membership_type === "non_member") amt = amt * 1.5;
      line_items.push({ code: f.code, label: f.description, amount: amt });
    }

    if (body.horse_birth_date) {
      const ageYrs = (Date.now() - new Date(body.horse_birth_date).getTime()) / (365.25 * 86400000);
      if (ageYrs > 2 && map.has("late_fee")) {
        const f = map.get("late_fee")!;
        line_items.push({ code: f.code, label: f.description, amount: Number(f.amount) });
      }
    }

    for (const code of body.add_ons ?? []) {
      const f = map.get(code);
      if (f) line_items.push({ code: f.code, label: f.description, amount: Number(f.amount) });
    }

    const total = line_items.reduce((s, l) => s + l.amount, 0);

    return new Response(JSON.stringify({ line_items, total, currency: "USD" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
