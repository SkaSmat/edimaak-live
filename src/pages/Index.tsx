import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Plane, Package, MessageSquare, Shield, Clock, Users } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-8">
              <Plane className="w-12 h-12 text-primary" />
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground">
                EdiM3ak
              </h1>
            </div>
            
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              La plateforme qui fait voyager tes colis avec les passagers de confiance
            </h2>
            
            <p className="text-lg lg:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Connecte les voyageurs France-Algérie avec ceux qui souhaitent envoyer des colis.
              Simple, rapide et économique.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/auth?role=sender")}
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-6"
              >
                <Package className="mr-2" />
                Je suis expéditeur
              </Button>
              <Button
                onClick={() => navigate("/auth?role=traveler")}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-6"
              >
                <Plane className="mr-2" />
                Je suis voyageur
              </Button>
            </div>

            <div className="mt-8">
              <p className="text-sm text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <Button
                  variant="link"
                  className="text-primary p-0 h-auto"
                  onClick={() => navigate("/auth")}
                >
                  Se connecter
                </Button>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Trois étapes simples pour envoyer ou transporter des colis
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Je publie ma demande</h3>
              <p className="text-muted-foreground">
                Crée une demande d'expédition avec les détails de ton colis et tes dates.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Plane className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Un voyageur propose</h3>
              <p className="text-muted-foreground">
                Un voyageur compatible avec ton trajet te propose de transporter ton colis.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Nous convenons ensemble</h3>
              <p className="text-muted-foreground">
                Discute directement avec le voyageur pour convenir des détails et du prix.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi utiliser EdiM3ak */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
            Pourquoi utiliser EdiM3ak ?
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Une solution pensée pour simplifier l'envoi de colis entre la France et l'Algérie
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Simple et rapide</h3>
              <p className="text-muted-foreground">
                Mise en relation instantanée avec des voyageurs compatibles. Pas de procédures
                compliquées, juste quelques clics.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Économique</h3>
              <p className="text-muted-foreground">
                Profite des trajets déjà existants. Une solution avantageuse pour les expéditeurs
                et rentable pour les voyageurs.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Plus humain</h3>
              <p className="text-muted-foreground">
                Discussion directe entre personnes. Créez des liens de confiance et convenez
                ensemble des modalités.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
            Questions fréquentes
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Tout ce que vous devez savoir sur EdiM3ak
          </p>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  Comment fonctionne la mise en relation ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Les expéditeurs publient leurs demandes d'envoi de colis avec les détails (villes,
                  dates, poids). Les voyageurs publient leurs trajets. Notre plateforme identifie
                  automatiquement les correspondances compatibles et permet aux deux parties de
                  discuter directement pour convenir des modalités.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  Est-ce que c'est sécurisé ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  EdiM3ak facilite la mise en relation entre voyageurs et expéditeurs. Nous
                  recommandons de toujours discuter en détail avec votre correspondant, de vérifier
                  le contenu du colis et de convenir des modalités qui vous conviennent. La
                  confiance et la communication sont essentielles.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  Comment se passe le paiement ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Le prix et les modalités de paiement sont convenus directement entre l'expéditeur
                  et le voyageur lors de leur discussion. EdiM3ak ne gère pas les paiements, ce qui
                  vous laisse la liberté de choisir le mode qui vous convient le mieux.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Rejoins la communauté EdiM3ak dès aujourd'hui
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/auth?role=sender")}
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Je suis expéditeur
            </Button>
            <Button
              onClick={() => navigate("/auth?role=traveler")}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
            >
              Je suis voyageur
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
