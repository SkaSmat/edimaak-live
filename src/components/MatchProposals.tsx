import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Calendar, Check, X, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
      phone: string | null;
    };
  };
  shipment_requests: {
    id: string;
    item_type: string;
  };
}

interface MatchProposalsProps {
  userId: string;
}

const MatchProposals = ({ userId }: MatchProposalsProps) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, [userId]);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          trips:trip_id(id, from_city, to_city, departure_date, traveler_id, profiles:traveler_id(full_name, phone)),
          shipment_requests:shipment_request_id(id, item_type, sender_id)
        `)
        .eq("shipment_requests.sender_id", userId)
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

  const handleUpdateStatus = async (matchId: string, status: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("matches")
        .update({ status })
        .eq("id", matchId);

      if (error) throw error;
      
      if (status === "accepted") {
        toast.success("Proposition acceptée ! Vous pouvez maintenant discuter.");
        // Redirect to messages page with the match pre-selected
        navigate(`/messages?matchId=${matchId}`);
      } else {
        toast.success("Proposition rejetée");
        fetchMatches();
      }
    } catch (error) {
      console.error("Error updating match:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleOpenChat = (matchId: string) => {
    navigate(`/messages?matchId=${matchId}`);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune proposition pour le moment
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match: any) => (
        <div
          key={match.id}
          className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold">
                  {match.trips.from_city} → {match.trips.to_city}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Par {match.trips.profiles.full_name}
                </p>
              </div>
            </div>
            <Badge
              variant={
                match.status === "pending"
                  ? "default"
                  : match.status === "accepted"
                  ? "default"
                  : "secondary"
              }
            >
              {match.status === "pending"
                ? "En attente"
                : match.status === "accepted"
                ? "Accepté"
                : match.status === "rejected"
                ? "Refusé"
                : "Complété"}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="w-4 h-4" />
            <span>
              Départ: {format(new Date(match.trips.departure_date), "d MMMM yyyy", { locale: fr })}
            </span>
          </div>

          {match.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleUpdateStatus(match.id, "accepted")}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Accepter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateStatus(match.id, "rejected")}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Refuser
              </Button>
            </div>
          )}

          {(match.status === "accepted" || match.status === "completed") && (
            <Button
              size="sm"
              onClick={() => handleOpenChat(match.id)}
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Discuter
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MatchProposals;
