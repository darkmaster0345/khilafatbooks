import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatPKR(amount: number) {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

const STATUS_CONFIG: Record<string, { title: string; emoji: string; color: string; message: string }> = {
  pending: { title: "Order Received 📋", emoji: "🎉", color: "#059669", message: "Thank you for your order! We've received your payment proof and will verify it shortly. You'll receive another email once your payment is confirmed." },
  approved: { title: "Payment Verified ✅", emoji: "🎉", color: "#059669", message: "Great news! Your payment has been verified and your order is now being processed." },
  rejected: { title: "Payment Issue ❌", emoji: "⚠️", color: "#dc2626", message: "Unfortunately, we could not verify your payment. Please contact us on WhatsApp for assistance." },
  shipped: { title: "Order Shipped 🚚", emoji: "📦", color: "#2563eb", message: "Your order has been shipped and is on its way to you!" },
  delivered: { title: "Order Delivered 🎊", emoji: "✅", color: "#059669", message: "Your order has been delivered. We hope you enjoy your purchase!" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require Authorization header for all requests
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderId, newStatus } = await req.json();
    if (!orderId || !newStatus) throw new Error("orderId and newStatus are required");

    // Validate newStatus against allowed values
    const allowedStatuses = ["pending", "approved", "rejected", "shipped", "delivered"];
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error("Invalid status value");
    }

    // Create authenticated client to verify the caller
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the caller is authenticated
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let isAdminUser = false;
    let requireOwnership = false;

    if (newStatus === "pending") {
      requireOwnership = true;
    } else if (newStatus === "delivered" || newStatus === "approved") {
      const { data: adminCheck } = await userClient.rpc("is_admin");
      isAdminUser = !!adminCheck;
      if (!isAdminUser) requireOwnership = true;
    } else {
      const { data: adminCheck } = await userClient.rpc("is_admin");
      if (!adminCheck) {
        return new Response(JSON.stringify({ error: "Forbidden: admin access required" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: order, error: orderError } = await db
      .from("orders")
      .select("customer_name, customer_email, total, items, tracking_number, user_id, shipping_status, status")
      .eq("id", orderId)
      .single() as { data: any; error: any };

    if (orderError || !order) throw new Error(`Order not found: ${orderError?.message}`);

    if (requireOwnership && order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden: you can only send emails for your own orders" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order.customer_email) {
      return new Response(JSON.stringify({ success: false, message: "No customer email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const isAllDigital = items.every((item: any) => item.type === 'digital');
    const hasDigital = items.some((item: any) => item.type === 'digital');
    const isFreeOrder = order.total === 0;

    let config = STATUS_CONFIG[newStatus] || STATUS_CONFIG.approved;

    // Customize for free digital orders
    if (isFreeOrder && isAllDigital && (newStatus === 'approved' || newStatus === 'delivered')) {
      config = {
        ...config,
        title: "Your Digital Products Are Ready! 📥",
        emoji: "🎉",
        color: "#059669",
        message: "Your free digital products have been delivered instantly! You can download them using the links below or from your Library page."
      };
    } else if (hasDigital && (newStatus === 'delivered' || newStatus === 'approved')) {
      config = {
        ...config,
        message: config.message + " Your digital products are available for download below."
      };
    }

    // Build download links for digital products
    let digitalDownloadHtml = "";
    if (hasDigital && (newStatus === 'approved' || newStatus === 'delivered')) {
      const siteUrl = Deno.env.get("SITE_URL") || "https://khilafatbooks.vercel.app";
      const digitalItems = items.filter((item: any) => item.type === 'digital');
      
      const downloadLinks = digitalItems.map((item: any) =>
        `<tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:14px;color:#374151;font-weight:600">${item.name}</span>
            </div>
          </td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right">
            <a href="${siteUrl}/library" style="display:inline-block;padding:8px 16px;background:#059669;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">
              📥 Download
            </a>
          </td>
        </tr>`
      ).join("");

      digitalDownloadHtml = `
        <div style="margin-top:20px;padding:20px;background:#ecfdf5;border-radius:12px;border:1px solid #a7f3d0">
          <h3 style="margin:0 0 12px;font-size:16px;color:#065f46">📥 Your Digital Downloads</h3>
          <p style="margin:0 0 16px;font-size:13px;color:#047857">Access your digital products anytime from your Library.</p>
          <table style="width:100%;border-collapse:collapse">
            <tbody>${downloadLinks}</tbody>
          </table>
          <div style="margin-top:16px;text-align:center">
            <a href="${siteUrl}/library" style="display:inline-block;padding:12px 32px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
              Go to My Library →
            </a>
          </div>
        </div>`;
    }

    const itemsHtml = items.map((item: any) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151">${item.name}${item.type === 'digital' ? ' <span style="color:#059669;font-size:11px">📥 Digital</span>' : ''}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;text-align:center">${item.quantity}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;text-align:right">${item.price === 0 ? 'Free' : formatPKR(item.price * item.quantity)}</td></tr>`
    ).join("");

    const trackingHtml = order.tracking_number
      ? `<div style="margin-top:16px;padding:12px 16px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe"><p style="margin:0;font-size:14px;color:#1e40af"><strong>Tracking:</strong> ${order.tracking_number}</p></div>`
      : "";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',sans-serif"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)"><div style="background:${config.color};padding:28px 32px;text-align:center"><h1 style="margin:0;color:#fff;font-size:24px">Khilafat Books</h1><p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Knowledge with Barakah</p></div><div style="padding:32px"><h2 style="margin:0 0 8px;font-size:20px;color:#111827">${config.emoji} ${config.title}</h2><p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6">Asalam-o-Alaikum <strong style="color:#111827">${order.customer_name}</strong>,<br/>${config.message}</p><div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px"><p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Order #${orderId.slice(0, 8).toUpperCase()}</p><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:2px solid #e5e7eb"><th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Item</th><th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280">Qty</th><th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table><div style="margin-top:12px;padding-top:12px;border-top:2px solid #e5e7eb;text-align:right"><span style="font-size:16px;font-weight:700;color:#111827">${isFreeOrder ? 'Free' : formatPKR(order.total)}</span></div></div>${digitalDownloadHtml}${trackingHtml}${newStatus === "rejected" ? `<div style="margin-top:16px;padding:12px 16px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca"><p style="margin:0;font-size:14px;color:#991b1b">Need help? WhatsApp: <strong>03352706540</strong></p></div>` : ""}</div><div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center"><p style="margin:0;font-size:12px;color:#9ca3af">Thank you for shopping with Khilafat Books</p></div></div></div></body></html>`;

    const subjectMap: Record<string, string> = {
      pending: `📋 Order Received — #${orderId.slice(0, 8).toUpperCase()}`,
      approved: isFreeOrder && isAllDigital
        ? `📥 Your digital products are ready! — #${orderId.slice(0, 8).toUpperCase()}`
        : order.total === 0
          ? `📥 Your free download is ready — #${orderId.slice(0, 8).toUpperCase()}`
          : `✅ Payment Verified — Order #${orderId.slice(0, 8).toUpperCase()}`,
      rejected: `⚠️ Payment Issue — Order #${orderId.slice(0, 8).toUpperCase()}`,
      shipped: `🚚 Your Order Has Shipped — #${orderId.slice(0, 8).toUpperCase()}`,
      delivered: hasDigital
        ? `✅ Order Delivered — Download Your Products — #${orderId.slice(0, 8).toUpperCase()}`
        : `✅ Order Delivered — #${orderId.slice(0, 8).toUpperCase()}`,
    };

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Khilafat Books <onboarding@resend.dev>",
        to: [order.customer_email],
        subject: subjectMap[newStatus] || "Order Update — Khilafat Books",
        html,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) throw new Error(`Resend error: ${JSON.stringify(resendData)}`);

    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});