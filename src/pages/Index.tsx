import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Package,
  MapPin,
  Calendar,
  Shield,
  TrendingUp,
  Zap,
  ShieldCheck,
  Bell,
  MessageCircle,
  ArrowRightLeft,
} from "lucide-react";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { format } from "date-fns";
import { getShipmentImageUrl } from "@/lib/shipmentImageHelper";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatShortName } from "@/lib/nameHelper";
import { ShipmentDetailModal } from "@/components/ShipmentDetailModal";
import { toast } from "sonner";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { isDateInRange } from "@/lib/utils/shipmentHelpers";
import { SkeletonCard } from "@/components/SkeletonCard";

interface ShipmentRequest {
  id: string;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  earliest_date: string;
  latest_date: string;
  weight_kg: number;
  item_type: string;
  notes: string | null;
  image_url: string | null;
  view_count: number;
  sender_id: string;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  sender_request_count?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { session, userRole, isLoading: authLoading } = useAuth();
  const { unreadCount, resetUnreadCount } = useRealtimeNotifications(session?.user?.id);

  const [direction, setDirection] = useState<"fr-dz" | "dz-fr">("fr-dz");
  const [localFromCity, setLocalFromCity] = useState(searchParams.get("from") || "");
  const [localToCity, setLocalToCity] = useState(searchParams.get("to") || "");
  const [localSearchDate, setLocalSearchDate] = useState(searchParams.get("date") || "");

  const [shipmentRequests, setShipmentRequests] = useState<ShipmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRequest | null>(null);

  const currentFromCity = searchParams.get("from") || "";
  const currentToCity = searchParams.get("to") || "";
  const currentSearchDate = searchParams.get("date") || "";
  const isSearching = currentFromCity || currentToCity || currentSearchDate;

  const toggleDirection = () => {
    setDirection((prev) => (prev === "fr-dz" ? "dz-fr" : "fr-dz"));
    setLocalFromCity("");
    setLocalToCity("");
  };

  const getDashboardPath = (userRole: UserRole): string => {
    if (userRole === "sender") return "/dashboard/sender";
    if (userRole === "admin") return "/admin";
    return "/dashboard/traveler";
  };

  useEffect(() => {
    fetchShipmentRequests();
  }, []);

