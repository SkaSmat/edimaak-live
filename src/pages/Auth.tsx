import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { AuthLogo } from "@/components/LogoIcon";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getPhoneCodeOptions, getPhoneCodeById } from "@/lib/countryData";
import { validatePhoneNumber, formatFullPhoneNumber } from "@/lib/phoneValidation";
import { OnboardingModal } from "@/components/OnboardingModal";

const authSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
  phone: z.string().optional(),
});

type AuthView = "login" | "signup" | "reset_password";

const phoneCodeOptions = getPhoneCodeOptions();

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") as "traveler" | "sender" | null;
  const viewFromUrl = searchParams.get("view") as AuthView | null;

  const [view, setView] = useState<AuthView>(viewFromUrl === "signup" ? "signup" : "login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewSignup, setIsNewSignup] = useState(false);

  // État pour l'indicatif (stocke l'id du pays, ex: "FR")
  const [phoneCode, setPhoneCode] = useState("FR");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: roleFromUrl || "sender",
  });

  // Redirection intelligente
  const handleSmartRedirect = async (userId: string) => {
    try {
      const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();

      const targetShipmentId = localStorage.getItem("targetShipmentId");

      if (data?.role === "traveler") {
        if (targetShipmentId) {
          localStorage.removeItem("targetShipmentId");
          navigate(`/dashboard/traveler?highlight=${targetShipmentId}`);
        } else {
          navigate("/dashboard/traveler");
        }
      } else if (data?.role === "sender") {
        // If sender clicked on a shipment, propose to switch to traveler
        if (targetShipmentId) {
          localStorage.setItem("pendingShipmentSwitch", targetShipmentId);
          navigate("/dashboard/sender");
        } else {
          navigate("/dashboard/sender");
        }
      } else if (data?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Erreur redirection:", error);
      navigate("/");
    }
  };

  useEffect(() => {
    // 1. Vérif session classique (only for returning users, not new signups)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isNewSignup) handleSmartRedirect(session.user.id);
    });

    // 2. Écouteur d'événements (C'est ici qu'on gère le cas Mobile)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only redirect for login, NOT for new signups (they see the onboarding modal)
      if (event === "SIGNED_IN" && session && !isNewSignup) {
        handleSmartRedirect(session.user.id);
      }
      // AJOUT : Si c'est une récupération de mot de passe, on file direct au profil
      if (event === "PASSWORD_RECOVERY") {
        navigate("/profile");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isNewSignup]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("📧 Lien de réinitialisation envoyé par email !");
      toast.info("Cliquez sur le lien pour créer un nouveau mot de passe.", { duration: 5000 });
      setView("login");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast.success("Connexion réussie !");
        if (data.user) await handleSmartRedirect(data.user.id);
      } else if (view === "signup") {
        if (!formData.phone) throw new Error("Le numéro de téléphone est obligatoire.");

        // Validation du numéro de téléphone
        const phoneValidation = validatePhoneNumber(formData.phone, phoneCode);
        if (!phoneValidation.isValid) {
          throw new Error(phoneValidation.error || "Numéro de téléphone invalide");
        }

        // Construire le numéro complet avec indicatif
        const fullPhone = formatFullPhoneNumber(formData.phone, phoneCode);

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: formData.role,
              phone: fullPhone,
            },
          },
        });

        if (error) throw error;
        toast.success("Compte créé !");

        if (data.session) {
          // Mark as new signup to prevent auto-redirect from onAuthStateChange
          setIsNewSignup(true);
          // Show onboarding modal for new signups instead of direct redirect
          setShowOnboarding(true);
        } else {
          toast.info("Vérifiez vos emails pour confirmer le compte.");
        }
      }
    } catch (error: any) {
      if (error.message.includes("already registered")) {
        toast.error("Cet email a déjà un compte. Connectez-vous !");
        setView("login");
      } else {
        toast.error(error.message || "Une erreur est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (view === "reset_password") return "Mot de passe oublié ?";
    return view === "login" ? "Connexion" : "Créer mon compte";
  };

  const getDescription = () => {
    if (view === "reset_password") return "Entrez votre email pour recevoir un lien de réinitialisation.";
    return view === "login" ? "Connecte-toi à ton compte EdiM3ak." : "Un seul compte pour voyager et expédier.";
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl border-0">
        <CardHeader className="text-center pb-2 relative">
          {view === "reset_password" && (
            <Button variant="ghost" size="icon" className="absolute left-4 top-4" onClick={() => setView("login")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          <div className="flex justify-center mb-4">
            <AuthLogo size={64} onClick={() => navigate("/")} />
          </div>
          <CardTitle className="text-2xl font-semibold">{getTitle()}</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">{getDescription()}</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {view === "reset_password" ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email associé au compte</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="vous@example.com"
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Envoyer le lien de réinitialisation"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {view === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      placeholder="Jean Dupont"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Je veux commencer par *</Label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as "traveler" | "sender" })}
                      className="w-full h-11 px-3 py-2 border border-input rounded-md bg-background text-sm"
                    >
                      <option value="traveler">Voyager (Transporteur)</option>
                      <option value="sender">Expédier (Envoyer un colis)</option>
                    </select>
                    <p className="text-[10px] text-muted-foreground">
                      Pas d'inquiétude, vous pourrez changer de rôle plus tard avec le même compte.
                    </p>
                  </div>

                  {/* SÉLECTEUR DE PAYS + TÉLÉPHONE */}
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
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="6 12 34 56 78"
                        className="h-11 flex-1"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Recherchez votre pays pour sélectionner l'indicatif.</p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="vous@example.com"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe *</Label>
                  {view === "login" && (
                    <button
                      type="button"
                      onClick={() => setView("reset_password")}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : view === "login" ? (
                  "Se connecter"
                ) : (
                  "Créer mon compte"
                )}
              </Button>
            </form>
          )}

          {view !== "reset_password" && (
            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {view === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setView(view === "login" ? "signup" : "login")}
                className="w-full"
              >
                {view === "login" ? "Créer un compte" : "Se connecter"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Modal for new signups */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
    </div>
  );
};

export default Auth;
