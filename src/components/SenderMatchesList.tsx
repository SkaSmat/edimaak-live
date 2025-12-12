import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, MessageSquare, Clock, Check, X, Package, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Match {
  id: string;
  status: string;
  created_at: string;
  trips: {
    id: string;
    from_city: string;
    to_city: string;
    departure_date: string;
    traveler_id: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
  shipment_requests: {
    id: string;
    item_type: string;
    from_city: string;
    to_city: string;
    sender_id: string;
  } | null;
}

interface SenderMatchesListProps {
  embedded?: boolean;
  userId: string;
}

const SenderMatchesList = ({ embedded = false, userId }: SenderMatchesListProps) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchMatches();
      
      // Subscribe to realtime match updates
      const channel = supabase
        .channel(`sender-matches-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
          },
          () => {
            // Refetch when any match changes
            fetchMatches();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const fetchMatches = async () => {
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
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false })
        .limit(embedded ? 5 : 20); // Limite à 5 si embedded

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (matchId: string, newStatus: "accepted" | "rejected") => {
    try {
      const { error } = await supabase.from("matches").update({ status: newStatus }).eq("id", matchId);

      if (error) throw error;

      toast.success(newStatus === "accepted" ? "Proposition acceptée !" : "Proposition refusée");

      // Rafraîchir la liste
      fetchMatches();
    } catch (error) {
      console.error("Error updating match:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleOpenChat = (matchId: string) => {
    navigate(`/messages?matchId=${matchId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-0">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-0">
            <Check className="w-3 h-3 mr-1" />
            Accepté
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4 bg-muted/30 rounded-xl">
        <div className="bg-primary/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Aucune proposition pour le moment</h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Les voyageurs intéressés par vos colis apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {matches.map((match) => (
        <div
          key={match.id}
          className="bg-card rounded-xl border shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            {/* Info principale */}
            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                      {match.trips?.profiles?.full_name || "Voyageur"}
                    </h3>
                    {getStatusBadge(match.status)}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Voyage : {match.trips?.from_city} → {match.trips?.to_city}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{match.shipment_requests?.item_type || "Colis"}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">
                    {match.trips?.departure_date
                      ? format(new Date(match.trips.departure_date), "d MMM yyyy", { locale: fr })
                      : "Date non spécifiée"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col gap-2 flex-shrink-0">
              {match.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(match.id, "accepted")}
                    className="flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(match.id, "rejected")}
                    className="flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Refuser
                  </Button>
                </>
              )}
              {match.status === "accepted" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenChat(match.id)}
                  className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
                >
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Message
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}

      {embedded && matches.length > 0 && (
        <div className="text-center pt-2">
          <Button variant="link" onClick={() => navigate("/dashboard/sender/matches")} className="text-xs sm:text-sm">
            Voir tous les matches →
          </Button>
        </div>
      )}
    </div>
  );
};

export default SenderMatchesList;
