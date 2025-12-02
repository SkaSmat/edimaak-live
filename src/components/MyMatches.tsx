import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Calendar, MessageSquare, Package } from "lucide-react";
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

  useEffect(() => {
    fetchMatches();
  }, [userId]);

  const fetchMatches = async () => {
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

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun match accepté pour le moment
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
              <Package className="w-5 h-5 text-accent" />
              <div>
                <h3 className="font-semibold">
                  {match.shipment_requests.from_city} → {match.shipment_requests.to_city}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Avec {match.shipment_requests.profiles.full_name}
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
              Départ: {format(new Date(match.trips.departure_date), "d MMMM yyyy", { locale: fr })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm mb-4">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">
              Votre voyage: {match.trips.from_city} → {match.trips.to_city}
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
  );
};

export default MyMatches;
