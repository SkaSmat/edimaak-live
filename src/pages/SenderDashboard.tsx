import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import SenderMatchesList from "@/components/SenderMatchesList";
import CompatibleTrips from "@/components/CompatibleTrips";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, Handshake, ChevronRight, Loader2, CheckCircle, Clock, XCircle, AlertCircle, ArrowRight, Plane, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SenderDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>("not_submitted");
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [pendingShipmentId, setPendingShipmentId] = useState<string | null>(null);

  const [stats, setStats] = useState({
    activeRequests: 0,
    acceptedMatches: 0,
    pendingMatches: 0,
  });

  useEffect(() => {
    checkAuthAndFetchStats();
    
    // Check for pending shipment switch
    const pending = localStorage.getItem("pendingShipmentSwitch");
    if (pending) {
      setPendingShipmentId(pending);
      setShowSwitchDialog(true);
      localStorage.removeItem("pendingShipmentSwitch");
    }
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
        const ids = myShipmentIds.map((s) => s.id);

        const { count, error: matchError } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .in("shipment_request_id", ids) // On filtre par ID de COLIS (pas de voyage)
          .eq("status", "accepted");

        if (!matchError && count !== null) acceptedCount = count;
      }
      let pendingCount = 0;
      if (myShipmentIds && myShipmentIds.length > 0) {
        const ids = myShipmentIds.map((s) => s.id);

        const { count, error: pendingError } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .in("shipment_request_id", ids)
          .eq("status", "pending");

        if (!pendingError && count !== null) pendingCount = count;
      }
      setStats({
        activeRequests: openCount || 0,
        acceptedMatches: acceptedCount || 0,
        pendingMatches: pendingCount || 0,
      });
    } catch (error) {
      console.error("Erreur dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToTraveler = async () => {
    if (!profile?.id) return;
    try {
      await supabase.from("profiles").update({ role: "traveler" }).eq("id", profile.id);
      toast.success("Mode voyageur activé !");
      if (pendingShipmentId) {
        navigate(`/dashboard/traveler?highlight=${pendingShipmentId}`);
      } else {
        navigate("/dashboard/traveler");
      }
    } catch (error) {
      toast.error("Erreur lors du changement de rôle");
    }
  };

  // Variables pour l'affichage KYC
  const isVerified = kycStatus === "verified";
  const isPending = kycStatus === "pending";
  const isRejected = kycStatus === "rejected";

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
    <>
    <DashboardLayout role="sender" fullName={profile?.full_name}>
      <ProfileCompletionBanner />
      
      {/* Mode Info Banner */}
      <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-3 sm:p-4 mb-6">
        <div className="flex items-start gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl flex-shrink-0">📦</span>
          <div>
            <h3 className="font-semibold text-green-900 text-sm sm:text-base mb-1">
              Mode Expéditeur
            </h3>
            <p className="text-green-800 text-xs sm:text-sm leading-relaxed">
              Créez une demande d'envoi de colis. Des voyageurs vous proposeront de transporter votre colis.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* Carte 1 : Mes demandes d'expédition */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6 flex flex-col justify-between">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-xs sm:text-sm font-medium text-muted-foreground">
                Mes demandes d'expédition
              </h3>
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div className="text-xl sm:text-2xl font-bold">{stats.activeRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">Demandes actives</p>
            <div className="mt-3 sm:mt-4 flex flex-col gap-2">
              <Button
                onClick={() => navigate("/dashboard/sender/shipments")}
                variant="link"
                className="p-0 h-auto text-primary text-xs sm:text-sm flex items-center gap-1 justify-start"
              >
                Voir mes demandes <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                onClick={() => navigate("/dashboard/sender/shipments?new=true")}
                size="sm"
                className="w-full mt-1 bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm"
              >
                <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                Envoyer un colis
              </Button>
            </div>
          </div>
          {/* Carte 2 : Demandes de match reçues */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-xs sm:text-sm font-medium text-muted-foreground">Demandes de match</h3>
              <Handshake className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold">{stats.pendingMatches}</div>
            <p className="text-xs text-muted-foreground mt-1">Voyageurs intéressés par vos colis</p>
            <div className="mt-3 sm:mt-4">
              <Button
                onClick={() => navigate("/dashboard/sender/matches?filter=pending")}
                variant="link"
                className="p-0 h-auto text-primary text-xs sm:text-sm flex items-center gap-1"
              >
                Voir les demandes <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
          {/* Carte 3 : Statut KYC */}
          <Card className="bg-card border shadow-sm sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Statut KYC</CardTitle>
              {isVerified ? (
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              ) : isPending ? (
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              ) : isRejected ? (
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              ) : (
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              {isVerified ? (
                <Badge className="text-xs bg-green-600 text-white border-0 hover:bg-green-600">
                  KYC accepté ✅
                </Badge>
              ) : isPending ? (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-0">
                  KYC en attente ⏳
                </Badge>
              ) : isRejected ? (
                <Badge className="text-xs bg-red-600 text-white border-0 hover:bg-red-600">
                  KYC rejeté ❌
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-0">
                  Incomplet
                </Badge>
              )}

              <Button
                variant="link"
                className="p-0 h-auto text-primary mt-2 block text-xs sm:text-sm"
                onClick={() => navigate("/profile")}
              >
                {isVerified ? "Voir mon profil" : "Gérer mon dossier"}{" "}
                <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4 inline" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Section Voyageurs compatibles */}
        <div className="pt-2 sm:pt-4">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Voyageurs compatibles</h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Voyageurs dont le trajet correspond à vos demandes (matching flexible : ±3 jours, villes proches)
            </p>
          </div>
          <CompatibleTrips userId={profile?.id} />
        </div>

        {/* Section Matches / Demandes de voyageurs */}
        <div className="pt-2 sm:pt-4">
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Demandes de voyageurs</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Gérez les propositions des voyageurs pour vos colis
              </p>
            </div>
            <Button
              onClick={() => navigate("/dashboard/sender/matches")}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              Voir tout
            </Button>
          </div>
          <SenderMatchesList embedded={true} userId={profile?.id} />
        </div>
      </div>
    </DashboardLayout>

      {/* Dialog for switching to traveler mode when shipment was clicked before login */}
      <AlertDialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              Proposer votre voyage ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm space-y-2">
              <p>
                Vous avez cliqué sur une demande d'expédition. Pour proposer votre voyage à cet expéditeur,
                vous devez passer en mode <strong>Voyageur</strong>.
              </p>
              <p className="text-muted-foreground text-xs">
                Vous pourrez revenir en mode Expéditeur à tout moment depuis votre profil.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSwitchDialog(false)}>Rester expéditeur</AlertDialogCancel>
            <AlertDialogAction onClick={handleSwitchToTraveler}>Passer en mode Voyageur</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SenderDashboard;
