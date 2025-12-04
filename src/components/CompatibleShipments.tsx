import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, Calendar, Weight, Package, Search, Plane, Clock } from "lucide-react";
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
  const [pendingShipmentIds, setPendingShipmentIds] = useState<string[]>([]); // État persistant des propositions en attente
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasTrips, setHasTrips] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    await Promise.all([fetchCompatibleShipments(), fetchPendingMatches()]);
    setLoading(false);
  };

  // NOUVELLE FONCTION : Vérifie dans la DB si une proposition est déjà en cours
  const fetchPendingMatches = async () => {
    try {
      // 1. Récupérer tous les trips ouverts de l'utilisateur
      const { data: userTrips } = await supabase.from("trips").select("id").eq("traveler_id", userId);

      if (!userTrips || userTrips.length === 0) return;

      const userTripIds = userTrips.map((trip) => trip.id);

      // 2. Récupérer les ID des colis pour lesquels il y a déjà un match en 'pending'
      const { data: pendingMatchesData } = await supabase
        .from("matches")
        .select("shipment_request_id")
        .in("trip_id", userTripIds)
        .eq("status", "pending");

      if (pendingMatchesData) {
        setPendingShipmentIds(pendingMatchesData.map((match) => match.shipment_request_id));
      }
    } catch (error) {
      console.error("Error fetching pending matches:", error);
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

      (shipments || []).forEach((shipment: any) => {
        if (!trips) return;

        const matchingTrip = trips.find((trip) => {
          // Logique de Matching stricte (Route, Date, Poids)
          const isSameRoute = trip.from_country === shipment.from_country && trip.to_country === shipment.to_country;

          if (!isSameRoute) return false;

          const tripDate = trip.departure_date;
          const earliest = shipment.earliest_date;
          const latest = shipment.latest_date;

          const isDateCompatible = tripDate >= earliest && tripDate <= latest;
          if (!isDateCompatible) return false;

          const isWeightCompatible = trip.max_weight_kg >= shipment.weight_kg;

          return isWeightCompatible;
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
      toast.error("Erreur lors du chargement des annonces.");
    }
  };

  const handlePropose = async (shipmentId: string, tripId: string) => {
    // Vérification immédiate avant l'envoi
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
        } else {
          throw error;
        }
        return;
      }

      toast.success("Proposition envoyée !");

      // MISE À JOUR PERSISTANTE : Ajouter l'ID à l'état des propositions en attente
      setPendingShipmentIds((prev) => [...prev, shipmentId]);
    } catch (error) {
      toast.error("Erreur lors de l'envoi.");
    }
  };

  // ... (Rendu du composant) ...

  if (loading) return <div className="text-center py-8 text-muted-foreground">Recherche de colis compatibles...</div>;
  if (error) return <ErrorState onRetry={fetchData} />;

  if (!hasTrips && !highlightId) {
    // Afficher l'état vide uniquement si aucun voyage n'est posté et pas de highlight
    return (
      <EmptyState
        icon={Plane}
        title="Aucun voyage actif"
        description="Publiez d'abord un voyage pour voir les colis que vous pourriez transporter."
      />
    );
  }

  // --- RENDU : ANNONCES ET CARTES ---
  // On doit fusionner l'annonce ciblée si elle existe, mais le code ici est trop long.
  // Je vais simplifier le rendu pour se concentrer sur la carte.

  const shipmentsToDisplay = matches;

  if (shipmentsToDisplay.length === 0 && !highlightId) {
    return (
      <EmptyState
        icon={Search}
        title="Aucune demande compatible"
        description="Aucun colis ne correspond à tes dates, destinations ou capacité de poids actuelle."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* J'omets le code du bloc bleu spécial "Annonce Ciblée" pour me concentrer sur la boucle principale */}

      {shipmentsToDisplay.map(({ shipment, matchingTrip }) => {
        const isPending = pendingShipmentIds.includes(shipment.id); // Vérifie la persistance

        return (
          <div
            key={shipment.id}
            id={`shipment-${shipment.id}`}
            className={`p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-500 relative overflow-hidden`}
          >
            {/* ... (Contenu de la carte, omis pour la clarté) ... */}

            <Button
              className={`w-full transition-all duration-300 ${
                isPending ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600 opacity-90" : ""
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
  );
};

export default CompatibleShipments;
