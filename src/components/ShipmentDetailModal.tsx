import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { formatShortName } from "@/lib/nameHelper";
import { getShipmentImageUrl } from "@/lib/shipmentImageHelper";
import { MapPin, Calendar, Package, User, Weight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
    profiles?: {
      id: string;
      full_name: string;
    };
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

          {/* Bloc Expéditeur */}
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-3">
              Expéditeur
            </p>
            {shipment.profiles ? (
              <div className="flex items-center gap-3">
                <AvatarInitials fullName={shipment.profiles.full_name} size="md" />
                <div>
                  <p className="font-semibold text-foreground">
                    {formatShortName(shipment.profiles.full_name)}
                  </p>
                  <p className="text-sm text-muted-foreground">Expéditeur vérifié</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Utilisateur</p>
                  <p className="text-sm text-muted-foreground">Expéditeur</p>
                </div>
              </div>
            )}
          </div>

          {/* Type d'objet */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Package className="w-4 h-4" />
              <span className="uppercase font-semibold">Type d'objet</span>
            </div>
            <p className="text-xl font-bold text-foreground">{shipment.item_type}</p>
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

          {/* Notes */}
          {shipment.notes && (
            <div>
              <p className="text-sm text-muted-foreground uppercase font-semibold mb-2">
                Description
              </p>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-foreground">{shipment.notes}</p>
              </div>
            </div>
          )}

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
              <div className="flex gap-3">
                <Button
                  onClick={onSignUp}
                  size="lg"
                  className="flex-1"
                >
                  S'inscrire
                </Button>
                <Button
                  onClick={onLogin}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Se connecter
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
                Voir mon dashboard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
