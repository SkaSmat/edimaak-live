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
  profiles: {
    full_name: string;
  };
}

const AdminShipments = () => {
  const [shipments, setShipments] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Expéditeur</TableHead>
            <TableHead>Trajet</TableHead>
            <TableHead>Période</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Poids</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment: any) => (
            <TableRow key={shipment.id}>
              <TableCell className="font-medium">{shipment.profiles.full_name}</TableCell>
              <TableCell>
                {shipment.from_city} ({shipment.from_country}) → {shipment.to_city} ({shipment.to_country})
              </TableCell>
              <TableCell>
                {format(new Date(shipment.earliest_date), "d MMM", { locale: fr })} -{" "}
                {format(new Date(shipment.latest_date), "d MMM", { locale: fr })}
              </TableCell>
              <TableCell>{shipment.item_type}</TableCell>
              <TableCell>{shipment.weight_kg} kg</TableCell>
              <TableCell>
                <Badge variant={shipment.status === "open" ? "default" : "secondary"}>
                  {shipment.status === "open" ? "Ouvert" : shipment.status === "matched" ? "Associé" : "Fermé"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminShipments;
