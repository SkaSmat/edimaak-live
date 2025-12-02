import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, MessageSquare, Package } from "lucide-react";
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
    fetchMatches(session.user.id);
  };

  const fetchMatches = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          trips:trip_id(id, from_city, to_city, departure_date, traveler_id, profiles:traveler_id(full_name)),
          shipment_requests:shipment_request_id(id, item_type, from_city, to_city, sender_id)
        `)
        .eq("shipment_requests.sender_id", userId)
        .in("status", ["accepted", "completed"])
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Déconnexion réussie");
  };

  const handleOpenChat = (matchId: string) => {
    navigate(`/messages?matchId=${matchId}`);
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
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Mes matches acceptés</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Voyageurs qui ont accepté vos demandes
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun match accepté pour le moment
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match: any) => (
                <div
                  key={match.id}
                  className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
                >
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
                    <Badge variant="default">
                      {match.status === "accepted" ? "Actif" : "Complété"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Départ: {match.trips?.departure_date ? format(new Date(match.trips.departure_date), "d MMMM yyyy", { locale: fr }) : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm mb-4">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">
                      Voyage: {match.trips?.from_city} → {match.trips?.to_city}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenChat(match.id)}
                    className="w-full"
                  >
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
