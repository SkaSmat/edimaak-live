import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import ShipmentRequestForm from "@/components/ShipmentRequestForm";
import ShipmentRequestList from "@/components/ShipmentRequestList";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2 } from "lucide-react";

// 1. On définit que cette page peut recevoir une option "embedded" (embarqué)
interface SenderShipmentsProps {
  embedded?: boolean;
}

const SenderShipments = ({ embedded = false }: SenderShipmentsProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // Open form if ?new=true is in URL
    if (searchParams.get("new") === "true") {
      setShowRequestForm(true);
    }
  }, [searchParams]);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Redirection seulement si on est sur la page seule (pas dans le dashboard)
        if (!embedded) navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();

      if (profileData?.role !== "sender" && !embedded) {
        navigate("/auth");
        return;
      }

      setProfile(profileData);
    } catch (error) {
      // Error handled by navigation
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return embedded ? (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    ) : null;
  }

  if (!user) return null;

  // --- LE CŒUR DE LA PAGE (Liste + Formulaire) ---
  const Content = (
    <div className="space-y-6">
      <section className={`bg-card rounded-2xl border p-6 ${embedded ? "shadow-none border-0 p-0" : "shadow-sm"}`}>
        {/* Titre et sous-titre */}
        {!embedded && (
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground">Mes demandes d'expédition</h2>
            <p className="text-sm text-muted-foreground mt-1">Gérez vos demandes d'expédition</p>
          </div>
        )}

        {/* Bouton full-width comme TravelerTrips */}
        <Button
          onClick={() => setShowRequestForm(!showRequestForm)}
          variant={showRequestForm ? "outline" : "default"}
          className="w-full mb-6"
        >
          {showRequestForm ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Envoyer un colis
            </>
          )}
        </Button>

        {showRequestForm && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <ShipmentRequestForm userId={user.id} onSuccess={handleRequestCreated} />
          </div>
        )}

        <ShipmentRequestList key={refreshKey} userId={user.id} onCreateRequest={() => setShowRequestForm(true)} />
      </section>
    </div>
  );

  // --- LOGIQUE D'AFFICHAGE CRITIQUE ---

  // CAS A : On est DANS le Dashboard (via SenderDashboard)
  // => On renvoie seulement le contenu (pas de menu, pas de header, pas de "Bonjour")
  if (embedded) {
    return Content;
  }

  // CAS B : On est sur la page seule (/dashboard/sender/shipments)
  // => On met le Layout complet autour
  return (
    <DashboardLayout
      role="sender"
      fullName={profile?.full_name || "Utilisateur"}
      isAdmin={profile?.role === "admin"}
      onLogout={handleLogout}
    >
      {Content}
    </DashboardLayout>
  );
};

export default SenderShipments;
