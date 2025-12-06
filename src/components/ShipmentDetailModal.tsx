import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Weight, Package, User, Info, ArrowRight, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getShipmentImageUrl } from "@/lib/shipmentImageHelper";

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
  notes: string | null;
  image_url: string | null;
  sender_id: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ShipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: ShipmentRequest | null;
  isAuthenticated: boolean;
  onSignUp: () => void;
  onLogin: () => void;
  onViewProfile?: (userId: string) => void;
}

export const ShipmentDetailModal = ({
  isOpen,
  onClose,
  shipment,
  isAuthenticated,
  onSignUp,
  onLogin,
  onViewProfile,
}: ShipmentDetailModalProps) => {
  if (!shipment) return null;

  // Fonction helper pour sauvegarder l'intention avant de rediriger
  const handleAuthAction = (action: () => void) => {
    // On sauvegarde l'ID du colis pour le retrouver après la connexion
    localStorage.setItem("targetShipmentId", shipment.id);
    action();
  };

  const handleProfileClick = () => {
    if (isAuthenticated && onViewProfile && shipment.sender_id) {
      onViewProfile(shipment.sender_id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
        {/* Header Image */}
        <div className="relative h-48 w-full bg-muted">
          <img
            src={getShipmentImageUrl(shipment.image_url, shipment.item_type)}
            alt={shipment.item_type}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <Badge
              variant="secondary"
              className="mb-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            >
              {shipment.item_type}
            </Badge>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {shipment.from_city} <ArrowRight className="w-5 h-5" /> {shipment.to_city}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Expéditeur - Visible pour les utilisateurs connectés */}
          <button
            type="button"
            onClick={handleProfileClick}
            disabled={!isAuthenticated}
            className={`w-full flex items-center justify-between p-4 bg-muted/30 rounded-lg text-left transition-colors ${
              isAuthenticated ? "hover:bg-muted/50 cursor-pointer" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <UserAvatar fullName={shipment.profiles?.full_name || ""} avatarUrl={shipment.profiles?.avatar_url} />
              <div>
                <p className="font-medium text-foreground">
                  {isAuthenticated 
                    ? (shipment.profiles?.full_name || "Utilisateur") 
                    : "Expéditeur"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isAuthenticated ? "Cliquez pour voir le profil" : "Connectez-vous pour voir le profil"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Détails du colis */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="w-4 h-4" />
                <span>Dates souhaitées</span>
              </div>
              <p className="font-medium">
                {format(new Date(shipment.earliest_date), "d MMM", { locale: fr })} -{" "}
                {format(new Date(shipment.latest_date), "d MMM yyyy", { locale: fr })}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Weight className="w-4 h-4" />
                <span>Poids</span>
              </div>
              <p className="font-medium">{shipment.weight_kg} kg</p>
            </div>

            <div className="space-y-1 col-span-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" />
                <span>Trajet</span>
              </div>
              <p className="font-medium">
                De {shipment.from_city} ({shipment.from_country}) vers {shipment.to_city} ({shipment.to_country})
              </p>
            </div>
          </div>

          {/* Notes */}
          {shipment.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100 text-sm mb-1">Note de l'expéditeur</h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200/80 italic">"{shipment.notes}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            {!isAuthenticated ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Connectez-vous pour proposer votre voyage à cet expéditeur.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => handleAuthAction(onLogin)} className="w-full">
                    Se connecter
                  </Button>
                  <Button onClick={() => handleAuthAction(onSignUp)} className="w-full">
                    Créer un compte
                  </Button>
                </div>
              </div>
            ) : (
              <Button className="w-full h-11 text-base" onClick={onSignUp}>
                <Package className="w-4 h-4 mr-2" />
                Proposer mon voyage
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
