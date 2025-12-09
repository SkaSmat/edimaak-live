import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
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
  sender_display_name?: string;
  sender_avatar_url?: string;
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

  // NOUVEAU : On stocke le statut exact pour chaque colis (ex: 'pending', 'accepted', 'rejected')
  const [matchStatuses, setMatchStatuses] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasTrips, setHasTrips] = useState(false);

  // --- RÉCUPÉRATION DE SECOURS (Si URL vide mais localStorage plein) ---
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
    await Promise.all([
      fetchCompatibleShipments(),
      fetchMatchStatuses(), // On récupère les statuts
    ]);
    setLoading(false);
  };

  // NOUVELLE FONCTION : Récupère les statuts des matchs existants
  const fetchMatchStatuses = async () => {
    try {
      const { data: userTrips } = await supabase.from("trips").select("id").eq("traveler_id", userId);
      if (!userTrips || userTrips.length === 0) return;

      const userTripIds = userTrips.map((trip) => trip.id);

      const { data: matchesData } = await supabase
        .from("matches")
        .select("shipment_request_id, status") // On prend aussi le statut
        .in("trip_id", userTripIds);

      if (matchesData) {
        // On transforme le tableau en objet pour un accès rapide : { 'id_colis': 'accepted', ... }
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
      const { data: trips } = await supabase.from("trips").select("*").eq("traveler_id", userId).eq("status", "open");

      setHasTrips(trips && trips.length > 0);

      const { data: shipments, error } = await supabase
        .from("shipment_requests")
        .select("*")
        .eq("status", "open");

      if (error) throw error;

      // Récupérer les infos d'affichage des expéditeurs via la fonction sécurisée
      const senderIds = [...new Set((shipments || []).map((s: any) => s.sender_id))];
      const senderInfos: Record<string, { display_name: string; avatar_url: string | null }> = {};
      
      await Promise.all(
        senderIds.map(async (senderId) => {
          const { data } = await supabase.rpc("get_sender_display_info", { sender_uuid: senderId });
          if (data && data.length > 0) {
            senderInfos[senderId] = {
              display_name: data[0].display_name,
              avatar_url: data[0].avatar_url,
            };
          }
        })
      );

      const foundMatches: CompatibleMatch[] = [];
      const normalize = (text: string) => (text ? text.toLowerCase().trim() : "");

      (shipments || []).forEach((shipment: any) => {
        if (!trips) return;

        const matchingTrip = trips.find((trip) => {
          const isSameFromCountry = normalize(trip.from_country) === normalize(shipment.from_country);
          const isSameToCountry = normalize(trip.to_country) === normalize(shipment.to_country);
          const tripFromCity = normalize(trip.from_city);
          const shipFromCity = normalize(shipment.from_city);
          const isSameFromCity = tripFromCity.includes(shipFromCity) || shipFromCity.includes(tripFromCity);
          const tripToCity = normalize(trip.to_city);
          const shipToCity = normalize(shipment.to_city);
          const isSameToCity = tripToCity.includes(shipToCity) || shipToCity.includes(tripToCity);

          if (!(isSameFromCountry && isSameToCountry && isSameFromCity && isSameToCity)) return false;

          const tripDate = trip.departure_date;
          const earliest = shipment.earliest_date;
          const latest = shipment.latest_date;
          if (!(tripDate >= earliest && tripDate <= latest)) return false;

          // Le poids est optionnel côté voyageur - on ne bloque pas si max_weight_kg est 0 ou null
          // Seulement si le voyageur a spécifié une limite et que le colis dépasse
          if (trip.max_weight_kg && trip.max_weight_kg > 0 && trip.max_weight_kg < shipment.weight_kg) return false;

          return true;
        });

        if (matchingTrip) {
          const senderInfo = senderInfos[shipment.sender_id];
          foundMatches.push({
            shipment: {
              ...shipment,
              sender_display_name: senderInfo?.display_name || "Anonyme",
              sender_avatar_url: senderInfo?.avatar_url || null,
            } as ShipmentRequest,
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
    // Si déjà un statut, on ne fait rien
    if (matchStatuses[shipmentId]) {
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
          // On force l'affichage en pending si erreur de duplicata
          setMatchStatuses((prev) => ({ ...prev, [shipmentId]: "pending" }));
        } else throw error;
        return;
      }

      toast.success("Proposition envoyée !");
      // Mise à jour immédiate de l'état local
      setMatchStatuses((prev) => ({ ...prev, [shipmentId]: "pending" }));
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

  // --- FONCTION POUR LE STYLE DU BOUTON ---
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

  return (
    <div className="space-y-6">
      {/* SECTION ANNONCE CIBLÉE */}
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
        <div className="space-y-3 sm:space-y-4">
          {shipmentsToDisplay.map(({ shipment, matchingTrip }) => {
            const currentStatus = matchStatuses[shipment.id]; // On récupère le statut (undefined, pending, accepted, rejected)

            return (
              <div
                key={shipment.id}
                id={`shipment-${shipment.id}`}
                className={`p-3 sm:p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-500 relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 bg-green-500/10 text-green-600 text-[10px] sm:text-xs px-2 py-1 rounded-bl-lg font-medium">
                  Compatible • {format(new Date(matchingTrip.departure_date), "d MMM")}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3 mt-5 sm:mt-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">
                        {shipment.from_city} → {shipment.to_city}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {shipment.sender_display_name || "Anonyme"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm bg-muted/30 p-2 sm:p-3 rounded-md mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      {format(new Date(shipment.earliest_date), "d MMM")} - {format(new Date(shipment.latest_date), "d MMM")}
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
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 italic line-clamp-2">{shipment.notes}</p>
                )}

                <Button
                  className={`w-full transition-all duration-300 text-xs sm:text-sm h-8 sm:h-9 ${getButtonStyle(currentStatus)}`}
                  onClick={() => handlePropose(shipment.id, matchingTrip.id)}
                  disabled={!!currentStatus} // Désactivé si un statut existe déjà
                  size="sm"
                >
                  {getButtonContent(currentStatus, matchingTrip.departure_date)}
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
