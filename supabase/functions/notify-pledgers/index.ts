import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { requestId, productId } = await req.json();
    if (!requestId) throw new Error("requestId required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get the book request
    const { data: request, error: reqErr } = await supabase
      .from("book_requests")
      .select("title, author")
      .eq("id", requestId)
      .single();

    if (reqErr || !request) throw new Error("Book request not found");

    // Get all pledgers with emails
    const { data: pledges } = await supabase
      .from("book_pledges")
      .select("user_email, user_name")
      .eq("request_id", requestId)
      .not("user_email", "is", null);

    if (!pledges || pledges.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emails = pledges.map((p: any) => p.user_email).filter(Boolean);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <div style="background:#059669;padding:28px 32px;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:24px">Khilafat Books</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Knowledge with Barakah</p>
      </div>
      <div style="padding:32px">
        <h2 style="margin:0 0 8px;font-size:20px;color:#111827">📚 Great News! Your Book is Here!</h2>
        <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6">
          Asalam-o-Alaikum!<br/><br/>
          The book you pledged for — <strong style="color:#111827">"${request.title}"${request.author ? ` by ${request.author}` : ''}</strong> — is now available in our store!
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6">
          Your Rs. 200 pledge fee will be credited towards your purchase. Visit our store to grab your copy before it sells out!
        </p>
        <div style="text-align:center;margin-top:24px">
          <a href="https://khilafatbooks.lovable.app/shop" style="display:inline-block;padding:12px 32px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
            Shop Now →
          </a>
        </div>
      </div>
      <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
        <p style="margin:0;font-size:12px;color:#9ca3af">Thank you for being part of our community!</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Send email to all pledgers
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Khilafat Books <onboarding@resend.dev>",
        to: emails,
        subject: `📚 "${request.title}" is now available! — Khilafat Books`,
        html,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) throw new Error(`Resend error: ${JSON.stringify(resendData)}`);

    // Update request status to fulfilled
    await supabase
      .from("book_requests")
      .update({ status: "fulfilled", product_id: productId || null, fulfilled_at: new Date().toISOString() } as any)
      .eq("id", requestId);

    return new Response(
      JSON.stringify({ success: true, sent: emails.length, emailId: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
