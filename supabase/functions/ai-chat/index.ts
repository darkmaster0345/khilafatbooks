import "https://esm.sh/@supabase/supabase-js@2.95.3";

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

async function getProductCatalog(): Promise<string> {
  const now = Date.now();
  if (cachedProducts && now - cacheTimestamp < CACHE_TTL) {
    return cachedProducts;
  }

  const { createClient } = await import(
    "https://esm.sh/@supabase/supabase-js@2.95.3"
  );
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: products } = await supabase
    .from("products")
    .select("id, name, name_ar, description, price, category, in_stock")
    .eq("in_stock", true)
    .limit(100);

  cachedProducts = products
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

/**
 * Normalise an OpenAI-style message content value to a plain string.
 */
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

// ---------------------------------------------------------------------------
// Gemini content array builder
// ---------------------------------------------------------------------------

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

/**
 * Convert an OpenAI-style messages array to a valid Gemini contents array.
 */
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
      prev.parts[prev.parts.length - 1].text +=
        "\n" + turn.parts[0].text;
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
// SSE transform: Gemini → OpenAI-compatible
// ---------------------------------------------------------------------------

async function transformGeminiStream(
  geminiBody: ReadableStream<Uint8Array>,
  writer: WritableStreamDefaultWriter<Uint8Array>,
): Promise<void> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = geminiBody.getReader();

  const write = (s: string) => writer.write(encoder.encode(s));

  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trimStart();
        if (!dataStr.startsWith("{")) continue;

        let json: any;
        try {
          json = JSON.parse(dataStr);
        } catch {
          buffer = trimmed + "\n" + buffer;
          continue;
        }

        const candidate = json?.candidates?.[0];
        if (!candidate) continue;

        const parts: Array<{ text?: string }> =
          candidate.content?.parts ?? [];
        for (const part of parts) {
          if (typeof part.text === "string" && part.text.length > 0) {
            const chunk = {
              choices: [
                {
                  delta: { content: part.text },
                  finish_reason: null,
                },
              ],
            };
            await write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
        }

        const finishReason: string | undefined = candidate.finishReason;
        if (finishReason && finishReason !== "FINISH_REASON_UNSPECIFIED" && finishReason !== "STOP") {
          const finalChunk = {
            choices: [
              {
                delta: {},
                finish_reason: "content_filter",
                gemini_finish_reason: finishReason,
              },
            ],
          };
          await write(`data: ${JSON.stringify(finalChunk)}\n\n`);
        }
      }
    }
    await write("data: [DONE]\n\n");
  } catch (err) {
    console.error("Stream transformation error:", err);
    const errorChunk = {
      error: {
        message:
          err instanceof Error ? err.message : "Stream transformation failed",
        type: "stream_error",
      },
    };
    try {
      await write(`data: ${JSON.stringify(errorChunk)}\n\n`);
      await write("data: [DONE]\n\n");
    } catch {
      // ignore
    }
  } finally {
    reader.cancel().catch(() => {});
    writer.close().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2.95.3"
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")! || Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error in ai-chat:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const catalog = await getProductCatalog();
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE(catalog);

    const contents = buildGeminiContents(messages);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
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
        JSON.stringify({ error: "AI service error", details: errorData }),
        {
          status: geminiRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!geminiRes.body) {
      return new Response(
        JSON.stringify({ error: "Gemini returned an empty response body" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();

    transformGeminiStream(geminiRes.body, writer);

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
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
