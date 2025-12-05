import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import ShipmentRequestForm from "@/components/ShipmentRequestForm";
import ShipmentRequestList from "@/components/ShipmentRequestList";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2 } from "lucide-react";

// C'EST ICI QUE LA MAGIE OPÈRE : On déclare que ce composant accepte "embedded"
interface SenderShipmentsProps {
  embedded?: boolean;
}

const SenderShipments = ({ embedded = false }: SenderShipmentsProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Si on n'est pas en mode "embarqué", on redirige.
        // Sinon, on laisse le parent gérer.
        if (!embedded) navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();

      // Sécurité : On vérifie le rôle seulement si on est sur la page dédiée
      if (profileData?.role !== "sender" && !embedded) {
        navigate("/auth");
        return;
      }

      setProfile(profileData);
    } catch (error) {
      console.error(error);
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

  // --- LE CONTENU (Sans le Layout autour) ---
  const Content = (
    <div className="space-y-6">
      {/* On adapte le style selon si on est "embedded" ou pas */}
      <section className={`bg-card rounded-2xl border p-6 ${embedded ? "shadow-none border-0 p-0" : "shadow-sm"}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            {/* Si embedded, on cache le titre car le Dashboard l'a déjà. Sinon on l'affiche. */}
            {!embedded && (
              <>
                <h2 className="text-xl font-bold text-foreground">Mes demandes d'expédition</h2>
                <p className="text-sm text-muted-foreground mt-1">Gérez vos demandes d'expédition</p>
              </>
            )}
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
            <ShipmentRequestForm userId={user.id} onSuccess={handleRequestCreated} />
          </div>
        )}

        <ShipmentRequestList key={refreshKey} userId={user.id} onCreateRequest={() => setShowRequestForm(true)} />
      </section>
    </div>
  );

  // --- LOGIQUE DE RETOUR ---

  // Cas 1 : Appelé depuis le Dashboard -> On renvoie juste le contenu
  if (embedded) {
    return Content;
  }

  // Cas 2 : Appelé via l'URL directe -> On met le Layout autour
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
