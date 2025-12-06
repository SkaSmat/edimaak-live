import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, MapPin, Calendar, Shield, TrendingUp, Zap, ShieldCheck, Bell, MessageCircle, ArrowRightLeft, ChevronDown } from "lucide-react";
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

// Liste des pays disponibles
const COUNTRIES = ["Algérie", "France", "Canada", "Espagne", "Royaume-Uni"];
const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    session,
    userRole,
    isLoading: authLoading
  } = useAuth();
  const {
    unreadCount,
    resetUnreadCount
  } = useRealtimeNotifications(session?.user?.id);

  // NOUVEAU : Gestion des pays indépendants
  const [fromCountry, setFromCountry] = useState("France");
  const [toCountry, setToCountry] = useState("Algérie");
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

  // --- LOGIQUE INTELLIGENTE DES PAYS ---
  // Si on change le départ et qu'il devient égal à l'arrivée, on change l'arrivée
  useEffect(() => {
    if (fromCountry === toCountry) {
      const otherCountry = COUNTRIES.find(c => c !== fromCountry) || "Algérie";
      setToCountry(otherCountry);
      setLocalToCity(""); // Reset ville car pays a changé
    }
  }, [fromCountry]);

  // Fonction d'inversion complète (Pays + Ville)
  const toggleDirection = () => {
    const tempCountry = fromCountry;
    // On utilise les setters fonctionnels pour éviter les conflits
    setFromCountry(toCountry);
    setToCountry(tempCountry);
    const tempCity = localFromCity;
    setLocalFromCity(localToCity);
    setLocalToCity(tempCity);
  };
  const getDashboardPath = (userRole: UserRole): string => {
    if (userRole === "sender") return "/dashboard/sender";
    if (userRole === "admin") return "/admin";
    return "/dashboard/traveler";
  };
  const handleDashboardClick = useCallback(() => {
    resetUnreadCount();
    navigate(getDashboardPath(userRole));
  }, [userRole, navigate, resetUnreadCount]);
  useEffect(() => {
    fetchShipmentRequests();
  }, []);
  const fetchShipmentRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        data,
        error: fetchError
      } = await supabase.from("shipment_requests").select(`*, profiles!sender_id (id, full_name, avatar_url)`).eq("status", "open").order("created_at", {
        ascending: false
      }).limit(20);
      if (fetchError) throw fetchError;
      if (data) {
        const senderIds = [...new Set(data.map(r => r.sender_id))];
        if (senderIds.length > 0) {
          const {
            data: counts
          } = await supabase.from("shipment_requests").select("sender_id").in("sender_id", senderIds);
          const countMap: Record<string, number> = (counts || []).reduce((acc, item) => {
            acc[item.sender_id] = (acc[item.sender_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const enrichedData = data.map(r => ({
            ...r,
            sender_request_count: countMap[r.sender_id] || 0
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
    if (currentFromCity) filtered = filtered.filter(req => req.from_city.toLowerCase().includes(currentFromCity.toLowerCase().trim()));
    if (currentToCity) filtered = filtered.filter(req => req.to_city.toLowerCase().includes(currentToCity.toLowerCase().trim()));
    if (currentSearchDate) filtered = filtered.filter(req => isDateInRange(req, currentSearchDate));
    return filtered;
  }, [shipmentRequests, currentFromCity, currentToCity, currentSearchDate]);
  const handleSearchClick = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation finale de sécurité
    if (fromCountry === toCountry) {
      toast.error("Le départ et l'arrivée ne peuvent pas être identiques.");
      return;
    }
    const newParams: Record<string, string> = {};
    if (localFromCity.trim()) newParams.from = localFromCity.trim();
    if (localToCity.trim()) newParams.to = localToCity.trim();
    if (localSearchDate) newParams.date = localSearchDate;
    setSearchParams(newParams);
    if (Object.keys(newParams).length > 0) {
      setTimeout(() => {
        const resultsSection = document.getElementById("results-section");
        if (resultsSection) resultsSection.scrollIntoView({
          behavior: "smooth"
        });
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
  return <div className="min-h-screen bg-gray-50/50">
      {/* HEADER OPTIMISÉ */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl h-14 sm:h-16 md:h-20 flex items-center justify-between">
          <LogoEdiM3ak iconSize="lg" onClick={() => navigate("/")} />
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
            {authLoading ? <div className="h-8 sm:h-10 w-24 sm:w-32 bg-gray-200 rounded-full animate-pulse" /> : session ? <Button onClick={handleDashboardClick} size="sm" className="rounded-full font-medium relative overflow-visible text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10">
                <span className="hidden sm:inline">Mon Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 animate-bounce items-center justify-center rounded-full bg-red-600 text-[9px] sm:text-[10px] font-bold text-white shadow-sm ring-2 ring-white z-50">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>}
              </Button> : <>
                <Button variant="ghost" onClick={() => navigate("/auth?role=sender")} size="sm" className="hidden md:inline-flex text-gray-600 text-xs sm:text-sm">
                  Devenir expéditeur
                </Button>
                <Button onClick={() => navigate("/auth")} size="sm" className="rounded-full px-3 sm:px-6 shadow-sm text-xs sm:text-sm h-8 sm:h-10">
                  <span className="hidden sm:inline">Se connecter</span>
                  <span className="sm:hidden">Connexion</span>
                </Button>
              </>}
          </div>
        </div>
      </header>

      {/* HERO OPTIMISÉ */}
      <section className="pt-8 pb-6 sm:pt-16 sm:pb-8 md:pt-24 md:pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-3 sm:mb-4 md:mb-6 leading-tight tracking-tight px-2">
              Faites voyager vos colis <br className="hidden sm:block" /> en toute confiance.
            </h1>
            <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">​La 1ère plateforme au service de la communauté algérienne, 
 connectant voyageurs et expéditeurs pour le transport de colis.
          </p>
          </div>
        </div>
      </section>

      {/* BARRE DE RECHERCHE MOBILE-FIRST */}
      <form onSubmit={handleSearchClick} className="relative z-40 px-3 sm:px-4 mb-8">
        <div className="container mx-auto max-w-4xl">
          {/* VERSION MOBILE (< md) : Layout vertical */}
          <div className="md:hidden bg-white rounded-2xl shadow-lg border border-gray-200 p-4 space-y-3">
            {/* DÉPART */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Départ</span>
                <select value={fromCountry} onChange={e => {
                setFromCountry(e.target.value);
                setLocalFromCity("");
              }} className="text-xs font-bold text-gray-900 border border-gray-200 rounded-lg px-2 py-1">
                  {COUNTRIES.map(c => <option key={c} value={c}>
                      {c}
                    </option>)}
                </select>
              </div>
              <CityAutocomplete placeholder={`Ville de ${fromCountry}`} value={localFromCity} onChange={setLocalFromCity} limitToCountry={fromCountry} className="border border-gray-200 rounded-lg p-2.5 text-sm w-full" />
            </div>

            {/* BOUTON INVERSER MOBILE */}
            <div className="flex justify-center -my-1">
              <Button type="button" variant="outline" size="sm" onClick={toggleDirection} className="rounded-full h-8 px-4 bg-gray-50 text-xs border-gray-200 gap-2">
                <ArrowRightLeft className="w-3 h-3" /> Inverser
              </Button>
            </div>

            {/* ARRIVÉE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Arrivée</span>
                <select value={toCountry} onChange={e => {
                setToCountry(e.target.value);
                setLocalToCity("");
              }} className="text-xs font-bold text-gray-900 border border-gray-200 rounded-lg px-2 py-1">
                  {COUNTRIES.map(c => <option key={c} value={c} disabled={c === fromCountry}>
                      {c}
                    </option>)}
                </select>
              </div>
              <CityAutocomplete placeholder={`Ville de ${toCountry}`} value={localToCity} onChange={setLocalToCity} limitToCountry={toCountry} className="border border-gray-200 rounded-lg p-2.5 text-sm w-full" />
            </div>

            {/* DATE MOBILE */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Quand ?</label>
              <Input type="date" value={localSearchDate} onChange={e => setLocalSearchDate(e.target.value)} className="border-gray-200 rounded-lg p-2.5 text-sm w-full" />
            </div>

            {/* BOUTON RECHERCHE MOBILE */}
            <Button type="submit" size="lg" className="w-full rounded-xl h-12 bg-orange-500 hover:bg-orange-600 text-white shadow-md font-bold text-base">
              <Search className="w-5 h-5 mr-2" />
              Rechercher
            </Button>
          </div>

          {/* VERSION DESKTOP (≥ md) : Layout horizontal */}
          <div className="hidden md:flex bg-white rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.12)] border border-gray-200 items-center p-2 divide-x divide-gray-100 relative">
            {/* DÉPART */}
            <div className="flex-1 px-6 py-2.5 hover:bg-gray-50 rounded-full transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Départ</span>
                <div className="relative">
                  <select value={fromCountry} onChange={e => {
                  setFromCountry(e.target.value);
                  setLocalFromCity("");
                }} className="appearance-none bg-transparent text-[10px] font-extrabold text-gray-900 uppercase pr-4 cursor-pointer outline-none hover:text-primary pt-0 pb-[7px]">
                    {COUNTRIES.map(c => <option key={c} value={c}>
                        {c}
                      </option>)}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <CityAutocomplete placeholder={`Ville de ${fromCountry}`} value={localFromCity} onChange={setLocalFromCity} limitToCountry={fromCountry} className="border-0 p-0 h-auto text-sm font-medium placeholder:text-gray-400 focus-visible:ring-0 bg-transparent w-full" />
            </div>

            {/* BOUTON INVERSER DESKTOP - POSITION RESPONSIVE */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <Button type="button" variant="outline" size="icon" onClick={toggleDirection} className="rounded-full h-8 w-8 bg-white border-gray-200 shadow-sm hover:scale-110 transition-transform hover:bg-gray-50">
                <ArrowRightLeft className="w-3.5 h-3.5 text-gray-600" />
              </Button>
            </div>

            {/* ARRIVÉE */}
            <div className="flex-1 px-6 py-2.5 hover:bg-gray-50 rounded-full transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Arrivée</span>
                <div className="relative">
                  <select value={toCountry} onChange={e => {
                  setToCountry(e.target.value);
                  setLocalToCity("");
                }} className="appearance-none bg-transparent text-[10px] font-extrabold text-gray-900 uppercase pr-4 cursor-pointer outline-none hover:text-primary pb-[7px]">
                    {COUNTRIES.map(c => <option key={c} value={c} disabled={c === fromCountry}>
                        {c}
                      </option>)}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <CityAutocomplete placeholder={`Ville de ${toCountry}`} value={localToCity} onChange={setLocalToCity} limitToCountry={toCountry} className="border-0 p-0 h-auto text-sm font-medium placeholder:text-gray-400 focus-visible:ring-0 bg-transparent w-full" />
            </div>

            {/* DATE */}
            <div className="flex-[0.8] px-6 py-2.5 hover:bg-gray-50 rounded-full transition-colors">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block mb-1">
                Quand ?
              </label>
              <Input type="date" value={localSearchDate} onChange={e => setLocalSearchDate(e.target.value)} className="border-0 bg-transparent focus-visible:ring-0 text-sm font-medium w-full p-0 h-auto" />
            </div>

            {/* BOUTON RECHERCHE */}
            <div className="pl-2 pr-1">
              <Button type="submit" size="lg" className="rounded-full h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white shadow-md font-bold">
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* SECTION RÉSULTATS */}
      <main className="container mx-auto px-3 sm:px-4 max-w-7xl pb-12 sm:pb-20 pt-6 sm:pt-12" id="results-section">
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isSearching ? `Résultats (${filteredRequests.length})` : "Dernières annonces"}
          </h2>
        </div>

        {isLoading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>}

        {!isLoading && filteredRequests.length === 0 && <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-gray-200 text-center">
            <div className="bg-primary/10 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
              <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Aucun trajet ne correspond</h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mb-6 sm:mb-8">
              Créez une alerte voyageur et nous vous préviendrons.
            </p>
            <Button onClick={() => navigate("/auth?role=traveler")} size="lg" className="rounded-full px-6 sm:px-8 text-sm sm:text-base shadow-lg shadow-primary/20">
              Créer une alerte
            </Button>
          </div>}

        {!isLoading && filteredRequests.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredRequests.map(request => <div key={request.id} role="button" className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col" onClick={() => handleShipmentClick(request)}>
                <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
                  <img src={getShipmentImageUrl(request.image_url, request.item_type)} alt={request.item_type} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/90 backdrop-blur-md text-gray-900 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-sm flex items-center gap-1">
                    <Package className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                    {request.weight_kg} kg
                  </div>
                </div>

                <div className="p-3 sm:p-4 flex flex-col flex-1">
                  {/* Type d'objet en premier */}
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
                      {request.item_type}
                    </Badge>
                    {(request.sender_request_count || 0) > 2 && <div className="bg-green-50 text-green-700 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                        <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline">FIABLE</span>
                        <span className="sm:hidden">✓</span>
                      </div>}
                  </div>

                  {/* Trajet en dessous */}
                  <div className="mb-2 sm:mb-3">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight truncate">
                      {request.from_city} → {request.to_city}
                    </h3>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {format(new Date(request.earliest_date), "dd MMM")} -{" "}
                        {format(new Date(request.latest_date), "dd MMM")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-50 flex items-center gap-2 sm:gap-3">
                    <UserAvatar fullName={request.profiles?.full_name || ""} avatarUrl={request.profiles?.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {request.profiles?.full_name ? formatShortName(request.profiles.full_name) : "Utilisateur"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-6 sm:py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-xs sm:text-sm text-gray-400">
          © 2025 EDIM3AK. La plateforme de confiance.
        </div>
      </footer>

      {selectedShipment && <ShipmentDetailModal isOpen={!!selectedShipment} onClose={() => setSelectedShipment(null)} shipment={selectedShipment} isAuthenticated={!!session} onSignUp={handleSignUp} onLogin={handleLogin} />}
    </div>;
};
export default Index;