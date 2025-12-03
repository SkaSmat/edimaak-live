import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react"; // Ajout des icônes
import { z } from "zod";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";

// Mise à jour du schéma : Téléphone obligatoire pour la sécurité
const authSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
  phone: z.string().min(8, "Numéro de téléphone invalide").optional(), // Devenu important
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") as "traveler" | "sender" | null;

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  // Nouvel état pour la visibilité du mot de passe
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: roleFromUrl || "sender",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserRole(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        checkUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserRole = (userId: string) => {
    supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        // On vérifie s'il y a un colis en mémoire
        const targetShipmentId = localStorage.getItem("targetShipmentId");

        if (data?.role === "traveler") {
          // Si on a un colis cible, on l'ajoute à l'URL
          if (targetShipmentId) {
            // On nettoie le storage pour ne pas que ça reste à vie
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
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const validated = authSchema.pick({ email: true, password: true }).parse(formData);
        const { error } = await supabase.auth.signInWithPassword({
          email: validated.email,
          password: validated.password,
        });

        if (error) throw error;
        toast.success("Connexion réussie !");
      } else {
        // Validation renforcée pour l'inscription
        if (!formData.phone) {
          throw new Error("Le numéro de téléphone est obligatoire pour la sécurité.");
        }

        const validated = authSchema.parse({
          ...formData,
          fullName: formData.fullName,
        });

        const { error } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            data: {
              full_name: validated.fullName,
              role: formData.role,
              phone: validated.phone, // On envoie le téléphone
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            throw new Error("Cet email est déjà utilisé");
          }
          throw error;
        }

        // Note: Le trigger SQL s'occupera de créer le profil,
        // mais pour le téléphone dans private_info, on compte sur la page Profile.tsx
        // ou on pourrait l'ajouter ici si on avait accès direct à la table.
        // Pour l'instant, on laisse l'utilisateur le confirmer sur son profil.

        toast.success("Compte créé avec succès ! Vérifiez vos emails.");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <LogoEdiM3ak iconSize="lg" onClick={() => navigate("/")} />
          </div>

          <CardTitle className="text-2xl font-semibold">{isLogin ? "Connexion" : "Créer mon compte"}</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            {isLogin
              ? "Connecte-toi à ton compte EdiM3ak pour retrouver tes voyages et tes colis."
              : "Crée ton compte EdiM3ak pour transporter des colis lors de tes voyages."}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required={!isLogin}
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
                    className="w-full h-11 px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                    placeholder="+33 6 12 34 56 78"
                    className="h-11"
                    required={!isLogin}
                  />
                  <p className="text-[10px] text-muted-foreground">Requis pour la vérification KYC.</p>
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
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="password"
                  // C'est ici que la magie opère
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="••••••••"
                  className="h-11 pr-10" // pr-10 laisse de la place pour l'icône
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : isLogin ? (
                "Se connecter"
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {isLogin ? "Pas encore de compte ?" : "Déjà inscrit ?"}
            </p>
            <Button type="button" variant="outline" onClick={() => setIsLogin(!isLogin)} className="w-full">
              {isLogin ? "Créer un compte" : "Se connecter"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
