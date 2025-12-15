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
      <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : 15 décembre 2025</p>
    </div>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Introduction</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        EdiMaak s'engage à protéger la confidentialité de vos données personnelles. 
        Cette politique décrit comment nous collectons, utilisons et protégons vos informations 
        lorsque vous utilisez notre plateforme de mise en relation entre voyageurs et expéditeurs de colis.
      </p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">1. Données Collectées</h3>
      
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-3">
        <p className="font-semibold text-foreground text-sm mb-2">
          Via connexion Google ou Facebook (OAuth)
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li><strong>Nom et prénom</strong> : pour créer votre profil utilisateur</li>
          <li><strong>Adresse email</strong> : pour l'authentification et les communications liées au service</li>
          <li><strong>Photo de profil</strong> (optionnel) : pour personnaliser votre profil</li>
        </ul>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed">
        Pour vérifier votre identité (KYC), nous collectons également :
      </p>
      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
        <li><strong>Pièce d'identité</strong> : pour la sécurité de tous les utilisateurs</li>
        <li><strong>Numéro de téléphone</strong> : pour les communications relatives aux transactions</li>
        <li><strong>Détails des voyages et des colis</strong> : pour faciliter la mise en relation</li>
      </ul>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">2. Utilisation des Données</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Vos données sont utilisées uniquement pour :
      </p>
      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
        <li>Créer et gérer votre compte EdiMaak</li>
        <li>Faciliter la mise en relation entre voyageurs et expéditeurs</li>
        <li>Vérifier votre identité pour la sécurité de la plateforme</li>
        <li>Vous envoyer des notifications concernant vos annonces et transactions</li>
        <li>Améliorer nos services</li>
      </ul>
      <p className="text-sm font-bold text-foreground mt-3">
        ⚠️ Nous ne vendons jamais vos données à des tiers.
      </p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">3. Partage des Données</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Vos informations de profil (nom, photo) sont visibles par les autres utilisateurs 
        uniquement lorsque vous publiez une annonce ou contactez un autre utilisateur. 
        <strong className="text-foreground"> Vos données de KYC (pièce d'identité, adresse exacte) restent strictement confidentielles</strong> et 
        ne sont jamais partagées avec d'autres utilisateurs.
      </p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">4. Sécurité et Stockage</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Vos données sont stockées de manière sécurisée via <strong className="text-foreground">Supabase</strong> (infrastructure AWS Europe), 
        notre fournisseur d'infrastructure qui respecte les normes de sécurité les plus élevées (ISO 27001, SOC 2). 
        Toutes les communications sont chiffrées via HTTPS.
      </p>
      <p className="text-muted-foreground text-sm leading-relaxed mt-2">
        Vos données sensibles (pièce d'identité) sont stockées dans une table sécurisée séparée 
        et ne sont accessibles qu'aux administrateurs habilités pour validation KYC.
      </p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">5. Conservation des Données</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Vos données sont conservées tant que votre compte est actif. Vous pouvez demander 
        la suppression de votre compte et de toutes vos données à tout moment en nous contactant 
        ou via le bouton "Supprimer mon compte" dans votre profil.
      </p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">6. Vos Droits (RGPD)</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
      </p>
      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
        <li><strong>Droit d'accès</strong> : consulter les données que nous détenons sur vous</li>
        <li><strong>Droit de rectification</strong> : corriger vos informations personnelles</li>
        <li><strong>Droit à l'effacement</strong> : supprimer votre compte et vos données</li>
        <li><strong>Droit à la portabilité</strong> : récupérer vos données dans un format exploitable</li>
        <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
      </ul>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">7. Cookies</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        EdiMaak utilise uniquement des cookies essentiels pour le fonctionnement du site 
        (session d'authentification). Nous n'utilisons pas de cookies publicitaires ou de tracking tiers.
      </p>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">8. Contact</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez-nous :
      </p>
      <div className="bg-muted p-3 rounded-lg text-sm">
        <p className="text-foreground">
          <strong>Email :</strong> <a href="mailto:contact@edimaak.com" className="text-primary hover:underline">contact@edimaak.com</a>
        </p>
        <p className="text-foreground mt-1">
          <strong>Site web :</strong> <a href="https://edimaak.com" className="text-primary hover:underline">https://edimaak.com</a>
        </p>
      </div>
    </section>

    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">9. Modifications</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
        Les modifications seront publiées sur cette page avec une date de mise à jour actualisée.
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
