import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getFlexibleMatchInfo, FlexibleMatchInfo, MatchType, areCitiesInSameRegion } from "@/lib/regionMapping";
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

const CompatibleShipments = ({ userId }: CompatibleShipmentsProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [matches, setMatches] = useState<CompatibleMatch[]>([]);
  const [targetShipment, setTargetShipment] = useState<ShipmentRequest | null>(null);
  const [matchStatuses, setMatchStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasTrips, setHasTrips] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

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
      const normalize = (text: string) => (text ? text.toLowerCase().trim() : "");

      (shipments || []).forEach((shipment: any) => {
        if (!trips) return;

        // Try to find the best matching trip (exact first, then flexible)
        let bestMatch: { trip: any; matchInfo: FlexibleMatchInfo } | null = null;

        for (const trip of trips) {
          // Check country match (origin and destination)
          const isSameFromCountry = normalize(trip.from_country) === normalize(shipment.from_country);
          const isSameToCountry = normalize(trip.to_country) === normalize(shipment.to_country);

          if (!isSameFromCountry || !isSameToCountry) continue;

          // Check origin city (with stopover and regional matching)
          const tripFromCity = normalize(trip.from_city);
          const tripStopover1 = normalize(trip.stopover_city_1 || "");
          const tripStopover2 = normalize(trip.stopover_city_2 || "");
          const shipFromCity = normalize(shipment.from_city);

          const matchesOrigin = tripFromCity.includes(shipFromCity) || shipFromCity.includes(tripFromCity);
          const matchesStopover1 = tripStopover1 && (tripStopover1.includes(shipFromCity) || shipFromCity.includes(tripStopover1));
          const matchesStopover2 = tripStopover2 && (tripStopover2.includes(shipFromCity) || shipFromCity.includes(tripStopover2));

          const isSameFromCity = matchesOrigin || matchesStopover1 || matchesStopover2;

          // If not exact match, check if same region (including stopovers)
          const isSameFromRegion =
            !isSameFromCity &&
            (areCitiesInSameRegion(trip.from_city, trip.from_country, shipment.from_city, shipment.from_country) ||
              (trip.stopover_city_1 && areCitiesInSameRegion(trip.stopover_city_1, trip.from_country, shipment.from_city, shipment.from_country)) ||
              (trip.stopover_city_2 && areCitiesInSameRegion(trip.stopover_city_2, trip.from_country, shipment.from_city, shipment.from_country)));

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
            shipment.to_country,
          );

          if (matchInfo) {
            // Prioritize exact matches
            if (!bestMatch || (matchInfo.matchType === "exact" && bestMatch.matchInfo.matchType !== "exact")) {
              bestMatch = { trip, matchInfo };
            }
          }
        }

        if (bestMatch) {
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

      // Sort: exact matches first, then by date difference
      foundMatches.sort((a, b) => {
        if (a.flexibleMatchInfo.matchType === "exact" && b.flexibleMatchInfo.matchType !== "exact") return -1;
        if (a.flexibleMatchInfo.matchType !== "exact" && b.flexibleMatchInfo.matchType === "exact") return 1;
        return a.flexibleMatchInfo.dateDifference - b.flexibleMatchInfo.dateDifference;
      });

      setMatches(foundMatches);
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
          toast.error("Déjà proposé");
          setMatchStatuses((prev) => ({ ...prev, [shipmentId]: "pending" }));
        } else throw error;
        return;
      }

      toast.success("Proposition envoyée !");
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

  if (loading) return <div className="text-center py-8 text-muted-foreground">Chargement des opportunités...</div>;
  if (error) return <ErrorState onRetry={fetchData} />;

  const isTargetAlreadyInMatches = matches.some((m) => m.shipment.id === highlightId);

  const getButtonContent = (status: string | undefined, date: string) => {
    switch (status) {
      case "accepted":
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Demande acceptée !
          </>
        );
      case "rejected":
        return (
          <>
            <XCircle className="w-4 h-4 mr-2" />
            Demande refusée
          </>
        );
      case "pending":
        return (
          <>
            <Clock className="w-4 h-4 mr-2 animate-pulse" />
            En attente de réponse...
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
            Annonce sélectionnée
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
                Créer un voyage compatible
              </Button>
            </div>
          </div>
          <div className="text-xs text-blue-600/80 mt-2 text-center bg-blue-100/50 p-2 rounded">
            <strong>Pourquoi cette annonce n'est pas compatible ?</strong>
            <br />
            Vérifiez vos dates et votre poids disponible.
          </div>
        </div>
      )}

      {/* Main list */}
      {!hasTrips && !targetShipment ? (
        <EmptyState
          icon={Plane}
          title="Aucun voyage actif"
          description="Publiez d'abord un voyage pour voir les colis que vous pourriez transporter."
        />
      ) : matches.length === 0 && !targetShipment ? (
        <EmptyState
          icon={Search}
          title="Aucune demande compatible"
          description="Aucun colis ne correspond à vos destinations ou dates. Le matching flexible (±5 jours, villes proches) est activé."
        />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {matches.map(({ shipment, matchingTrip, flexibleMatchInfo }) => {
            const currentStatus = matchStatuses[shipment.id];
            const showContactButton = isFlexibleMatch(flexibleMatchInfo) && !currentStatus;

            return (
              <div
                key={shipment.id}
                id={`shipment-${shipment.id}`}
                className={`p-3 sm:p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-500 relative overflow-hidden ${
                  isFlexibleMatch(flexibleMatchInfo) ? "border-amber-200" : ""
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
                    <span className={shipment.weight_kg > matchingTrip.max_weight_kg ? "text-red-500" : ""}>
                      {shipment.weight_kg} kg (Dispo: {matchingTrip.max_weight_kg}kg)
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
                  <Button
                    className={`flex-1 transition-all duration-300 text-xs sm:text-sm h-8 sm:h-9 ${getButtonStyle(currentStatus)}`}
                    onClick={() => handlePropose(shipment.id, matchingTrip.id)}
                    disabled={!!currentStatus}
                    size="sm"
                  >
                    {getButtonContent(currentStatus, matchingTrip.departure_date)}
                  </Button>

                  {/* Contact button for flexible matches */}
                  {showContactButton && (
                    <DirectMessageButton
                      currentUserId={userId}
                      targetUserId={shipment.sender_id}
                      shipmentRequestId={shipment.id}
                      tripId={matchingTrip.id}
                      targetUserName={shipment.sender_display_name || "l'expéditeur"}
                      shipmentRoute={`${shipment.from_city} → ${shipment.to_city}`}
                      tripDate={format(new Date(matchingTrip.departure_date), "d MMMM", { locale: fr })}
                      tripCity={matchingTrip.to_city}
                      className="sm:w-auto"
                    />
                  )}
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

export default CompatibleShipments;
