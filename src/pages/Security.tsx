import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Camera, 
  MessageSquare, 
  Scale, 
  Lock, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight,
  CheckCircle,
  Clock,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Security = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: "Publication de l'annonce",
      items: [
        "L'expéditeur crée son annonce (description, photos, destination)",
        "Le voyageur propose ses dates et itinéraire",
        "Vérification KYC obligatoire des deux parties ✅"
      ]
    },
    {
      number: 2,
      title: "Mise en relation",
      items: [
        "Chat sécurisé dans l'application",
        "Accord sur les modalités (lieu, date, prix)",
        "Photos du colis obligatoires avant remise"
      ]
    },
    {
      number: 3,
      title: "Remise du colis",
      items: [
        "Photo du colis scellé avec l'expéditeur",
        "Le voyageur confirme la prise en charge dans l'app",
        "Suivi en temps réel du trajet"
      ]
    },
    {
      number: 4,
      title: "Livraison et paiement",
      items: [
        "Photo de la livraison au destinataire",
        "Confirmation de réception dans l'app",
        "Paiement libéré au voyageur après validation"
      ]
    }
  ];

  const securityMeasures = [
    {
      icon: Lock,
      title: "Vérification d'identité (KYC)",
      description: "Tous les utilisateurs doivent fournir une pièce d'identité valide avant toute transaction"
    },
    {
      icon: Camera,
      title: "Photos obligatoires",
      description: "Prise de photos avant/après obligatoire pour tracer le colis"
    },
    {
      icon: MessageSquare,
      title: "Chat sécurisé",
      description: "Toutes les conversations sont enregistrées dans l'application"
    },
    {
      icon: Scale,
      title: "Médiation en cas de litige",
      description: "Notre équipe arbitre gratuitement tout différend entre utilisateurs"
    }
  ];

  const upcomingFeatures = [
    "Paiement en ligne avec blocage des fonds (escrow)",
    "Assurance automatique incluse",
    "Augmentation de la limite de valeur",
    "Système de réputation voyageurs certifiés"
  ];

  const faqItems = [
    {
      question: "Que se passe-t-il si le colis est perdu/endommagé ?",
      answer: "Notre équipe intervient comme médiateur. Avec les photos avant/après et le KYC, nous pouvons identifier les responsabilités. En attendant notre système d'escrow, nous recommandons de limiter la valeur à 200€."
    },
    {
      question: "Comment être sûr que le voyageur est fiable ?",
      answer: "Vérification KYC obligatoire + système d'avis après chaque transaction. Bientôt : voyageurs certifiés \"Gold\" avec caution."
    },
    {
      question: "Quand et comment le voyageur est-il payé ?",
      answer: "Actuellement après livraison confirmée par le destinataire. Prochainement via notre système de paiement sécurisé automatique."
    },
    {
      question: "Puis-je annuler une transaction ?",
      answer: "Oui, tant que le colis n'a pas été remis au voyageur. Contactez l'autre partie via le chat."
    }
  ];

  // SEO meta tags
  useEffect(() => {
    document.title = "Sécurité et Garanties - EdiMaak";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Découvrez comment EdiMaak protège vos colis et garantit des transactions sécurisées entre voyageurs et expéditeurs France-Algérie");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-7xl h-16 md:h-20 flex items-center justify-between">
          <LogoEdiM3ak iconSize="lg" onClick={() => navigate("/")} />
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" onClick={() => navigate("/legal")} size="sm" className="text-gray-600 text-xs sm:text-sm">
              Mentions légales
            </Button>
            <Button onClick={() => navigate("/auth")} size="sm" className="rounded-full px-4 sm:px-6">
              Se connecter
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-white to-orange-50">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 mb-6">
            <Shield className="w-10 h-10 md:w-12 md:h-12 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 md:mb-6 leading-tight">
            Voyagez et expédiez vos colis <br className="hidden md:block" />
            en toute sécurité
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Edimaak met en place des mesures strictes pour protéger expéditeurs et voyageurs
          </p>
        </div>
      </section>

      {/* Section 1: Comment ça marche */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un processus simple et sécurisé en 4 étapes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {steps.map((step) => (
              <Card key={step.number} className="relative overflow-hidden border-2 hover:border-primary/30 transition-colors">
                <div className="absolute top-0 left-0 w-12 h-12 bg-primary rounded-br-2xl flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{step.number}</span>
                </div>
                <CardHeader className="pt-16 pb-2">
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {step.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Mesures de sécurité */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Mesures de sécurité actuelles
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Votre sécurité est notre priorité absolue
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityMeasures.map((measure, idx) => (
              <Card key={idx} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                    <measure.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{measure.title}</h3>
                  <p className="text-sm text-muted-foreground">{measure.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Limites et protections */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <Card className="border-2 border-amber-300 bg-amber-50/50">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-amber-900 mb-4">
                    Pour débuter en toute sécurité
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-amber-800">
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      <span><strong>Valeur maximale du colis :</strong> 200€</span>
                    </li>
                    <li className="flex items-center gap-2 text-amber-800">
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      <span><strong>Objets interdits :</strong> électronique, bijoux, argent liquide, objets fragiles de grande valeur</span>
                    </li>
                    <li className="flex items-center gap-2 text-amber-800">
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      <span><strong>Paiement :</strong> après livraison confirmée (en main propre ou virement)</span>
                    </li>
                    <li className="flex items-center gap-2 text-amber-800">
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      <span><strong>Assurance :</strong> responsabilité limitée selon nos CGU</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 4: Prochainement */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="relative overflow-hidden border-2 border-primary/20">
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Bientôt
              </Badge>
            </div>
            <CardContent className="p-6 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-8 h-8 text-primary" />
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                  Système de paiement sécurisé en développement
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {upcomingFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 5: FAQ */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg px-4 bg-gray-50/50">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary to-primary/80">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Rejoignez la communauté EdiMaak et profitez d'une expérience sécurisée
          </p>
          <Button 
            onClick={() => navigate("/dashboard/sender")} 
            size="lg"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-8 py-6 text-lg font-semibold shadow-xl"
          >
            Commencer en toute sécurité
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-4 mb-4 text-sm">
            <button onClick={() => navigate("/")} className="text-gray-500 hover:text-primary transition-colors">
              Accueil
            </button>
            <button onClick={() => navigate("/securite")} className="text-gray-500 hover:text-primary transition-colors">
              Sécurité
            </button>
            <button onClick={() => navigate("/legal")} className="text-gray-500 hover:text-primary transition-colors">
              Mentions légales
            </button>
          </div>
          <p className="text-xs text-gray-400">
            © 2025 EDIM3AK. La plateforme de confiance.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Security;
