import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plane, LogOut, MessageSquare, Plus } from "lucide-react";
import TripForm from "@/components/TripForm";
import TripList from "@/components/TripList";
import CompatibleShipments from "@/components/CompatibleShipments";
import MyMatches from "@/components/MyMatches";

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">ColisVoyage</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Bonjour, {profile.full_name}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate("/messages")}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* My Trips Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mes voyages</CardTitle>
                <CardDescription>
                  Gérez vos voyages et acceptez des demandes d'expédition
                </CardDescription>
              </div>
              <Button onClick={() => setShowTripForm(!showTripForm)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau voyage
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showTripForm && (
              <div className="mb-6">
                <TripForm userId={user.id} onSuccess={handleTripCreated} />
              </div>
            )}
            <TripList key={refreshKey} userId={user.id} />
          </CardContent>
        </Card>

        {/* My Matches Section */}
        <Card>
          <CardHeader>
            <CardTitle>Mes matches acceptés</CardTitle>
            <CardDescription>
              Expéditions que vous avez acceptées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MyMatches userId={user.id} />
          </CardContent>
        </Card>

        {/* Compatible Shipments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Demandes d'expédition compatibles</CardTitle>
            <CardDescription>
              Proposez vos services pour ces demandes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompatibleShipments userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TravelerDashboard;
