import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const ALLOWED_ORIGIN = "https://khilafatbooks.vercel.app";

const getCorsHeaders = (origin: string | null) => {
  const headers = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };

  if (origin === ALLOWED_ORIGIN) {
    return { ...headers, "Access-Control-Allow-Origin": ALLOWED_ORIGIN };
  }

  return headers;
};

/**
 * Constant-time comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Critical CORS check
  if (origin && origin !== ALLOWED_ORIGIN) {
    return new Response(JSON.stringify({ error: "Forbidden: Invalid Origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // --- AUTH CHECK ---
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!authHeader || !timingSafeEqual(authHeader, `Bearer ${serviceRoleKey}`)) {
      console.error("Unauthorized cleanup attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey!,
    );

    // Call the cleanup function
    const { data, error } = await supabase.rpc("cleanup_private_orders");

    if (error) {
      console.error("Cleanup error:", error.message);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Privacy cleanup complete. Deleted ${data} orders.`);

    return new Response(
      JSON.stringify({ success: true, deleted_orders: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Cleanup error:", e.message);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
