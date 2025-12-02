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

interface Match {
  id: string;
  status: string;
  created_at: string;
  trips: {
    from_city: string;
    to_city: string;
    departure_date: string;
    profiles: {
      full_name: string;
    };
  };
  shipment_requests: {
    item_type: string;
    profiles: {
      full_name: string;
    };
  };
}

const AdminMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          trips:trip_id(from_city, to_city, departure_date, profiles:traveler_id(full_name)),
          shipment_requests:shipment_request_id(item_type, profiles:sender_id(full_name))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMatches(data as any || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
      setMatches(matches.filter(m => m.id !== id));
      toast.success("Match supprimé");
    } catch (error: any) {
      console.error("Error deleting match:", error);
      toast.error("Impossible de supprimer ce match");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">En attente</Badge>;
      case "accepted":
        return <Badge className="bg-green-500/90">Accepté</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/90">Complété</Badge>;
      case "rejected":
        return <Badge variant="destructive">Refusé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Voyageur</TableHead>
            <TableHead>Expéditeur</TableHead>
            <TableHead>Trajet</TableHead>
            <TableHead>Type d'objet</TableHead>
            <TableHead>Date voyage</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Aucun match
              </TableCell>
            </TableRow>
          ) : (
            matches.map((match: any) => (
              <TableRow key={match.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">
                  {match.trips?.profiles?.full_name || "-"}
                </TableCell>
                <TableCell>
                  {match.shipment_requests?.profiles?.full_name || "-"}
                </TableCell>
                <TableCell>
                  {match.trips?.from_city} → {match.trips?.to_city}
                </TableCell>
                <TableCell>{match.shipment_requests?.item_type || "-"}</TableCell>
                <TableCell>
                  {match.trips?.departure_date
                    ? format(new Date(match.trips.departure_date), "d MMM yyyy", { locale: fr })
                    : "-"}
                </TableCell>
                <TableCell>{getStatusBadge(match.status)}</TableCell>
                <TableCell>
                  {format(new Date(match.created_at), "d MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deleting === match.id}
                      >
                        {deleting === match.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce match ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Le match entre le voyageur et l'expéditeur sera supprimé.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(match.id)}
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

export default AdminMatches;
