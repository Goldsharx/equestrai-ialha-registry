const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type FeeLine = { label: string; amount: number };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { registration_id, transfer_id, return_url } = await req.json();
    if (!return_url) throw new Error("return_url is required");
    const stripeKey =
      Deno.env.get("STRIPE_SECRET_KEY") ??
      Deno.env.get("STRIPE_SANDBOX_API_KEY") ??
      Deno.env.get("STRIPE_LIVE_API_KEY");
    if (!stripeKey) {
      throw new Error("Stripe Checkout is not configured: missing Stripe secret key");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const table = registration_id ? "registrations" : "transfers";
    const id = registration_id ?? transfer_id;
    if (!id) throw new Error("registration_id or transfer_id is required");

    const recordResp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&select=*`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!recordResp.ok) throw new Error(`Unable to load payment record (${recordResp.status})`);
    const [record] = await recordResp.json();
    if (!record) throw new Error("Payment record not found");

    const feeBreakdown = Array.isArray(record.fee_breakdown) ? record.fee_breakdown as FeeLine[] : [];
    const fallbackAmount = Number(record.fee_total ?? record.fee_amount ?? 0);
    const lineItems = feeBreakdown.length > 0
      ? feeBreakdown
      : [{ label: registration_id ? "Horse registration fee" : "Ownership transfer fee", amount: fallbackAmount }];

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", return_url.includes("?") ? `${return_url}&success=true` : `${return_url}?success=true`);
    params.set("cancel_url", return_url);
    params.set(`metadata[${registration_id ? "registration_id" : "transfer_id"}]`, id);
    lineItems.forEach((item, index) => {
      params.set(`line_items[${index}][price_data][currency]`, "usd");
      params.set(`line_items[${index}][price_data][product_data][name]`, item.label || "Registry fee");
      params.set(`line_items[${index}][price_data][unit_amount]`, String(Math.max(50, Math.round(Number(item.amount || 0) * 100))));
      params.set(`line_items[${index}][quantity]`, "1");
    });

    const stripeResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const session = await stripeResp.json();
    if (!stripeResp.ok) throw new Error(session?.error?.message ?? "Unable to create Stripe Checkout session");

    return json({ checkout_url: session.url, session_id: session.id });
  } catch (err) {
    return json({ error: (err as Error).message }, 400);
  }
});
