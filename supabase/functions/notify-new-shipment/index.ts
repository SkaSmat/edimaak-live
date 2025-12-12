import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

// Verify request is from internal database trigger or has valid webhook secret
function isAuthorizedRequest(req: Request): boolean {
  const webhookSecret = req.headers.get("x-webhook-secret");
  if (webhookSecret && WEBHOOK_SECRET && webhookSecret === WEBHOOK_SECRET) {
    return true;
  }
  
  const authHeader = req.headers.get("authorization");
  if (authHeader && SUPABASE_SERVICE_ROLE_KEY) {
    const token = authHeader.replace("Bearer ", "");
    if (token === SUPABASE_SERVICE_ROLE_KEY) {
      return true;
    }
  }
  
  return false;
}

// Input validation schema
const ShipmentRecordSchema = z.object({
  id: z.string().uuid(),
  sender_id: z.string().uuid(),
  from_city: z.string(),
  from_country: z.string(),
  to_city: z.string(),
  to_country: z.string(),
  item_type: z.string(),
  price: z.number().nullable(),
  earliest_date: z.string(),
  latest_date: z.string(),
  status: z.string(),
});

const WebhookPayloadSchema = z.object({
  type: z.literal("INSERT"),
  table: z.string(),
  record: ShipmentRecordSchema,
  schema: z.string(),
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

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

// Helper function to delay execution (for rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!isAuthorizedRequest(req)) {
      console.error("Unauthorized: Invalid or missing authentication");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawPayload = await req.json();
    const parseResult = WebhookPayloadSchema.safeParse(rawPayload);
    
    if (!parseResult.success) {
      console.error("Invalid payload:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid payload", details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = parseResult.data;
    console.log("Received validated webhook payload:", JSON.stringify(payload));

    const { record } = payload;

    if (record.status !== "open") {
      console.log("Shipment status is not 'open', skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "Skipped - status not open" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. First, notify users with matching alerts (priority)
    const { data: matchingAlerts, error: alertsError } = await supabaseAdmin
      .from("shipment_alerts")
      .select("user_id")
      .eq("is_active", true)
      .eq("from_country", record.from_country)
      .eq("to_country", record.to_country)
      .neq("user_id", record.sender_id);

    if (alertsError) {
      console.error("Error fetching alerts:", alertsError);
    }

    // Filter alerts by city match (if specified in alert)
    const alertUserIds = new Set<string>();
    if (matchingAlerts) {
      for (const alert of matchingAlerts) {
        // We need to check city match separately since we can't do OR/NULL in the query easily
        const { data: alertDetails } = await supabaseAdmin
          .from("shipment_alerts")
          .select("from_city, to_city")
          .eq("user_id", alert.user_id)
          .eq("from_country", record.from_country)
          .eq("to_country", record.to_country)
          .eq("is_active", true)
          .maybeSingle();

        if (alertDetails) {
          const fromCityMatch = !alertDetails.from_city || 
            record.from_city.toLowerCase().includes(alertDetails.from_city.toLowerCase());
          const toCityMatch = !alertDetails.to_city || 
            record.to_city.toLowerCase().includes(alertDetails.to_city.toLowerCase());
          
          if (fromCityMatch && toCityMatch) {
            alertUserIds.add(alert.user_id);
          }
        }
      }
    }

    console.log(`Found ${alertUserIds.size} users with matching alerts`);

    // 2. Get all travelers (excluding the sender and alert users - they get priority email)
    const { data: travelers, error: travelersError } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, full_name")
      .eq("role", "traveler")
      .neq("id", record.sender_id)
      .limit(10000);

    if (travelersError) {
      console.error("Error fetching travelers:", travelersError);
      return new Response(
        JSON.stringify({ error: "Could not fetch travelers", details: travelersError }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Combine: alert users first (they get priority), then other travelers
    const allRecipients: { userId: string; firstName: string; isAlert: boolean }[] = [];
    
    // Add alert users first
    for (const userId of alertUserIds) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("first_name, full_name")
        .eq("id", userId)
        .maybeSingle();
      
      if (profile) {
        allRecipients.push({
          userId,
          firstName: profile.first_name || profile.full_name?.split(" ")[0] || "Voyageur",
          isAlert: true,
        });
      }
    }
    
    // Add other travelers (excluding alert users to avoid duplicates)
    if (travelers) {
      for (const traveler of travelers) {
        if (!alertUserIds.has(traveler.id)) {
          allRecipients.push({
            userId: traveler.id,
            firstName: traveler.first_name || traveler.full_name?.split(" ")[0] || "Voyageur",
            isAlert: false,
          });
        }
      }
    }

    if (allRecipients.length === 0) {
      console.log("No recipients to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No recipients to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Total recipients: ${allRecipients.length} (${alertUserIds.size} alerts, ${allRecipients.length - alertUserIds.size} travelers)`);

    // Get emails for all recipients
    const recipientEmails: { email: string; firstName: string; isAlert: boolean }[] = [];
    
    for (const recipient of allRecipients) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(recipient.userId);
      
      if (!userError && userData?.user?.email) {
        recipientEmails.push({
          email: userData.user.email,
          firstName: recipient.firstName,
          isAlert: recipient.isAlert,
        });
      }
    }

    console.log(`Sending notifications to ${recipientEmails.length} recipients`);

    // Send emails sequentially with delay to respect Resend rate limit (2 req/sec)
    let successful = 0;
    let failed = 0;
    const failedDetails: { email: string; reason: string }[] = [];

    for (let i = 0; i < recipientEmails.length; i++) {
      const { email, firstName, isAlert } = recipientEmails[i];
      
      const priceSection = record.price 
        ? `<div class="detail">💰 <strong>Compensation :</strong> ${record.price}€</div>`
        : "";

      // Different messaging for alert users vs regular travelers
      const introMessage = isAlert 
        ? `<p><strong>🔔 Bonne nouvelle !</strong> Un colis correspondant à votre alerte vient d'être publié :</p>`
        : `<p>Une nouvelle demande d'expédition vient d'être publiée sur EdiMaak :</p>`;

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E75C3C, #FF7A3A); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .detail { margin: 10px 0; padding: 12px; background: white; border-radius: 5px; border-left: 3px solid #E75C3C; }
    .cta { display: inline-block; background: #E75C3C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .alert-badge { background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📦 ${isAlert ? "Alerte : Nouveau colis disponible !" : "Nouvelle demande d'expédition"}</h1>
    <p>${record.from_city} → ${record.to_city}</p>
  </div>
  <div class="content">
    ${isAlert ? '<span class="alert-badge">✓ Correspond à votre alerte</span>' : ''}
    <p>Bonjour <strong>${firstName}</strong>,</p>
    ${introMessage}
    
    <div class="detail">🗺️ <strong>Trajet :</strong> ${record.from_city} (${record.from_country}) → ${record.to_city} (${record.to_country})</div>
    <div class="detail">📦 <strong>Type :</strong> ${record.item_type}</div>
    ${priceSection}
    <div class="detail">📅 <strong>Date souhaitée :</strong> Entre le ${formatDate(record.earliest_date)} et le ${formatDate(record.latest_date)}</div>
    
    <p>${isAlert ? "Ne manquez pas cette opportunité !" : "Cette annonce correspond peut-être à votre prochain voyage !"}</p>
    
    <p style="text-align: center;">
      <a href="https://edimaak.com/" class="cta">👉 Voir l'annonce</a>
    </p>
    
    <p>Bonne route !</p>
    <p><strong>L'équipe EdiMaak</strong></p>
  </div>
  <div class="footer">
    <p>© 2025 EdiMaak - Tous droits réservés</p>
    <p><small>Vous recevez cet email car ${isAlert ? "vous avez créé une alerte pour ce trajet" : "vous êtes inscrit comme voyageur"} sur EdiMaak.</small></p>
  </div>
</body>
</html>
      `;

      try {
        await sendEmail(
          email, 
          isAlert 
            ? `🔔 Alerte : Nouveau colis ${record.from_city} → ${record.to_city}` 
            : `📦 Nouvelle demande d'expédition ${record.from_city} → ${record.to_city}`, 
          emailHtml
        );
        successful++;
        console.log(`Email sent successfully to ${email} (alert: ${isAlert})`);
      } catch (error: any) {
        failed++;
        failedDetails.push({ email, reason: error.message || "Unknown error" });
        console.error(`Failed to send email to ${email}:`, error.message);
      }

      // Wait 600ms between emails to respect Resend rate limit (2 req/sec)
      if (i < recipientEmails.length - 1) {
        await delay(600);
      }
    }
    
    if (failedDetails.length > 0) {
      console.error("Failed email details:", failedDetails);
    }
    
    console.log(`Emails sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        failed: failed,
        alertUsers: alertUserIds.size,
        totalRecipients: recipientEmails.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-new-shipment function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);