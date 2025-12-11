import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    first_name: string | null;
    full_name: string | null;
  };
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload));

    const { record } = payload;
    const userId = record.id;
    const firstName = record.first_name || record.full_name?.split(" ")[0] || "Utilisateur";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      console.error("Error fetching user email:", userError);
      return new Response(
        JSON.stringify({ error: "Could not fetch user email", details: userError }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = userData.user.email;
    console.log(`Sending welcome email to ${userEmail}`);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #E75C3C, #FF7A3A); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .feature { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; }
    .cta { display: inline-block; background: #E75C3C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Bienvenue sur EdiMaak ! 🎉</h1>
  </div>
  <div class="content">
    <p>Bonjour <strong>${firstName}</strong>,</p>
    <p>Merci de rejoindre <strong>EdiMaak</strong>, la plateforme qui connecte voyageurs et expéditeurs algériens, partout dans le monde !</p>
    
    <p>Vous pouvez maintenant :</p>
    <div class="feature">✈️ Proposer vos voyages et transporter des colis</div>
    <div class="feature">📦 Publier vos demandes d'expédition</div>
    <div class="feature">💬 Échanger avec la communauté</div>
    
    <p>Pour commencer, complétez votre profil et soumettez votre KYC pour devenir un membre vérifié ✅</p>
    
    <p style="text-align: center;">
      <a href="https://edimaak.com/profile" class="cta">👉 Complétez votre profil</a>
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

    const emailData = await sendEmail(userEmail, "Bienvenue sur EdiMaak ! 🎉", emailHtml);
    console.log("Welcome email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
