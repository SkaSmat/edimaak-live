import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

function isAuthorizedRequest(req: Request): boolean {
  const webhookSecret = req.headers.get("x-webhook-secret");
  const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
  if (webhookSecret && WEBHOOK_SECRET && webhookSecret === WEBHOOK_SECRET) return true;

  const clientInfo = req.headers.get("x-client-info");
  if (clientInfo === "supabase-db-trigger") return true;

  const authHeader = req.headers.get("authorization");
  if (authHeader && SUPABASE_SERVICE_ROLE_KEY) {
    const token = authHeader.replace("Bearer ", "");
    if (token === SUPABASE_SERVICE_ROLE_KEY) return true;
  }
  return false;
}

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

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const normalize = (text: string) => text ? text.toLowerCase().trim() : "";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!isAuthorizedRequest(req)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawPayload = await req.json();
    console.log("notify-new-trip: received payload");

    const record = rawPayload.record;
    if (!record || !record.id || !record.traveler_id) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (record.status !== "open") {
      return new Response(
        JSON.stringify({ success: true, message: "Skipped - status not open" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find matching shipment requests (same origin + destination country)
    const { data: matchingShipments, error: shipError } = await supabaseAdmin
      .from("shipment_requests")
      .select("id, sender_id, from_city, from_country, to_city, to_country, earliest_date, latest_date, weight_kg, item_type")
      .eq("status", "open")
      .eq("from_country", record.from_country)
      .eq("to_country", record.to_country)
      .neq("sender_id", record.traveler_id)
      .gte("latest_date", new Date().toISOString().split("T")[0]);

    if (shipError) {
      console.error("Error fetching matching shipments:", shipError);
      return new Response(
        JSON.stringify({ error: "Could not fetch shipments" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!matchingShipments || matchingShipments.length === 0) {
      console.log("No matching shipments found");
      return new Response(
        JSON.stringify({ success: true, message: "No matching shipments" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter for city-level match (exact or regional — same origin city)
    const cityMatches = matchingShipments.filter((s: any) => {
      const tripCity = normalize(record.from_city);
      const shipCity = normalize(s.from_city);
      return tripCity.includes(shipCity) || shipCity.includes(tripCity);
    });

    // Use city matches if available, otherwise use all country matches
    const recipientShipments = cityMatches.length > 0 ? cityMatches : matchingShipments;

    // Deduplicate by sender_id (one email per sender)
    const senderMap = new Map<string, any>();
    for (const s of recipientShipments) {
      if (!senderMap.has(s.sender_id)) {
        senderMap.set(s.sender_id, s);
      }
    }

    // Get traveler name
    const { data: travelerProfile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, full_name")
      .eq("id", record.traveler_id)
      .maybeSingle();

    const travelerName = travelerProfile?.first_name || travelerProfile?.full_name?.split(" ")[0] || "Un voyageur";

    console.log(`Notifying ${senderMap.size} senders about new trip ${record.from_city} -> ${record.to_city}`);

    let successful = 0;
    let failed = 0;

    for (const [senderId, shipment] of senderMap) {
      // Get sender profile
      const { data: senderProfile } = await supabaseAdmin
        .from("profiles")
        .select("first_name, full_name")
        .eq("id", senderId)
        .maybeSingle();

      // Get sender email
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(senderId);
      if (!userData?.user?.email) continue;

      const senderFirstName = senderProfile?.first_name || senderProfile?.full_name?.split(" ")[0] || "Expediteur";
      const isExactCity = normalize(record.from_city).includes(normalize(shipment.from_city)) ||
                          normalize(shipment.from_city).includes(normalize(record.from_city));

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3B82F6, #6366F1); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .detail { margin: 10px 0; padding: 12px; background: white; border-radius: 5px; border-left: 3px solid #3B82F6; }
    .cta { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .match-badge { background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✈️ Un voyageur correspond a votre colis !</h1>
    <p>${record.from_city} → ${record.to_city}</p>
  </div>
  <div class="content">
    ${isExactCity ? '<span class="match-badge">✓ Meme ville de depart</span>' : '<span class="match-badge">~ Meme pays</span>'}
    <p>Bonjour <strong>${senderFirstName}</strong>,</p>
    <p><strong>${travelerName}</strong> vient de publier un voyage qui pourrait correspondre a votre demande d'expedition :</p>

    <div class="detail">🗺️ <strong>Trajet :</strong> ${record.from_city} (${record.from_country}) → ${record.to_city} (${record.to_country})</div>
    <div class="detail">📅 <strong>Date de depart :</strong> ${formatDate(record.departure_date)}</div>
    ${record.max_weight_kg > 0 ? `<div class="detail">⚖️ <strong>Capacite :</strong> ${record.max_weight_kg} kg</div>` : ""}

    <div style="background: #EFF6FF; padding: 12px; border-radius: 5px; margin-top: 15px;">
      <strong>Votre colis :</strong> ${shipment.from_city} → ${shipment.to_city} (${shipment.weight_kg} kg, ${shipment.item_type})
    </div>

    <p>Connectez-vous pour contacter ce voyageur !</p>

    <p style="text-align: center;">
      <a href="https://edimaak.com/dashboard/sender" class="cta">👉 Voir le voyageur</a>
    </p>

    <p><strong>L'equipe EdiMaak</strong></p>
  </div>
  <div class="footer">
    <p>&copy; 2025 EdiMaak - Tous droits reserves</p>
    <p><small>Vous recevez cet email car vous avez une demande d'expedition active sur EdiMaak.</small></p>
  </div>
</body>
</html>
      `;

      try {
        await sendEmail(
          userData.user.email,
          `✈️ Un voyageur part de ${record.from_city} vers ${record.to_city} !`,
          emailHtml
        );
        successful++;
      } catch (error: any) {
        failed++;
        console.error(`Failed to send to ${userData.user.email}:`, error.message);
      }

      await delay(600);
    }

    console.log(`notify-new-trip: ${successful} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: successful, failed, totalRecipients: senderMap.size }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-new-trip:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
