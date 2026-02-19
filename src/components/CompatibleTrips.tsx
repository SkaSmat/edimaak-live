import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getFlexibleMatchInfo, getCountryOnlyMatchInfo, FlexibleMatchInfo, MATCH_TOLERANCE_DAYS, areCitiesInSameRegion } from "@/lib/regionMapping";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, Weight, Search, Plane, Star, Bell, ChevronDown, Globe } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PublicProfileModal } from "@/components/PublicProfileModal";
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
  stopover_city_1: string | null;
  stopover_city_2: string | null;
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

const ITEMS_PER_PAGE = 6;

const CompatibleTrips = ({ userId }: CompatibleTripsProps) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<CompatibleTripMatch[]>([]);
  const [suggestions, setSuggestions] = useState<CompatibleTripMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasShipments, setHasShipments] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [visibleSuggestions, setVisibleSuggestions] = useState(3);
  const [totalTripsCount, setTotalTripsCount] = useState(0);
  const [creatingAlert, setCreatingAlert] = useState(false);

  useEffect(() => {
    fetchCompatibleTrips();
  }, [userId]);

  const handleCreateAlert = async (shipment: ShipmentRequest) => {
    setCreatingAlert(true);
    try {
      const { error } = await supabase.from("shipment_alerts").insert({
        user_id: userId,
        from_city: shipment.from_city,
        from_country: shipment.from_country,
        to_city: shipment.to_city,
        to_country: shipment.to_country,
      });
      if (error) {
        if (error.code === "23505") {
          toast.info("Vous avez deja une alerte pour ce trajet.");
        } else throw error;
      } else {
        toast.success("Alerte creee ! Vous serez notifie(e) par email.");
      }
    } catch (err) {
      toast.error("Erreur lors de la creation de l'alerte.");
    } finally {
      setCreatingAlert(false);
    }
  };

  const fetchCompatibleTrips = async () => {
    setLoading(true);
    setError(false);
    try {
      const today = new Date().toISOString().split("T")[0];

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
        setSuggestions([]);
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

      setTotalTripsCount((trips || []).length);

      // Fetch traveler info
      const travelerIds = [...new Set((trips || []).map((t: any) => t.traveler_id))];
      const travelerInfos: Record<
        string,
        { display_name: string; avatar_url: string | null; rating: number | null; reviews_count: number }
      > = {};

      await Promise.all(
        travelerIds.map(async (travelerId) => {
          const [travelerResult, ratingResult] = await Promise.all([
            supabase.rpc("get_sender_display_info", { sender_uuid: travelerId }),
            supabase.rpc("get_user_rating", { user_id: travelerId }),
          ]);

          if (travelerResult.data && travelerResult.data.length > 0) {
            travelerInfos[travelerId] = {
              display_name: travelerResult.data[0].display_name,
              avatar_url: travelerResult.data[0].avatar_url,
              rating: ratingResult.data?.[0]?.average_rating || null,
              reviews_count: ratingResult.data?.[0]?.reviews_count || 0,
            };
          }
        }),
      );

      const foundMatches: CompatibleTripMatch[] = [];
      const foundSuggestions: CompatibleTripMatch[] = [];
      const matchedTripIds = new Set<string>();
      const normalize = (text: string) => (text ? text.toLowerCase().trim() : "");

      // Pass 1: Standard matching (exact + flexible)
      (trips || []).forEach((trip: any) => {
        let bestMatch: { shipment: any; matchInfo: FlexibleMatchInfo } | null = null;

        for (const shipment of shipments) {
          const isSameFromCountry = normalize(trip.from_country) === normalize(shipment.from_country);
          const isSameToCountry = normalize(trip.to_country) === normalize(shipment.to_country);

          if (!isSameFromCountry || !isSameToCountry) continue;

          const tripFromCity = normalize(trip.from_city);
          const tripStopover1 = normalize(trip.stopover_city_1 || "");
          const tripStopover2 = normalize(trip.stopover_city_2 || "");
          const shipFromCity = normalize(shipment.from_city);

          const matchesOrigin = tripFromCity.includes(shipFromCity) || shipFromCity.includes(tripFromCity);
          const matchesStopover1 = tripStopover1 && (tripStopover1.includes(shipFromCity) || shipFromCity.includes(tripStopover1));
          const matchesStopover2 = tripStopover2 && (tripStopover2.includes(shipFromCity) || shipFromCity.includes(tripStopover2));

          const isSameFromCity = matchesOrigin || matchesStopover1 || matchesStopover2;

          const isSameFromRegion =
            !isSameFromCity &&
            (areCitiesInSameRegion(trip.from_city, trip.from_country, shipment.from_city, shipment.from_country) ||
              (trip.stopover_city_1 && areCitiesInSameRegion(trip.stopover_city_1, trip.from_country, shipment.from_city, shipment.from_country)) ||
              (trip.stopover_city_2 && areCitiesInSameRegion(trip.stopover_city_2, trip.from_country, shipment.from_city, shipment.from_country)));

          if (!isSameFromCity && !isSameFromRegion) continue;

          if (trip.max_weight_kg && trip.max_weight_kg > 0 && trip.max_weight_kg < shipment.weight_kg) continue;

          const matchInfo = getFlexibleMatchInfo(
            trip.departure_date,
            trip.to_city,
            trip.to_country,
            shipment.earliest_date,
            shipment.latest_date,
            shipment.to_city,
            shipment.to_country,
          );

          if (matchInfo) {
            if (!bestMatch || matchInfo.score > bestMatch.matchInfo.score) {
              bestMatch = { shipment, matchInfo };
            }
          }
        }

        if (bestMatch) {
          matchedTripIds.add(trip.id);
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

      // Pass 2: Country-only suggestions for unmatched trips
      (trips || []).forEach((trip: any) => {
        if (matchedTripIds.has(trip.id)) return;

        let bestSuggestion: { shipment: any; matchInfo: FlexibleMatchInfo } | null = null;

        for (const shipment of shipments) {
          const isSameFromCountry = normalize(trip.from_country) === normalize(shipment.from_country);
          if (!isSameFromCountry) continue;

          const matchInfo = getCountryOnlyMatchInfo(
            trip.departure_date,
            trip.to_country,
            shipment.earliest_date,
            shipment.latest_date,
            shipment.to_country,
          );

          if (matchInfo) {
            if (!bestSuggestion || matchInfo.score > bestSuggestion.matchInfo.score) {
              bestSuggestion = { shipment, matchInfo };
            }
          }
        }

        if (bestSuggestion) {
          const travelerInfo = travelerInfos[trip.traveler_id];
          foundSuggestions.push({
            trip: {
              ...trip,
              traveler_display_name: travelerInfo?.display_name || "Anonyme",
              traveler_avatar_url: travelerInfo?.avatar_url || null,
              traveler_rating: travelerInfo?.rating || null,
              traveler_reviews_count: travelerInfo?.reviews_count || 0,
            } as Trip,
            matchingShipment: bestSuggestion.shipment,
            flexibleMatchInfo: bestSuggestion.matchInfo,
          });
        }
      });

      // Sort by score (highest first)
      foundMatches.sort((a, b) => b.flexibleMatchInfo.score - a.flexibleMatchInfo.score);
      foundSuggestions.sort((a, b) => b.flexibleMatchInfo.score - a.flexibleMatchInfo.score);

      setMatches(foundMatches);
      setSuggestions(foundSuggestions);
    } catch (error) {
      console.error("Error fetching compatible trips:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const isFlexibleMatch = (matchInfo: FlexibleMatchInfo) => matchInfo.matchType !== "exact";

  const renderTripCard = (trip: Trip, matchingShipment: ShipmentRequest, flexibleMatchInfo: FlexibleMatchInfo, isSuggestion = false) => (
    <div
      key={`${trip.id}-${isSuggestion ? 's' : 'm'}`}
      className={`p-3 sm:p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-500 ${
        isSuggestion ? "border-gray-200 opacity-90" : isFlexibleMatch(flexibleMatchInfo) ? "border-amber-200" : ""
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
            {(trip.stopover_city_1 || trip.stopover_city_2) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <span>via</span>
                {trip.stopover_city_1 && <span className="font-medium">{trip.stopover_city_1}</span>}
                {trip.stopover_city_1 && trip.stopover_city_2 && <span>,</span>}
                {trip.stopover_city_2 && <span className="font-medium">{trip.stopover_city_2}</span>}
              </div>
            )}
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
            Depart : {format(new Date(trip.departure_date), "d MMMM", { locale: fr })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Weight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
          <span>Capacite : {trip.max_weight_kg > 0 ? `${trip.max_weight_kg} kg` : "Non precise"}</span>
        </div>
      </div>

      {trip.notes && (
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 italic line-clamp-2">
          {trip.notes}
        </p>
      )}

      {/* Reference shipment */}
      <div className="text-xs text-muted-foreground bg-primary/5 p-2 rounded mb-3">
        <span className="font-medium">Pour votre colis :</span> {matchingShipment.from_city} →{" "}
        {matchingShipment.to_city}
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

  if (loading)
    return <div className="text-center py-8 text-muted-foreground">Chargement des voyages compatibles...</div>;
  if (error) return <ErrorState onRetry={fetchCompatibleTrips} />;

  const hasResults = matches.length > 0 || suggestions.length > 0;

  return (
    <div className="space-y-6">
      {!hasShipments ? (
        <EmptyState
          icon={Plane}
          title="Aucune demande active"
          description="Publiez d'abord une demande d'expedition pour voir les voyageurs disponibles."
          actionLabel="Creer une demande"
          onAction={() => navigate("/dashboard/sender/shipments?new=true")}
        />
      ) : !hasResults ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun voyageur compatible pour le moment</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-2">
            Le matching flexible (±{MATCH_TOLERANCE_DAYS} jours, villes proches) est actif.
            {totalTripsCount > 0
              ? ` ${totalTripsCount} voyageur${totalTripsCount > 1 ? "s" : ""} actif${totalTripsCount > 1 ? "s" : ""} sur la plateforme.`
              : ""}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const firstShipment = matches[0]?.matchingShipment;
                if (firstShipment) handleCreateAlert(firstShipment);
              }}
              disabled={creatingAlert}
              className="gap-2"
            >
              <Bell className="w-4 h-4" />
              Creer une alerte email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/sender/shipments")}
            >
              Modifier mes demandes
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Primary matches */}
          {matches.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              {matches.slice(0, visibleCount).map(({ trip, matchingShipment, flexibleMatchInfo }) =>
                renderTripCard(trip, matchingShipment, flexibleMatchInfo)
              )}
              {matches.length > visibleCount && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                >
                  <ChevronDown className="w-4 h-4" />
                  Voir plus ({matches.length - visibleCount} restant{matches.length - visibleCount > 1 ? "s" : ""})
                </Button>
              )}
            </div>
          )}

          {/* Suggestions section */}
          {suggestions.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 pt-4 border-t">
                <Globe className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  {matches.length > 0 ? "Autres voyageurs sur le meme pays" : "Voyageurs vers le meme pays"}
                  <span className="ml-1 text-xs">({suggestions.length})</span>
                </h3>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Ces voyageurs ne correspondent pas exactement mais pourraient vous aider. Contactez-les pour en discuter.
              </p>
              {suggestions.slice(0, visibleSuggestions).map(({ trip, matchingShipment, flexibleMatchInfo }) =>
                renderTripCard(trip, matchingShipment, flexibleMatchInfo, true)
              )}
              {suggestions.length > visibleSuggestions && (
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground"
                  onClick={() => setVisibleSuggestions((prev) => prev + 6)}
                >
                  <ChevronDown className="w-4 h-4" />
                  Voir plus de suggestions ({suggestions.length - visibleSuggestions})
                </Button>
              )}
            </div>
          )}
        </>
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
