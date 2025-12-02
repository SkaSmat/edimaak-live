import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, MapPin, Calendar, Weight } from "lucide-react";
import TripForm from "@/components/TripForm";
import TripList from "@/components/TripList";
import CompatibleShipments from "@/components/CompatibleShipments";
import MyMatches from "@/components/MyMatches";
import { DashboardHeader } from "@/components/DashboardHeader";

const TravelerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleTripCreated = () => {
    setShowTripForm(false);
    setRefreshKey((prev) => prev + 1);
    toast.success("Voyage créé avec succès !");
  };

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader
        fullName={profile.full_name}
        role="traveler"
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Section: Mes voyages */}
        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Mes voyages</h2>
              <p className="text-muted-foreground mt-1">
                Gérez vos voyages et acceptez des demandes d'expédition
              </p>
            </div>
            <Button 
              onClick={() => setShowTripForm(!showTripForm)}
              className="shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau voyage
            </Button>
          </div>

          {showTripForm && (
            <div className="mb-6 p-4 bg-muted/50 rounded-xl border">
              <TripForm userId={user.id} onSuccess={handleTripCreated} />
            </div>
          )}

          <TripList key={refreshKey} userId={user.id} />
        </section>

        {/* Section: Mes matches acceptés */}
        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Mes matches acceptés</h2>
            <p className="text-muted-foreground mt-1">
              Expéditions que vous avez acceptées
            </p>
          </div>
          <MyMatches userId={user.id} />
        </section>

        {/* Section: Demandes compatibles */}
        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Demandes d'expédition compatibles</h2>
            <p className="text-muted-foreground mt-1">
              Proposez vos services pour ces demandes
            </p>
          </div>
          <CompatibleShipments userId={user.id} />
        </section>
      </div>
    </div>
  );
};

export default TravelerDashboard;
