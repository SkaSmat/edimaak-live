import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, MapPin, Calendar, Weight, Package } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";

interface ShipmentRequest {
  id: string;
  from_country: string;
  from_city: string;
  to_country: string;
  to_city: string;
  earliest_date: string;
  latest_date: string;
  weight_kg: number;
  item_type: string;
  notes: string | null;
  status: string;
  created_at: string;
}

interface ShipmentRequestListProps {
  userId: string;
  onCreateRequest?: () => void;
}

const ShipmentRequestList = ({ userId, onCreateRequest }: ShipmentRequestListProps) => {
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [userId]);

  const fetchRequests = async () => {
    setError(false);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shipment_requests")
        .select("*")
        .eq("sender_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setError(true);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette demande ?")) return;

    try {
      const { error } = await supabase.from("shipment_requests").delete().eq("id", id);
      if (error) throw error;
      setRequests(requests.filter((r) => r.id !== id));
      toast.success("Demande supprimée");
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchRequests} />;
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Aucune demande d'expédition"
        description="Tu n'as pas encore créé de demande. Clique sur le bouton ci-dessous pour commencer."
        actionLabel={onCreateRequest ? "+ Nouvelle demande" : undefined}
        onAction={onCreateRequest}
      />
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">
                {request.from_city} ({request.from_country}) → {request.to_city} ({request.to_country})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={request.status === "open" ? "default" : "secondary"}>
                {request.status === "open" ? "Ouvert" : request.status === "matched" ? "Associé" : "Fermé"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(request.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(request.earliest_date), "d MMM", { locale: fr })} -{" "}
                {format(new Date(request.latest_date), "d MMM yyyy", { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Weight className="w-4 h-4" />
              <span>{request.weight_kg} kg</span>
            </div>
          </div>

          <div className="mt-3">
            <Badge variant="outline">{request.item_type}</Badge>
          </div>

          {request.notes && (
            <p className="mt-3 text-sm text-muted-foreground border-t pt-3">{request.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ShipmentRequestList;
