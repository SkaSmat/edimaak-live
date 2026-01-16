import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getPhoneCodeOptions } from "@/lib/countryData";
import { validatePhoneNumber, formatFullPhoneNumber } from "@/lib/phoneValidation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plane, Package, Shield, LogOut } from "lucide-react";
import { AuthLogo } from "@/components/LogoIcon";

const phoneCodeOptions = getPhoneCodeOptions();

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [phoneCode, setPhoneCode] = useState("FR");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"traveler" | "sender">("sender");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Not logged in, redirect to auth
        navigate("/auth");
        return;
      }

      // Check if profile is already complete
      const { data: privateInfo } = await supabase
        .from("private_info")
        .select("phone")
        .eq("id", session.user.id)
        .maybeSingle();

      if (privateInfo?.phone) {
        // Already complete, redirect to dashboard
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.role === "traveler") {
          navigate("/dashboard/traveler");
        } else if (profile?.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard/sender");
        }
        return;
      }

      setUserId(session.user.id);
      setCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !userId) {
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

      toast.success("Profil complété avec succès !");

      // Redirect based on role
      if (role === "traveler") {
        navigate("/dashboard/traveler");
      } else {
        navigate("/dashboard/sender");
      }
    } catch (error: any) {
      console.error("Error completing profile:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <AuthLogo size={64} onClick={() => {}} />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Complétez votre profil
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Quelques informations pour finaliser votre inscription
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Security notice */}
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg mb-6">
            <Shield className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Ces informations sont nécessaires pour sécuriser votre compte et vous permettre d'utiliser la plateforme.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Logout option */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="w-full mt-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Changer de compte
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
