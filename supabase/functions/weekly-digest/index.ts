import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function can be triggered by a cron job or manually
    const authHeader = req.headers.get("authorization");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      SUPABASE_SERVICE_ROLE_KEY ?? ""
    );

    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    // Count new shipments this week
    const { count: newShipmentsCount } = await supabaseAdmin
      .from("shipment_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "open")
      .gte("created_at", oneWeekAgoStr)
      .gte("latest_date", todayStr);

    // Count new trips this week
    const { count: newTripsCount } = await supabaseAdmin
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("status", "open")
      .gte("created_at", oneWeekAgoStr)
      .gte("departure_date", todayStr);

    // Count total active listings
    const { count: activeShipments } = await supabaseAdmin
      .from("shipment_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "open")
      .gte("latest_date", todayStr);

    const { count: activeTrips } = await supabaseAdmin
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("status", "open")
      .gte("departure_date", todayStr);

    // Get top routes this week (most popular from_country -> to_country)
    const { data: recentShipments } = await supabaseAdmin
      .from("shipment_requests")
      .select("from_city, from_country, to_city, to_country")
      .eq("status", "open")
      .gte("created_at", oneWeekAgoStr)
      .gte("latest_date", todayStr)
      .limit(50);

    const routeCounts: Record<string, number> = {};
    (recentShipments || []).forEach((s: any) => {
      const route = `${s.from_city} → ${s.to_city}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });
    const topRoutes = Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // If nothing happened this week, skip
    if ((newShipmentsCount || 0) === 0 && (newTripsCount || 0) === 0) {
      console.log("No new activity this week, skipping digest");
      return new Response(
        JSON.stringify({ success: true, message: "No activity to report" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all users who haven't been active in the last 3 days (re-engagement target)
    const { data: allUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, full_name, role")
      .limit(10000);

    if (!allUsers || allUsers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const topRoutesHtml = topRoutes.length > 0
      ? topRoutes.map(([route, count]) =>
          `<div style="padding: 8px 12px; background: white; border-radius: 5px; margin: 5px 0; border-left: 3px solid #E75C3C;">
            <strong>${route}</strong> — ${count} demande${count > 1 ? "s" : ""}
          </div>`
        ).join("")
      : "<p>Aucune route populaire cette semaine.</p>";

    let successful = 0;
    let failed = 0;

    for (const user of allUsers) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user.id);
      if (!userData?.user?.email) continue;

      const firstName = user.first_name || user.full_name?.split(" ")[0] || "Membre";
      const isTraveler = user.role === "traveler";

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E75C3C, #FF7A3A); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px; }
    .stat-grid { display: flex; gap: 15px; margin: 15px 0; }
    .stat-box { flex: 1; background: white; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-number { font-size: 24px; font-weight: bold; color: #E75C3C; }
    .stat-label { font-size: 12px; color: #666; }
    .cta { display: inline-block; background: #E75C3C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Votre resume hebdomadaire</h1>
    <p>Semaine du ${oneWeekAgo.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} au ${today.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
  </div>
  <div class="content">
    <p>Bonjour <strong>${firstName}</strong>,</p>
    <p>Voici ce qui s'est passe sur EdiMaak cette semaine :</p>

    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-number">${newShipmentsCount || 0}</div>
        <div class="stat-label">Nouveaux colis</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${newTripsCount || 0}</div>
        <div class="stat-label">Nouveaux voyages</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${(activeShipments || 0) + (activeTrips || 0)}</div>
        <div class="stat-label">Annonces actives</div>
      </div>
    </div>

    ${topRoutes.length > 0 ? `
    <h3 style="margin-top: 20px;">Trajets les plus demandes</h3>
    ${topRoutesHtml}
    ` : ""}

    <p style="margin-top: 20px;">
      ${isTraveler
        ? `<strong>${newShipmentsCount || 0} nouveaux colis</strong> attendent un voyageur. Peut-etre l'un d'eux correspond a votre prochain voyage ?`
        : `<strong>${newTripsCount || 0} nouveaux voyageurs</strong> sont disponibles. Publiez une demande pour trouver un transporteur !`
      }
    </p>

    <p style="text-align: center;">
      <a href="https://edimaak.com/${isTraveler ? "dashboard/traveler" : "dashboard/sender"}" class="cta">
        ${isTraveler ? "Voir les colis disponibles" : "Trouver un voyageur"}
      </a>
    </p>

    <p><strong>L'equipe EdiMaak</strong></p>
  </div>
  <div class="footer">
    <p>&copy; 2025 EdiMaak - Tous droits reserves</p>
    <p><small>Resume hebdomadaire — pour vous desabonner, contactez-nous.</small></p>
  </div>
</body>
</html>
      `;

      try {
        await sendEmail(
          userData.user.email,
          `📊 EdiMaak : ${newShipmentsCount || 0} colis et ${newTripsCount || 0} voyages cette semaine`,
          emailHtml
        );
        successful++;
      } catch (error: any) {
        failed++;
        console.error(`Failed: ${userData.user.email}:`, error.message);
      }

      await delay(600);
    }

    console.log(`Weekly digest: ${successful} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: successful, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in weekly-digest:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
