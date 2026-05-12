// Use Lovable AI Gateway to extract structured data from a foreign registry document.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { file_url, document_id } = await req.json();
    if (!file_url) throw new Error("file_url required");

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const tools = [
      {
        type: "function",
        function: {
          name: "submit_extraction",
          description: "Submit extracted fields from a horse foreign-registry certificate.",
          parameters: {
            type: "object",
            properties: {
              registry_name: { type: "string" },
              registration_number: { type: "string" },
              horse_name: { type: "string" },
              breed: { type: "string" },
              sex: { type: "string" },
              color: { type: "string" },
              birth_date: { type: "string", description: "ISO 8601 date" },
              birth_country: { type: "string" },
              microchip_number: { type: "string" },
              sire_name: { type: "string" },
              dam_name: { type: "string" },
              breeder_name: { type: "string" },
              confidence: { type: "number", description: "0-1 overall confidence" },
            },
            required: ["confidence"],
          },
        },
      },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a document-extraction assistant for an equine registry. Examine the supplied certificate image and extract fields. Return null/empty for unknowns. Always call submit_extraction.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract fields from this foreign registry certificate." },
              { type: "image_url", image_url: { url: file_url } },
            ],
          },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "submit_extraction" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const text = await aiRes.text();
      throw new Error(`AI gateway: ${aiRes.status} ${text}`);
    }

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let extracted: Record<string, unknown> = {};
    try {
      extracted = call?.function?.arguments ? JSON.parse(call.function.arguments) : {};
    } catch {
      /* ignore */
    }

    return new Response(JSON.stringify({ document_id, extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
