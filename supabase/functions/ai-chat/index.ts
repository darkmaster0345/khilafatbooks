// @ts-ignore Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

// Deno types for TypeScript
/// <reference lib="deno.ns" />

const ALLOWED_ORIGINS = [
  "https://khilafatbooks.vercel.app",
  "https://khilafatbooks.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173"
];

const getCorsHeaders = (origin: string | null) => {
  const headers = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };

  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app") || origin.endsWith(".lovable.app"))) {
    return { ...headers, "Access-Control-Allow-Origin": origin };
  }

  return headers;
};

// ---------------------------------------------------------------------------
// Rate Limiting (In-Memory)
// Limits: 10 req/min, 50 req/hour, 100 req/day per user
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  minuteCount: number;
  hourCount: number;
  dayCount: number;
  minuteReset: number;
  hourReset: number;
  dayReset: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const MINUTE_LIMIT = 10;
const HOUR_LIMIT = 50;
const DAY_LIMIT = 100;

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number; message?: string } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry) {
    // First request
    rateLimitMap.set(userId, {
      minuteCount: 1,
      hourCount: 1,
      dayCount: 1,
      minuteReset: now + 60 * 1000,
      hourReset: now + 60 * 60 * 1000,
      dayReset: now + 24 * 60 * 60 * 1000,
    });
    return { allowed: true };
  }

  // Reset counters if time has passed
  if (now > entry.minuteReset) {
    entry.minuteCount = 0;
    entry.minuteReset = now + 60 * 1000;
  }
  if (now > entry.hourReset) {
    entry.hourCount = 0;
    entry.hourReset = now + 60 * 60 * 1000;
  }
  if (now > entry.dayReset) {
    entry.dayCount = 0;
    entry.dayReset = now + 24 * 60 * 60 * 1000;
  }

  // Check limits
  if (entry.dayCount >= DAY_LIMIT) {
    const retryAfter = Math.ceil((entry.dayReset - now) / 1000);
    return { allowed: false, retryAfter, message: "Daily limit exceeded" };
  }
  if (entry.hourCount >= HOUR_LIMIT) {
    const retryAfter = Math.ceil((entry.hourReset - now) / 1000);
    return { allowed: false, retryAfter, message: "Hourly limit exceeded" };
  }
  if (entry.minuteCount >= MINUTE_LIMIT) {
    const retryAfter = Math.ceil((entry.minuteReset - now) / 1000);
    return { allowed: false, retryAfter, message: "Rate limit exceeded" };
  }

  // Increment counters
  entry.minuteCount++;
  entry.hourCount++;
  entry.dayCount++;

  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Islamic Jurisprudence (Fiqh) Content Filtering
// ---------------------------------------------------------------------------

const FIQH_KEYWORDS = [
  "halal", "haram", "fiqh", "fatwa", "ruling", "islamic ruling",
  "prayer method", "how to pray", "salat method", "wudu steps",
  "fasting rules", "ramadan fasting", "zakat calculation",
  "marriage ruling", "nikah rules", "divorce in islam", "talaq",
  "riba", "interest", "bank interest", "loan interest",
  "inheritance", "mirath", "islamic will",
  "hajj steps", "umrah method", "pilgrimage ruling",
  "food halal", "meat halal", "slaughter rules", "qurbani",
  "salah", "namaz", "zuhr", "asr", "maghrib", "isha", "fajr",
  "wajib", "sunnah", "mustahab", "makruh"
];

const FIQH_WARNING_MESSAGE = `This relates to Islamic jurisprudence (Fiqh). As an AI assistant, I cannot provide religious rulings or fatwas. For matters of Islamic law and religious guidance, please consult a qualified Islamic scholar (Mufti or Aalim). You may also browse our Fiqh and Islamic Law book collection for scholarly references.`;

function containsFiqhKeywords(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return FIQH_KEYWORDS.some(keyword => lowerContent.includes(keyword.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Input Validation
// ---------------------------------------------------------------------------

const MAX_MESSAGE_LENGTH = 500;
const MAX_MESSAGES = 20;

function validateInput(messages: unknown): { valid: boolean; error?: string; isFiqh?: boolean } {
  if (!messages || !Array.isArray(messages)) {
    return { valid: false, error: "Invalid request: messages array required" };
  }

  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Too many messages. Maximum ${MAX_MESSAGES} allowed.` };
  }

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: "Invalid message format" };
    }

    const content = (msg as any).content;
    let text = "";

    if (typeof content === "string") {
      text = content;
    } else if (Array.isArray(content)) {
      text = content
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text ?? "")
        .join("");
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.` };
    }

    // Check for fiqh keywords in user messages
    if ((msg as any).role === "user" && containsFiqhKeywords(text)) {
      return { valid: true, isFiqh: true };
    }
  }

  return { valid: true, isFiqh: false };
}

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
  return cachedProducts || "No products available.";
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

