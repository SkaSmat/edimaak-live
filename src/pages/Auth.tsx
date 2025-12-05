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
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";

// Schéma de validation
const authSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
  phone: z.string().min(8, "Numéro de téléphone invalide").optional(),
});

type AuthView = "login" | "signup" | "reset_password";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") as "traveler" | "sender" | null;

  // On gère maintenant 3 vues : connexion, inscription, mot de passe oublié
  const [view, setView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
      const targetShipmentId = localStorage.getItem("targetShipmentId");

      // Si un shipment était sélectionné avant login, rediriger vers la landing avec highlight
      if (targetShipmentId) {
        localStorage.removeItem("targetShipmentId");
        navigate(`/?highlight=${targetShipmentId}`);
        return;
      }

      if (data?.role === "traveler") {
        navigate("/dashboard/traveler");
      } else if (data?.role === "sender") {
        navigate("/dashboard/sender");
      } else if (data?.role === "admin") {
        navigate("/admin");
      }
    } catch (error) {
      console.error("Erreur redirection:", error);
      navigate("/");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSmartRedirect(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) handleSmartRedirect(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: window.location.origin + "/profile", // Redirige vers le profil pour changer le MDP
      });
      if (error) throw error;
      toast.success("Email de réinitialisation envoyé ! Vérifiez vos spams.");
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

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: formData.role,
              phone: formData.phone,
            },
          },
        });

        if (error) throw error;
        toast.success("Compte créé !");

        // Si l'auto-confirm est activé, on connecte direct. Sinon on prévient.
        if (data.session) {
          await handleSmartRedirect(data.user!.id);
        } else {
          toast.info("Vérifiez vos emails pour confirmer le compte.");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // TITRE DYNAMIQUE
  const getTitle = () => {
    if (view === "reset_password") return "Réinitialisation";
    return view === "login" ? "Connexion" : "Créer mon compte";
  };

  const getDescription = () => {
    if (view === "reset_password") return "Entrez votre email pour recevoir un lien de réinitialisation.";
    return view === "login"
      ? "Connecte-toi à ton compte EdiM3ak."
      : "Crée ton compte pour commencer à utiliser EdiM3ak.";
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
            <LogoEdiM3ak iconSize="lg" onClick={() => navigate("/")} />
          </div>
          <CardTitle className="text-2xl font-semibold">{getTitle()}</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">{getDescription()}</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {/* VUE MOT DE PASSE OUBLIÉ */}
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
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Envoyer le lien"}
              </Button>
            </form>
          ) : (
            /* VUE LOGIN / SIGNUP */
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
                    <Label htmlFor="role">Type de compte *</Label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as "traveler" | "sender" })}
                      className="w-full h-11 px-3 py-2 border border-input rounded-md bg-background text-sm"
                    >
                      <option value="traveler">Voyageur</option>
                      <option value="sender">Expéditeur</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+33 6..."
                      className="h-11"
                      required
                    />
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

          {/* Switch Login/Signup (caché si on est en mode reset) */}
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
    </div>
  );
};

export default Auth;
