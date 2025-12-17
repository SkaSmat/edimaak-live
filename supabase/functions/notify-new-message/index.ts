import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function formatDateFr(date: Date): string {
  const day = date.getDate();
  const month = MONTHS_FR[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatTimeFr(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}h${minutes}`;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isAuthorizedRequest(req: Request): boolean {
  const webhookSecret = req.headers.get("x-webhook-secret");
  if (webhookSecret && webhookSecret === WEBHOOK_SECRET) return true;
  
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    if (token === SUPABASE_SERVICE_ROLE_KEY) return true;
  }
  
  const clientInfo = req.headers.get("x-client-info");
  if (clientInfo === "supabase-db-trigger") return true;
  
  return false;
}

const MessagePayloadSchema = z.object({
  type: z.literal("INSERT"),
  table: z.literal("messages"),
  schema: z.literal("public"),
  record: z.object({
    id: z.string().uuid(),
    match_id: z.string().uuid(),
    sender_id: z.string().uuid(),
    content: z.string(),
    created_at: z.string(),
  }),
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
  if (!response.ok) throw new Error(`Resend API error: ${JSON.stringify(data)}`);
  return data;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!isAuthorizedRequest(req)) {
    console.error("Unauthorized request to notify-new-message");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const rawPayload = await req.json();
    console.log("Received message notification payload:", JSON.stringify(rawPayload));
    
    const parseResult = MessagePayloadSchema.safeParse(rawPayload);
    
    if (!parseResult.success) {
      console.error("Invalid payload:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid payload", details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { record } = parseResult.data;
    const { match_id, sender_id, content, created_at } = record;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      SUPABASE_SERVICE_ROLE_KEY ?? ""
    );

    // Get match details to find the recipient
    const { data: matchData, error: matchError } = await supabaseAdmin
      .from("matches")
      .select(`
        trip_id,
        shipment_request_id,
        trips:trip_id(traveler_id, from_city, to_city, departure_date),
        shipment_requests:shipment_request_id(sender_id)
      `)
      .eq("id", match_id)
      .maybeSingle();

    if (matchError || !matchData) {
      console.error("Error fetching match:", matchError);
      return new Response(
        JSON.stringify({ error: "Could not fetch match details" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trip = matchData.trips as any;
    const shipmentRequest = matchData.shipment_requests as any;

    // Determine recipient (the person who didn't send the message)
    let recipientId: string;
    let typeAnnonce: string;
    
    if (sender_id === trip?.traveler_id) {
      recipientId = shipmentRequest?.sender_id;
      typeAnnonce = "demande de colis";
    } else {
      recipientId = trip?.traveler_id;
      typeAnnonce = "voyage";
    }

    if (!recipientId) {
      console.log("Could not determine recipient");
      return new Response(
        JSON.stringify({ success: false, error: "No recipient found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get sender's profile
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, full_name")
      .eq("id", sender_id)
      .maybeSingle();

    const senderFirstName = senderProfile?.first_name || senderProfile?.full_name?.split(" ")[0] || "Utilisateur";
    const senderInitial = senderFirstName.charAt(0).toUpperCase();

    // Get recipient's profile
    const { data: recipientProfile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, full_name")
      .eq("id", recipientId)
      .maybeSingle();

    const recipientFirstName = recipientProfile?.first_name || recipientProfile?.full_name?.split(" ")[0] || "Utilisateur";

    // Get recipient's email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(recipientId);

    if (userError || !userData?.user?.email) {
      console.error("Error fetching recipient email:", userError);
      return new Response(
        JSON.stringify({ error: "Could not fetch recipient email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipientEmail = userData.user.email;

    // Format message time
    let heureMessage = "Aujourd'hui";
    try {
      const messageDate = new Date(created_at);
      heureMessage = `Aujourd'hui à ${formatTimeFr(messageDate)}`;
    } catch (e) {
      console.log("Error formatting time:", e);
    }

    // Truncate message to 100 chars
    const apercuMessage = content.length > 100 ? content.substring(0, 100) + "..." : content;

    // Trip details
    const villeDepart = trip?.from_city || "Départ";
    const villeArrivee = trip?.to_city || "Arrivée";
    let dateVoyage = "Date à confirmer";
    if (trip?.departure_date) {
      try {
        const date = new Date(trip.departure_date);
        dateVoyage = formatDateFr(date);
      } catch (e) {
        console.log("Error formatting date:", e);
      }
    }

    const lienConversation = `https://edimaak.com/messages?match=${match_id}`;

    console.log(`Sending message notification email to ${recipientEmail}`);

    const emailHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EdiMaak - Nouveau message</title>
  <style>
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f4f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f4f0;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #E75C3C, #FF7A3A); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
              <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Nouveau message</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Bonjour ${recipientFirstName},</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #333333;">${senderFirstName} vous a envoyé un message concernant votre ${typeAnnonce}.</p>
              
              <!-- Message Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f4f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="48" valign="top">
                          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #E75C3C, #FF7A3A); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; line-height: 40px; text-align: center;">${senderInitial}</div>
                        </td>
                        <td style="padding-left: 12px;" valign="top">
                          <p style="margin: 0; font-weight: 600; color: #333333; font-size: 14px;">${senderFirstName}</p>
                          <p style="margin: 4px 0 0 0; font-size: 12px; color: #999999;">${heureMessage}</p>
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top: 16px; padding: 16px; background-color: #ffffff; border-radius: 8px; border-left: 3px solid #E75C3C;">
                      <p style="margin: 0; font-size: 14px; color: #333333; font-style: italic;">"${apercuMessage}"</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 16px 0;">
                    <a href="${lienConversation}" style="display: inline-block; background: linear-gradient(135deg, #E75C3C, #FF7A3A); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Répondre →</a>
                  </td>
                </tr>
              </table>
              
              <!-- Trip Info -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="text-align: center; padding: 16px; background-color: #f8f4f0; border-radius: 8px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">📍 Trajet concerné</p>
                    <p style="margin: 0; font-size: 16px; color: #333333; font-weight: 600;">${villeDepart} → ${villeArrivee}</p>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #666666;">${dateVoyage}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Tip -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="background-color: #e8f4fd; border-radius: 8px; padding: 16px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #0066cc;">💡 Conseil : Répondez rapidement pour finaliser votre accord.</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 32px 0 0 0; font-size: 14px; color: #333333;">À très vite,</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #333333; font-weight: 600;">L'équipe EdiMaak</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 24px; text-align: center;">
              <p style="margin: 0 0 8px 0;"><a href="https://edimaak.com" style="color: #E75C3C; text-decoration: none; font-weight: 600;">Edimaak.com</a></p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #999999;">
                <a href="https://edimaak.com/securite" style="color: #999999; text-decoration: none;">Sécurité</a> • 
                <a href="mailto:contact@edimaak.com?subject=Se%20désinscrire" style="color: #999999; text-decoration: none;">Se désinscrire</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #cccccc;">Vous recevez cet email car vous avez une conversation active sur EdiMaak.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailData = await sendEmail(
      recipientEmail, 
      `💬 ${senderFirstName} vous a envoyé un message`, 
      emailHtml
    );
    console.log("Message notification email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-new-message function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);