function buildGroqMessages(
  systemPrompt: string,
  messages: Array<{ role: string; content: unknown }>,
  maxTurns = 20,
): any[] {
  const filtered = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "model" ? "assistant" : m.role,
      content: contentToText(m.content),
    }))
    .slice(-maxTurns);

  return [
    { role: "system", content: systemPrompt },
    ...filtered,
  ];
}

function getSSEResponse(assistantText: string, corsHeaders: any): Response {
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
// SECURITY FIX (Finding 3.2): Strict JWT-only authentication.
// The anon/publishable key fallback has been REMOVED. Only valid user JWTs
// are accepted. Requests without a proper session are rejected with 401.
// Entry point
// ---------------------------------------------------------------------------

// @ts-ignore Deno is available in Supabase Edge Runtime
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Origin validation
  const isAllowed = !origin ||
                    ALLOWED_ORIGINS.includes(origin) ||
                    origin.endsWith(".vercel.app") ||
                    origin.endsWith(".lovable.app");

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "Forbidden: Invalid Origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // SECURITY: Require a valid Bearer JWT. Reject immediately if missing.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: Validate the JWT against Supabase Auth using only the ANON key.
    // Do NOT fall back to the publishable key — that would bypass session checks.
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
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

    // Type-safe environment variables
    const getEnv = (name: string): string => {
      // @ts-ignore Deno.env
      const value = Deno.env.get(name);
      if (!value) throw new Error(`Missing environment variable: ${name}`);
      return value;
    };

    // SECURITY: Rate limiting per user
    const rateLimitResult = checkRateLimit(user.id);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user ${user.id}: ${rateLimitResult.message}`);
      return new Response(
        JSON.stringify({
          error: rateLimitResult.message,
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter || 60),
          },
        },
      );
    }

    const { messages } = await req.json();

    // SECURITY: Input validation
    const validationResult = validateInput(messages);
    if (!validationResult.valid) {
      return new Response(
        JSON.stringify({ error: validationResult.error }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if message contains fiqh (Islamic jurisprudence) keywords
    if (validationResult.isFiqh) {
      return getSSEResponse(FIQH_WARNING_MESSAGE, corsHeaders);
    }

    const GEMINI_API_KEY = getEnv("GEMINI_API_KEY");
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY"); // Optional fallback
    const SUPABASE_URL = getEnv("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
      const missing = [];
      if (!SUPABASE_URL) missing.push("SUPABASE_URL");
      if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
      if (!GEMINI_API_KEY) missing.push("GEMINI_API_KEY");
      throw new Error(`Missing environment variables: ${missing.join(", ")}`);
    }

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid request: 'messages' array is required");
    }

    const catalog = await getProductCatalog(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE(catalog);
    const contents = buildGeminiContents(messages);

    let assistantText = "";
    let useFallback = false;

    try {
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

        const isQuotaError = geminiRes.status === 429 ||
                            errorData.error?.message?.includes("quota") ||
                            errorData.error?.message?.includes("rate limit");
        const isServerError = [500, 502, 503, 504].includes(geminiRes.status);

        if ((isQuotaError || isServerError) && GROQ_API_KEY) {
          console.log("Gemini failed, attempting Groq fallback...");
          useFallback = true;
        } else {
          return new Response(
            JSON.stringify({ error: "AI service temporarily unavailable" }),
            {
              status: 502,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      } else {
        const data = await geminiRes.json();
        assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
      }
    } catch (err) {
      console.error("Gemini fetch error:", err);
      if (GROQ_API_KEY) {
        useFallback = true;
      } else {
        throw err;
      }
    }

    if (useFallback && GROQ_API_KEY) {
      try {
        const groqMessages = buildGroqMessages(systemPrompt, messages);
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        if (!groqRes.ok) {
          const errorData = await groqRes.json().catch(() => ({}));
          console.error("Groq API error:", errorData);
          return new Response(
            JSON.stringify({ error: "AI service temporarily unavailable" }),
            {
              status: 502,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const data = await groqRes.json();
        assistantText = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      } catch (err) {
        console.error("Groq fallback error:", err);
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    return getSSEResponse(assistantText, corsHeaders);
  } catch (err) {
    console.error("chat error:", err);
    return new Response(
      JSON.stringify({ error: "Request failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
