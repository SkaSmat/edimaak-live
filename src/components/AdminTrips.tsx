import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Trash2, Loader2 } from "lucide-react";
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
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from("trips").delete().eq("id", id);
      if (error) throw error;
      setTrips(trips.filter(t => t.id !== id));
      toast.success("Voyage supprimé");
    } catch (error: any) {
      console.error("Error deleting trip:", error);
      toast.error("Impossible de supprimer ce voyage (peut-être lié à un match)");
    } finally {
      setDeleting(null);
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
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Voyageur</TableHead>
            <TableHead>Trajet</TableHead>
            <TableHead>Départ</TableHead>
            <TableHead>Capacité</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Aucun voyage
              </TableCell>
            </TableRow>
          ) : (
            trips.map((trip: any) => (
              <TableRow key={trip.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{trip.profiles?.full_name || "-"}</TableCell>
                <TableCell>
                  {trip.from_city} → {trip.to_city}
                </TableCell>
                <TableCell>
                  {format(new Date(trip.departure_date), "d MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell>{trip.max_weight_kg} kg</TableCell>
                <TableCell>{getStatusBadge(trip.status)}</TableCell>
                <TableCell>
                  {format(new Date(trip.created_at), "d MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deleting === trip.id}
                      >
                        {deleting === trip.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce voyage ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Le voyage sera définitivement supprimé.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(trip.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminTrips;
