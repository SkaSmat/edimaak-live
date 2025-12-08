import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProfileCompletion {
  percentage: number;
  items: {
    label: string;
    completed: boolean;
    description: string;
  }[];
}

export const ProfileProgressCard = () => {
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProfileCompletion();
  }, []);

  const checkProfileCompletion = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          `
          *,
          private_info (
            kyc_status,
            phone
          )
        `,
        )
        .eq("id", session.user.id)
        .single();

      if (!profile) return;

      let percentage = 0;
      const items = [];

      // Email vérifié (20%)
      const emailVerified = true; // Toujours vrai si connecté
      items.push({
        label: "Email vérifié",
        completed: emailVerified,
        description: "Votre adresse email a été confirmée",
      });
      if (emailVerified) percentage += 20;

      // Photo de profil (20%)
      const hasAvatar = !!profile.avatar_url;
      items.push({
        label: "Photo de profil",
        completed: hasAvatar,
        description: "Ajoutez une photo pour vous identifier",
      });
      if (hasAvatar) percentage += 20;

      // KYC vérifié (30%)
      const privateInfo = Array.isArray(profile.private_info) ? profile.private_info[0] : profile.private_info;
      const kycVerified = privateInfo?.kyc_status === "verified";
      items.push({
        label: "KYC vérifié",
        completed: kycVerified,
        description: "Vérifiez votre identité pour gagner la confiance",
      });
      if (kycVerified) percentage += 30;

      // Localisation (15%)
      const hasLocation = !!profile.country_of_residence;
      items.push({
        label: "Localisation",
        completed: hasLocation,
        description: "Indiquez votre pays de résidence",
      });
      if (hasLocation) percentage += 15;

      // Téléphone (15%)
      const hasPhone = !!privateInfo?.phone;
      items.push({
        label: "Téléphone",
        completed: hasPhone,
        description: "Ajoutez votre numéro de téléphone",
      });
      if (hasPhone) percentage += 15;

      setCompletion({ percentage, items });
    } catch (error) {
      console.error("Erreur calcul complétion:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !completion) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Complétion du profil</span>
          <span
            className={`text-2xl font-bold ${
              completion.percentage === 100
                ? "text-green-500"
                : completion.percentage >= 50
                  ? "text-orange-500"
                  : "text-red-500"
            }`}
          >
            {completion.percentage}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={completion.percentage} className="mb-6" />

        <div className="space-y-3">
          {completion.items.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              {item.completed ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${item.completed ? "text-gray-900" : "text-gray-500"}`}>{item.label}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {completion.percentage === 100 && (
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">🎉 Félicitations ! Votre profil est complet !</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
