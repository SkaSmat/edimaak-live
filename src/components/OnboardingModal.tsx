import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const navigate = useNavigate();

  const handleCompleteNow = () => {
    onClose();
    navigate("/profile");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            🎉 Bienvenue sur EdiM3ak !
          </DialogTitle>
          <DialogDescription className="text-base">
            Merci de nous avoir rejoint. Prenez 2 minutes pour compléter votre profil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="font-medium text-gray-900">
            Un profil complet vous permet de :
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Publier des annonces</p>
                <p className="text-sm text-gray-600">
                  Proposez vos services de voyage ou envoyez vos colis
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Répondre aux offres</p>
                <p className="text-sm text-gray-600">
                  Entrez en contact avec d'autres utilisateurs
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Gagner la confiance</p>
                <p className="text-sm text-gray-600">
                  Un profil vérifié inspire confiance et augmente vos chances de match
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Astuce :</strong> Un profil complété à 100% reçoit 3x plus de réponses !
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Plus tard
          </Button>
          <Button
            onClick={handleCompleteNow}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Compléter maintenant
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};