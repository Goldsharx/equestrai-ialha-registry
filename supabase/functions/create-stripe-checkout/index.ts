// Mock Stripe Checkout: returns a checkout_url that mirrors the return_url with ?success=true.
// Replace with real Stripe integration when STRIPE_SECRET_KEY is provided.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { registration_id, transfer_id, return_url } = await req.json();
    if (!return_url) throw new Error("return_url is required");

    const sep = return_url.includes("?") ? "&" : "?";
    const checkout_url = `${return_url}${sep}success=true`;

    return new Response(
      JSON.stringify({
        checkout_url,
        session_id: `mock_${registration_id ?? transfer_id ?? "unknown"}_${Date.now()}`,
        mocked: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
