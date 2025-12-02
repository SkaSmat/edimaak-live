import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, MapPin, Calendar, Weight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Trip {
  id: string;
  from_country: string;
  from_city: string;
  to_country: string;
  to_city: string;
  departure_date: string;
  arrival_date: string | null;
  max_weight_kg: number;
  notes: string | null;
  status: string;
  created_at: string;
}

interface TripListProps {
  userId: string;
}

const TripList = ({ userId }: TripListProps) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, [userId]);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("traveler_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast.error("Erreur lors du chargement des voyages");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce voyage ?")) return;

    try {
      const { error } = await supabase.from("trips").delete().eq("id", id);
      if (error) throw error;
      setTrips(trips.filter((t) => t.id !== id));
      toast.success("Voyage supprimé");
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun voyage pour le moment. Créez-en un !
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <div
          key={trip.id}
          className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">
                {trip.from_city} ({trip.from_country}) → {trip.to_city} ({trip.to_country})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={trip.status === "open" ? "default" : "secondary"}>
                {trip.status === "open" ? "Ouvert" : trip.status === "matched" ? "Associé" : "Fermé"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(trip.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Départ: {format(new Date(trip.departure_date), "d MMM yyyy", { locale: fr })}</span>
            </div>
            {trip.arrival_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Arrivée: {format(new Date(trip.arrival_date), "d MMM yyyy", { locale: fr })}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Weight className="w-4 h-4" />
              <span>Max: {trip.max_weight_kg} kg</span>
            </div>
          </div>

          {trip.notes && (
            <p className="mt-3 text-sm text-muted-foreground border-t pt-3">{trip.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default TripList;
