import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import SenderShipments from "./SenderShipments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, Handshake, User, Plus, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SenderDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>("not_submitted");

  const [stats, setStats] = useState({
    activeRequests: 0,
    acceptedMatches: 0,
  });

  useEffect(() => {
    checkAuthAndFetchStats();
  }, []);

  const checkAuthAndFetchStats = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // 1. Vérification du Rôle Actuel
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError || profileData?.role !== "sender") {
        // Si l'utilisateur est en mode "Traveler", on le redirige ou on bloque
        // Ici, on redirige vers le bon dashboard pour éviter la confusion
        if (profileData?.role === "traveler") {
          navigate("/dashboard/traveler");
          return;
        }
        navigate("/");
        return;
      }
      setProfile(profileData);

      // 🔧 Récupération du statut KYC
      const { data: privateData } = await supabase
        .from("private_info")
        .select("kyc_status")
        .eq("id", session.user.id)
        .single();

      if (privateData) {
        setKycStatus(privateData.kyc_status || "not_submitted");
      }

      const userId = session.user.id;

      // 2. Calcul STRICT des stats EXPÉDITEUR

      // A. Mes demandes d'expédition (Celles que J'AI créées en tant qu'expéditeur)
      const { count: openCount, error: openError } = await supabase
        .from("shipment_requests")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", userId) // STRICT : Seulement mes colis
        .eq("status", "open");

      if (openError) throw openError;

      // B. Mes Matches en tant qu'Expéditeur
      // On cherche les matchs liés à MES shipment_requests
      const { data: myShipmentIds } = await supabase.from("shipment_requests").select("id").eq("sender_id", userId); // STRICT : Seulement mes colis

      let acceptedCount = 0;
      if (myShipmentIds && myShipmentIds.length > 0) {
        const ids = myShipmentIds.map((s) => s.id);"

        const { count, error: matchError } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .in("shipment_request_id", ids) // On filtre par ID de COLIS (pas de voyage)
          .eq("status", "accepted");

        if (!matchError && count !== null) acceptedCount = count;
      }

      setStats({
        activeRequests: openCount || 0,
        acceptedMatches: acceptedCount || 0,
      });
    } catch (error) {
      console.error("Erreur dashboard:", error);
    } finally {
      setLoading(false);
    }
  };
  // 🔧 Fonction pour obtenir le badge de statut KYC
  const getKycBadge = () => {
    if (kycStatus === "verified") {
      return (
        <span className="bg-green-100 text-green-800 text-[9px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
          Expéditeur vérifié ✅
        </span>
      );
    }

    if (kycStatus === "pending") {
      return (
        <span className="bg-orange-100 text-orange-800 text-[9px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
          KYC en attente ⏳
        </span>
      );
    }

    if (kycStatus === "rejected") {
      return (
        <span className="bg-red-100 text-red-800 text-[9px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
          KYC rejeté ❌
        </span>
      );
    }

    return (
      <span className="bg-gray-100 text-gray-600 text-[9px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
        KYC non rempli
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout role="sender" fullName="Chargement...">
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="sender" fullName={profile?.full_name}>
      <div className="space-y-6 sm:space-y-8">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-xs sm:text-sm font-medium text-muted-foreground">
                Mes demandes d'expédition
              </h3>
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div className="text-xl sm:text-2xl font-bold">{stats.activeRequests}</div>
            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <Button
                onClick={() => navigate("/dashboard/sender/shipments")}
                variant="link"
                className="p-0 h-auto text-primary text-xs sm:text-sm flex items-center gap-1"
              >
                Gérer <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/dashboard/sender/shipments#new")}
                className="gap-1 rounded-full h-7 sm:h-8 px-2.5 sm:px-3 text-xs"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Nouvelle
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6 flex flex-col justify-between">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-xs sm:text-sm font-medium text-muted-foreground">Matches acceptés</h3>
              <Handshake className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold">{stats.acceptedMatches}</div>
            <div className="mt-3 sm:mt-4">
              <Button
                onClick={() => navigate("/dashboard/sender/matches")}
                variant="link"
                className="p-0 h-auto text-primary text-xs sm:text-sm flex items-center gap-1"
              >
                Voir mes contacts <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-xs sm:text-sm font-medium text-muted-foreground">Mon Profil</h3>
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs sm:text-sm font-medium mt-2">Statut : {getKycBadge()}</div>
            <div className="mt-3 sm:mt-4">
              <Button
                onClick={() => navigate("/profile")}
                variant="link"
                className="p-0 h-auto text-primary text-xs sm:text-sm flex items-center gap-1"
              >
                Voir mon profil <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-2 sm:pt-4">
          <SenderShipments embedded={true} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SenderDashboard;
