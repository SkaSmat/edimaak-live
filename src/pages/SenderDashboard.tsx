import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Package, LogOut, MessageSquare, Plus } from "lucide-react";
import ShipmentRequestForm from "@/components/ShipmentRequestForm";
import ShipmentRequestList from "@/components/ShipmentRequestList";
import MatchProposals from "@/components/MatchProposals";

const SenderDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
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

    if (profileData?.role !== "sender") {
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

  const handleRequestCreated = () => {
    setShowRequestForm(false);
    setRefreshKey((prev) => prev + 1);
    toast.success("Demande créée avec succès !");
  };

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-accent" />
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
        {/* My Requests Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mes demandes d'expédition</CardTitle>
                <CardDescription>
                  Gérez vos demandes et acceptez les propositions
                </CardDescription>
              </div>
              <Button onClick={() => setShowRequestForm(!showRequestForm)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle demande
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showRequestForm && (
              <div className="mb-6">
                <ShipmentRequestForm userId={user.id} onSuccess={handleRequestCreated} />
              </div>
            )}
            <ShipmentRequestList key={refreshKey} userId={user.id} />
          </CardContent>
        </Card>

        {/* Match Proposals Section */}
        <Card>
          <CardHeader>
            <CardTitle>Propositions de voyageurs</CardTitle>
            <CardDescription>
              Voyageurs intéressés par vos demandes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MatchProposals userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SenderDashboard;
