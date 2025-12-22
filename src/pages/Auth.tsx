import { useState, useEffect, useRef } from "react";
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
import { SocialLoginCompletionModal } from "@/components/SocialLoginCompletionModal";

const authSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
  phone: z.string().optional(),
});

type AuthView = "login" | "signup" | "reset_password";

const phoneCodeOptions = getPhoneCodeOptions();

// Google icon SVG
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z"
      fill="#EA4335"
    />
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") as "traveler" | "sender" | null;
  const viewFromUrl = searchParams.get("view") as AuthView | null;

  const [view, setView] = useState<AuthView>(viewFromUrl === "signup" ? "signup" : "login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSocialCompletion, setShowSocialCompletion] = useState(false);
  const [socialUserId, setSocialUserId] = useState<string>("");
  // Use ref instead of state to prevent race condition with onAuthStateChange
  const isNewSignupRef = useRef(false);

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

  // Check if user needs to complete profile (social login without phone)
  // Check if user needs to complete profile (social login without phone)
  // Admins are excluded from this check
  const checkSocialLoginCompletion = async (userId: string) => {
    try {
      // First check if user is admin - admins don't need to complete profile
      const { data: isAdminResult } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });

      if (isAdminResult) {
        return false; // Admin, no completion needed
      }

      const { data: privateInfo } = await supabase.from("private_info").select("phone").eq("id", userId).maybeSingle();

      // If no phone number, show completion modal
      if (!privateInfo?.phone) {
        setSocialUserId(userId);
        setShowSocialCompletion(true);
        return true; // needs completion
      }
      return false; // profile complete
    } catch (error) {
      console.error("Error checking profile completion:", error);
      return false;
    }
  };

  useEffect(() => {
    // 1. Vérif session classique (only for returning users, not new signups)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && !isNewSignupRef.current) {
        // Check if social login needs completion
        const needsCompletion = await checkSocialLoginCompletion(session.user.id);
        if (!needsCompletion) {
          handleSmartRedirect(session.user.id);
        }
      }
    });

    // 2. Écouteur d'événements (C'est ici qu'on gère le cas Mobile)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // On ne gère ici que la récupération de mot de passe pour éviter
      // de rediriger automatiquement après un SIGNED_IN (qui ferme le modal onboarding)
      if (event === "PASSWORD_RECOVERY") {
        navigate("/profile");
      }

      // Handle social login return (SIGNED_IN event from OAuth)
      if (event === "SIGNED_IN" && session && !isNewSignupRef.current) {
        const needsCompletion = await checkSocialLoginCompletion(session.user.id);
        if (!needsCompletion) {
          handleSmartRedirect(session.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

        if (data.session) {
          // Mark as new signup IMMEDIATELY (ref updates sync) to prevent auto-redirect
          isNewSignupRef.current = true;
          toast.success("Compte créé !");
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Erreur avec Google");
      setLoading(false);
    }
  };

  const handleSocialCompletionDone = () => {
    setShowSocialCompletion(false);
    setShowOnboarding(true);
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
            <div className="space-y-4">
              {/* Social Auth Buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 flex items-center justify-center gap-3 border-border hover:bg-muted/50"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <GoogleIcon />
                  <span>Continuer avec Google</span>
                </Button>
              </div>

              {/* Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

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
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="w-full sm:w-44">
                          <SearchableSelect
                            options={phoneCodeOptions}
                            value={phoneCode}
                            onValueChange={setPhoneCode}
                            placeholder="Indicatif"
                            searchPlaceholder="Rechercher..."
                            emptyMessage="Aucun pays trouvé."
                            triggerClassName="h-11 w-full"
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
                      <p className="text-[10px] text-muted-foreground">
                        Recherchez votre pays pour sélectionner l'indicatif.
                      </p>
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
            </div>
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
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* Social Login Completion Modal - for Google/Facebook signups missing phone */}
      <SocialLoginCompletionModal
        isOpen={showSocialCompletion}
        userId={socialUserId}
        onComplete={handleSocialCompletionDone}
      />
    </div>
  );
};

export default Auth;
