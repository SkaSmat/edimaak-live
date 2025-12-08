import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plane, Handshake, CheckCircle, AlertCircle, ArrowRight, Package, Clock, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useUserStats, getKycStatus } from "@/hooks/useUserStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CompatibleShipments from "@/components/CompatibleShipments";

const TravelerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const { tripsCount, matchesCount, isLoading: statsLoading } = useUserStats(user?.id);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select(
        `
        *,
        private_info (
          phone,
          id_number,
          id_type,
          kyc_status
        )
      `,
      )
      .eq("id", session.user.id)
      .single();

    if (profileData?.role !== "traveler") {
      navigate("/auth");
      toast.error("Accès non autorisé");
      return;
    }

    setProfile(profileData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Déconnexion réussie");
  };

  if (!user || !profile) return null;

  // On récupère le vrai statut
  const pInfo = profile?.private_info;
  const infoObj = Array.isArray(pInfo) ? pInfo[0] : pInfo; // Sécurité format
  const status = infoObj?.kyc_status || "not_submitted";

  // Variables pour l'affichage
  const isVerified = status === "verified";
  const isPending = status === "pending";
  const isRejected = status === "rejected";

  return (
    <DashboardLayout role="traveler" fullName={profile.full_name} onLogout={handleLogout}>
      <div className="space-y-4 sm:space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-card border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Voyages actifs</CardTitle>
              <Plane className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{statsLoading ? "..." : tripsCount}</div>
              <Button
                variant="link"
                className="p-0 h-auto text-primary mt-2 text-xs sm:text-sm"
                onClick={() => navigate("/dashboard/traveler/trips")}
              >
                Voir mes voyages <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Matches acceptés</CardTitle>
              <Handshake className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {statsLoading ? "..." : matchesCount}
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-primary mt-2 text-xs sm:text-sm"
                onClick={() => navigate("/dashboard/traveler/matches")}
              >
                Voir mes matches <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </CardContent>
          </Card>

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
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-0">
                  Expéditeur vérifié ✅
                </Badge>
              ) : isPending ? (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-0">
                  En attente ⏳
                </Badge>
              ) : isRejected ? (
                <Badge variant="destructive" className="text-xs">
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

        {/* Compatible Shipments Section */}
        <section className="bg-card rounded-xl sm:rounded-2xl shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Demandes compatibles
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Proposez vos services pour ces demandes</p>
            </div>
          </div>
          <CompatibleShipments userId={user.id} />
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TravelerDashboard;
