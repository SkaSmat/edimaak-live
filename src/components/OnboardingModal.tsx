import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Plane, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const navigate = useNavigate();

  const handleSendPackage = () => {
    onClose();
    // Redirect to sender dashboard with new shipment form open
    navigate("/dashboard/sender/shipments?new=true");
  };

  const handleTravelSoon = () => {
    onClose();
    // Redirect to traveler dashboard with new trip form open
    navigate("/dashboard/traveler/trips?new=true");
  };

  const handleExplore = () => {
    onClose();
    // Just go to dashboard based on current role - will be handled by redirect
    navigate("/");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary/80 px-6 py-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-2">
            Bienvenue sur EdiMaak ! 🎉
          </h2>
          <p className="text-primary-foreground/90 text-base sm:text-lg">
            Que souhaitez-vous faire ?
          </p>
        </div>

        {/* Main content */}
        <div className="p-6 space-y-4">
          {/* Big button: Send package */}
          <button
            onClick={handleSendPackage}
            className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 sm:p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-500/30"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Package className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                  J'ai un colis à envoyer
                </h3>
                <p className="text-white/80 text-sm sm:text-base">
                  Trouvez un voyageur pour transporter votre colis
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
            {/* Decorative elements */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/5" />
          </button>

          {/* Big button: Travel soon */}
          <button
            onClick={handleTravelSoon}
            className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 sm:p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Plane className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                  Je voyage bientôt
                </h3>
                <p className="text-white/80 text-sm sm:text-base">
                  Gagnez de l'argent en transportant des colis
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
            {/* Decorative elements */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/5" />
          </button>
        </div>

        {/* Footer - Explore link */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={handleExplore}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Je veux juste explorer →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
