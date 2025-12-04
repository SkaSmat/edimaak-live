import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, MessageSquare, Package, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const SenderMatches = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // NOUVEAU : On marque les matchs comme "vus" dès qu'on arrive sur la page
    localStorage.removeItem("newMatches");
    window.dispatchEvent(new Event("match-change"));
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

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();

    if (profileData?.role !== "sender") {
      navigate("/auth");
      toast.error("Accès non autorisé");
      return;
    }

    setProfile(profileData);
    fetchMatches(session.user.id);
  };

  const fetchMatches = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          trips:trip_id(id, from_city, to_city, departure_date, traveler_id, profiles:traveler_id(full_name)),
          shipment_requests:shipment_request_id(id, item_type, from_city, to_city, sender_id)
        `,
        )
        .eq("shipment_requests.sender_id", userId)
        .in("status", ["pending", "accepted", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (matchId: string, newStatus: "accepted" | "rejected") => {
    try {
      const { error } = await supabase.from("matches").update({ status: newStatus }).eq("id", matchId);

      if (error) throw error;

      toast.success(newStatus === "accepted" ? "Proposition acceptée !" : "Proposition refusée");

      if (newStatus === "rejected") {
        setMatches(matches.filter((m) => m.id !== matchId));
      } else {
        setMatches(matches.map((m) => (m.id === matchId ? { ...m, status: newStatus } : m)));
      }
    } catch (error) {
      console.error("Error updating match:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleOpenChat = (matchId: string) => {
    navigate(`/messages?matchId=${matchId}`);
  };

  if (!user || !profile) return null;

  const pendingMatches = matches.filter((m) => m.status === "pending");
  const activeMatches = matches.filter((m) => m.status === "accepted" || m.status === "completed");

  return (
    <DashboardLayout role="sender" fullName={profile.full_name} isAdmin={profile.role === "admin"}>
      <div className="space-y-8">
        {pendingMatches.length > 0 && (
          <section className="bg-orange-50/50 border border-orange-100 rounded-2xl p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Propositions en attente ({pendingMatches.length})
              </h2>
              <p className="text-sm text-orange-600/80">Ces voyageurs proposent de transporter vos colis.</p>
            </div>
            <div className="space-y-4">
              {pendingMatches.map((match: any) => (
                <div key={match.id} className="p-4 bg-white border border-orange-200 rounded-lg shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {match.trips?.profiles?.full_name || "Un Voyageur"} propose un trajet
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Pour votre colis : {match.shipment_requests?.item_type} ({match.shipment_requests?.from_city} →{" "}
                        {match.shipment_requests?.to_city})
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        Date de départ : {format(new Date(match.trips?.departure_date), "d MMMM yyyy", { locale: fr })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdateStatus(match.id, "accepted")}
                      >
                        <Check className="w-4 h-4 mr-2" /> Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(match.id, "rejected")}
                      >
                        <X className="w-4 h-4 mr-2" /> Refuser
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Mes matches acceptés</h2>
            <p className="text-sm text-muted-foreground mt-1">Voyageurs avec qui vous êtes en contact</p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : activeMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {pendingMatches.length > 0 ? "Acceptez une proposition ci-dessus pour commencer." : "Aucun match actif."}
            </div>
          ) : (
            <div className="space-y-4">
              {activeMatches.map((match: any) => (
                <div key={match.id} className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-accent" />
                      <div>
                        <h3 className="font-semibold">
                          {match.shipment_requests?.from_city} → {match.shipment_requests?.to_city}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Avec {match.trips?.profiles?.full_name || "Voyageur"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">{match.status === "accepted" ? "Actif" : "Complété"}</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Départ:{" "}
                      {match.trips?.departure_date
                        ? format(new Date(match.trips.departure_date), "d MMMM yyyy", { locale: fr })
                        : "N/A"}
                    </span>
                  </div>

                  <Button size="sm" onClick={() => handleOpenChat(match.id)} className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Discuter
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default SenderMatches;
