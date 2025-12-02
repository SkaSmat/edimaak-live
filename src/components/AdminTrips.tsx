import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, Search, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Trip {
  id: string;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  departure_date: string;
  arrival_date: string | null;
  max_weight_kg: number;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

const AdminTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hiding, setHiding] = useState<string | null>(null);

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

  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const query = searchQuery.toLowerCase();
    return trips.filter(
      (trip: any) =>
        trip.from_city.toLowerCase().includes(query) ||
        trip.to_city.toLowerCase().includes(query) ||
        trip.profiles?.full_name?.toLowerCase().includes(query) ||
        trip.status.toLowerCase().includes(query)
    );
  }, [trips, searchQuery]);

  const handleHide = async (id: string) => {
    setHiding(id);
    try {
      // Try to update status to 'hidden' (soft-delete approach)
      const { error } = await supabase
        .from("trips")
        .update({ status: "closed" })
        .eq("id", id);

      if (error) throw error;
      
      // Update local state
      setTrips(trips.map(t => t.id === id ? { ...t, status: "closed" } : t));
      toast.success("Voyage masqué (statut changé en 'fermé')");
    } catch (error: any) {
      console.error("Error hiding trip:", error);
      toast.info("Action non prise en charge dans cette configuration.");
    } finally {
      setHiding(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500/90">Ouvert</Badge>;
      case "matched":
        return <Badge className="bg-blue-500/90">Associé</Badge>;
      case "closed":
        return <Badge variant="secondary">Fermé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par ville, voyageur ou statut..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Voyageur</TableHead>
              <TableHead>Trajet</TableHead>
              <TableHead>Départ</TableHead>
              <TableHead>Arrivée</TableHead>
              <TableHead>Capacité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Aucun voyage trouvé" : "Aucun voyage"}
                </TableCell>
              </TableRow>
            ) : (
              filteredTrips.map((trip: any) => (
                <TableRow key={trip.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{trip.profiles?.full_name || "-"}</TableCell>
                  <TableCell>
                    {trip.from_city} → {trip.to_city}
                  </TableCell>
                  <TableCell>
                    {format(new Date(trip.departure_date), "d MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {trip.arrival_date 
                      ? format(new Date(trip.arrival_date), "d MMM yyyy", { locale: fr })
                      : "-"
                    }
                  </TableCell>
                  <TableCell>{trip.max_weight_kg} kg</TableCell>
                  <TableCell>{getStatusBadge(trip.status)}</TableCell>
                  <TableCell>
                    {format(new Date(trip.created_at), "d MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {trip.status === "open" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-muted-foreground hover:text-orange-600"
                            disabled={hiding === trip.id}
                          >
                            {hiding === trip.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Masquer
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Masquer ce voyage ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Le statut du voyage sera changé en "fermé". Il ne sera plus visible pour les nouveaux matches.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleHide(trip.id)}>
                              Masquer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {filteredTrips.length} voyage(s) affiché(s)
      </p>
    </div>
  );
};

export default AdminTrips;
