import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Calendar, Weight, Package, Search } from "lucide-react";
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

interface CompatibleShipmentsProps {
  userId: string;
}

const CompatibleShipments = ({ userId }: CompatibleShipmentsProps) => {
  const [shipments, setShipments] = useState<ShipmentRequest[]>([]);
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
      // Get user's trips first
      const { data: trips } = await supabase
        .from("trips")
        .select("*")
        .eq("traveler_id", userId)
        .eq("status", "open");

      if (!trips || trips.length === 0) {
        setHasTrips(false);
        setLoading(false);
        return;
      }

      setHasTrips(true);

      // For simplicity, get all open shipment requests and filter on client side
      const { data, error } = await supabase
        .from("shipment_requests")
        .select("*, profiles:sender_id(full_name)")
        .eq("status", "open");

      if (error) throw error;

      // Filter compatible shipments
      const compatible = (data || []).filter((shipment: any) => {
        return trips.some((trip) => {
          const isSameRoute =
            trip.from_country === shipment.from_country &&
            trip.to_country === shipment.to_country;
          
          const tripDate = new Date(trip.departure_date);
          const earliestDate = new Date(shipment.earliest_date);
          const latestDate = new Date(shipment.latest_date);
          
          const isDateCompatible = tripDate >= earliestDate && tripDate <= latestDate;
          
          return isSameRoute && isDateCompatible;
        });
      });

      setShipments(compatible as ShipmentRequest[]);
    } catch (error) {
      console.error("Error fetching compatible shipments:", error);
      setError(true);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handlePropose = async (shipmentId: string) => {
    try {
      // Get one of user's open trips for this route
      const { data: trips } = await supabase
        .from("trips")
        .select("id")
        .eq("traveler_id", userId)
        .eq("status", "open")
        .limit(1);

      if (!trips || trips.length === 0) {
        toast.error("Vous devez avoir un voyage ouvert");
        return;
      }

      const { error } = await supabase.from("matches").insert({
        trip_id: trips[0].id,
        shipment_request_id: shipmentId,
        status: "pending",
      });

      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("Vous avez déjà proposé ce voyage");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Proposition envoyée !");
      fetchCompatibleShipments();
    } catch (error: any) {
      console.error("Error creating match:", error);
      toast.error("Une erreur est survenue. Vérifie ta connexion et réessaie.");
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchCompatibleShipments} />;
  }

  if (!hasTrips) {
    return (
      <EmptyState
        icon={Search}
        title="Aucun voyage actif"
        description="Crée d'abord un voyage pour voir les demandes d'expédition compatibles."
      />
    );
  }

  if (shipments.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="Aucune demande compatible"
        description="Aucune demande d'expédition ne correspond à tes voyages pour le moment. Reviens plus tard !"
      />
    );
  }

  return (
    <div className="space-y-4">
      {shipments.map((shipment) => (
        <div
          key={shipment.id}
          className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              <div>
                <h3 className="font-semibold">
                  {shipment.from_city} ({shipment.from_country}) → {shipment.to_city} ({shipment.to_country})
                </h3>
                <p className="text-sm text-muted-foreground">
                  Par {shipment.profiles?.full_name || "Expéditeur"}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => handlePropose(shipment.id)}>
              Proposer
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(shipment.earliest_date), "d MMM", { locale: fr })} -{" "}
                {format(new Date(shipment.latest_date), "d MMM yyyy", { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Weight className="w-4 h-4" />
              <span>{shipment.weight_kg} kg</span>
            </div>
          </div>

          <div className="mt-3 text-sm">
            <Badge variant="outline">{shipment.item_type}</Badge>
          </div>

          {shipment.notes && (
            <p className="mt-3 text-sm text-muted-foreground border-t pt-3">{shipment.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default CompatibleShipments;