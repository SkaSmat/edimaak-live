import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatShortName } from "@/lib/nameHelper";
import { getShipmentImageUrl } from "@/lib/shipmentImageHelper";
import { MapPin, Calendar, Package, Weight, Eye, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface ShipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: {
    id: string;
    from_city: string;
    from_country: string;
    to_city: string;
    to_country: string;
    earliest_date: string;
    latest_date: string;
    weight_kg: number;
    item_type: string;
    notes: string | null;
    image_url: string | null;
    view_count: number;
    profiles?: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
    sender_request_count?: number;
  };
  isAuthenticated: boolean;
  onSignUp: () => void;
  onLogin: () => void;
}

export const ShipmentDetailModal = ({
  isOpen,
  onClose,
  shipment,
  isAuthenticated,
  onSignUp,
  onLogin,
}: ShipmentDetailModalProps) => {
  // Increment view count when modal opens
  useEffect(() => {
    if (isOpen && shipment?.id) {
      supabase.rpc('increment_shipment_view_count', { shipment_id: shipment.id });
    }
  }, [isOpen, shipment?.id]);

  const senderTrustLabel = shipment.sender_request_count && shipment.sender_request_count > 1
    ? `Expéditeur actif • ${shipment.sender_request_count} demandes publiées`
    : "Nouvel expéditeur";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Détails de la demande</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image du colis */}
          <div className="aspect-video w-full overflow-hidden rounded-lg">
            <img
              src={getShipmentImageUrl(shipment.image_url, shipment.item_type)}
              alt={shipment.item_type}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Bloc Expéditeur avec indicateur de confiance */}
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-3">
              Expéditeur
            </p>
            <div className="flex items-center gap-3">
              <UserAvatar
                fullName={shipment.profiles?.full_name || ""}
                avatarUrl={shipment.profiles?.avatar_url}
                size="md"
              />
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {shipment.profiles ? formatShortName(shipment.profiles.full_name) : "Utilisateur"}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  <span>{senderTrustLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Type d'objet et description */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Package className="w-4 h-4" />
              <span className="uppercase font-semibold">Type d'objet</span>
            </div>
            <p className="text-xl font-bold text-foreground">{shipment.item_type}</p>
            {shipment.notes && (
              <p className="text-muted-foreground mt-2">{shipment.notes}</p>
            )}
          </div>

          {/* Trajet */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="w-4 h-4" />
              <span className="uppercase font-semibold">Trajet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Départ</p>
                <p className="font-semibold text-foreground">
                  {shipment.from_city}, {shipment.from_country}
                </p>
              </div>
              <div className="text-muted-foreground">→</div>
              <div className="flex-1 bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Arrivée</p>
                <p className="font-semibold text-foreground">
                  {shipment.to_city}, {shipment.to_country}
                </p>
              </div>
            </div>
          </div>

          {/* Informations complémentaires */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Weight className="w-4 h-4" />
                <span className="uppercase font-semibold">Poids</span>
              </div>
              <p className="text-xl font-bold text-foreground">{shipment.weight_kg} kg</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <span className="uppercase font-semibold">Dates</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {format(new Date(shipment.earliest_date), "dd MMM", { locale: fr })}
                {" - "}
                {format(new Date(shipment.latest_date), "dd MMM yyyy", { locale: fr })}
              </p>
            </div>
          </div>

          {/* Compteur de vues */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <Eye className="w-4 h-4" />
            <span>Ce colis a été vu {shipment.view_count + 1} fois</span>
          </div>

          {/* CTA selon l'état d'authentification */}
          {!isAuthenticated ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
              <div className="text-center">
                <p className="font-semibold text-foreground mb-2">
                  Intéressé par cette demande ?
                </p>
                <p className="text-sm text-muted-foreground">
                  Crée ton compte voyageur pour proposer ton trajet et discuter avec cet expéditeur.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={onSignUp}
                  size="lg"
                  className="flex-1"
                >
                  Créer un compte voyageur
                </Button>
                <Button
                  onClick={onLogin}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Je suis déjà inscrit
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
              <div className="text-center">
                <p className="font-semibold text-foreground mb-2">
                  Cette demande vous intéresse ?
                </p>
                <p className="text-sm text-muted-foreground">
                  Accédez à votre dashboard pour voir les correspondances avec vos trajets.
                </p>
              </div>
              <Button
                onClick={() => window.location.href = "/dashboard/traveler"}
                size="lg"
                className="w-full"
              >
                Proposer mon trajet
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
