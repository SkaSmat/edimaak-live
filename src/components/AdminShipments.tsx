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

const AdminShipments = () => {
  const [shipments, setShipments] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hiding, setHiding] = useState<string | null>(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from("shipment_requests")
        .select("*, profiles:sender_id(full_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShipments(data as any || []);
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
        shipment.status.toLowerCase().includes(query)
    );
  }, [shipments, searchQuery]);

  const handleHide = async (id: string) => {
    setHiding(id);
    try {
      // Try to update status to 'closed' (soft-delete approach)
      const { error } = await supabase
        .from("shipment_requests")
        .update({ status: "closed" })
        .eq("id", id);

      if (error) throw error;
      
      // Update local state
      setShipments(shipments.map(s => s.id === id ? { ...s, status: "closed" } : s));
      toast.success("Demande masquée (statut changé en 'fermée')");
    } catch (error: any) {
      console.error("Error hiding shipment:", error);
      toast.info("Action non prise en charge dans cette configuration.");
    } finally {
      setHiding(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500/90">Ouverte</Badge>;
      case "matched":
        return <Badge className="bg-blue-500/90">Associée</Badge>;
      case "closed":
        return <Badge variant="secondary">Fermée</Badge>;
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
          placeholder="Rechercher par ville, expéditeur, type ou statut..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border overflow-x-auto">
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
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Aucune demande trouvée" : "Aucune demande"}
                </TableCell>
              </TableRow>
            ) : (
              filteredShipments.map((shipment: any) => (
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
                  <TableCell>
                    {format(new Date(shipment.created_at), "d MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {shipment.status === "open" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-muted-foreground hover:text-orange-600"
                            disabled={hiding === shipment.id}
                          >
                            {hiding === shipment.id ? (
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
                            <AlertDialogTitle>Masquer cette demande ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Le statut de la demande sera changé en "fermée". Elle ne sera plus visible pour les voyageurs.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleHide(shipment.id)}>
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
        {filteredShipments.length} demande(s) affichée(s)
      </p>
    </div>
  );
};

export default AdminShipments;
