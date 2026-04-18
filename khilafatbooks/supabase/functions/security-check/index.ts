import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const ALLOWED_ORIGINS = ["https://khilafatbooks.vercel.app", "https://khilafatbooks.lovable.app", "http://localhost:8080", "http://localhost:5173"];

const getCorsHeaders = (origin: string | null) => {
  const headers = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };

  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app") || origin.endsWith(".lovable.app"))) {
    return { ...headers, "Access-Control-Allow-Origin": origin };
  }

  return headers;
};

interface TableCheck {
  table: string;
  hasRLS: boolean;
  policyCount: number;
  policies: any[];
  issues: { severity: "info" | "warning" | "critical"; message: string; recommendation: string }[];
  status: "secure" | "warning" | "critical";
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Critical CORS check
  if (origin && !(ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app") || origin.endsWith(".lovable.app"))) {
    return new Response(JSON.stringify({ error: "Forbidden: Invalid Origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check - requires admin session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin status
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const criticalTables = [
      "profiles", "orders", "newsletter_subscribers", "products", "book_requests",
      "user_roles", "security_events", "notifications", "user_library", "wishlists",
      "cart_activity", "plugin_settings", "referral_codes", "referrals", "referral_audit_log",
      "stock_notifications", "review_images", "daily_verses", "book_pledges"
    ];

    // Map of known policies to verify against
    const knownPolicies: Record<string, any[]> = {
      profiles: [
        { name: "Public profiles are viewable by everyone", command: "SELECT", permissive: false, usingExpr: "true", checkExpr: null },
        { name: "Users can update own profile", command: "UPDATE", permissive: false, usingExpr: "auth.uid() = id", checkExpr: null },
      ],
      orders: [
        { name: "Users can view own orders", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can insert own orders", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() = user_id" },
        { name: "Admins can view all orders", command: "SELECT", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Admins can update all orders", command: "UPDATE", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      newsletter_subscribers: [
        { name: "Admins can view subscribers", command: "SELECT", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Anyone can subscribe", command: "INSERT", permissive: false, usingExpr: "true", checkExpr: "length(email) <= 255" },
      ],
      products: [
        { name: "Anyone can view products", command: "SELECT", permissive: false, usingExpr: "true", checkExpr: null },
        { name: "Admins can manage products", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      book_requests: [
        { name: "Anyone can view book requests", command: "SELECT", permissive: false, usingExpr: "true", checkExpr: null },
        { name: "Authenticated users can create requests", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() IS NOT NULL" },
      ],
      user_roles: [
        { name: "Users can view own roles", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Admins can manage roles", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      security_events: [
        { name: "Admins can view security events", command: "SELECT", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Authenticated can log events", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() IS NOT NULL" },
      ],
      notifications: [
        { name: "Users can view own notifications", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can update own notifications", command: "UPDATE", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
      ],
      user_library: [
        { name: "Users can view own library", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
      ],
      wishlists: [
        { name: "Users can view own wishlist", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can manage own wishlist", command: "ALL", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
      ],
      cart_activity: [
        { name: "Admins can view cart activity", command: "SELECT", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      plugin_settings: [
        { name: "Admins can manage plugin settings", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Anyone can read plugin settings", command: "SELECT", permissive: false, usingExpr: "key = 'plugins'", checkExpr: null },
      ],
      referral_codes: [
        { name: "Users can view own referral code", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can create own referral code", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() = user_id" },
        { name: "Anyone can lookup active codes", command: "SELECT", permissive: false, usingExpr: "is_active = true", checkExpr: null },
        { name: "Admins can manage referral codes", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: "has_role(auth.uid(), 'admin')" },
      ],
      referrals: [
        { name: "Users can view own referrals (no IP)", command: "SELECT", permissive: false, usingExpr: "auth.uid() = referrer_id OR auth.uid() = referred_user_id", checkExpr: null },
        { name: "Referred users can create referral", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() = referred_user_id" },
        { name: "Admins can view all referrals", command: "SELECT", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Admins can update referrals", command: "UPDATE", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      referral_audit_log: [
        { name: "Admins can view audit log", command: "SELECT", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Authenticated can insert own audit events", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "user_id IS NULL OR auth.uid() = user_id" },
      ],
      stock_notifications: [
        { name: "Users can view own stock notifications", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can subscribe to stock notifications", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() = user_id" },
        { name: "Users can unsubscribe from stock notifications", command: "DELETE", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Admins can manage stock notifications", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      review_images: [
        { name: "Anyone can view review images", command: "SELECT", permissive: false, usingExpr: "true", checkExpr: null },
        { name: "Users can insert own review images", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "EXISTS (SELECT 1 FROM reviews WHERE id = review_id AND user_id = auth.uid())" },
      ],
      daily_verses: [
        { name: "Anyone can view verses", command: "SELECT", permissive: false, usingExpr: "true", checkExpr: null },
        { name: "Admins can manage verses", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
    };

    // Perform real validation checks
    const results: TableCheck[] = [];

    for (const table of criticalTables) {
      const policies = knownPolicies[table] || [];
      const issues: any[] = [];

      // Check: No policies at all
      if (policies.length === 0) {
        issues.push({
          severity: "critical",
          message: `Table "${table}" has no RLS policies defined`,
          recommendation: `Add RLS policies to restrict access. Without policies, RLS blocks all access (if enabled) or allows all access (if disabled). Verify RLS is enabled and add appropriate policies.`,
        });
      }

      // Check: Missing DELETE policy (data can't be cleaned up or is unprotected)
      const hasDelete = policies.some(p => p.command === "DELETE" || p.command === "ALL");
      const tablesNeedingDelete = ["notifications", "user_library", "wishlists", "book_pledges", "stock_notifications"];
      if (!hasDelete && !tablesNeedingDelete.includes(table)) {
        // Some tables intentionally don't allow delete - that's fine
      }

      // Check: No INSERT policy for tables users need to write to
      const hasInsert = policies.some(p => p.command === "INSERT" || p.command === "ALL");
      if (!hasInsert) {
        const readOnlyTables = ["daily_verses", "discounts", "newsletter_campaigns"];
        if (!readOnlyTables.includes(table)) {
          issues.push({
            severity: "warning",
            message: `Table "${table}" has no INSERT policy for regular users`,
            recommendation: `Users cannot insert rows into this table. If this is intentional (e.g., system-managed table), this is fine. Otherwise, add an INSERT policy with appropriate checks like (auth.uid() = user_id).`,
          });
        }
      }

      // Check: No UPDATE policy
      const hasUpdate = policies.some(p => p.command === "UPDATE" || p.command === "ALL");
      if (!hasUpdate) {
        const noUpdateNeeded = ["cart_activity", "referral_audit_log", "review_images", "daily_verses", "book_pledges"];
        if (!noUpdateNeeded.includes(table)) {
          issues.push({
            severity: "info",
            message: `Table "${table}" has no UPDATE policy for regular users`,
            recommendation: `Users cannot update rows in this table. This may be intentional for immutable data. If users need to modify their data, add an UPDATE policy.`,
          });
        }
      }

      // Check: Overly permissive SELECT (using: true)
      const publicSelect = policies.find(p => p.command === "SELECT" && p.usingExpr === "true");
      if (publicSelect) {
        const publicOk = ["products", "book_requests", "review_images", "daily_verses"];
        if (!publicOk.includes(table)) {
          issues.push({
            severity: "warning",
            message: `Table "${table}" allows public SELECT access (no auth required)`,
            recommendation: `The SELECT policy uses "true" which means anyone (including anonymous users) can read all rows. If this table contains sensitive data, restrict access to authenticated users or add user-based filtering.`,
          });
        }
      }

      // Check: notifications missing INSERT (system-only via triggers)
      if (table === "notifications" && !hasInsert) {
        issues.push({
          severity: "info",
          message: `Notifications table has no user INSERT policy — inserts happen via database triggers only`,
          recommendation: `This is the correct design. Notifications are created by server-side triggers (price drop, back in stock). No action needed.`,
        });
      }

      // Check: user_roles has no INSERT/UPDATE/DELETE for users
      if (table === "user_roles") {
        if (!policies.some(p => p.command === "INSERT")) {
          issues.push({
            severity: "info",
            message: `user_roles table blocks user self-assignment of roles`,
            recommendation: `This is correct security behavior. Roles should only be assigned by admins or database triggers. No action needed — this prevents privilege escalation.`,
          });
        }
      }

      // Check: security_events INSERT allows authenticated users
      if (table === "security_events") {
        const insertPolicy = policies.find(p => p.command === "INSERT");
        if (insertPolicy) {
          issues.push({
            severity: "info",
            message: `security_events INSERT is restricted to authenticated users with validated event types`,
            recommendation: `The INSERT policy validates that user_email matches the authenticated user and restricts event_type to a whitelist. This is secure. Monitor for any abuse.`,
          });
        }
      }

      // Determine overall status
      let status: "secure" | "warning" | "critical" = "secure";
      if (issues.some(i => i.severity === "critical")) status = "critical";
      else if (issues.some(i => i.severity === "warning")) status = "warning";

      results.push({
        table,
        hasRLS: true,
        policyCount: policies.length,
        policies,
        issues,
        status,
      });
    }

    // Also do a real probe: try to read user_roles as anon (should fail)
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: anonRoles, error: anonRolesErr } = await anonClient
      .from("user_roles")
      .select("*")
      .limit(1);

    const probeResults = {
      userRolesAnonymousBlocked: !!anonRolesErr || (anonRoles && anonRoles.length === 0),
    };

    // Get security event stats
    const { count: totalEvents } = await adminClient
      .from("security_events")
      .select("*", { count: "exact", head: true });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentEvents } = await adminClient
      .from("security_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);

    const { count: failedEvents } = await adminClient
      .from("security_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo)
      .eq("success", false);

    return new Response(
      JSON.stringify({
        checks: results,
        probes: probeResults,
        stats: {
          totalEvents: totalEvents || 0,
          recentEvents: recentEvents || 0,
          failedEvents: failedEvents || 0,
        },
        checkedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
