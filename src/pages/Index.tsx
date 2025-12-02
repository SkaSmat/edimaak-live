import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Plane, Package } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Redirect to dashboard based on role
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role === "traveler") {
              navigate("/dashboard/traveler");
            } else if (data?.role === "sender") {
              navigate("/dashboard/sender");
            } else if (data?.role === "admin") {
              navigate("/admin");
            }
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-2 mb-6">
            <Plane className="w-10 h-10 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              ColisVoyage
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connectez les voyageurs France-Algérie avec ceux qui souhaitent envoyer des colis.
            Une solution simple, rapide et économique.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <div className="group relative overflow-hidden rounded-2xl bg-card p-8 shadow-lg hover:shadow-glow transition-all duration-500 animate-in fade-in slide-in-from-left-8 delay-200">
            <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
            <Plane className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-3">Je suis voyageur</h2>
            <p className="text-muted-foreground mb-6">
              Vous voyagez entre la France et l'Algérie ? Rentabilisez votre voyage en transportant
              des colis.
            </p>
            <Button
              onClick={() => navigate("/auth?role=traveler")}
              className="w-full group-hover:scale-105 transition-transform"
            >
              Commencer
            </Button>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-card p-8 shadow-lg hover:shadow-glow transition-all duration-500 animate-in fade-in slide-in-from-right-8 delay-300">
            <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
            <Package className="w-12 h-12 text-accent mb-4" />
            <h2 className="text-2xl font-bold mb-3">Je suis expéditeur</h2>
            <p className="text-muted-foreground mb-6">
              Vous souhaitez envoyer un colis ? Trouvez un voyageur qui se rend à votre destination.
            </p>
            <Button
              onClick={() => navigate("/auth?role=sender")}
              variant="secondary"
              className="w-full group-hover:scale-105 transition-transform"
            >
              Commencer
            </Button>
          </div>
        </div>

        {/* Already have account */}
        <div className="text-center animate-in fade-in delay-500">
          <p className="text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Button
              variant="link"
              className="text-primary hover:text-primary-glow p-0"
              onClick={() => navigate("/auth")}
            >
              Se connecter
            </Button>
          </p>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              title: "Rapide",
              description: "Trouvez des correspondances en quelques clics",
            },
            {
              title: "Sécurisé",
              description: "Échangez directement avec vos correspondants",
            },
            {
              title: "Économique",
              description: "Des tarifs avantageux pour tous",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${600 + i * 100}ms` }}
            >
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
