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

const authSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
  phone: z.string().optional(), // On valide manuellement la concaténation
});

type AuthView = "login" | "signup" | "reset_password";

// Liste des indicatifs
const COUNTRY_CODES = [
  { code: "+33", label: "🇫🇷 France (+33)" },
  { code: "+213", label: "🇩🇿 Algérie (+213)" },
  { code: "+216", label: "🇹🇳 Tunisie (+216)" },
  { code: "+212", label: "🇲🇦 Maroc (+212)" },
  { code: "+32", label: "🇧🇪 Belgique (+32)" },
  { code: "+1", label: "🇨🇦 Canada (+1)" },
];

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") as "traveler" | "sender" | null;

  const [view, setView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Nouvel état pour l'indicatif
  const [phoneCode, setPhoneCode] = useState("+33");

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

      if (data?.role === "traveler") {
        if (targetShipmentId) {
          localStorage.removeItem("targetShipmentId");
          navigate(`/dashboard/traveler?highlight=${targetShipmentId}`);
        } else {
          navigate("/dashboard/traveler");
        }
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
        redirectTo: window.location.origin + "/profile",
      });
      if (error) throw error;
      toast.success("Email de réinitialisation envoyé !");
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

        // On combine l'indicatif et le numéro
        const fullPhone = `${phoneCode}${formData.phone.replace(/^0+/, "")}`; // Enlève le premier 0 si présent

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: formData.role,
              phone: fullPhone, // On envoie le numéro complet
            },
          },
        });

        if (error) throw error;
        toast.success("Compte créé !");

        if (data.session) {
          await handleSmartRedirect(data.user!.id);
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
    if (view === "reset_password") return "Réinitialisation";
    return view === "login" ? "Connexion" : "Créer mon compte";
  };

  const getDescription = () => {
    if (view === "reset_password") return "Entrez votre email pour recevoir un lien.";
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
            <LogoEdiM3ak iconSize="lg" onClick={() => navigate("/")} />
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
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Envoyer le lien"}
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
                      <select
                        className="w-24 h-11 px-2 border border-input rounded-md bg-background text-sm"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code}
                          </option>
                        ))}
                      </select>
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
                    <p className="text-[10px] text-muted-foreground">Sélectionnez l'indicatif de votre pays.</p>
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
    </div>
  );
};

export default Auth;
