import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Trip {
  id: string;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  departure_date: string;
  max_weight_kg: number;
  status: string;
  profiles: {
    full_name: string;
  };
}

const AdminTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("*, profiles:traveler_id(full_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTrips(data as any || []);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Voyageur</TableHead>
            <TableHead>Trajet</TableHead>
            <TableHead>Départ</TableHead>
            <TableHead>Poids max</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip: any) => (
            <TableRow key={trip.id}>
              <TableCell className="font-medium">{trip.profiles.full_name}</TableCell>
              <TableCell>
                {trip.from_city} ({trip.from_country}) → {trip.to_city} ({trip.to_country})
              </TableCell>
              <TableCell>
                {format(new Date(trip.departure_date), "d MMM yyyy", { locale: fr })}
              </TableCell>
              <TableCell>{trip.max_weight_kg} kg</TableCell>
              <TableCell>
                <Badge variant={trip.status === "open" ? "default" : "secondary"}>
                  {trip.status === "open" ? "Ouvert" : trip.status === "matched" ? "Associé" : "Fermé"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminTrips;
