import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShipmentRecord {
  id: string;
  sender_id: string;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  item_type: string;
  price: number | null;
  earliest_date: string;
  latest_date: string;
  status: string;
}

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: ShipmentRecord;
  schema: string;
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "EdiMaak <onboarding@resend.dev>",
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload));

    const { record } = payload;

    // Only process if status is 'open'
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

    // Get all travelers (excluding the sender)
    const { data: travelers, error: travelersError } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, full_name")
      .eq("role", "traveler")
      .neq("id", record.sender_id);

    if (travelersError) {
      console.error("Error fetching travelers:", travelersError);
      return new Response(
        JSON.stringify({ error: "Could not fetch travelers", details: travelersError }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!travelers || travelers.length === 0) {
      console.log("No travelers to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No travelers to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${travelers.length} travelers to notify`);

    // Get emails for all travelers
    const travelerEmails: { email: string; firstName: string }[] = [];
    
    for (const traveler of travelers) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(traveler.id);
      
      if (!userError && userData?.user?.email) {
        travelerEmails.push({
          email: userData.user.email,
          firstName: traveler.first_name || traveler.full_name?.split(" ")[0] || "Voyageur",
        });
      }
    }

    console.log(`Sending notifications to ${travelerEmails.length} travelers`);

    // Send emails to all travelers
    const results = await Promise.allSettled(
      travelerEmails.map(({ email, firstName }) => {
        const priceSection = record.price 
          ? `<div class="detail">💰 <strong>Compensation :</strong> ${record.price}€</div>`
          : "";

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
  </style>
</head>
<body>
  <div class="header">
    <h1>📦 Nouvelle demande d'expédition</h1>
    <p>${record.from_city} → ${record.to_city}</p>
  </div>
  <div class="content">
    <p>Bonjour <strong>${firstName}</strong>,</p>
    <p>Une nouvelle demande d'expédition vient d'être publiée sur EdiMaak :</p>
    
    <div class="detail">🗺️ <strong>Trajet :</strong> ${record.from_city} (${record.from_country}) → ${record.to_city} (${record.to_country})</div>
    <div class="detail">📦 <strong>Type :</strong> ${record.item_type}</div>
    ${priceSection}
    <div class="detail">📅 <strong>Date souhaitée :</strong> Entre le ${formatDate(record.earliest_date)} et le ${formatDate(record.latest_date)}</div>
    
    <p>Cette annonce correspond peut-être à votre prochain voyage !</p>
    
    <p style="text-align: center;">
      <a href="https://edimaak.com/" class="cta">👉 Voir l'annonce</a>
    </p>
    
    <p>Bonne route !</p>
    <p><strong>L'équipe EdiMaak</strong></p>
  </div>
  <div class="footer">
    <p>© 2024 EdiMaak - Tous droits réservés</p>
    <p><small>Vous recevez cet email car vous êtes inscrit comme voyageur sur EdiMaak.</small></p>
  </div>
</body>
</html>
        `;

        return sendEmail(email, `📦 Nouvelle demande d'expédition ${record.from_city} → ${record.to_city}`, emailHtml);
      })
    );
    
    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;
    
    console.log(`Emails sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        failed: failed,
        totalTravelers: travelerEmails.length 
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
