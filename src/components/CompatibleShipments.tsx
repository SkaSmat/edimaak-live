import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getFlexibleMatchInfo, getCountryOnlyMatchInfo, FlexibleMatchInfo, MatchType, MATCH_TOLERANCE_DAYS, areCitiesInSameRegion } from "@/lib/regionMapping";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MapPin,
  Calendar,
  Weight,
  Package,
  Search,
  Plane,
  Clock,
  PlusCircle,
  CheckCircle,
  XCircle,
  Star,
  ChevronDown,
  Globe,
  Bell,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PublicProfileModal } from "@/components/PublicProfileModal";
import FlexibleMatchBadge from "@/components/FlexibleMatchBadge";
import DirectMessageButton from "@/components/DirectMessageButton";

interface ShipmentRequest {
  id: string;
  sender_id: string;
  from_country: string;
  from_city: string;
  to_country: string;
  to_city: string;
  earliest_date: string;
  latest_date: string;
  weight_kg: number;
  item_type: string;
  notes: string | null;
  sender_display_name?: string;
  sender_avatar_url?: string;
  sender_rating?: number | null;
  sender_reviews_count?: number;
}

interface CompatibleMatch {
  shipment: ShipmentRequest;
  matchingTrip: {
    id: string;
    departure_date: string;
    max_weight_kg: number;
    to_city: string;
    to_country: string;
  };
  flexibleMatchInfo: FlexibleMatchInfo;
}

interface CompatibleShipmentsProps {
  userId: string;
}

const ITEMS_PER_PAGE = 6;

