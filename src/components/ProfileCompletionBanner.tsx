import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileCompletion {
  percentage: number;
  missingItems: string[];
  hasAvatar: boolean;
  hasKyc: boolean;
  hasLocation: boolean;
  hasBio: boolean;
}

export const ProfileCompletionBanner = () => {
  const navigate = useNavigate();
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [dismissed, setDismissed] = useState(false);
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

      // Charger le profil + private_info
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

      let percentage = 20; // Email vérifié (automatique)
      const missing: string[] = [];

      // Photo de profil (20%)
      if (profile.avatar_url) {
        percentage += 20;
      } else {
        missing.push("Photo de profil");
      }

      // KYC vérifié (30%)
      const privateInfo = Array.isArray(profile.private_info) ? profile.private_info[0] : profile.private_info;

      if (privateInfo?.kyc_status === "verified") {
        percentage += 30;
      } else {
        missing.push("KYC vérifié");
      }

      // Localisation (15%)
      if (profile.country_of_residence) {
        percentage += 15;
      } else {
        missing.push("Localisation");
      }

      // Téléphone rempli (15%)
      if (privateInfo?.phone) {
        percentage += 15;
      } else {
        missing.push("Téléphone");
      }

      setCompletion({
        percentage,
        missingItems: missing,
        hasAvatar: !!profile.avatar_url,
        hasKyc: privateInfo?.kyc_status === "verified",
        hasLocation: !!profile.country_of_residence,
        hasBio: !!privateInfo?.phone,
      });
    } catch (error) {
      // Silently handle completion calculation errors
    } finally {
      setLoading(false);
    }
  };

  // Ne rien afficher si profil complet ou si fermé
  if (loading || !completion || completion.percentage >= 80 || dismissed) {
    return null;
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 relative">
      <button type="button" onClick={() => setDismissed(true)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" aria-label="Fermer la bannière de complétion de profil">
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">Profil complété à {completion.percentage}%</h3>

          <p className="text-sm text-gray-600 mb-3">
            Complétez votre profil pour augmenter votre visibilité et gagner la confiance des autres utilisateurs.
          </p>

          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>

          {/* Liste des éléments manquants */}
          <div className="flex flex-wrap gap-2 mb-3">
            {completion.missingItems.map((item) => (
              <span
                key={item}
                className="text-xs bg-white border border-orange-200 text-orange-700 px-2 py-1 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>

          <Button onClick={() => navigate("/profile")} size="sm" className="bg-orange-500 hover:bg-orange-600">
            Compléter mon profil
          </Button>
        </div>
      </div>
    </div>
  );
};
