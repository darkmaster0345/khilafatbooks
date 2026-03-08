import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Reuse client across warm invocations
let serviceClient: ReturnType<typeof createClient> | null = null;
function getServiceClient() {
  if (!serviceClient) {
    serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  }
  return serviceClient;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate user with anon key client
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { productId } = await req.json();
    if (!productId || typeof productId !== "string") {
      return new Response(JSON.stringify({ error: "Product ID required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = getServiceClient();

    // Run purchase check and product lookup in parallel
    const [ordersRes, productRes] = await Promise.all([
      db.from("orders").select("items").eq("user_id", user.id).eq("status", "approved"),
      db.from("products").select("digital_file_url, name").eq("id", productId).single(),
    ]);

    if (ordersRes.error) {
      return new Response(JSON.stringify({ error: "Failed to verify purchase" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const purchased = ordersRes.data?.some((order: any) => {
      const items = Array.isArray(order.items) ? order.items : [];
      return items.some((item: any) => item.id === productId);
    });

    if (!purchased) {
      return new Response(JSON.stringify({ error: "Product not purchased" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (productRes.error || !productRes.data?.digital_file_url) {
      return new Response(JSON.stringify({ error: "Digital file not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signedUrl, error: signError } = await db.storage
      .from("digital-products")
      .createSignedUrl(productRes.data.digital_file_url, 3600);

    if (signError || !signedUrl) {
      return new Response(JSON.stringify({ error: "Failed to generate download link" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ url: signedUrl.signedUrl, name: productRes.data.name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
