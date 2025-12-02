import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plane, Handshake, CheckCircle, AlertCircle, ArrowRight, Package } from "lucide-react";
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
      .select("*")
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

  const kycStatus = getKycStatus(profile);
  const isKycComplete = kycStatus === "complete";

  return (
    <DashboardLayout
      role="traveler"
      fullName={profile.full_name}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Voyages actifs
              </CardTitle>
              <Plane className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {statsLoading ? "..." : tripsCount}
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-primary mt-2"
                onClick={() => navigate("/dashboard/traveler/trips")}
              >
                Voir mes voyages <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Matches acceptés
              </CardTitle>
              <Handshake className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {statsLoading ? "..." : matchesCount}
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-primary mt-2"
                onClick={() => navigate("/dashboard/traveler/matches")}
              >
                Voir mes matches <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Statut KYC
              </CardTitle>
              {isKycComplete ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              )}
            </CardHeader>
            <CardContent>
              <Badge
                variant={isKycComplete ? "default" : "secondary"}
                className={isKycComplete ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"}
              >
                {isKycComplete ? "Complété" : "Incomplet"}
              </Badge>
              <Button
                variant="link"
                className="p-0 h-auto text-primary mt-2 block"
                onClick={() => navigate("/profile")}
              >
                {isKycComplete ? "Voir mon profil" : "Compléter mon profil"} <ArrowRight className="ml-1 h-4 w-4 inline" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Compatible Shipments Section */}
        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Demandes d'expédition compatibles
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Proposez vos services pour ces demandes
              </p>
            </div>
          </div>
          <CompatibleShipments userId={user.id} />
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TravelerDashboard;
