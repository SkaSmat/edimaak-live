import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import ShipmentRequestForm from "@/components/ShipmentRequestForm";
import ShipmentRequestList from "@/components/ShipmentRequestList";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

const SenderShipments = () => {
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
    toast.success("Demande créée avec succès");
  };

  if (!user || !profile) return null;

  return (
    <DashboardLayout
      role="sender"
      fullName={profile.full_name}
      isAdmin={profile.role === "admin"}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Mes demandes d'expédition</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Gérez vos demandes d'expédition
              </p>
            </div>
            <Button
              onClick={() => setShowRequestForm(!showRequestForm)}
              variant={showRequestForm ? "outline" : "default"}
            >
              {showRequestForm ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle demande
                </>
              )}
            </Button>
          </div>

          {showRequestForm && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
              <ShipmentRequestForm
                userId={user.id}
                onSuccess={handleRequestCreated}
              />
            </div>
          )}

          <ShipmentRequestList key={refreshKey} userId={user.id} />
        </section>
      </div>
    </DashboardLayout>
  );
};

export default SenderShipments;
