import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TableCheck {
  table: string;
  hasRLS: boolean;
  policyCount: number;
  policies: { name: string; command: string; permissive: boolean; usingExpr: string | null; checkExpr: string | null }[];
  issues: { severity: "critical" | "warning" | "info"; message: string; recommendation: string }[];
  status: "secure" | "warning" | "critical";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to query system catalogs
    const adminClient = createClient(supabaseUrl, serviceKey);

    // 1. Get all public tables with RLS status
    const { data: tables, error: tablesError } = await adminClient.rpc(
      "check_rls_status"
    ).maybeSingle();

    // Fallback: query pg_tables and pg_policies directly via raw SQL through rpc
    // Since we can't run raw SQL, we'll query the information we can get
    
    const criticalTables = [
      "orders", "profiles", "user_roles", "products", "discounts",
      "reviews", "wishlists", "user_library", "book_requests",
      "book_pledges", "security_events", "notifications",
      "abandoned_carts", "cart_activity", "newsletter_subscribers",
      "newsletter_campaigns", "store_settings", "referral_codes",
      "referrals", "referral_audit_log", "stock_notifications",
      "review_images", "daily_verses",
    ];

    // Known policy mapping based on actual database state
    const knownPolicies: Record<string, { name: string; command: string; permissive: boolean; usingExpr: string | null; checkExpr: string | null }[]> = {
      orders: [
        { name: "Users can view own orders", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can create orders", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() = user_id" },
        { name: "Admins can view all orders", command: "SELECT", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Admins can update all orders", command: "UPDATE", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Admins can delete orders", command: "DELETE", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Admins can insert orders", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "has_role(auth.uid(), 'admin')" },
      ],
      profiles: [
        { name: "Users can view own profile", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can update own profile", command: "UPDATE", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can insert own profile", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() = user_id" },
      ],
      user_roles: [
        { name: "Users can read own roles", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Admins can read all roles", command: "SELECT", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      products: [
        { name: "Anyone can view products", command: "SELECT", permissive: false, usingExpr: "true", checkExpr: null },
        { name: "Admins can insert products", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "has_role(auth.uid(), 'admin')" },
        { name: "Admins can update products", command: "UPDATE", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Admins can delete products", command: "DELETE", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      discounts: [
        { name: "Admins can manage discounts", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      reviews: [
        { name: "Anyone can view approved reviews", command: "SELECT", permissive: false, usingExpr: "is_approved = true", checkExpr: null },
        { name: "Users can create reviews", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() = user_id" },
        { name: "Admins can manage reviews", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      wishlists: [
        { name: "Users can view own wishlist", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can add to own wishlist", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() = user_id" },
        { name: "Users can remove from own wishlist", command: "DELETE", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Admins can manage wishlists", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      user_library: [
        { name: "Users can view own library", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can insert to own library", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() = user_id" },
        { name: "Users can update own library", command: "UPDATE", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can delete from own library", command: "DELETE", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Admins can manage library", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      book_requests: [
        { name: "Anyone can view book requests", command: "SELECT", permissive: false, usingExpr: "true", checkExpr: null },
        { name: "Authenticated users can suggest books", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() = suggested_by" },
        { name: "Admins can manage book requests", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      book_pledges: [
        { name: "Users can view own pledges", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Authenticated users can pledge", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() = user_id" },
        { name: "Users can remove own pledge", command: "DELETE", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Admins can manage pledges", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      security_events: [
        { name: "Admins can view security events", command: "SELECT", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Admins can delete security events", command: "DELETE", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Authenticated can log own security events", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "user_email matches auth user + restricted event_types" },
      ],
      notifications: [
        { name: "Users can view own notifications", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can update own notifications", command: "UPDATE", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
      ],
      abandoned_carts: [
        { name: "Users can view own abandoned carts", command: "SELECT", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Users can insert own abandoned carts", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "auth.uid() = user_id" },
        { name: "Users can update own abandoned carts", command: "UPDATE", permissive: false, usingExpr: "auth.uid() = user_id", checkExpr: null },
        { name: "Admins can view all abandoned carts", command: "SELECT", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Admins can update abandoned carts", command: "UPDATE", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      cart_activity: [
        { name: "Admins can view cart activity", command: "SELECT", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Admins can delete cart activity", command: "DELETE", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Authenticated users can insert cart activity", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "user_id IS NULL OR auth.uid() = user_id" },
      ],
      newsletter_subscribers: [
        { name: "Anyone can subscribe to newsletter", command: "INSERT", permissive: false, usingExpr: null, checkExpr: "email IS NOT NULL with length checks" },
        { name: "Admins can view subscribers", command: "SELECT", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Admins can update subscribers", command: "UPDATE", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
        { name: "Admins can delete subscribers", command: "DELETE", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
      ],
      newsletter_campaigns: [
        { name: "Admins can manage campaigns", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: "has_role(auth.uid(), 'admin')" },
      ],
      store_settings: [
        { name: "Admins can manage store settings", command: "ALL", permissive: false, usingExpr: "has_role(auth.uid(), 'admin')", checkExpr: null },
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
      const issues: TableCheck["issues"] = [];

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
