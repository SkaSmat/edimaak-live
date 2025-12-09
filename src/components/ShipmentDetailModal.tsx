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
  public_profiles?: {
    id: string;
    display_first_name: string;
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
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] p-0 overflow-hidden gap-0 max-h-[90vh] overflow-y-auto">
        {/* Header Image */}
        <div className="relative h-40 sm:h-48 w-full bg-muted">
          <img
            src={getShipmentImageUrl(shipment.image_url, shipment.item_type)}
            alt={shipment.item_type}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 text-white">
            <Badge
              variant="secondary"
              className="mb-1.5 sm:mb-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm text-xs"
            >
              {shipment.item_type}
            </Badge>
            <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="truncate max-w-[120px] sm:max-w-none">{shipment.from_city}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-none">{shipment.to_city}</span>
            </h2>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Info Expéditeur - Visible pour les utilisateurs connectés */}
          <button
            type="button"
            onClick={handleProfileClick}
            disabled={!isAuthenticated}
            className={`w-full flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg text-left transition-colors ${
              isAuthenticated ? "hover:bg-muted/50 cursor-pointer" : ""
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <UserAvatar
                fullName={shipment.public_profiles?.display_first_name || ""}
                avatarUrl={shipment.public_profiles?.avatar_url}
                size="sm"
                className="flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base truncate">
                  {isAuthenticated ? shipment.public_profiles?.display_first_name || "Utilisateur" : "Expéditeur"}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {isAuthenticated ? "Cliquez pour voir le profil" : "Connectez-vous pour voir le profil"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isAuthenticated && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>

          {/* Détails du colis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Dates souhaitées</span>
              </div>
              <p className="font-medium text-sm sm:text-base">
                {format(new Date(shipment.earliest_date), "d MMM", { locale: fr })} -{" "}
                {format(new Date(shipment.latest_date), "d MMM yyyy", { locale: fr })}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                <Weight className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Poids</span>
              </div>
              <p className="font-medium text-sm sm:text-base">{shipment.weight_kg} kg</p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Trajet</span>
              </div>
              <p className="font-medium text-sm sm:text-base break-words">
                De {shipment.from_city} ({shipment.from_country}) vers {shipment.to_city} ({shipment.to_country})
              </p>
            </div>
          </div>

          {/* Notes */}
          {shipment.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 sm:p-4 rounded-lg border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-medium text-amber-900 dark:text-amber-100 text-xs sm:text-sm mb-1">
                    Note de l'expéditeur
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200/80 italic break-words">
                    "{shipment.notes}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            {!isAuthenticated ? (
              <div className="space-y-3 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Connectez-vous pour proposer votre voyage à cet expéditeur.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleAuthAction(onLogin)}
                    className="w-full text-xs sm:text-sm h-9 sm:h-10"
                  >
                    Se connecter
                  </Button>
                  <Button onClick={() => handleAuthAction(onSignUp)} className="w-full text-xs sm:text-sm h-9 sm:h-10">
                    Créer un compte
                  </Button>
                </div>
              </div>
            ) : (
              <Button className="w-full h-10 sm:h-11 text-sm sm:text-base" onClick={onSignUp}>
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
