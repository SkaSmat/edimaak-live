import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function formatDateFr(date: Date): string {
  const day = date.getDate();
  const month = MONTHS_FR[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
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

const MatchPayloadSchema = z.object({
  match_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  traveler_name: z.string(),
  shipment_route: z.string(),
  trip_id: z.string().uuid().optional(),
});

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
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
    console.error("Unauthorized request to notify-match-proposal");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const rawPayload = await req.json();
    console.log("Received match notification payload:", JSON.stringify(rawPayload));

    const parseResult = MatchPayloadSchema.safeParse(rawPayload);

    if (!parseResult.success) {
      console.error("Invalid payload:", parseResult.error.errors);
      return new Response(JSON.stringify({ error: "Invalid payload", details: parseResult.error.errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { match_id, sender_id, traveler_name, shipment_route, trip_id } = parseResult.data;

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");

    // Get sender profile info
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, full_name")
      .eq("id", sender_id)
      .maybeSingle();

    const senderFirstName = senderProfile?.first_name || senderProfile?.full_name?.split(" ")[0] || "Utilisateur";

    // Get trip details if trip_id is provided
    let tripDetails = {
      from_city: "",
      to_city: "",
      departure_date: "",
      max_weight_kg: 0,
    };

    if (trip_id) {
      const { data: tripData } = await supabaseAdmin
        .from("trips")
        .select("from_city, to_city, departure_date, max_weight_kg")
        .eq("id", trip_id)
        .maybeSingle();

      if (tripData) {
        tripDetails = tripData;
      }
    }

    // Parse route for fallback
    const [fromCity, toCity] = shipment_route.split(" → ");
    const villeDepart = tripDetails.from_city || fromCity || "Départ";
    const villeArrivee = tripDetails.to_city || toCity || "Arrivée";

    // Format date
    let dateVoyage = "Date à confirmer";
    if (tripDetails.departure_date) {
      try {
        const date = new Date(tripDetails.departure_date);
        dateVoyage = formatDateFr(date);
      } catch (e) {
        console.log("Error formatting date:", e);
      }
    }

    const capacite = tripDetails.max_weight_kg || "À confirmer";
    const lienProposition = `https://edimaak.com/dashboard/sender/matches`;

    // Get sender's email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(sender_id);

    if (userError || !userData?.user?.email) {
      console.error("Error fetching sender email:", userError);
      return new Response(JSON.stringify({ error: "Could not fetch sender email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const senderEmail = userData.user.email;
    console.log(`Sending match notification email to ${senderEmail}`);

    const emailHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EdiMaak - Un voyageur pour votre colis !</title>
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
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Bonne nouvelle !</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Un voyageur pour votre colis</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Bonjour ${senderFirstName},</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #333333;">${traveler_name} se rend à ${villeArrivee} et propose de transporter votre colis !</p>
              
              <!-- Trip Details Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f4f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px 0; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">📍 Détails du trajet</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                          <span style="color: #666666; font-size: 14px;">Départ</span>
                          <span style="float: right; color: #333333; font-weight: 600;">${villeDepart}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                          <span style="color: #666666; font-size: 14px;">Arrivée</span>
                          <span style="float: right; color: #333333; font-weight: 600;">${villeArrivee}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                          <span style="color: #666666; font-size: 14px;">Date</span>
                          <span style="float: right; color: #333333; font-weight: 600;">${dateVoyage}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666666; font-size: 14px;">Capacité disponible</span>
                          <span style="float: right; color: #333333; font-weight: 600;">${capacite} kg</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 16px 0;">
                    <a href="${lienProposition}" style="display: inline-block; background: linear-gradient(135deg, #E75C3C, #FF7A3A); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Voir la proposition →</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; color: #666666; text-align: center;">Consultez le profil de ${traveler_name} et échangez directement avec lui/elle.</p>
              
              <!-- Warning -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td style="background-color: #fff8e6; border-radius: 8px; padding: 16px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #856404;">⏰ Ce voyageur attend votre réponse.<br>Ne tardez pas, les places sont limitées !</p>
                  </td>
                </tr>
              </table>
              
              <!-- WhatsApp -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #666666;">Une question ?</p>
                    <a href="https://wa.me/33669367997" style="color: #25D366; text-decoration: none; font-size: 14px;">📱 M'écrire sur WhatsApp</a>
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
              <p style="margin: 0; font-size: 11px; color: #cccccc;">Vous recevez cet email car vous avez publié une annonce sur EdiMaak.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailData = await sendEmail(
      senderEmail,
      `🎉 ${traveler_name} propose de transporter votre colis !`,
      emailHtml,
    );
    console.log("Match notification email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailId: emailData?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in notify-match-proposal function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