const CompatibleShipments = ({ userId }: CompatibleShipmentsProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [matches, setMatches] = useState<CompatibleMatch[]>([]);
  const [suggestions, setSuggestions] = useState<CompatibleMatch[]>([]);
  const [targetShipment, setTargetShipment] = useState<ShipmentRequest | null>(null);
  const [matchStatuses, setMatchStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasTrips, setHasTrips] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [visibleSuggestions, setVisibleSuggestions] = useState(3);
  const [totalShipmentsCount, setTotalShipmentsCount] = useState(0);
  const [creatingAlert, setCreatingAlert] = useState(false);

  // URL fallback
  useEffect(() => {
    if (!highlightId) {
      const storedId = localStorage.getItem("targetShipmentId");
      if (storedId) {
        localStorage.removeItem("targetShipmentId");
        navigate(`/dashboard/traveler?highlight=${storedId}`, { replace: true });
      }
    }
  }, [highlightId, navigate]);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchCompatibleShipments(), fetchMatchStatuses()]);
    setLoading(false);
  };

  const handleCreateAlert = async (fromCountry: string, fromCity: string, toCountry: string, toCity: string) => {
    setCreatingAlert(true);
    try {
      const { error } = await supabase.from("shipment_alerts").insert({
        user_id: userId,
        from_city: fromCity,
        from_country: fromCountry,
        to_city: toCity,
        to_country: toCountry,
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

  const fetchMatchStatuses = async () => {
    try {
      const { data: userTrips } = await supabase.from("trips").select("id").eq("traveler_id", userId);
      if (!userTrips || userTrips.length === 0) return;

      const userTripIds = userTrips.map((trip) => trip.id);

      const { data: matchesData } = await supabase
        .from("matches")
        .select("shipment_request_id, status")
        .in("trip_id", userTripIds);

      if (matchesData) {
        const statuses: Record<string, string> = {};
        matchesData.forEach((match) => {
          statuses[match.shipment_request_id] = match.status;
        });
        setMatchStatuses(statuses);
      }
    } catch (error) {
      console.error("Error fetching match statuses:", error);
    }
  };

  const fetchCompatibleShipments = async () => {
    setError(false);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Fetch traveler's active trips
      const { data: trips } = await supabase
        .from("trips")
        .select("*")
        .eq("traveler_id", userId)
        .eq("status", "open")
        .gte("departure_date", today);

      setHasTrips(trips && trips.length > 0);

      // Fetch open shipments (exclude own, not expired)
      const { data: shipments, error } = await supabase
        .from("shipment_requests")
        .select("*")
        .eq("status", "open")
        .neq("sender_id", userId)
        .gte("latest_date", today);

      if (error) throw error;

      setTotalShipmentsCount((shipments || []).length);

      // Fetch sender info
      const senderIds = [...new Set((shipments || []).map((s: any) => s.sender_id))];
      const senderInfos: Record<
        string,
        { display_name: string; avatar_url: string | null; rating: number | null; reviews_count: number }
      > = {};

      await Promise.all(
        senderIds.map(async (senderId) => {
          const [senderResult, ratingResult] = await Promise.all([
            supabase.rpc("get_sender_display_info", { sender_uuid: senderId }),
            supabase.rpc("get_user_rating", { user_id: senderId }),
          ]);

          if (senderResult.data && senderResult.data.length > 0) {
            senderInfos[senderId] = {
              display_name: senderResult.data[0].display_name,
              avatar_url: senderResult.data[0].avatar_url,
              rating: ratingResult.data?.[0]?.average_rating || null,
              reviews_count: ratingResult.data?.[0]?.reviews_count || 0,
            };
          }
        }),
      );

      const foundMatches: CompatibleMatch[] = [];
      const foundSuggestions: CompatibleMatch[] = [];
      const matchedShipmentIds = new Set<string>();
      const normalize = (text: string) => (text ? text.toLowerCase().trim() : "");

      // Pass 1: Standard matching (exact + flexible)
      (shipments || []).forEach((shipment: any) => {
        if (!trips) return;

        let bestMatch: { trip: any; matchInfo: FlexibleMatchInfo } | null = null;

        for (const trip of trips) {
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
              bestMatch = { trip, matchInfo };
            }
          }
        }

        if (bestMatch) {
          matchedShipmentIds.add(shipment.id);
          const senderInfo = senderInfos[shipment.sender_id];
          foundMatches.push({
            shipment: {
              ...shipment,
              sender_display_name: senderInfo?.display_name || "Anonyme",
              sender_avatar_url: senderInfo?.avatar_url || null,
              sender_rating: senderInfo?.rating || null,
              sender_reviews_count: senderInfo?.reviews_count || 0,
            } as ShipmentRequest,
            matchingTrip: {
              id: bestMatch.trip.id,
              departure_date: bestMatch.trip.departure_date,
              max_weight_kg: bestMatch.trip.max_weight_kg,
              to_city: bestMatch.trip.to_city,
              to_country: bestMatch.trip.to_country,
            },
            flexibleMatchInfo: bestMatch.matchInfo,
          });
        }
      });

      // Pass 2: Country-only suggestions for unmatched shipments
      (shipments || []).forEach((shipment: any) => {
        if (matchedShipmentIds.has(shipment.id)) return;
        if (!trips || trips.length === 0) return;

        let bestSuggestion: { trip: any; matchInfo: FlexibleMatchInfo } | null = null;

        for (const trip of trips) {
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
              bestSuggestion = { trip, matchInfo };
            }
          }
        }

        if (bestSuggestion) {
          const senderInfo = senderInfos[shipment.sender_id];
          foundSuggestions.push({
            shipment: {
              ...shipment,
              sender_display_name: senderInfo?.display_name || "Anonyme",
              sender_avatar_url: senderInfo?.avatar_url || null,
              sender_rating: senderInfo?.rating || null,
              sender_reviews_count: senderInfo?.reviews_count || 0,
            } as ShipmentRequest,
            matchingTrip: {
              id: bestSuggestion.trip.id,
              departure_date: bestSuggestion.trip.departure_date,
              max_weight_kg: bestSuggestion.trip.max_weight_kg,
              to_city: bestSuggestion.trip.to_city,
              to_country: bestSuggestion.trip.to_country,
            },
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
      console.error("Error fetching compatible shipments:", error);
      setError(true);
    }
  };

  const handlePropose = async (shipmentId: string, tripId: string) => {
    if (matchStatuses[shipmentId]) return;

    try {
      const { error } = await supabase.from("matches").insert({
        trip_id: tripId,
        shipment_request_id: shipmentId,
        status: "pending",
      });

      if (error) {
        if (error.message.includes("duplicate") || error.code === "23505") {
          toast.error("Deja propose");
          setMatchStatuses((prev) => ({ ...prev, [shipmentId]: "pending" }));
        } else throw error;
        return;
      }

      toast.success("Proposition envoyee !");
      setMatchStatuses((prev) => ({ ...prev, [shipmentId]: "pending" }));
    } catch (error) {
      toast.error("Erreur lors de l'envoi.");
    }
  };

  // Load target shipment from URL
  useEffect(() => {
    const fetchTargetShipment = async () => {
      if (!highlightId) return;
      try {
        const { data, error } = await supabase
          .from("shipment_requests")
          .select("*")
          .eq("id", highlightId)
          .maybeSingle();

        if (!error && data) {
          const { data: senderInfo } = await supabase.rpc("get_sender_display_info", { sender_uuid: data.sender_id });
          setTargetShipment({
            ...data,
            sender_display_name: senderInfo?.[0]?.display_name || "Anonyme",
            sender_avatar_url: senderInfo?.[0]?.avatar_url || null,
          } as ShipmentRequest);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTargetShipment();
  }, [highlightId]);

  // Auto-scroll to highlighted shipment
  useEffect(() => {
    if (highlightId && !loading) {
      const element = document.getElementById(`shipment-${highlightId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-4", "ring-primary", "ring-offset-2");
          setTimeout(() => element.classList.remove("ring-4", "ring-primary", "ring-offset-2"), 3000);
        }, 500);
      }
    }
  }, [highlightId, matches, targetShipment, loading]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Chargement des opportunites...</div>;
  if (error) return <ErrorState onRetry={fetchData} />;

  const isTargetAlreadyInMatches = matches.some((m) => m.shipment.id === highlightId);

  const getButtonContent = (status: string | undefined, date: string) => {
    switch (status) {
      case "accepted":
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Demande acceptee !
          </>
        );
      case "rejected":
        return (
          <>
            <XCircle className="w-4 h-4 mr-2" />
            Demande refusee
          </>
        );
      case "pending":
        return (
          <>
            <Clock className="w-4 h-4 mr-2 animate-pulse" />
            En attente de reponse...
          </>
        );
      default:
        return `Proposer mon voyage (${format(new Date(date), "d/MM")})`;
    }
  };

  const getButtonStyle = (status: string | undefined) => {
    switch (status) {
      case "accepted":
        return "bg-green-600 hover:bg-green-700 text-white border-green-600 opacity-100 cursor-default";
      case "rejected":
        return "bg-red-100 hover:bg-red-200 text-red-700 border-red-200 opacity-90 cursor-default";
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600 opacity-90 cursor-default";
      default:
        return "bg-primary hover:bg-primary/90 text-primary-foreground";
    }
  };

  const isFlexibleMatch = (matchInfo: FlexibleMatchInfo) => matchInfo.matchType !== "exact";

  const hasResults = matches.length > 0 || suggestions.length > 0;

  const renderShipmentCard = (shipment: ShipmentRequest, matchingTrip: CompatibleMatch["matchingTrip"], flexibleMatchInfo: FlexibleMatchInfo, isSuggestion = false) => {
    const currentStatus = matchStatuses[shipment.id];
    const showContactButton = (isFlexibleMatch(flexibleMatchInfo) || isSuggestion) && !currentStatus;

    return (
      <div
        key={`${shipment.id}-${isSuggestion ? 's' : 'm'}`}
        id={`shipment-${shipment.id}`}
        className={`p-3 sm:p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-500 relative overflow-hidden ${
          isSuggestion ? "border-gray-200 opacity-90" : isFlexibleMatch(flexibleMatchInfo) ? "border-amber-200" : ""
        }`}
      >
        {/* Match badge */}
        <div className="mb-3">
          <FlexibleMatchBadge
            matchInfo={flexibleMatchInfo}
            tripDate={format(new Date(matchingTrip.departure_date), "d MMM", { locale: fr })}
            shipmentDateRange={`${format(new Date(shipment.earliest_date), "d MMM")} - ${format(new Date(shipment.latest_date), "d MMM")}`}
          />
        </div>

        {/* Sender info */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProfileId(shipment.sender_id);
              }}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <UserAvatar
                fullName={shipment.sender_display_name || "Anonyme"}
                avatarUrl={shipment.sender_avatar_url || null}
                size="sm"
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
            </button>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate">
                {shipment.from_city} → {shipment.to_city}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProfileId(shipment.sender_id);
                }}
                className="text-xs sm:text-sm text-muted-foreground truncate hover:text-primary hover:underline transition-colors flex items-center gap-1"
              >
                {shipment.sender_display_name || "Anonyme"}
                {shipment.sender_rating && shipment.sender_rating > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-500 font-medium">
                    <Star className="w-3 h-3 fill-current" />
                    {shipment.sender_rating}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Shipment details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm bg-muted/30 p-2 sm:p-3 rounded-md mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              {format(new Date(shipment.earliest_date), "d MMM")} -{" "}
              {format(new Date(shipment.latest_date), "d MMM")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Weight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            <span className={shipment.weight_kg > matchingTrip.max_weight_kg && matchingTrip.max_weight_kg > 0 ? "text-red-500" : ""}>
              {shipment.weight_kg} kg {matchingTrip.max_weight_kg > 0 ? `(Dispo: ${matchingTrip.max_weight_kg}kg)` : ""}
            </span>
          </div>
        </div>

        {shipment.notes && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 italic line-clamp-2">
            {shipment.notes}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {!isSuggestion && (
            <Button
              className={`flex-1 transition-all duration-300 text-xs sm:text-sm h-8 sm:h-9 ${getButtonStyle(currentStatus)}`}
              onClick={() => handlePropose(shipment.id, matchingTrip.id)}
              disabled={!!currentStatus}
              size="sm"
            >
              {getButtonContent(currentStatus, matchingTrip.departure_date)}
            </Button>
          )}

          {/* Contact button for flexible/suggestion matches */}
          {(showContactButton || isSuggestion) && (
            <DirectMessageButton
              currentUserId={userId}
              targetUserId={shipment.sender_id}
              shipmentRequestId={shipment.id}
              tripId={matchingTrip.id}
              targetUserName={shipment.sender_display_name || "l'expediteur"}
              shipmentRoute={`${shipment.from_city} → ${shipment.to_city}`}
              tripDate={format(new Date(matchingTrip.departure_date), "d MMMM", { locale: fr })}
              tripCity={matchingTrip.to_city}
              className={isSuggestion ? "flex-1" : "sm:w-auto"}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Target shipment section */}
      {targetShipment && !isTargetAlreadyInMatches && (
        <div
          id={`shipment-${targetShipment.id}`}
          className="bg-blue-50/50 border-2 border-blue-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold">
            <Search className="w-4 h-4" />
            Annonce selectionnee
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-lg border border-blue-100">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {targetShipment.from_city} <span className="text-muted-foreground">→</span> {targetShipment.to_city}
              </h3>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {format(new Date(targetShipment.earliest_date), "dd/MM")} -{" "}
                  {format(new Date(targetShipment.latest_date), "dd/MM")}
                </span>
                <span className="flex items-center gap-1">
                  <Weight className="w-3 h-3" /> {targetShipment.weight_kg}kg
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <Button
                onClick={() => navigate("/dashboard/traveler/trips")}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Creer un voyage compatible
              </Button>
            </div>
          </div>
          <div className="text-xs text-blue-600/80 mt-2 text-center bg-blue-100/50 p-2 rounded">
            <strong>Pourquoi cette annonce n'est pas compatible ?</strong>
            <br />
            Verifiez vos dates et votre poids disponible.
          </div>
        </div>
      )}

      {/* Main list */}
      {!hasTrips && !targetShipment ? (
        <EmptyState
          icon={Plane}
          title="Aucun voyage actif"
          description="Publiez d'abord un voyage pour voir les colis que vous pourriez transporter."
          actionLabel="Publier un voyage"
          onAction={() => navigate("/dashboard/traveler/trips?new=true")}
        />
      ) : !hasResults && !targetShipment ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Aucune demande compatible pour le moment</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-2">
            Le matching flexible (±{MATCH_TOLERANCE_DAYS} jours, villes proches) est actif.
            {totalShipmentsCount > 0
              ? ` ${totalShipmentsCount} demande${totalShipmentsCount > 1 ? "s" : ""} active${totalShipmentsCount > 1 ? "s" : ""} sur la plateforme.`
              : ""}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCreateAlert("", "", "", "")}
              disabled={creatingAlert}
              className="gap-2"
            >
              <Bell className="w-4 h-4" />
              Creer une alerte email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/traveler/trips")}
            >
              Modifier mes voyages
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Primary matches */}
          {matches.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              {matches.slice(0, visibleCount).map(({ shipment, matchingTrip, flexibleMatchInfo }) =>
                renderShipmentCard(shipment, matchingTrip, flexibleMatchInfo)
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
                  {matches.length > 0 ? "Autres demandes sur le meme pays" : "Demandes vers le meme pays"}
                  <span className="ml-1 text-xs">({suggestions.length})</span>
                </h3>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Ces demandes ne correspondent pas exactement a votre trajet mais pourraient vous interesser.
              </p>
              {suggestions.slice(0, visibleSuggestions).map(({ shipment, matchingTrip, flexibleMatchInfo }) =>
                renderShipmentCard(shipment, matchingTrip, flexibleMatchInfo, true)
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

export default CompatibleShipments;
