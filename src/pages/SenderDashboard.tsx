import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import MatchProposals from "@/components/MatchProposals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, Handshake, User, Plus, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SenderDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    activeRequests: 0,
    acceptedMatches: 0,
  });

  useEffect(() => {
    checkAuthAndFetchStats();
  }, []);

  const checkAuthAndFetchStats = async () => {
    try {
      // 1. Vérif Auth et Profil
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError || profileData?.role !== "sender") {
        toast.error("Accès non autorisé ou erreur de profil");
        navigate("/");
        return;
      }
      setProfile(profileData);

      // 2. Calcul des stats (KPIs)
      const userId = session.user.id;

      // Count 1 : Demandes actives (status = 'open')
      const { count: openCount, error: openError } = await supabase
        .from("shipment_requests")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", userId)
        .eq("status", "open");

      if (openError) throw openError;

      // Count 2 : Matches acceptés
      const { data: myShipmentIds } = await supabase.from("shipment_requests").select("id").eq("sender_id", userId);

      let acceptedCount = 0;
      if (myShipmentIds && myShipmentIds.length > 0) {
        const ids = myShipmentIds.map((s) => s.id);
        const { count, error: matchError } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .in("shipment_request_id", ids)
          .eq("status", "accepted");

        if (!matchError && count !== null) acceptedCount = count;
      }

      setStats({
        activeRequests: openCount || 0,
        acceptedMatches: acceptedCount || 0,
      });
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard:", error);
      toast.error("Erreur de chargement des données.");
    } finally {
      setLoading(false);
    }
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
      <div className="space-y-8">
        {/* --- CARTES RÉSUMÉ --- */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Carte 1 : Mes demandes d'expédition */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              {/* MODIFICATION ICI : Changement du titre */}
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Mes demandes d'expédition</h3>
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.activeRequests}</div>
            <div className="mt-4 flex items-center justify-between">
              <Button
                onClick={() => navigate("/dashboard/sender/shipments")}
                variant="link"
                className="p-0 h-auto text-primary text-sm flex items-center gap-1"
              >
                Gérer <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/dashboard/sender/shipments#new")}
                className="gap-1 rounded-full h-8 px-3"
              >
                <Plus className="w-4 h-4" /> Nouvelle
              </Button>
            </div>
          </div>

          {/* Carte 2 : Matches acceptés */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Matches acceptés</h3>
              <Handshake className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold">{stats.acceptedMatches}</div>
            <div className="mt-4">
              <Button
                onClick={() => navigate("/dashboard/sender/matches")}
                variant="link"
                className="p-0 h-auto text-primary text-sm flex items-center gap-1"
              >
                Voir mes contacts <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Carte 3 : Profil */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Mon Profil</h3>
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium mt-2">
              Statut :{" "}
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Expéditeur vérifié</span>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => navigate("/profile")}
                variant="link"
                className="p-0 h-auto text-primary text-sm flex items-center gap-1"
              >
                Voir mon profil <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* --- SECTION PROPOSITIONS --- */}
        <div className="pt-4">
          {profile?.id && <MatchProposals userId={profile.id} />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SenderDashboard;
