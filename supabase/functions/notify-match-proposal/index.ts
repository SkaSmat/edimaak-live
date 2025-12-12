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

// Authorization check - verifies the request is from database trigger or authorized source
function isAuthorizedRequest(req: Request): boolean {
  // Check for webhook secret header
  const webhookSecret = req.headers.get("x-webhook-secret");
  if (webhookSecret && webhookSecret === WEBHOOK_SECRET) {
    return true;
  }
  
  // Check for service role key in authorization header (from database triggers)
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    if (token === SUPABASE_SERVICE_ROLE_KEY) {
      return true;
    }
  }
  
  // Check for internal database trigger header
  const clientInfo = req.headers.get("x-client-info");
  if (clientInfo === "supabase-db-trigger") {
    return true;
  }
  
  return false;
}

// Payload schema for match notification
const MatchPayloadSchema = z.object({
  match_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  traveler_name: z.string(),
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

  // Authorization check - verify the request is from database trigger
  if (!isAuthorizedRequest(req)) {
    console.error("Unauthorized request to notify-match-proposal");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const rawPayload = await req.json();
    console.log("Received match notification payload:", JSON.stringify(rawPayload));
    
    const parseResult = MatchPayloadSchema.safeParse(rawPayload);
    
    if (!parseResult.success) {
      console.error("Invalid payload:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid payload", details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { match_id, sender_id, traveler_name, shipment_route } = parseResult.data;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      SUPABASE_SERVICE_ROLE_KEY ?? ""
    );

    // Get sender's email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(sender_id);

    if (userError || !userData?.user?.email) {
      console.error("Error fetching sender email:", userError);
      return new Response(
        JSON.stringify({ error: "Could not fetch sender email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const senderEmail = userData.user.email;
    console.log(`Sending match notification email to ${senderEmail}`);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E75C3C, #FF7A3A); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .highlight { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #E75C3C; margin: 15px 0; }
    .cta { display: inline-block; background: #E75C3C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Nouvelle proposition de voyage !</h1>
  </div>
  <div class="content">
    <p>Bonne nouvelle !</p>
    
    <div class="highlight">
      <strong>${traveler_name}</strong> propose de transporter votre colis sur le trajet <strong>${shipment_route}</strong>
    </div>
    
    <p>Connectez-vous à votre tableau de bord pour accepter ou refuser cette proposition.</p>
    
    <p style="text-align: center;">
      <a href="https://edimaak.com/dashboard/sender/matches" class="cta">👉 Voir la proposition</a>
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
      senderEmail, 
      `🎉 ${traveler_name} veut transporter votre colis !`, 
      emailHtml
    );
    console.log("Match notification email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-match-proposal function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
