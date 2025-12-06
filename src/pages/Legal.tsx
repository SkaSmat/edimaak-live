import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Shield, FileText, Lock } from "lucide-react";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";

const Legal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"mentions" | "cgu" | "privacy">("cgu");

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header Simple */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <LogoEdiM3ak iconSize="md" onClick={() => navigate("/")} />
          </div>
          <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">
            Centre Juridique
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Navigation Mobile (Tabs horizontaux) */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-border scrollbar-hide">
          <button
            onClick={() => setActiveTab("cgu")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "cgu" 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Scale className="w-4 h-4" />
            CGU
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "privacy" 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Lock className="w-4 h-4" />
            Confidentialité
          </button>
          <button
            onClick={() => setActiveTab("mentions")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === "mentions" 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            Mentions
          </button>
        </div>

        <div className="grid md:grid-cols-[250px_1fr] gap-8">
          
          {/* Navigation Latérale Desktop */}
          <nav className="hidden md:block space-y-2 sticky top-24 h-fit">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">
              Documents
            </p>
            
            <button
              onClick={() => setActiveTab("cgu")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "cgu" 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Scale className="w-4 h-4" />
              Conditions Générales (CGU)
            </button>

            <button
              onClick={() => setActiveTab("privacy")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "privacy" 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Lock className="w-4 h-4" />
              Politique de Confidentialité
            </button>

            <button
              onClick={() => setActiveTab("mentions")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "mentions" 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <FileText className="w-4 h-4" />
              Mentions Légales
            </button>
          </nav>

          {/* Contenu */}
          <div className="bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border min-h-[60vh]">
            
            {activeTab === "cgu" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="border-b border-border pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Conditions Générales d'Utilisation</h2>
                  <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : Décembre 2025</p>
                </div>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">1. Objet et Rôle d'EdiM3ak</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    EdiM3ak est une plateforme technique de mise en relation entre particuliers. 
                    <span className="font-bold text-foreground"> Nous ne sommes ni transporteurs, ni commissionnaires de transport.</span> 
                    Notre rôle se limite à héberger les annonces et faciliter la prise de contact.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">2. Interdictions Strictes (Douanes)</h3>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
                    <p className="font-bold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Tolérance Zéro
                    </p>
                    Il est strictement interdit de demander ou d'accepter le transport de :
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Stupéfiants, drogues ou substances psychotropes.</li>
                      <li>Armes, munitions, explosifs.</li>
                      <li>Produits de contrefaçon.</li>
                      <li>Sommes d'argent liquide supérieures aux seuils légaux.</li>
                      <li>Médicaments sans ordonnance nominative.</li>
                    </ul>
                    Le Voyageur s'engage à <strong>toujours vérifier le contenu</strong> du colis avant de l'accepter. Il est seul responsable devant les autorités douanières.
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">3. Responsabilités</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    EdiM3ak décline toute responsabilité en cas de :
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Perte, vol ou détérioration du colis durant le voyage.</li>
                      <li>Annulation du voyage par le Voyageur.</li>
                      <li>Non-conformité de l'objet remis par l'Expéditeur.</li>
                    </ul>
                    Les transactions financières et les accords de dédommagement relèvent de la responsabilité privée des utilisateurs.
                  </p>
                </section>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="border-b border-border pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Politique de Confidentialité</h2>
                  <p className="text-sm text-muted-foreground mt-1">Protection de vos données (RGPD)</p>
                </div>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">1. Données Collectées</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pour assurer la sécurité de la communauté (KYC), nous collectons :
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Informations d'identité (Nom, Prénom, Pièce d'identité).</li>
                      <li>Coordonnées (Téléphone, Email).</li>
                      <li>Détails des voyages et des colis.</li>
                    </ul>
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">2. Stockage Sécurisé</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Vos données sensibles (pièce d'identité, adresse exacte) sont stockées dans une table sécurisée (<code className="bg-muted px-1 rounded">private_info</code>) et ne sont jamais affichées publiquement. Seuls vous et les administrateurs habilités y avez accès pour validation.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">3. Vos Droits</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Vous pouvez à tout moment demander la suppression complète de votre compte et de vos données en contactant le support ou via le bouton "Supprimer mon compte" dans votre profil.
                  </p>
                </section>
              </div>
            )}

            {activeTab === "mentions" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="border-b border-border pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Mentions Légales</h2>
                </div>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Éditeur du site</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <strong className="text-foreground">Nom du projet :</strong> EdiM3ak<br/>
                    <strong className="text-foreground">Statut :</strong> Plateforme en version Bêta (MVP)<br/>
                    <strong className="text-foreground">Contact :</strong> contact@edim3ak.com<br/>
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Hébergement</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Ce site est hébergé par <strong className="text-foreground">Lovable / Netlify / Vercel</strong> (selon ton déploiement final).<br/>
                    Les données sont stockées par <strong className="text-foreground">Supabase</strong> (AWS Europe).
                  </p>
                </section>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default Legal;
