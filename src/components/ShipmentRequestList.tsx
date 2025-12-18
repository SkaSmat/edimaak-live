import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Pencil, Calendar, Weight, Package, Eye, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ShipmentRequestForm from "./ShipmentRequestForm";

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
  price: number | null;
  image_url: string | null;
  view_count: number;
}

interface ShipmentRequestListProps {
  userId: string;
  onCreateRequest?: () => void;
}

const ShipmentRequestList = ({ userId, onCreateRequest }: ShipmentRequestListProps) => {
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ShipmentRequest | null>(null);

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

  const handleEditSuccess = () => {
    setEditingRequest(null);
    fetchRequests();
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

  const today = new Date().toISOString().split('T')[0];
  const activeRequests = requests.filter(r => r.latest_date >= today && r.status !== 'completed');
  const archivedRequests = requests.filter(r => r.latest_date < today || r.status === 'completed');

  const renderRequestCard = (request: ShipmentRequest) => {
    const isExpired = request.latest_date < today && request.status !== 'completed';
    const isCompleted = request.status === 'completed';

    return (
      <div
        key={request.id}
        className={`p-3 sm:p-4 border rounded-lg bg-card hover:shadow-md transition-shadow ${isExpired ? 'opacity-60' : ''}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
            <h3 className="font-semibold text-sm sm:text-base truncate">
              {request.from_city} → {request.to_city}
            </h3>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isCompleted ? (
              <Badge className="text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                <CheckCircle className="w-3 h-3 mr-1" />
                Colis livré
              </Badge>
            ) : isExpired ? (
              <Badge className="text-xs bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100">
                <Clock className="w-3 h-3 mr-1" />
                Date passée
              </Badge>
            ) : (
              <>
                <Badge variant={request.status === "open" ? "default" : "secondary"} className="text-xs">
                  {request.status === "open" ? "Ouvert" : request.status === "matched" ? "Associé" : "Fermé"}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setEditingRequest(request)} className="h-8 w-8 p-0">
                  <Pencil className="w-4 h-4 text-primary" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(request.id)} className="h-8 w-8 p-0">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">
              {format(new Date(request.earliest_date), "d MMM", { locale: fr })} -{" "}
              {format(new Date(request.latest_date), "d MMM yyyy", { locale: fr })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Weight className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{request.weight_kg} kg</span>
          </div>
          {request.view_count > 5 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{request.view_count} vues</span>
            </div>
          )}
        </div>

        <div className="mt-2 sm:mt-3 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">{request.item_type}</Badge>
          {request.price && (
            <Badge variant="secondary" className="text-xs">💶 {request.price}€</Badge>
          )}
        </div>

        {request.notes && (
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground border-t pt-2 sm:pt-3 line-clamp-2">{request.notes}</p>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Active requests */}
        {activeRequests.length > 0 && (
          <div className="space-y-4">
            {activeRequests.map(renderRequestCard)}
          </div>
        )}

        {/* Archived/Completed requests */}
        {archivedRequests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Demandes passées ou livrées</span>
            </div>
            {archivedRequests.map(renderRequestCard)}
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la demande d'expédition</DialogTitle>
          </DialogHeader>
          {editingRequest && (
            <ShipmentRequestForm
              userId={userId}
              onSuccess={handleEditSuccess}
              editData={editingRequest}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShipmentRequestList;
