import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Pencil, MapPin, Calendar, Weight, Plane, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TripForm from "./TripForm";

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
  onCreateTrip?: () => void;
}

const TripList = ({ userId, onCreateTrip }: TripListProps) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  useEffect(() => {
    fetchTrips();
  }, [userId]);

  const fetchTrips = async () => {
    setError(false);
    setLoading(true);
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
      setError(true);
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

  const handleEditSuccess = () => {
    setEditingTrip(null);
    fetchTrips();
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchTrips} />;
  }

  if (trips.length === 0) {
    return (
      <EmptyState
        icon={Plane}
        title="Aucun voyage pour le moment"
        description="Tu n'as pas encore créé de voyage. Clique sur le bouton ci-dessous pour commencer."
        actionLabel={onCreateTrip ? "+ Nouveau voyage" : undefined}
        onAction={onCreateTrip}
      />
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const activeTrips = trips.filter(t => t.departure_date >= today && t.status !== 'completed');
  const archivedTrips = trips.filter(t => t.departure_date < today || t.status === 'completed');

  const renderTripCard = (trip: Trip) => {
    const isExpired = trip.departure_date < today && trip.status !== 'completed';
    const isCompleted = trip.status === 'completed';

    return (
      <div
        key={trip.id}
        className={`p-3 sm:p-4 border rounded-lg bg-card hover:shadow-md transition-shadow ${isExpired ? 'opacity-60' : ''}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-sm sm:text-base truncate">
              {trip.from_city} → {trip.to_city}
            </h3>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isCompleted ? (
              <Badge className="text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                <CheckCircle className="w-3 h-3 mr-1" />
                Livraison validée
              </Badge>
            ) : isExpired ? (
              <Badge className="text-xs bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100">
                <Clock className="w-3 h-3 mr-1" />
                Date passée
              </Badge>
            ) : (
              <Badge variant={trip.status === "open" ? "default" : "secondary"} className="text-xs">
                {trip.status === "open" ? "Ouvert" : trip.status === "matched" ? "Associé" : "Fermé"}
              </Badge>
            )}
            {!isCompleted && !isExpired && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditingTrip(trip)} className="h-8 w-8 p-0">
                  <Pencil className="w-4 h-4 text-primary" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(trip.id)} className="h-8 w-8 p-0">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">Départ: {format(new Date(trip.departure_date), "d MMM yyyy", { locale: fr })}</span>
          </div>
          {trip.arrival_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Arrivée: {format(new Date(trip.arrival_date), "d MMM yyyy", { locale: fr })}</span>
            </div>
          )}
          {trip.max_weight_kg > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Weight className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Max: {trip.max_weight_kg} kg</span>
            </div>
          )}
        </div>

        {trip.notes && (
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground border-t pt-2 sm:pt-3 line-clamp-2">{trip.notes}</p>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Active trips */}
        {activeTrips.length > 0 && (
          <div className="space-y-4">
            {activeTrips.map(renderTripCard)}
          </div>
        )}

        {/* Archived/Completed trips */}
        {archivedTrips.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Voyages passés ou complétés</span>
            </div>
            {archivedTrips.map(renderTripCard)}
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      <Dialog open={!!editingTrip} onOpenChange={(open) => !open && setEditingTrip(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le voyage</DialogTitle>
          </DialogHeader>
          {editingTrip && (
            <TripForm
              userId={userId}
              onSuccess={handleEditSuccess}
              editData={editingTrip}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TripList;
