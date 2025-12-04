import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, Calendar, Weight, Package, Search, Plane, Clock, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";

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
  profiles: {
    full_name: string;
  } | null;
}

interface CompatibleMatch {
  shipment: ShipmentRequest;
  matchingTrip: {
    id: string;
    departure_date: string;
    max_weight_kg: number;
  };
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
  const [pendingShipmentIds, setPendingShipmentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasTrips, setHasTrips] = useState(false);

  // --- CORRECTIF : RÉCUPÉRATION DE SECOURS ---
  // Si l'URL est vide, on vérifie si un ID traîne dans la mémoire locale
  useEffect(() => {
    if (!highlightId) {
      const storedId = localStorage.getItem("targetShipmentId");
      if (storedId) {
        // On consomme l'ID (on le supprime pour ne pas boucler) et on recharge avec l'URL correcte
        localStorage.removeItem("targetShipmentId");
        navigate(`/dashboard/traveler?highlight=${storedId}`, { replace: true });
      }
    }
  }, [highlightId, navigate]);
  // --------------------------------------------

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchCompatibleShipments(), fetchPendingMatches()]);
    setLoading(false);
  };

  const fetchPendingMatches = async () => {
    try {
      const { data: userTrips } = await supabase.from("trips").select("id").eq("traveler_id", userId);
      if (!userTrips || userTrips.length === 0) return;
      const userTripIds = userTrips.map((trip) => trip.id);
      const { data: pendingMatchesData } = await supabase
        .from("matches")
        .select("shipment_request_id")
        .in("trip_id", userTripIds)
        .eq("status", "pending");
      if (pendingMatchesData) {
        setPendingShipmentIds(pendingMatchesData.map((match) => match.shipment_request_id));
      }
    } catch (error) {
      console.error("Error pending matches:", error);
    }
  };

  const fetchCompatibleShipments = async () => {
    setError(false);
    try {
      const { data: trips } = await supabase.from("trips").select("*").eq("traveler_id", userId).eq("status", "open");

      setHasTrips(trips && trips.length > 0);

      const { data: shipments, error } = await supabase
        .from("shipment_requests")
        .select("*, profiles:sender_id(full_name)")
        .eq("status", "open");

      if (error) throw error;

      const foundMatches: CompatibleMatch[] = [];
      const normalize = (text: string) => (text ? text.toLowerCase().trim() : "");

      (shipments || []).forEach((shipment: any) => {
        if (!trips) return;

        const matchingTrip = trips.find((trip) => {
          // Comparaison Route
          const isSameFromCountry = normalize(trip.from_country) === normalize(shipment.from_country);
          const isSameToCountry = normalize(trip.to_country) === normalize(shipment.to_country);
          const tripFromCity = normalize(trip.from_city);
          const shipFromCity = normalize(shipment.from_city);
          const isSameFromCity = tripFromCity.includes(shipFromCity) || shipFromCity.includes(tripFromCity);
          const tripToCity = normalize(trip.to_city);
          const shipToCity = normalize(shipment.to_city);
          const isSameToCity = tripToCity.includes(shipToCity) || shipToCity.includes(tripToCity);

          if (!(isSameFromCountry && isSameToCountry && isSameFromCity && isSameToCity)) return false;

          // Comparaison Dates (String ISO)
          const tripDate = trip.departure_date;
          const earliest = shipment.earliest_date;
          const latest = shipment.latest_date;
          if (!(tripDate >= earliest && tripDate <= latest)) return false;

          // Comparaison Poids
          if (trip.max_weight_kg < shipment.weight_kg) return false;

          return true;
        });

        if (matchingTrip) {
          foundMatches.push({
            shipment: shipment as ShipmentRequest,
            matchingTrip: {
              id: matchingTrip.id,
              departure_date: matchingTrip.departure_date,
              max_weight_kg: matchingTrip.max_weight_kg,
            },
          });
        }
      });

      setMatches(foundMatches);
    } catch (error) {
      console.error("Error fetching compatible shipments:", error);
      setError(true);
    }
  };

  const handlePropose = async (shipmentId: string, tripId: string) => {
    if (pendingShipmentIds.includes(shipmentId)) {
      toast.error("Proposition déjà envoyée !");
      return;
    }

    try {
      const { error } = await supabase.from("matches").insert({
        trip_id: tripId,
        shipment_request_id: shipmentId,
        status: "pending",
      });

      if (error) {
        if (error.message.includes("duplicate") || error.code === "23505") {
          toast.error("Déjà proposé");
          setPendingShipmentIds((prev) => [...prev, shipmentId]);
        } else throw error;
        return;
      }

      toast.success("Proposition envoyée !");
      setPendingShipmentIds((prev) => [...prev, shipmentId]);
    } catch (error) {
      toast.error("Erreur lors de l'envoi.");
    }
  };

  // Chargement Annonce Ciblée
  useEffect(() => {
    const fetchTargetShipment = async () => {
      if (!highlightId) return;
      try {
        const { data, error } = await supabase
          .from("shipment_requests")
          .select("*, profiles:sender_id(full_name)")
          .eq("id", highlightId)
          .single();
        if (!error && data) setTargetShipment(data as unknown as ShipmentRequest);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTargetShipment();
  }, [highlightId]);

  // Scroll automatique
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
  const shipmentsToDisplay = matches;

  return (
    <div className="space-y-6">
      {/* SECTION ANNONCE CIBLÉE (Si non compatible ou pas de voyage) */}
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
          <p className="text-xs text-blue-600/80 mt-2 text-center">
            Vous n'avez pas encore de voyage compatible avec cette annonce. Créez-en un pour postuler !
          </p>
        </div>
      )}

      {/* LISTE NORMALE */}
      {!hasTrips && !targetShipment ? (
        <EmptyState
          icon={Plane}
          title="Aucun voyage actif"
          description="Publiez d'abord un voyage pour voir les colis que vous pourriez transporter."
        />
      ) : shipmentsToDisplay.length === 0 && !targetShipment ? (
        <EmptyState
          icon={Search}
          title="Aucune demande compatible"
          description="Aucun colis ne correspond exactement à tes dates, destinations ou capacité de poids actuelle."
        />
      ) : (
        <div className="space-y-4">
          {shipmentsToDisplay.map(({ shipment, matchingTrip }) => {
            const isPending = pendingShipmentIds.includes(shipment.id);

            return (
              <div
                key={shipment.id}
                id={`shipment-${shipment.id}`}
                className={`p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-500 relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 bg-green-500/10 text-green-600 text-xs px-2 py-1 rounded-bl-lg font-medium">
                  Compatible avec votre voyage du {format(new Date(matchingTrip.departure_date), "d MMM")}
                </div>

                <div className="flex items-start justify-between mb-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">
                        {shipment.from_city} → {shipment.to_city}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Expéditeur : {shipment.profiles?.full_name || "Anonyme"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm bg-muted/30 p-3 rounded-md mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      Livraison : {format(new Date(shipment.earliest_date), "d MMM")} -{" "}
                      {format(new Date(shipment.latest_date), "d MMM")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-muted-foreground" />
                    <span className={shipment.weight_kg > matchingTrip.max_weight_kg ? "text-red-500" : ""}>
                      {shipment.weight_kg} kg (Dispo: {matchingTrip.max_weight_kg}kg)
                    </span>
                  </div>
                </div>

                {shipment.notes && (
                  <p className="text-sm text-muted-foreground mb-4 italic line-clamp-2">{shipment.notes}</p>
                )}

                <Button
                  className={`w-full transition-all duration-300 ${
                    isPending
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600 opacity-90"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                  onClick={() => handlePropose(shipment.id, matchingTrip.id)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-pulse" />
                      En attente de réponse...
                    </>
                  ) : (
                    `Proposer mon voyage (${format(new Date(matchingTrip.departure_date), "d/MM")})`
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompatibleShipments;
