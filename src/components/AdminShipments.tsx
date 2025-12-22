import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminExportButton } from "@/components/admin/AdminExportButton";

interface ShipmentRequest {
  id: string;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  earliest_date: string;
  latest_date: string;
  weight_kg: number;
  item_type: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

const ITEMS_PER_PAGE = 15;

const AdminShipments = () => {
  const [shipments, setShipments] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from("shipment_requests")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShipments((data as any) || []);
    } catch (error) {
      console.error("Error fetching shipments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = useMemo(() => {
    if (!searchQuery.trim()) return shipments;
    const query = searchQuery.toLowerCase();
    return shipments.filter(
      (shipment: any) =>
        shipment.from_city.toLowerCase().includes(query) ||
        shipment.to_city.toLowerCase().includes(query) ||
        shipment.profiles?.full_name?.toLowerCase().includes(query) ||
        shipment.item_type.toLowerCase().includes(query) ||
        shipment.status.toLowerCase().includes(query),
    );
  }, [shipments, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredShipments.length / ITEMS_PER_PAGE);
  const paginatedShipments = filteredShipments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleToggleVisibility = async (id: string, currentStatus: string) => {
    setToggling(id);
    const newStatus = currentStatus === "closed" ? "open" : "closed";

    try {
      const { error } = await supabase.from("shipment_requests").update({ status: newStatus }).eq("id", id);

      if (error) throw error;

      setShipments(shipments.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
      toast.success(newStatus === "closed" ? "Demande masquée" : "Demande remise en ligne");
    } catch (error: any) {
      console.error("Error toggling shipment visibility:", error);
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
        return <Badge className="bg-blue-500/90">Associée</Badge>;
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">✓ Colis livré</Badge>;
      case "closed":
        return (
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">
            Masquée
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Export columns
  const exportColumns = [
    { key: "profiles.full_name", label: "Expéditeur", transform: (val: any) => val || "" },
    { key: "from_city", label: "Départ" },
    { key: "to_city", label: "Arrivée" },
    { key: "item_type", label: "Type" },
    { key: "weight_kg", label: "Poids (kg)" },
    { key: "earliest_date", label: "Date début", transform: (val: string) => format(new Date(val), "dd/MM/yyyy") },
    { key: "latest_date", label: "Date fin", transform: (val: string) => format(new Date(val), "dd/MM/yyyy") },
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
            placeholder="Rechercher par ville, expéditeur, type ou statut..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <AdminExportButton data={filteredShipments} filename="demandes" columns={exportColumns} />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedShipments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "Aucune demande trouvée" : "Aucune demande"}
          </div>
        ) : (
          paginatedShipments.map((shipment: any) => (
            <div key={shipment.id} className="bg-card rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{shipment.profiles?.full_name || "-"}</p>
                  <p className="text-sm text-muted-foreground">
                    {shipment.from_city} → {shipment.to_city}
                  </p>
                </div>
                {getStatusBadge(shipment.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">{shipment.item_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Poids:</span>
                  <p className="font-medium">{shipment.weight_kg} kg</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Période:</span>
                  <p className="font-medium">
                    {format(new Date(shipment.earliest_date), "d MMM", { locale: fr })} -{" "}
                    {format(new Date(shipment.latest_date), "d MMM", { locale: fr })}
                  </p>
                </div>
              </div>

              {shipment.status !== "matched" && shipment.status !== "completed" && (
                <div className="pt-2 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`w-full h-8 ${shipment.status === "closed" ? "text-green-600 border-green-200" : "text-orange-600 border-orange-200"}`}
                        disabled={toggling === shipment.id}
                      >
                        {toggling === shipment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : shipment.status === "closed" ? (
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
                          {shipment.status === "closed"
                            ? "Remettre en ligne cette demande ?"
                            : "Masquer cette demande ?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {shipment.status === "closed"
                            ? "La demande sera à nouveau visible pour les voyageurs."
                            : "La demande ne sera plus visible pour les voyageurs."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          className="w-full sm:w-auto"
                          onClick={() => handleToggleVisibility(shipment.id, shipment.status)}
                        >
                          {shipment.status === "closed" ? "Remettre en ligne" : "Masquer"}
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
              <TableHead>Expéditeur</TableHead>
              <TableHead>Trajet</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Poids</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedShipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Aucune demande trouvée" : "Aucune demande"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedShipments.map((shipment: any) => (
                <TableRow key={shipment.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{shipment.profiles?.full_name || "-"}</TableCell>
                  <TableCell>
                    {shipment.from_city} → {shipment.to_city}
                  </TableCell>
                  <TableCell>
                    {format(new Date(shipment.earliest_date), "d MMM", { locale: fr })} -{" "}
                    {format(new Date(shipment.latest_date), "d MMM", { locale: fr })}
                  </TableCell>
                  <TableCell>{shipment.item_type}</TableCell>
                  <TableCell>{shipment.weight_kg} kg</TableCell>
                  <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                  <TableCell>{format(new Date(shipment.created_at), "d MMM yyyy", { locale: fr })}</TableCell>
                  <TableCell>
                    {shipment.status !== "matched" && shipment.status !== "completed" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 ${shipment.status === "closed" ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-orange-600"}`}
                            disabled={toggling === shipment.id}
                          >
                            {toggling === shipment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : shipment.status === "closed" ? (
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
                              {shipment.status === "closed"
                                ? "Remettre en ligne cette demande ?"
                                : "Masquer cette demande ?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {shipment.status === "closed"
                                ? "La demande sera à nouveau visible pour les voyageurs."
                                : "La demande ne sera plus visible pour les voyageurs."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleToggleVisibility(shipment.id, shipment.status)}>
                              {shipment.status === "closed" ? "Remettre en ligne" : "Masquer"}
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

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredShipments.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default AdminShipments;
