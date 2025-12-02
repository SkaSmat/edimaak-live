import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

interface Match {
  id: string;
  status: string;
  trips: {
    from_city: string;
    to_city: string;
    traveler_id: string;
    profiles: {
      full_name: string;
    };
  } | null;
  shipment_requests: {
    item_type: string;
    from_city: string;
    to_city: string;
    sender_id: string;
    profiles: {
      full_name: string;
    };
  } | null;
}

interface ConversationListProps {
  userId: string;
  onSelectMatch: (matchId: string) => void;
  selectedMatchId: string | null;
}

const ConversationList = ({ userId, onSelectMatch, selectedMatchId }: ConversationListProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, [userId]);

  const fetchMatches = async () => {
    try {
      // RLS already filters to matches user is involved in
      // We fetch all matches with accepted/completed status
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          trips:trip_id(from_city, to_city, traveler_id, profiles:traveler_id(full_name)),
          shipment_requests:shipment_request_id(item_type, from_city, to_city, sender_id, profiles:sender_id(full_name))
        `)
        .in("status", ["accepted", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Filter client-side to only include matches where user is traveler or sender
      const filteredMatches = (data || []).filter((match: any) => {
        const isTraveler = match.trips?.traveler_id === userId;
        const isSender = match.shipment_requests?.sender_id === userId;
        return isTraveler || isSender;
      });
      
      setMatches(filteredMatches as Match[]);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-sm text-muted-foreground">Chargement...</div>;
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Aucune conversation"
        description="Tu n'as pas encore de conversation active. Accepte un match pour commencer à discuter."
        className="py-8"
      />
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => {
        const isUserTraveler = match.trips?.traveler_id === userId;
        const otherUser = isUserTraveler
          ? match.shipment_requests?.profiles?.full_name
          : match.trips?.profiles?.full_name;
        const route = match.trips
          ? `${match.trips.from_city} → ${match.trips.to_city}`
          : "";
        const itemType = match.shipment_requests?.item_type || "";

        return (
          <button
            key={match.id}
            onClick={() => onSelectMatch(match.id)}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent/50",
              selectedMatchId === match.id ? "bg-accent/50 border-primary" : "bg-card"
            )}
          >
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{otherUser || "Utilisateur"}</p>
                <p className="text-sm text-muted-foreground truncate">{route}</p>
                {itemType && (
                  <p className="text-xs text-muted-foreground/70 truncate">{itemType}</p>
                )}
              </div>
              {match.status === "accepted" && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  Actif
                </Badge>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;