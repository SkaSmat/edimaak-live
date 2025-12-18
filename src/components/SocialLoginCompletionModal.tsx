import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getPhoneCodeOptions } from "@/lib/countryData";
import { validatePhoneNumber, formatFullPhoneNumber } from "@/lib/phoneValidation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plane, Package } from "lucide-react";

interface SocialLoginCompletionModalProps {
  isOpen: boolean;
  userId: string;
  onComplete: () => void;
}

const phoneCodeOptions = getPhoneCodeOptions();

export const SocialLoginCompletionModal = ({ isOpen, userId, onComplete }: SocialLoginCompletionModalProps) => {
  const [phoneCode, setPhoneCode] = useState("FR");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"traveler" | "sender">("sender");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast.error("Le numéro de téléphone est obligatoire");
      return;
    }

    // Validate phone number
    const phoneValidation = validatePhoneNumber(phone, phoneCode);
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error || "Numéro de téléphone invalide");
      return;
    }

    setLoading(true);

    try {
      const fullPhone = formatFullPhoneNumber(phone, phoneCode);

      // Update private_info with phone
      const { error: privateInfoError } = await supabase
        .from("private_info")
        .upsert({ 
          id: userId, 
          phone: fullPhone 
        }, { 
          onConflict: "id" 
        });

      if (privateInfoError) throw privateInfoError;

      // Update profile with role
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId);

      if (profileError) throw profileError;

      toast.success("Profil complété !");
      onComplete();
    } catch (error: any) {
      console.error("Error completing profile:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md bg-card shadow-lg rounded-2xl border-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-xl font-semibold">
            Complétez votre profil
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Quelques informations pour finaliser votre inscription
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Phone number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone *</Label>
            <div className="flex gap-2">
              <div className="w-44">
                <SearchableSelect
                  options={phoneCodeOptions}
                  value={phoneCode}
                  onValueChange={setPhoneCode}
                  placeholder="Indicatif"
                  searchPlaceholder="Rechercher un pays..."
                  emptyMessage="Aucun pays trouvé."
                  triggerClassName="h-11"
                />
              </div>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="6 12 34 56 78"
                className="h-11 flex-1"
                required
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Recherchez votre pays pour sélectionner l'indicatif.
            </p>
          </div>

          {/* Role selection as cards */}
          <div className="space-y-2">
            <Label>Je veux commencer par *</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Traveler option */}
              <button
                type="button"
                onClick={() => setRole("traveler")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  role === "traveler"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                  role === "traveler" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <Plane className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm block">Voyager</span>
                <span className="text-xs text-muted-foreground">(Transporteur)</span>
              </button>

              {/* Sender option */}
              <button
                type="button"
                onClick={() => setRole("sender")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  role === "sender"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                  role === "sender" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <Package className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm block">Expédier</span>
                <span className="text-xs text-muted-foreground">(Envoyer un colis)</span>
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Pas d'inquiétude, vous pourrez changer de rôle plus tard.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium" 
            disabled={loading || !phone}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validation...
              </>
            ) : (
              "Valider mon profil"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
