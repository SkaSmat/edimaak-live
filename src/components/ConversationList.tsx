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
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          trips:trip_id(from_city, to_city, traveler_id, profiles:traveler_id(full_name)),
          shipment_requests:shipment_request_id(item_type, from_city, to_city, sender_id, profiles:sender_id(full_name))
        `,
        )
        .in("status", ["accepted", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

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
          ? match.shipment_requests?.profiles?.full_name || "Utilisateur"
          : match.trips?.profiles?.full_name || "Utilisateur";

        const route = match.trips
          ? `${match.trips.from_city} → ${match.trips.to_city}`
          : match.shipment_requests
            ? `${match.shipment_requests.from_city} → ${match.shipment_requests.to_city}`
            : "Trajet inconnu";

        const itemType = match.shipment_requests?.item_type || "";

        // On vérifie si c'est la conversation active
        const isSelected = selectedMatchId === match.id;

        return (
          <button
            key={match.id}
            onClick={() => onSelectMatch(match.id)}
            className={cn(
              "w-full text-left p-3 rounded-xl border transition-all duration-200 relative group",
              // Style conditionnel pour la sélection
              isSelected
                ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20"
                : "bg-card hover:bg-accent/50 border-border",
            )}
          >
            {/* Indicateur visuel (Pastille) si sélectionné */}
            {isSelected && (
              <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
            )}

            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2 rounded-full transition-colors",
                  isSelected
                    ? "bg-background text-primary"
                    : "bg-muted text-muted-foreground group-hover:bg-background",
                )}
              >
                <MessageCircle className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn("font-medium truncate", isSelected ? "text-primary" : "text-foreground")}>
                  {otherUser}
                </p>
                <p className="text-sm text-muted-foreground truncate">{route}</p>
                {itemType && <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{itemType}</p>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;