  const fetchShipmentRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("shipment_requests")
        .select(`*, profiles!sender_id (id, full_name, avatar_url)`)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      if (data) {
        const senderIds = [...new Set(data.map((r) => r.sender_id))];
        if (senderIds.length > 0) {
          const { data: counts } = await supabase
            .from("shipment_requests")
            .select("sender_id")
            .in("sender_id", senderIds);

          const countMap: Record<string, number> = (counts || []).reduce(
            (acc, item) => {
              acc[item.sender_id] = (acc[item.sender_id] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          const enrichedData = data.map((r) => ({
            ...r,
            sender_request_count: countMap[r.sender_id] || 0,
          }));
          setShipmentRequests(enrichedData);
        } else {
          setShipmentRequests(data);
        }
      }
    } catch (err) {
      console.error("Erreur chargement", err);
      setError("Impossible de charger les annonces.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = shipmentRequests;
    if (currentFromCity)
      filtered = filtered.filter((req) => req.from_city.toLowerCase().includes(currentFromCity.toLowerCase().trim()));
    if (currentToCity)
      filtered = filtered.filter((req) => req.to_city.toLowerCase().includes(currentToCity.toLowerCase().trim()));
    if (currentSearchDate) filtered = filtered.filter((req) => isDateInRange(req, currentSearchDate));
    return filtered;
  }, [shipmentRequests, currentFromCity, currentToCity, currentSearchDate]);

  const handleSearchClick = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams: Record<string, string> = {};
    if (localFromCity.trim()) newParams.from = localFromCity.trim();
    if (localToCity.trim()) newParams.to = localToCity.trim();
    if (localSearchDate) newParams.date = localSearchDate;

    setSearchParams(newParams);

    if (Object.keys(newParams).length > 0) {
      setTimeout(() => {
        const resultsSection = document.getElementById("results-section");
        if (resultsSection) resultsSection.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleShipmentClick = useCallback((shipment: ShipmentRequest) => {
    setSelectedShipment(shipment);
  }, []);

  const handleSignUp = useCallback(() => {
    if (selectedShipment) {
      localStorage.setItem("targetShipmentId", selectedShipment.id);
      navigate("/auth?role=traveler");
    }
  }, [selectedShipment, navigate]);

  const handleLogin = useCallback(() => {
    if (selectedShipment) {
      localStorage.setItem("targetShipmentId", selectedShipment.id);
      navigate("/auth");
    }
  }, [selectedShipment, navigate]);

  const handleDashboardClick = useCallback(() => {
    resetUnreadCount();
    navigate(getDashboardPath(userRole));
  }, [userRole, navigate, resetUnreadCount]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-7xl h-16 sm:h-20 flex items-center justify-between">
          <LogoEdiM3ak iconSize="lg" onClick={() => navigate("/")} />

          <div className="flex items-center gap-2 sm:gap-4">
            {authLoading ? (
              <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
            ) : session ? (
              <Button onClick={handleDashboardClick} className="rounded-full font-medium relative overflow-visible">
                Mon Dashboard
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 animate-bounce items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white z-50">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth?role=sender")}
                  className="hidden sm:inline-flex text-gray-600"
                >
                  Devenir expéditeur
                </Button>
                <Button onClick={() => navigate("/auth")} className="rounded-full px-6 shadow-sm">
                  Se connecter
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-12 pb-8 sm:pt-24 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 sm:mb-6 leading-tight tracking-tight">
              Faites voyager vos colis <br className="hidden sm:block" /> en toute confiance.
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              La 1ère plateforme de mise en relation sécurisée entre voyageurs et expéditeurs France ⇄ Algérie.
            </p>
          </div>
        </div>
      </section>

      {/* BARRE DE RECHERCHE "AIRBNB STYLE" */}
      <form onSubmit={handleSearchClick} className="relative z-40 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Conteneur principal avec ombre portée et arrondis */}
          <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 flex flex-col md:flex-row items-center p-2 gap-1 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Champ Départ */}
            <div className="flex-1 w-full md:w-auto relative group px-6 py-3 hover:bg-gray-50 rounded-[24px] transition-colors cursor-pointer">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-800 block mb-1">
                Départ ({direction === "fr-dz" ? "France" : "Algérie"})
              </label>
              <div className="w-full">
                <CityAutocomplete
                  placeholder="Ex: Paris"
                  value={localFromCity}
                  onChange={setLocalFromCity}
                  limitToCountry={direction === "fr-dz" ? "France" : "Algérie"}
                  className="border-0 p-0 h-auto text-sm font-medium placeholder:text-gray-400 focus-visible:ring-0 bg-transparent w-full truncate"
                />
              </div>
            </div>

            {/* Bouton Inversion (Absolu au centre sur Desktop) */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleDirection}
                className="rounded-full h-8 w-8 bg-white border-gray-200 shadow-sm hover:scale-110 transition-transform"
                title="Inverser le sens"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-gray-600" />
              </Button>
            </div>

            {/* Champ Arrivée */}
            <div className="flex-1 w-full md:w-auto relative group px-6 py-3 hover:bg-gray-50 rounded-[24px] transition-colors cursor-pointer md:pl-8">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-800 block mb-1">
                Arrivée ({direction === "fr-dz" ? "Algérie" : "France"})
              </label>
              <div className="w-full">
                <CityAutocomplete
                  placeholder="Ex: Alger"
                  value={localToCity}
                  onChange={setLocalToCity}
                  limitToCountry={direction === "fr-dz" ? "Algérie" : "France"}
                  className="border-0 p-0 h-auto text-sm font-medium placeholder:text-gray-400 focus-visible:ring-0 bg-transparent w-full truncate"
                />
              </div>
            </div>

            {/* Champ Date */}
            <div className="flex-[0.8] w-full md:w-auto relative group px-6 py-3 hover:bg-gray-50 rounded-[24px] transition-colors cursor-pointer">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-800 block mb-1">
                Date de départ
              </label>
              <Input
                type="date"
                value={localSearchDate}
                onChange={(e) => setLocalSearchDate(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium text-gray-700 w-full p-0 h-auto cursor-pointer"
              />
            </div>

            {/* Bouton Recherche */}
            <div className="p-2 w-full md:w-auto">
              <Button
                type="submit"
                size="lg"
                className="w-full md:w-auto rounded-full h-12 md:h-12 px-6 bg-primary hover:bg-primary/90 text-white shadow-md font-bold text-base flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span className="md:hidden">Rechercher</span>
              </Button>
            </div>
          </div>

          {/* Petit bouton mobile pour inverser si besoin */}
          <div className="md:hidden flex justify-center -mt-4 mb-4 relative z-50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleDirection}
              className="rounded-full h-8 px-4 bg-white text-xs border-gray-200 shadow-sm gap-2"
            >
              <ArrowRightLeft className="w-3 h-3" /> Inverser sens
            </Button>
          </div>
        </div>
      </form>

      {/* CONTENU PRINCIPAL */}
      <main className="container mx-auto px-4 max-w-7xl pb-20 pt-12" id="results-section">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {isSearching ? `Résultats (${filteredRequests.length})` : "Dernières annonces"}
          </h2>
        </div>

        {/* État de chargement */}
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* État vide */}
        {!isLoading && filteredRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun trajet ne correspond</h3>
            <p className="text-gray-500 max-w-md mb-8">Créez une alerte voyageur et nous vous préviendrons.</p>
            <Button
              onClick={() => navigate("/auth?role=traveler")}
              size="lg"
              className="rounded-full px-8 text-base shadow-lg shadow-primary/20"
            >
              Créer une alerte
            </Button>
          </div>
        )}

        {/* Grille */}
        {!isLoading && filteredRequests.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                role="button"
                className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col focus:outline-none"
                onClick={() => handleShipmentClick(request)}
              >
                <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
                  <img
                    src={getShipmentImageUrl(request.image_url, request.item_type)}
                    alt={request.item_type}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                    <Package className="w-3 h-3 text-primary" />
                    {request.weight_kg} kg
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{request.to_city}</h3>
                      <p className="text-sm text-gray-500">Depuis {request.from_city}</p>
                    </div>
                    {(request.sender_request_count || 0) > 2 && (
                      <div className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> FIABLE
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {format(new Date(request.earliest_date), "dd MMM")} -{" "}
                        {format(new Date(request.latest_date), "dd MMM")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-3">
                    <UserAvatar
                      fullName={request.profiles?.full_name || ""}
                      avatarUrl={request.profiles?.avatar_url}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {request.profiles?.full_name ? formatShortName(request.profiles.full_name) : "Utilisateur"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          © 2025 EDIM3AK. La plateforme de confiance.
        </div>
      </footer>

      {/* Modal Détail */}
      {selectedShipment && (
        <ShipmentDetailModal
          isOpen={!!selectedShipment}
          onClose={() => setSelectedShipment(null)}
          shipment={selectedShipment}
          isAuthenticated={!!session}
          onSignUp={handleSignUp}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
};

export default Index;
