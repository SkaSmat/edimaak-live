import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Authorization check
function isAuthorizedRequest(req: Request): boolean {
  const webhookSecret = req.headers.get("x-webhook-secret");
  if (webhookSecret && webhookSecret === WEBHOOK_SECRET) {
    return true;
  }
  
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    if (token === SUPABASE_SERVICE_ROLE_KEY) {
      return true;
    }
  }
  
  const clientInfo = req.headers.get("x-client-info");
  if (clientInfo === "supabase-db-trigger") {
    return true;
  }
  
  return false;
}

// Payload schema
const MatchAcceptedPayloadSchema = z.object({
  match_id: z.string().uuid(),
  traveler_id: z.string().uuid(),
  sender_name: z.string(),
  shipment_route: z.string(),
});

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "EdiMaak <noreply@edimaak.com>",
      to: [to],
      subject,
      html,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Resend API error: ${JSON.stringify(data)}`);
  }
  
  return data;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!isAuthorizedRequest(req)) {
    console.error("Unauthorized request to notify-match-accepted");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const rawPayload = await req.json();
    console.log("Received match accepted payload:", JSON.stringify(rawPayload));
    
    const parseResult = MatchAcceptedPayloadSchema.safeParse(rawPayload);
    
    if (!parseResult.success) {
      console.error("Invalid payload:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid payload", details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { match_id, traveler_id, sender_name, shipment_route } = parseResult.data;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      SUPABASE_SERVICE_ROLE_KEY ?? ""
    );

    // Get traveler's email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(traveler_id);

    if (userError || !userData?.user?.email) {
      console.error("Error fetching traveler email:", userError);
      return new Response(
        JSON.stringify({ error: "Could not fetch traveler email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const travelerEmail = userData.user.email;
    console.log(`Sending match accepted email to ${travelerEmail}`);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .highlight { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981; margin: 15px 0; }
    .cta { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Votre proposition a été acceptée !</h1>
  </div>
  <div class="content">
    <p>Excellente nouvelle !</p>
    
    <div class="highlight">
      <strong>${sender_name}</strong> a accepté votre proposition pour transporter son colis sur le trajet <strong>${shipment_route}</strong>
    </div>
    
    <p>Vous pouvez maintenant discuter des détails de la remise du colis via la messagerie.</p>
    
    <p style="text-align: center;">
      <a href="https://edimaak.com/messages?matchId=${match_id}" class="cta">💬 Discuter avec l'expéditeur</a>
    </p>
    
    <p>À bientôt sur EdiMaak !</p>
    <p><strong>L'équipe EdiMaak</strong></p>
  </div>
  <div class="footer">
    <p>© 2024 EdiMaak - Tous droits réservés</p>
  </div>
</body>
</html>
    `;

    const emailData = await sendEmail(
      travelerEmail, 
      `✅ Votre proposition a été acceptée par ${sender_name} !`, 
      emailHtml
    );
    console.log("Match accepted email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-match-accepted function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
