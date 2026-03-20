import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------------------------------------------------------------------------
// Product catalog cache
// ---------------------------------------------------------------------------

let cachedProducts: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getProductCatalog(supabaseUrl: string, supabaseServiceKey: string): Promise<string> {
  const now = Date.now();
  if (cachedProducts && now - cacheTimestamp < CACHE_TTL) {
    return cachedProducts;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, name_ar, description, price, category, in_stock")
    .eq("in_stock", true)
    .limit(100);

  if (error) {
    console.error("Error fetching products for catalog:", error);
    return cachedProducts || "No products available.";
  }

  cachedProducts = products && products.length > 0
    ? products
        .map(
          (p: any) =>
            `- ${p.name}${p.name_ar ? ` (${p.name_ar})` : ""} [ID: ${p.id}]: ${p.category}, Rs. ${p.price}. ${p.description}`,
        )
        .join("\n")
    : "No products available.";

  cacheTimestamp = now;
  return cachedProducts;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT_TEMPLATE = (products: string) =>
  `You are a knowledgeable Islamic bookstore assistant for Khilafat Books. You help customers find the perfect Islamic books and products. When recommending books, ask questions to understand their needs — their age, what topics interest them, their reading level, whether it is for themselves or a gift. Be warm, respectful, and knowledgeable about Islamic literature. Only recommend products that are currently in stock.
Here are our current products:
${products}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text ?? "")
      .join("");
  }
  return String(content ?? "");
}

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

function buildGeminiContents(
  messages: Array<{ role: string; content: unknown }>,
  maxTurns = 20,
): GeminiContent[] {
  const filtered: GeminiContent[] = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      parts: [{ text: contentToText(m.content) }],
    }));

  const sliced = filtered.slice(-maxTurns);

  let start = 0;
  while (start < sliced.length && sliced[start].role !== "user") start++;
  const trimmed = sliced.slice(start);

  const merged: GeminiContent[] = [];
  for (const turn of trimmed) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === turn.role) {
      prev.parts[prev.parts.length - 1].text += "\n" + turn.parts[0].text;
    } else {
      merged.push({ role: turn.role, parts: [{ text: turn.parts[0].text }] });
    }
  }

  while (merged.length > 0 && merged[merged.length - 1].role !== "user") {
    merged.pop();
  }

  if (merged.length === 0) {
    return [{ role: "user", parts: [{ text: "Hello" }] }];
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
      const missing = [];
      if (!SUPABASE_URL) missing.push("SUPABASE_URL");
      if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
      if (!GEMINI_API_KEY) missing.push("GEMINI_API_KEY");
      throw new Error(`Missing environment variables: ${missing.join(", ")}`);
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid request: 'messages' array is required");
    }

    const catalog = await getProductCatalog(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE(catalog);
    const contents = buildGeminiContents(messages);

    // Call Gemini using the non-streaming generateContent endpoint as requested
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errorData = await geminiRes.json().catch(() => ({}));
      console.error("Gemini API error:", errorData);
      return new Response(
        JSON.stringify({
          error: "Gemini API Error",
          details: errorData.error?.message || "Internal service error",
          status: geminiRes.status
        }),
        {
          status: geminiRes.status === 401 ? 401 : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await geminiRes.json();
    const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    // We wrap the single response in an SSE format so the frontend doesn't need to change
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const chunk = {
          choices: [
            {
              delta: { content: assistantText },
              finish_reason: null,
            },
          ],
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("chat error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
