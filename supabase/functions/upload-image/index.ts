import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
    const API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      throw new Error("Cloudinary credentials are not configured");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      throw new Error("No file provided");
    }

    // Convert file to base64 (chunked to avoid stack overflow on large files)
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    const dataUri = `data:${file.type};base64,${base64}`;

    // Generate signature for authenticated upload
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}&transformation=f_auto,q_auto`;
    
    // Create SHA-1 signature
    const encoder = new TextEncoder();
    const data = encoder.encode(paramsToSign + API_SECRET);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Upload to Cloudinary
    const uploadForm = new FormData();
    uploadForm.append("file", dataUri);
    uploadForm.append("api_key", API_KEY);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("signature", signature);
    uploadForm.append("folder", folder);
    uploadForm.append("transformation", "f_auto,q_auto");

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: uploadForm }
    );

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(`Cloudinary error: ${JSON.stringify(uploadData)}`);
    }

    // Return optimized URL with auto-format and auto-quality
    const optimizedUrl = uploadData.secure_url.replace(
      "/upload/",
      "/upload/f_auto,q_auto/"
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
