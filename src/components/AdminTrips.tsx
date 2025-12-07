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
import { Loader2, Search, EyeOff, Eye } from "lucide-react";
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
  const [toggling, setToggling] = useState<string | null>(null);

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

  const handleToggleVisibility = async (id: string, currentStatus: string) => {
    setToggling(id);
    const newStatus = currentStatus === "closed" ? "open" : "closed";
    
    try {
      const { error } = await supabase
        .from("trips")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      
      // Update local state
      setTrips(trips.map(t => t.id === id ? { ...t, status: newStatus } : t));
      toast.success(newStatus === "closed" ? "Voyage masqué" : "Voyage remis en ligne");
    } catch (error: any) {
      console.error("Error toggling trip visibility:", error);
      toast.error("Erreur lors de la modification du statut");
    } finally {
      setToggling(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500/90">En ligne</Badge>;
      case "matched":
        return <Badge className="bg-blue-500/90">Associé</Badge>;
      case "closed":
        return <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">Masqué</Badge>;
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "Aucun voyage trouvé" : "Aucun voyage"}
          </div>
        ) : (
          filteredTrips.map((trip: any) => (
            <div key={trip.id} className="bg-card rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{trip.profiles?.full_name || "-"}</p>
                  <p className="text-sm text-muted-foreground">{trip.from_city} → {trip.to_city}</p>
                </div>
                {getStatusBadge(trip.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Départ:</span>
                  <p className="font-medium">{format(new Date(trip.departure_date), "d MMM yyyy", { locale: fr })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Capacité:</span>
                  <p className="font-medium">{trip.max_weight_kg} kg</p>
                </div>
              </div>
              
              {trip.status !== "matched" && (
                <div className="pt-2 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`w-full h-8 ${trip.status === "closed" ? "text-green-600 border-green-200" : "text-orange-600 border-orange-200"}`}
                        disabled={toggling === trip.id}
                      >
                        {toggling === trip.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : trip.status === "closed" ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Remettre en ligne
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Masquer
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {trip.status === "closed" 
                            ? "Remettre en ligne ce voyage ?" 
                            : "Masquer ce voyage ?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {trip.status === "closed"
                            ? "Le voyage sera à nouveau visible pour les correspondances."
                            : "Le voyage ne sera plus visible pour les correspondances."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                        <AlertDialogAction className="w-full sm:w-auto" onClick={() => handleToggleVisibility(trip.id, trip.status)}>
                          {trip.status === "closed" ? "Remettre en ligne" : "Masquer"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border overflow-x-auto">
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
              <TableHead className="w-[140px]">Actions</TableHead>
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
                    {trip.status !== "matched" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 ${trip.status === "closed" ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-orange-600"}`}
                            disabled={toggling === trip.id}
                          >
                            {toggling === trip.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : trip.status === "closed" ? (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                Remettre
                              </>
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
                            <AlertDialogTitle>
                              {trip.status === "closed" 
                                ? "Remettre en ligne ce voyage ?" 
                                : "Masquer ce voyage ?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {trip.status === "closed"
                                ? "Le voyage sera à nouveau visible pour les correspondances."
                                : "Le voyage ne sera plus visible pour les correspondances."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleToggleVisibility(trip.id, trip.status)}>
                              {trip.status === "closed" ? "Remettre en ligne" : "Masquer"}
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