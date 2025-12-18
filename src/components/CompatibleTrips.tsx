import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getFlexibleMatchInfo, areCitiesInSameRegion } from "@/lib/regionMapping";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Calendar,
  Weight,
  Search,
  Plane,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PublicProfileModal } from "@/components/PublicProfileModal";
import { getFlexibleMatchInfo, FlexibleMatchInfo } from "@/lib/regionMapping";
import FlexibleMatchBadge from "@/components/FlexibleMatchBadge";
import DirectMessageButton from "@/components/DirectMessageButton";

interface Trip {
  id: string;
  traveler_id: string;
  from_country: string;
  from_city: string;
  to_country: string;
  to_city: string;
  departure_date: string;
  max_weight_kg: number;
  notes: string | null;
  traveler_display_name?: string;
  traveler_avatar_url?: string;
  traveler_rating?: number | null;
  traveler_reviews_count?: number;
}

interface ShipmentRequest {
  id: string;
  from_country: string;
  from_city: string;
  to_country: string;
  to_city: string;
  earliest_date: string;
  latest_date: string;
  weight_kg: number;
}

interface CompatibleTripMatch {
  trip: Trip;
  matchingShipment: ShipmentRequest;
  flexibleMatchInfo: FlexibleMatchInfo;
}

interface CompatibleTripsProps {
  userId: string;
}

