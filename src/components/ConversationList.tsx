import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, ChevronRight } from "lucide-react";
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
  const [unreadIds, setUnreadIds] = useState<string[]>([]); // État pour la liste des IDs non lus

  // Fonction pour charger les IDs non lus
  const loadUnreadStatus = () => {
    try {
      const storage = localStorage.getItem("unreadMatches");
      if (storage) {
        setUnreadIds(JSON.parse(storage));
      } else {
        setUnreadIds([]);
      }
    } catch (error) {
      // Corrupted localStorage, reset to empty
      setUnreadIds([]);
    }
  };

  // Écoute des événements de synchronisation
  useEffect(() => {
    loadUnreadStatus();
    // Quand le Layout met à jour le storage (message reçu ou lu), on met à jour la liste
    window.addEventListener("unread-change", loadUnreadStatus);
    return () => window.removeEventListener("unread-change", loadUnreadStatus);
  }, [userId]);

  useEffect(() => {
    fetchMatches();
  }, [userId]);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(
          `*, trips:trip_id(from_city, to_city, traveler_id, profiles:traveler_id(full_name)), shipment_requests:shipment_request_id(item_type, from_city, to_city, sender_id, profiles:sender_id(full_name))`,
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

  if (loading) return <div className="text-center py-4 text-sm text-muted-foreground">Chargement...</div>;

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
    <div className="space-y-1.5 sm:space-y-2 p-2">
      {matches.map((match) => {
        const isUserTraveler = match.trips?.traveler_id === userId;
        const otherUser = isUserTraveler
          ? match.shipment_requests?.profiles?.full_name || "Utilisateur"
          : match.trips?.profiles?.full_name || "Utilisateur";

        const route = match.trips ? `${match.trips.from_city} → ${match.trips.to_city}` : "Trajet inconnu";

        const isSelected = selectedMatchId === match.id;
        const isUnread = unreadIds.includes(match.id);

        return (
          <button
            key={match.id}
            onClick={() => onSelectMatch(match.id)}
            className={cn(
              "w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-200 relative group flex items-center gap-2 sm:gap-3",
              isSelected
                ? "bg-orange-50 border-orange-500 shadow-md ring-1 ring-orange-200"
                : isUnread
                  ? "bg-red-50/70 border-red-200 shadow-sm font-semibold"
                  : "bg-card hover:bg-gray-50 border-transparent hover:border-gray-200 shadow-sm",
            )}
          >
            {isSelected && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 sm:h-8 w-1 bg-orange-500 rounded-r-full" />
            )}

            {isUnread && !isSelected && (
              <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-red-500 animate-pulse border-2 border-red-100" />
            )}

            <div
              className={cn(
                "p-2 sm:p-2.5 rounded-full transition-colors shrink-0",
                isSelected
                  ? "bg-orange-100 text-orange-600"
                  : isUnread
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-500 group-hover:bg-white",
              )}
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-semibold truncate text-sm sm:text-base",
                  isSelected ? "text-orange-900" : isUnread ? "text-red-800" : "text-gray-900",
                )}
              >
                {otherUser}
              </p>
              <p
                className={cn(
                  "text-[11px] sm:text-xs truncate font-medium",
                  isUnread ? "text-red-700 font-bold" : "text-muted-foreground",
                )}
              >
                {route}
              </p>
            </div>

            <ChevronRight
              className={cn(
                "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform flex-shrink-0",
                isSelected ? "text-orange-500" : "text-gray-300 group-hover:text-gray-400 group-hover:translate-x-1",
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;
