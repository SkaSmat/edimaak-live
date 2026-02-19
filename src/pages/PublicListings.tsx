import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Package, Calendar, MapPin, ArrowRight, Weight, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";
import ShareButtons from "@/components/ShareButtons";

interface PublicShipment {
  id: string;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  earliest_date: string;
  latest_date: string;
  weight_kg: number;
  item_type: string;
  created_at: string;
}

const PublicListings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [shipments, setShipments] = useState<PublicShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const routeFilter = searchParams.get("route"); // e.g., "france-algerie"

  useEffect(() => {
    fetchPublicListings();
  }, [routeFilter]);

  const fetchPublicListings = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      let query = supabase
        .from("shipment_requests")
        .select("id, from_city, from_country, to_city, to_country, earliest_date, latest_date, weight_kg, item_type, created_at", { count: "exact" })
        .eq("status", "open")
        .gte("latest_date", today)
        .order("created_at", { ascending: false })
        .limit(50);

      // Apply route filter if present
      if (routeFilter) {
        const [from, to] = routeFilter.split("-");
        if (from) query = query.ilike("from_country", `%${from}%`);
        if (to) query = query.ilike("to_country", `%${to}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setShipments(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching public listings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate routes for SEO
  const routeCounts: Record<string, number> = {};
  shipments.forEach((s) => {
    const route = `${s.from_country} → ${s.to_country}`;
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <LogoEdiM3ak className="h-8" />
          </button>
          <Button onClick={() => navigate("/auth")} size="sm">
            S'inscrire / Se connecter
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* SEO-friendly heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Envoyer un colis entre particuliers
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {totalCount} demande{totalCount > 1 ? "s" : ""} d'expedition active{totalCount > 1 ? "s" : ""}.
            Trouvez un voyageur pour transporter votre colis en toute securite.
          </p>
        </div>

        {/* Popular routes for SEO internal linking */}
        {topRoutes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Trajets populaires</h2>
            <div className="flex flex-wrap gap-2">
              {topRoutes.map(([route, count]) => {
                const parts = route.split(" → ");
                const slug = `${parts[0]?.toLowerCase().replace(/\s+/g, "")}-${parts[1]?.toLowerCase().replace(/\s+/g, "")}`;
                return (
                  <button
                    key={route}
                    onClick={() => navigate(`/annonces?route=${slug}`)}
                    className="px-3 py-1.5 bg-white border rounded-full text-sm text-gray-700 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  >
                    {route} <span className="text-gray-400">({count})</span>
                  </button>
                );
              })}
              {routeFilter && (
                <button
                  onClick={() => navigate("/annonces")}
                  className="px-3 py-1.5 bg-gray-100 border rounded-full text-sm text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  Voir tout
                </button>
              )}
            </div>
          </div>
        )}

        {/* Listings */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Aucune annonce active</h3>
            <p className="text-gray-500 text-sm mb-4">Revenez bientot ou inscrivez-vous pour creer la premiere annonce.</p>
            <Button onClick={() => navigate("/auth")}>S'inscrire gratuitement</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {shipments.map((shipment) => (
              <article
                key={shipment.id}
                className="bg-white border rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">
                      {shipment.from_city} → {shipment.to_city}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(shipment.earliest_date), "d MMM", { locale: fr })} - {format(new Date(shipment.latest_date), "d MMM", { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Weight className="w-3.5 h-3.5" />
                        {shipment.weight_kg} kg
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        {shipment.item_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => navigate("/auth")}
                      size="sm"
                      className="gap-1"
                    >
                      Proposer mon voyage <ArrowRight className="w-4 h-4" />
                    </Button>
                    <ShareButtons
                      title={`Colis ${shipment.from_city} → ${shipment.to_city}`}
                      text={`Cherche un voyageur pour transporter un colis de ${shipment.from_city} vers ${shipment.to_city} (${shipment.weight_kg}kg)`}
                      url="https://edimaak.com/annonces"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* SEO content */}
        <section className="mt-12 border-t pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Comment envoyer un colis entre particuliers ?</h2>
          <div className="prose prose-sm text-gray-600 max-w-none">
            <p>
              EdiMaak met en relation des expediteurs et des voyageurs pour le transport de colis entre pays.
              Que vous souhaitiez envoyer un colis de France vers l'Algerie, du Maroc vers la Belgique, ou de
              Tunisie vers le Canada, notre plateforme vous connecte avec des voyageurs de confiance.
            </p>
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Les etapes</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Inscrivez-vous gratuitement sur EdiMaak</li>
              <li>Publiez votre demande d'expedition avec les details du colis</li>
              <li>Recevez des propositions de voyageurs compatibles</li>
              <li>Choisissez votre voyageur et organisez la remise</li>
            </ol>
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Trajets les plus demandes</h3>
            <p>
              Les trajets les plus populaires incluent France-Algerie, France-Maroc, France-Tunisie,
              Belgique-Algerie, Canada-Algerie. Notre algorithme de matching intelligent vous connecte
              automatiquement avec les voyageurs compatibles, meme si les dates ou villes ne correspondent
              pas exactement.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-gray-500">
          <p>&copy; 2025 EdiMaak - Transport de colis entre particuliers</p>
          <div className="flex justify-center gap-4 mt-2">
            <button onClick={() => navigate("/legal")} className="hover:underline">Mentions legales</button>
            <button onClick={() => navigate("/securite")} className="hover:underline">Securite</button>
            <button onClick={() => navigate("/")} className="hover:underline">Accueil</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicListings;
