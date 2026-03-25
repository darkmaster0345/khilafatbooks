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

const formatPKR = (amount: number) => "Rs. " + amount.toLocaleString();

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
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey!);
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch abandoned carts from the last 24 hours that haven't been reminded
    const { data: carts, error: cartsError } = await db
      .from("abandoned_carts")
      .select("*")
      .eq("status", "abandoned")
      .lte("created_at", twentyFourHoursAgo.toISOString())
      .limit(50) as any;

    if (cartsError) throw cartsError;

    const results = {
      processed: 0,
      emailsSent: 0,
      errors: [] as string[],
    };

    for (const cart of carts || []) {
      try {
        if (!cart.user_email) continue;

        // Generate a 10% discount code for recovery
        const recoveryCode = "COMEBACK10-" + Math.random().toString(36).substring(2, 7).toUpperCase();
        const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

        const discountAmount = Math.floor(cart.cart_total * 0.1);
        const newTotal = cart.cart_total - discountAmount;

        const items = Array.isArray(cart.items) ? cart.items : [];
        const itemsHtml = items.map((item: any) =>
          `<tr>
            <td style="padding:12px;border-bottom:1px solid #f0f0f0">
              <div style="display:flex;align-items:center;gap:12px">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:50px;height:50px;object-fit:cover;border-radius:8px"/>` : ''}
                <span style="font-size:14px;color:#374151">${item.name}</span>
              </div>
            </td>
            <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#374151">${item.quantity}</td>
            <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;color:#374151">${formatPKR(item.price * item.quantity)}</td>
          </tr>`
        ).join("");

        const baseUrl = Deno.env.get("SITE_URL") || "https://khilafatbooks.vercel.app";
        const recoveryLink = `${baseUrl}/cart?recover=${recoveryCode}`;

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
      <div style="background:linear-gradient(135deg,#059669 0%,#047857 100%);padding:32px;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:24px">Khilafat Books</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:14px">You left something behind...</p>
      </div>
      <div style="padding:32px">
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827">🛒 Your Cart Misses You!</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
          Asalam-o-Alaikum <strong style="color:#111827">${cart.user_name || 'valued customer'}</strong>,<br/><br/>
          We noticed you left some items in your cart. Don't worry – they're still waiting for you!
        </p>
        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 12px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Your Cart Items</p>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="border-bottom:2px solid #e5e7eb">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Item</th>
                <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280">Qty</th>
                <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="margin-top:16px;padding-top:16px;border-top:2px solid #e5e7eb">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:14px;color:#6b7280">Subtotal:</span>
              <span style="font-size:14px;color:#6b7280;text-decoration:line-through">${formatPKR(cart.cart_total)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
              <span style="font-size:14px;color:#059669;font-weight:600">Recovery Discount:</span>
              <span style="font-size:14px;color:#059669;font-weight:600">-${formatPKR(discountAmount)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
              <span style="font-size:18px;font-weight:700;color:#111827">New Total:</span>
              <span style="font-size:18px;font-weight:700;color:#059669">${formatPKR(newTotal)}</span>
            </div>
          </div>
        </div>
        <div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;border:2px solid #f59e0b">
          <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#92400e">🎁 EXCLUSIVE OFFER</p>
          <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#78350f">${formatPKR(discountAmount)} OFF</p>
          <p style="margin:0;font-size:13px;color:#92400e">Complete your order in the next <strong>12 hours</strong></p>
        </div>
        <div style="text-align:center;margin-bottom:24px">
          <a href="${recoveryLink}" style="display:inline-block;background:linear-gradient(135deg,#059669 0%,#047857 100%);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 14px rgba(5,150,105,0.35)">
            Complete My Order →
          </a>
        </div>
        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
          Use code <strong style="color:#059669">${recoveryCode}</strong> at checkout if the discount isn't auto-applied.
        </p>
      </div>
      <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280">Need help? WhatsApp us at <strong>03352706540</strong></p>
        <p style="margin:0;font-size:11px;color:#9ca3af">© Khilafat Books — Knowledge with Barakah</p>
      </div>
    </div>
  </div>
</body>
</html>`;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Khilafat Books <onboarding@resend.dev>",
            to: [cart.user_email],
            subject: `🛒 Don't forget your cart — ${formatPKR(discountAmount)} OFF for 12 hours!`,
            html,
          }),
        });

        const resendData = await resendRes.json();
        if (!resendRes.ok) {
          results.errors.push(`Email failed for ${cart.user_email}: ${JSON.stringify(resendData)}`);
          continue;
        }

        await (db
          .from("abandoned_carts")
          .update({
            status: "reminded",
            reminder_sent_at: now.toISOString(),
            reminder_count: cart.reminder_count + 1,
            recovery_code: recoveryCode,
            recovery_code_expires_at: expiresAt.toISOString(),
            updated_at: now.toISOString(),
          } as any)
          .eq("id", cart.id) as any);

        results.emailsSent++;
        results.processed++;
      } catch (err: any) {
        results.errors.push(`Error processing cart ${cart.id}: ${err.message}`);
      }
    }

    await (db
      .from("abandoned_carts")
      .update({ status: "expired", updated_at: now.toISOString() } as any)
      .eq("status", "reminded")
      .lt("recovery_code_expires_at", now.toISOString()) as any);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} abandoned carts, sent ${results.emailsSent} emails`,
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Cart recovery error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
