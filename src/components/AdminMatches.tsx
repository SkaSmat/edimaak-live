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
import { Trash2, Loader2, Search } from "lucide-react";
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
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminExportButton } from "@/components/admin/AdminExportButton";

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

const ITEMS_PER_PAGE = 15;

const AdminMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

  const filteredMatches = useMemo(() => {
    if (!searchQuery.trim()) return matches;
    const query = searchQuery.toLowerCase();
    return matches.filter((match: any) =>
      match.trips?.profiles?.full_name?.toLowerCase().includes(query) ||
      match.shipment_requests?.profiles?.full_name?.toLowerCase().includes(query) ||
      match.trips?.from_city?.toLowerCase().includes(query) ||
      match.trips?.to_city?.toLowerCase().includes(query) ||
      match.status.toLowerCase().includes(query)
    );
  }, [matches, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE);
  const paginatedMatches = filteredMatches.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">En attente</Badge>;
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

  // Export columns
  const exportColumns = [
    { key: "trips.profiles.full_name", label: "Voyageur", transform: (val: any, row: any) => row.trips?.profiles?.full_name || "" },
    { key: "shipment_requests.profiles.full_name", label: "Expéditeur", transform: (val: any, row: any) => row.shipment_requests?.profiles?.full_name || "" },
    { key: "trips.from_city", label: "Départ", transform: (val: any, row: any) => row.trips?.from_city || "" },
    { key: "trips.to_city", label: "Arrivée", transform: (val: any, row: any) => row.trips?.to_city || "" },
    { key: "shipment_requests.item_type", label: "Type colis", transform: (val: any, row: any) => row.shipment_requests?.item_type || "" },
    { key: "status", label: "Statut" },
    { key: "created_at", label: "Créé le", transform: (val: string) => format(new Date(val), "dd/MM/yyyy") },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par voyageur, expéditeur, ville ou statut..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <AdminExportButton data={filteredMatches} filename="matches" columns={exportColumns} />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedMatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "Aucun match trouvé" : "Aucun match"}
          </div>
        ) : (
          paginatedMatches.map((match: any) => (
            <div key={match.id} className="bg-card rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {match.trips?.profiles?.full_name || "-"} ↔ {match.shipment_requests?.profiles?.full_name || "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {match.trips?.from_city} → {match.trips?.to_city}
                  </p>
                </div>
                {getStatusBadge(match.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Type colis:</span>
                  <p className="font-medium">{match.shipment_requests?.item_type || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date voyage:</span>
                  <p className="font-medium">
                    {match.trips?.departure_date 
                      ? format(new Date(match.trips.departure_date), "d MMM", { locale: fr })
                      : "-"
                    }
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(match.created_at), "d MMM yyyy", { locale: fr })}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={deleting === match.id}
                    >
                      {deleting === match.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ce match ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le match entre le voyageur et l'expéditeur sera supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(match.id)}
                        className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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
              <TableHead>Expéditeur</TableHead>
              <TableHead>Trajet</TableHead>
              <TableHead>Type colis</TableHead>
              <TableHead>Date voyage</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMatches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Aucun match trouvé" : "Aucun match"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedMatches.map((match: any) => (
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

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredMatches.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default AdminMatches;
