import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  // 1. Pour gérer la redirection depuis la Landing Page
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [matches, setMatches] = useState<CompatibleMatch[]>([]);
  const [proposedIds, setProposedIds] = useState<string[]>([]); // Mémoire pour les boutons "En attente"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasTrips, setHasTrips] = useState(false);

  // 2. Effet pour scroller automatiquement vers le colis ciblé
  useEffect(() => {
    if (highlightId && matches.length > 0 && !loading) {
      const element = document.getElementById(`shipment-${highlightId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Petit effet visuel pour montrer quel colis a été sélectionné
          element.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(() => element.classList.remove("ring-2", "ring-primary", "ring-offset-2"), 3000);
        }, 500);
      }
    }
  }, [highlightId, matches, loading]);

  useEffect(() => {
    fetchCompatibleShipments();
  }, [userId]);

  const fetchCompatibleShipments = async () => {
    setError(false);
    setLoading(true);
    try {
      // Récupérer mes voyages ouverts
      const { data: trips } = await supabase.from("trips").select("*").eq("traveler_id", userId).eq("status", "open");

      if (!trips || trips.length === 0) {
        setHasTrips(false);
        setLoading(false);
        return;
      }
      setHasTrips(true);

      // Récupérer les demandes
      const { data: shipments, error } = await supabase
        .from("shipment_requests")
        .select("*, profiles:sender_id(full_name)")
        .eq("status", "open");

      if (error) throw error;

      // Algorithme de Matching
      const foundMatches: CompatibleMatch[] = [];

      (shipments || []).forEach((shipment: any) => {
        const matchingTrip = trips.find((trip) => {
          const isSameRoute = trip.from_country === shipment.from_country && trip.to_country === shipment.to_country;

          if (!isSameRoute) return false;

          const tripDate = new Date(trip.departure_date);
          const earliestDate = new Date(shipment.earliest_date);
          const latestDate = new Date(shipment.latest_date);
          latestDate.setDate(latestDate.getDate() + 1);

          const isDateCompatible = tripDate >= earliestDate && tripDate <= latestDate;
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
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handlePropose = async (shipmentId: string, tripId: string) => {
    try {
      const { error } = await supabase.from("matches").insert({
        trip_id: tripId,
        shipment_request_id: shipmentId,
        status: "pending",
      });

      if (error) {
        if (error.message.includes("duplicate") || error.code === "23505") {
          toast.error("Vous avez déjà proposé ce voyage");
          // On marque quand même le bouton visuellement
          setProposedIds((prev) => [...prev, shipmentId]);
        } else {
          throw error;
        }
        return;
      }

      toast.success("Proposition envoyée !");
      // On ajoute l'ID à la liste "en attente" pour changer l'aspect du bouton
      setProposedIds((prev) => [...prev, shipmentId]);
    } catch (error: any) {
      console.error("Error creating match:", error);
      toast.error("Erreur lors de l'envoi de la proposition.");
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Recherche de colis compatibles...</div>;
  if (error) return <ErrorState onRetry={fetchCompatibleShipments} />;

  if (!hasTrips) {
    return (
      <EmptyState
        icon={Plane}
        title="Aucun voyage actif"
        description="Publiez d'abord un voyage pour voir les colis que vous pourriez transporter."
      />
    );
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="Aucune demande compatible"
        description="Aucun colis ne correspond à vos dates, destinations ou capacité de poids actuelle."
      />
    );
  }

  return (
    <div className="space-y-4">
      {matches.map(({ shipment, matchingTrip }) => (
        <div
          key={shipment.id}
          id={`shipment-${shipment.id}`} // L'ID indispensable pour le scroll !
          className={`p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-500 relative overflow-hidden ${
            highlightId === shipment.id ? "shadow-lg scale-[1.01]" : ""
          }`}
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
                À livrer entre le {format(new Date(shipment.earliest_date), "d MMM")} et le{" "}
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

          {shipment.notes && <p className="text-sm text-muted-foreground mb-4 italic">"{shipment.notes}"</p>}

          <Button
            className={`w-full transition-all duration-300 ${
              proposedIds.includes(shipment.id)
                ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-600 opacity-90"
                : ""
            }`}
            onClick={() => handlePropose(shipment.id, matchingTrip.id)}
            disabled={proposedIds.includes(shipment.id)}
          >
            {proposedIds.includes(shipment.id) ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-pulse" />
                En attente de réponse...
              </>
            ) : (
              `Proposer mon voyage (${format(new Date(matchingTrip.departure_date), "d/MM")})`
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default CompatibleShipments;
