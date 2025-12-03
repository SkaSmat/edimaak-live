import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Calendar, Weight, Package, Search, Plane } from "lucide-react";
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

// On crée un type pour lier un colis à UN voyage précis
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
  const [matches, setMatches] = useState<CompatibleMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasTrips, setHasTrips] = useState(false);

  useEffect(() => {
    fetchCompatibleShipments();
  }, [userId]);

  const fetchCompatibleShipments = async () => {
    setError(false);
    setLoading(true);
    try {
      // 1. Récupérer mes voyages ouverts
      const { data: trips } = await supabase.from("trips").select("*").eq("traveler_id", userId).eq("status", "open");

      if (!trips || trips.length === 0) {
        setHasTrips(false);
        setLoading(false);
        return;
      }
      setHasTrips(true);

      // 2. Récupérer les demandes (Idéalement, on devrait filtrer via une RPC Supabase pour la performance,
      // mais cette correction corrige déjà la logique métier critique)
      const { data: shipments, error } = await supabase
        .from("shipment_requests")
        .select("*, profiles:sender_id(full_name)")
        .eq("status", "open");

      if (error) throw error;

      // 3. L'ALGORITHME DE MATCHING CORRIGÉ
      const foundMatches: CompatibleMatch[] = [];

      (shipments || []).forEach((shipment: any) => {
        // On cherche SI un de mes voyages correspond à ce colis
        const matchingTrip = trips.find((trip) => {
          // A. Vérification de la Route (Ville exacte pour plus de précision, ou Pays si tu préfères large)
          const isSameRoute = trip.from_country === shipment.from_country && trip.to_country === shipment.to_country;

          if (!isSameRoute) return false;

          // B. Vérification des Dates
          const tripDate = new Date(trip.departure_date);
          const earliestDate = new Date(shipment.earliest_date);
          const latestDate = new Date(shipment.latest_date);
          // On ajoute 1 jour à la latestDate pour inclure le jour même
          latestDate.setDate(latestDate.getDate() + 1);

          const isDateCompatible = tripDate >= earliestDate && tripDate <= latestDate;
          if (!isDateCompatible) return false;

          // C. Vérification du POIDS (Critique !)
          const isWeightCompatible = trip.max_weight_kg >= shipment.weight_kg;

          return isWeightCompatible;
        });

        // Si on a trouvé un voyage compatible, on ajoute la paire à la liste
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

  // La fonction prend maintenant l'ID du voyage spécifique !
  const handlePropose = async (shipmentId: string, tripId: string) => {
    try {
      const { error } = await supabase.from("matches").insert({
        trip_id: tripId, // On utilise le BON voyage
        shipment_request_id: shipmentId,
        status: "pending",
      });

      if (error) {
        if (error.message.includes("duplicate") || error.code === "23505") {
          toast.error("Vous avez déjà proposé ce voyage");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Proposition envoyée !");
      // On retire l'élément de la liste locale pour éviter de re-cliquer
      setMatches((prev) => prev.filter((m) => m.shipment.id !== shipmentId));
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
          className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow relative overflow-hidden"
        >
          {/* Indicateur visuel de compatibilité */}
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

          <Button className="w-full" onClick={() => handlePropose(shipment.id, matchingTrip.id)}>
            Proposer mon voyage ({format(new Date(matchingTrip.departure_date), "d/MM")})
          </Button>
        </div>
      ))}
    </div>
  );
};

export default CompatibleShipments;