const CompatibleTrips = ({ userId }: CompatibleTripsProps) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<CompatibleTripMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasShipments, setHasShipments] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    fetchCompatibleTrips();
  }, [userId]);

  const fetchCompatibleTrips = async () => {
    setLoading(true);
    setError(false);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch sender's active shipment requests
      const { data: shipments } = await supabase
        .from("shipment_requests")
        .select("*")
        .eq("sender_id", userId)
        .eq("status", "open")
        .gte("latest_date", today);

      setHasShipments(shipments && shipments.length > 0);

      if (!shipments || shipments.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Fetch open trips (exclude own, not expired)
      const { data: trips, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("status", "open")
        .neq("traveler_id", userId)
        .gte("departure_date", today);

      if (tripError) throw tripError;

      // Fetch traveler info
      const travelerIds = [...new Set((trips || []).map((t: any) => t.traveler_id))];
      const travelerInfos: Record<string, { display_name: string; avatar_url: string | null; rating: number | null; reviews_count: number }> = {};
      
      await Promise.all(
        travelerIds.map(async (travelerId) => {
          const [travelerResult, ratingResult] = await Promise.all([
            supabase.rpc("get_sender_display_info", { sender_uuid: travelerId }),
            supabase.rpc("get_user_rating", { user_id: travelerId })
          ]);
          
          if (travelerResult.data && travelerResult.data.length > 0) {
            travelerInfos[travelerId] = {
              display_name: travelerResult.data[0].display_name,
              avatar_url: travelerResult.data[0].avatar_url,
              rating: ratingResult.data?.[0]?.average_rating || null,
              reviews_count: ratingResult.data?.[0]?.reviews_count || 0,
            };
          }
        })
      );

      const foundMatches: CompatibleTripMatch[] = [];
      const normalize = (text: string) => (text ? text.toLowerCase().trim() : "");

      // For each trip, find matching shipments
      (trips || []).forEach((trip: any) => {
        let bestMatch: { shipment: any; matchInfo: FlexibleMatchInfo } | null = null;

        for (const shipment of shipments) {
          // Check country match (origin and destination)
          const isSameFromCountry = normalize(trip.from_country) === normalize(shipment.from_country);
          const isSameToCountry = normalize(trip.to_country) === normalize(shipment.to_country);
          
          if (!isSameFromCountry || !isSameToCountry) continue;

          // Check origin city (with regional matching)
const tripFromCity = normalize(trip.from_city);
const shipFromCity = normalize(shipment.from_city);
const isSameFromCity = tripFromCity.includes(shipFromCity) || shipFromCity.includes(tripFromCity);

// If not exact match, check if same region
const isSameFromRegion = !isSameFromCity && areCitiesInSameRegion(
  trip.from_city,
  trip.from_country, 
  shipment.from_city,
  shipment.from_country
);

if (!isSameFromCity && !isSameFromRegion) continue;

          // Check weight (optional constraint)
          if (trip.max_weight_kg && trip.max_weight_kg > 0 && trip.max_weight_kg < shipment.weight_kg) continue;

          // Get flexible match info for destination and dates
          const matchInfo = getFlexibleMatchInfo(
            trip.departure_date,
            trip.to_city,
            trip.to_country,
            shipment.earliest_date,
            shipment.latest_date,
            shipment.to_city,
            shipment.to_country
          );

          if (matchInfo) {
            // Prioritize exact matches
            if (!bestMatch || (matchInfo.matchType === 'exact' && bestMatch.matchInfo.matchType !== 'exact')) {
              bestMatch = { shipment, matchInfo };
            }
          }
        }

        if (bestMatch) {
          const travelerInfo = travelerInfos[trip.traveler_id];
          foundMatches.push({
            trip: {
              ...trip,
              traveler_display_name: travelerInfo?.display_name || "Anonyme",
              traveler_avatar_url: travelerInfo?.avatar_url || null,
              traveler_rating: travelerInfo?.rating || null,
              traveler_reviews_count: travelerInfo?.reviews_count || 0,
            } as Trip,
            matchingShipment: bestMatch.shipment,
            flexibleMatchInfo: bestMatch.matchInfo,
          });
        }
      });

      // Sort: exact matches first, then by date difference
      foundMatches.sort((a, b) => {
        if (a.flexibleMatchInfo.matchType === 'exact' && b.flexibleMatchInfo.matchType !== 'exact') return -1;
        if (a.flexibleMatchInfo.matchType !== 'exact' && b.flexibleMatchInfo.matchType === 'exact') return 1;
        return a.flexibleMatchInfo.dateDifference - b.flexibleMatchInfo.dateDifference;
      });

      setMatches(foundMatches);
    } catch (error) {
      console.error("Error fetching compatible trips:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const isFlexibleMatch = (matchInfo: FlexibleMatchInfo) => matchInfo.matchType !== 'exact';

  if (loading) return <div className="text-center py-8 text-muted-foreground">Chargement des voyages compatibles...</div>;
  if (error) return <ErrorState onRetry={fetchCompatibleTrips} />;

  return (
    <div className="space-y-6">
      {!hasShipments ? (
        <EmptyState
          icon={Plane}
          title="Aucune demande active"
          description="Publiez d'abord une demande d'expédition pour voir les voyageurs disponibles."
        />
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun voyageur compatible"
          description="Aucun voyageur ne correspond à vos trajets ou dates. Le matching flexible (±5 jours, villes proches) est activé."
        />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {matches.map(({ trip, matchingShipment, flexibleMatchInfo }) => {
            const showContactButton = isFlexibleMatch(flexibleMatchInfo);

            return (
              <div
                key={trip.id}
                className={`p-3 sm:p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-500 ${
                  isFlexibleMatch(flexibleMatchInfo) ? 'border-amber-200' : ''
                }`}
              >
                {/* Match badge */}
                <div className="mb-3">
                  <FlexibleMatchBadge
                    matchInfo={flexibleMatchInfo}
                    tripDate={format(new Date(trip.departure_date), "d MMM", { locale: fr })}
                    shipmentDateRange={`${format(new Date(matchingShipment.earliest_date), "d MMM")} - ${format(new Date(matchingShipment.latest_date), "d MMM")}`}
                  />
                </div>

                {/* Traveler info */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProfileId(trip.traveler_id);
                      }}
                      className="flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      <UserAvatar
                        fullName={trip.traveler_display_name || "Anonyme"}
                        avatarUrl={trip.traveler_avatar_url || null}
                        size="sm"
                        className="w-8 h-8 sm:w-10 sm:h-10"
                      />
                    </button>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">
                        {trip.from_city} → {trip.to_city}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProfileId(trip.traveler_id);
                        }}
                        className="text-xs sm:text-sm text-muted-foreground truncate hover:text-primary hover:underline transition-colors flex items-center gap-1"
                      >
                        {trip.traveler_display_name || "Anonyme"}
                        {trip.traveler_rating && trip.traveler_rating > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-500 font-medium">
                            <Star className="w-3 h-3 fill-current" />
                            {trip.traveler_rating}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trip details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm bg-muted/30 p-2 sm:p-3 rounded-md mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      Départ : {format(new Date(trip.departure_date), "d MMMM", { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Weight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    <span>
                      Capacité : {trip.max_weight_kg} kg
                    </span>
                  </div>
                </div>

                {trip.notes && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 italic line-clamp-2">{trip.notes}</p>
                )}

                {/* Reference shipment */}
                <div className="text-xs text-muted-foreground bg-primary/5 p-2 rounded mb-3">
                  <span className="font-medium">Pour votre colis :</span> {matchingShipment.from_city} → {matchingShipment.to_city}
                </div>

                {/* Action button */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <DirectMessageButton
                    currentUserId={userId}
                    targetUserId={trip.traveler_id}
                    shipmentRequestId={matchingShipment.id}
                    tripId={trip.id}
                    targetUserName={trip.traveler_display_name || "le voyageur"}
                    shipmentRoute={`${matchingShipment.from_city} → ${matchingShipment.to_city}`}
                    tripDate={format(new Date(trip.departure_date), "d MMMM", { locale: fr })}
                    tripCity={trip.to_city}
                    className="flex-1"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Public profile modal */}
      <PublicProfileModal
        isOpen={!!selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
        userId={selectedProfileId || ""}
      />
    </div>
  );
};

export default CompatibleTrips;
