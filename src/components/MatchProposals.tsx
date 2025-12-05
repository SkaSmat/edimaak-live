import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Check, X, MessageSquare, Inbox, Clock, Package } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";

interface Match {
  id: string;
  status: string;
  trips: {
    id: string;
    from_city: string;
    to_city: string;
    departure_date: string;
    traveler_id: string;
    profiles: {
      full_name: string;
    } | null;
  };
  shipment_requests: {
    id: string;
    item_type: string;
    sender_id: string;
  };
}

interface MatchProposalsProps {
  userId: string;
}

const MatchProposals = ({ userId }: MatchProposalsProps) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [userId]);

  const fetchMatches = async () => {
    setError(false);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          trips:trip_id(id, from_city, to_city, departure_date, traveler_id, profiles:traveler_id(full_name)),
          shipment_requests:shipment_request_id(id, item_type, sender_id)
        `,
        )
        .eq("shipment_requests.sender_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMatches((data || []) as Match[]);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setError(true);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (matchId: string, status: "accepted" | "rejected") => {
    try {
      const { error } = await supabase.from("matches").update({ status }).eq("id", matchId);

      if (error) throw error;

      if (status === "accepted") {
        toast.success("Proposition acceptée ! Vous pouvez maintenant discuter.");
        navigate(`/messages?matchId=${matchId}`);
      } else {
        toast.success("Proposition refusée");
        fetchMatches();
      }
    } catch (error) {
      console.error("Error updating match:", error);
      toast.error("Une erreur est survenue. Vérifie ta connexion et réessaie.");
    }
  };

  const handleOpenChat = (matchId: string) => {
    navigate(`/messages?matchId=${matchId}`);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchMatches} />;
  }

  // Filtrer les matches valides
  const validMatches = matches.filter((match) => match.trips && match.trips.profiles);
  
  // Séparer par statut
  const pendingMatches = validMatches.filter((m) => m.status === "pending");
  const acceptedMatches = validMatches.filter((m) => m.status === "accepted" || m.status === "completed");
  const rejectedMatches = validMatches.filter((m) => m.status === "rejected");

  if (validMatches.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucune proposition"
        description="Tu n'as reçu aucune proposition de voyageur pour le moment."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Section Propositions en attente */}
      {pendingMatches.length > 0 && (
        <div className="rounded-2xl border bg-primary/5 border-primary/20 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-primary">
              Propositions en attente ({pendingMatches.length})
            </h3>
          </div>
          <p className="text-sm text-primary/70 mb-4">Ces voyageurs proposent de transporter vos colis.</p>
          
          <div className="space-y-4">
            {pendingMatches.map((match: any) => (
              <div
                key={match.id}
                className="bg-card rounded-xl p-4 border border-border/50 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">
                      {match.trips?.profiles?.full_name || "Voyageur"} propose un trajet
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Pour votre colis : {match.shipment_requests?.item_type || "Colis"} ({match.trips.from_city} → {match.trips.to_city})
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Calendar className="w-4 h-4" />
                      <span>Date de départ : {format(new Date(match.trips.departure_date), "d MMMM yyyy", { locale: fr })}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    <Button
                      onClick={() => handleUpdateStatus(match.id, "accepted")}
                      className="gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Accepter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(match.id, "rejected")}
                      className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                      Refuser
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Matches acceptés */}
      {acceptedMatches.length > 0 && (
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-1">Mes matches acceptés</h3>
          <p className="text-sm text-muted-foreground mb-4">Voyageurs avec qui vous êtes en contact</p>
          
          <div className="space-y-4">
            {acceptedMatches.map((match: any) => (
              <div
                key={match.id}
                className="rounded-xl border border-border/50 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {match.trips.from_city} → {match.trips.to_city}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Avec {match.trips?.profiles?.full_name || "Voyageur"}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Actif
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>Départ: {format(new Date(match.trips.departure_date), "d MMMM yyyy", { locale: fr })}</span>
                </div>

                <Button onClick={() => handleOpenChat(match.id)} className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Discuter
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Matches refusés */}
      {rejectedMatches.length > 0 && (
        <div className="rounded-2xl border bg-muted/30 p-6">
          <h3 className="text-lg font-bold text-muted-foreground mb-1">Propositions refusées</h3>
          <p className="text-sm text-muted-foreground mb-4">Historique des propositions que vous avez déclinées</p>
          
          <div className="space-y-3">
            {rejectedMatches.map((match: any) => (
              <div
                key={match.id}
                className="rounded-xl border border-border/30 bg-card/50 p-4 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">
                      {match.trips.from_city} → {match.trips.to_city}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Par {match.trips?.profiles?.full_name || "Voyageur"} • {format(new Date(match.trips.departure_date), "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    Refusé
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchProposals;
