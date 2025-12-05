import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Calendar, MessageSquare, Package, Handshake } from "lucide-react";
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
  };
  shipment_requests: {
    id: string;
    item_type: string;
    from_city: string;
    to_city: string;
    sender_id: string;
    profiles: {
      full_name: string;
    };
  };
}

interface MyMatchesProps {
  userId: string;
}

const MyMatches = ({ userId }: MyMatchesProps) => {
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
        .select(`
          *,
          trips:trip_id(id, from_city, to_city, departure_date, traveler_id),
          shipment_requests:shipment_request_id(id, item_type, from_city, to_city, sender_id, profiles:sender_id(full_name))
        `)
        .eq("trips.traveler_id", userId)
        .in("status", ["accepted", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMatches(data as any || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setError(true);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
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

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={Handshake}
        title="Aucun match accepté"
        description="Tu n'as pas encore de match accepté. Explore les demandes compatibles et propose tes voyages."
      />
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {matches.map((match: any) => (
        <div
          key={match.id}
          className="p-3 sm:p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">
                  {match.shipment_requests.from_city} → {match.shipment_requests.to_city}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Avec {match.shipment_requests.profiles.full_name}
                </p>
              </div>
            </div>
            <Badge variant="default" className="text-xs self-end sm:self-auto">
              {match.status === "accepted" ? "Actif" : "Complété"}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">
              Départ: {format(new Date(match.trips.departure_date), "d MMM yyyy", { locale: fr })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm mb-3 sm:mb-4">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground truncate">
              Votre voyage: {match.trips.from_city} → {match.trips.to_city}
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => handleOpenChat(match.id)}
            className="w-full text-xs sm:text-sm h-8 sm:h-9"
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Discuter
          </Button>
        </div>
      ))}
    </div>
  );
};

export default MyMatches;
