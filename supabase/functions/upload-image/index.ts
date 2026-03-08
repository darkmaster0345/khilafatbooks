const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
    const API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) throw new Error("Cloudinary credentials not configured");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "products";
    if (!file) throw new Error("No file provided");

    // Stream file directly to Cloudinary using unsigned-style upload with signature
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-1", encoder.encode(paramsToSign + API_SECRET));
    const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    // Upload raw file bytes directly (avoid base64 overhead)
    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", API_KEY);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("signature", signature);
    uploadForm.append("folder", folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: uploadForm }
    );

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(`Cloudinary error: ${JSON.stringify(uploadData)}`);

    // Return URL with aggressive caching transforms
    const optimizedUrl = uploadData.secure_url.replace(
      "/upload/",
      "/upload/f_auto,q_auto,w_800,c_limit/"
    );

    return new Response(
      JSON.stringify({
        success: true,
        url: optimizedUrl,
        public_id: uploadData.public_id,
        width: uploadData.width,
        height: uploadData.height,
        bytes: uploadData.bytes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=31536000, immutable" } }
    );
  } catch (error: any) {
    console.error("Upload error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
