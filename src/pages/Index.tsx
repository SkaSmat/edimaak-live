import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useShipmentRequests, ShipmentRequest } from "@/hooks/useShipmentRequests";
import {
  Search,
  Bell,
  ArrowRightLeft,
  ChevronDown,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { ShipmentDetailModal } from "@/components/ShipmentDetailModal";
import { toast } from "sonner";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { isDateInRange } from "@/lib/utils/shipmentHelpers";
import { SkeletonCard } from "@/components/SkeletonCard";
import { NotificationBell } from "@/components/NotificationBell";
// ShipmentRequest interface now imported from useShipmentRequests hook

// Import world data hook for lazy loading (reduces initial bundle size)
import { useWorldData } from "@/hooks/useWorldData";
import { ShipmentCard } from "@/components/landing/ShipmentCard";
const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, userRole, isLoading: authLoading } = useAuth();
  const { unreadCount, resetUnreadCount } = useRealtimeNotifications(session?.user?.id);

  // Lazy load world countries data
  const { countries: worldCountries, isLoading: isLoadingCountries } = useWorldData();
  const COUNTRIES = worldCountries.map((c) => c.name);

  // NOUVEAU : Gestion des pays indépendants
  const [fromCountry, setFromCountry] = useState("France");
  const [toCountry, setToCountry] = useState("Algérie");
  const [localFromCity, setLocalFromCity] = useState(searchParams.get("from") || "");
  const [localToCity, setLocalToCity] = useState(searchParams.get("to") || "");
  const [localSearchDate, setLocalSearchDate] = useState(searchParams.get("date") || "");
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRequest | null>(null);

  // Use React Query hook for shipment requests with automatic caching
  const { data: shipmentRequests = [], isLoading, error } = useShipmentRequests(session, authLoading);
  const [alertCreated, setAlertCreated] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const currentFromCity = searchParams.get("from") || "";
  const currentToCity = searchParams.get("to") || "";
  const currentSearchDate = searchParams.get("date") || "";
  const isSearching = currentFromCity || currentToCity || currentSearchDate;

  // --- LOGIQUE INTELLIGENTE DES PAYS ---
  // Si on change le départ et qu'il devient égal à l'arrivée, on change l'arrivée
  useEffect(() => {
    if (fromCountry === toCountry && COUNTRIES.length > 0) {
      const otherCountry = COUNTRIES.find((c) => c !== fromCountry) || "Algérie";
      setToCountry(otherCountry);
      setLocalToCity(""); // Reset ville car pays a changé
    }
  }, [fromCountry, COUNTRIES]);

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
        if (resultsSection)
          resultsSection.scrollIntoView({
            behavior: "smooth",
          });
      }, 100);
    }
  };
  const handleShipmentClick = useCallback(
    async (shipment: ShipmentRequest) => {
      setSelectedShipment(shipment);

      // Incrémenter le compteur de vues (uniquement si l'utilisateur n'est pas le créateur)
      if (session?.user?.id && session.user.id !== shipment.sender_id) {
        // Vérifier si l'utilisateur a déjà vu cette demande dans les dernières 24h
        const viewKey = `viewed_shipment_${shipment.id}`;
        const lastViewed = localStorage.getItem(viewKey);
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (!lastViewed || now - parseInt(lastViewed) > twentyFourHours) {
          // Incrémenter le compteur dans la base de données
          await supabase.rpc("increment_shipment_view_count", { shipment_id: shipment.id });
          localStorage.setItem(viewKey, now.toString());
        }
      }
    },
    [session?.user?.id],
  );
  const handleSignUp = useCallback(() => {
    if (selectedShipment) {
      localStorage.setItem("targetShipmentId", selectedShipment.id);
      navigate("/auth?role=traveler&view=signup");
    }
  }, [selectedShipment, navigate]);
  const handleLogin = useCallback(() => {
    if (selectedShipment) {
      localStorage.setItem("targetShipmentId", selectedShipment.id);
      navigate("/auth");
    }
  }, [selectedShipment, navigate]);
  const handleViewProfile = useCallback(
    (userId: string) => {
      navigate(`/user/${userId}`);
    },
    [navigate],
  );
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* HEADER OPTIMISÉ */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl h-16 md:h-20 transition-all duration-200 flex items-center justify-between">
          <LogoEdiM3ak iconSize="lg" onClick={() => navigate("/")} />
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/securite")}
              size="sm"
              className="hidden md:inline-flex text-gray-600 text-xs sm:text-sm"
            >
              Sécurité
            </Button>
            {authLoading ? (
              <div className="h-8 sm:h-10 w-24 sm:w-32 bg-gray-200 rounded-full animate-pulse" />
            ) : session ? (
              <>
                <NotificationBell userId={session.user.id} />
                <Button
                  onClick={handleDashboardClick}
                  size="sm"
                  className="rounded-full font-medium relative overflow-visible text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
                >
                  <span className="hidden sm:inline">Mon Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 animate-bounce items-center justify-center rounded-full bg-red-600 text-[9px] sm:text-[10px] font-bold text-white shadow-sm ring-2 ring-white z-50">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth?role=sender")}
                  size="sm"
                  className="hidden md:inline-flex text-gray-600 text-xs sm:text-sm"
                >
                  Devenir expéditeur
                </Button>
                <Button
                  onClick={() => navigate("/auth")}
                  size="sm"
                  className="rounded-full px-3 sm:px-6 shadow-sm text-xs sm:text-sm h-8 sm:h-10"
                >
                  <span className="hidden sm:inline">Se connecter</span>
                  <span className="sm:hidden">Connexion</span>
                </Button>
              </>
            )}
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
            <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              ​La 1ère plateforme au service de la communauté algérienne,  connectant voyageurs et expéditeurs pour le
              transport de colis.
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
                <select
                  value={fromCountry}
                  onChange={(e) => {
                    setFromCountry(e.target.value);
                    setLocalFromCity("");
                  }}
                  className="text-xs font-bold text-gray-900 border border-gray-200 rounded-lg px-2 py-1"
                  disabled={isLoadingCountries}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <CityAutocomplete
                placeholder={`Ville de ${fromCountry}`}
                value={localFromCity}
                onChange={setLocalFromCity}
                limitToCountry={fromCountry}
                className="border border-gray-200 rounded-lg p-2.5 text-sm w-full"
              />
            </div>

            {/* BOUTON INVERSER MOBILE */}
            <div className="flex justify-center -my-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleDirection}
                className="rounded-full h-8 px-4 bg-gray-50 text-xs border-gray-200 gap-2"
              >
                <ArrowRightLeft className="w-3 h-3" /> Inverser
              </Button>
            </div>

            {/* ARRIVÉE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Arrivée</span>
                <select
                  value={toCountry}
                  onChange={(e) => {
                    setToCountry(e.target.value);
                    setLocalToCity("");
                  }}
                  className="text-xs font-bold text-gray-900 border border-gray-200 rounded-lg px-2 py-1"
                  disabled={isLoadingCountries}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c} disabled={c === fromCountry}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <CityAutocomplete
                placeholder={`Ville de ${toCountry}`}
                value={localToCity}
                onChange={setLocalToCity}
                limitToCountry={toCountry}
                className="border border-gray-200 rounded-lg p-2.5 text-sm w-full"
              />
            </div>

            {/* DATE MOBILE */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Quand ?</label>
              <Input
                type="date"
                value={localSearchDate}
                onChange={(e) => setLocalSearchDate(e.target.value)}
                className="border-gray-200 rounded-lg p-2.5 text-sm w-full"
              />
            </div>

            {/* BOUTON RECHERCHE MOBILE */}
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-xl h-12 bg-orange-500 hover:bg-orange-600 text-white shadow-md font-bold text-base"
            >
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
                  <select
                    value={fromCountry}
                    onChange={(e) => {
                      setFromCountry(e.target.value);
                      setLocalFromCity("");
                    }}
                    className="appearance-none bg-transparent text-[10px] font-extrabold text-gray-900 uppercase pr-4 cursor-pointer outline-none hover:text-primary pt-0 pb-[7px]"
                    disabled={isLoadingCountries}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <CityAutocomplete
                placeholder={`Ville de ${fromCountry}`}
                value={localFromCity}
                onChange={setLocalFromCity}
                limitToCountry={fromCountry}
                className="border-0 p-0 h-auto text-sm font-medium placeholder:text-gray-400 focus-visible:ring-0 bg-transparent w-full"
              />
            </div>

            {/* BOUTON INVERSER DESKTOP - POSITION RESPONSIVE */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleDirection}
                className="rounded-full h-8 w-8 bg-white border-gray-200 shadow-sm hover:scale-110 transition-transform hover:bg-gray-50"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-gray-600" />
              </Button>
            </div>

            {/* ARRIVÉE */}
            <div className="flex-1 px-6 py-2.5 hover:bg-gray-50 rounded-full transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Arrivée</span>
                <div className="relative">
                  <select
                    value={toCountry}
                    onChange={(e) => {
                      setToCountry(e.target.value);
                      setLocalToCity("");
                    }}
                    className="appearance-none bg-transparent text-[10px] font-extrabold text-gray-900 uppercase pr-4 cursor-pointer outline-none hover:text-primary pb-[7px]"
                    disabled={isLoadingCountries}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} disabled={c === fromCountry}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <CityAutocomplete
                placeholder={`Ville de ${toCountry}`}
                value={localToCity}
                onChange={setLocalToCity}
                limitToCountry={toCountry}
                className="border-0 p-0 h-auto text-sm font-medium placeholder:text-gray-400 focus-visible:ring-0 bg-transparent w-full"
              />
            </div>

            {/* DATE */}
            <div className="flex-[0.8] px-6 py-2.5 hover:bg-gray-50 rounded-full transition-colors">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block mb-1">
                Quand ?
              </label>
              <Input
                type="date"
                value={localSearchDate}
                onChange={(e) => setLocalSearchDate(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 text-sm font-medium w-full p-0 h-auto"
              />
            </div>

            {/* BOUTON RECHERCHE */}
            <div className="pl-2 pr-1">
              <Button
                type="submit"
                size="lg"
                className="rounded-full h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white shadow-md font-bold"
              >
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

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 bg-red-50 rounded-2xl sm:rounded-3xl border border-red-200 text-center">
            <p className="text-red-600">Impossible de charger les annonces. Veuillez réessayer.</p>
          </div>
        )}

        {!isLoading && !error && filteredRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-gray-200 text-center">
            <div className="bg-primary/10 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
              <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Aucun colis ne correspond</h3>

            {/* Cas utilisateur connecté avec alerte créée */}
            {session && alertCreated && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 max-w-md">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                    <CheckCircle className="w-5 h-5" />
                    <span>Alerte créée avec succès !</span>
                  </div>
                  <p className="text-sm text-green-600">
                    Vous serez notifié par email dès qu'un colis correspondant à
                    <strong>
                      {" "}
                      {localFromCity || fromCountry} → {localToCity || toCountry}
                    </strong>{" "}
                    sera publié.
                  </p>
                </div>
              </>
            )}

            {/* Cas utilisateur connecté sans alerte */}
            {session && !alertCreated && (
              <>
                <p className="text-sm sm:text-base text-gray-500 max-w-md mb-6">
                  Recevez un email dès qu'un colis{" "}
                  <strong>
                    {localFromCity || fromCountry} → {localToCity || toCountry}
                  </strong>{" "}
                  sera publié.
                </p>
                <Button
                  onClick={async () => {
                    if (!session?.user?.id) return;
                    setIsCreatingAlert(true);
                    try {
                      const { error } = await supabase.from("shipment_alerts").insert({
                        user_id: session.user.id,
                        from_city: localFromCity || null,
                        from_country: fromCountry,
                        to_city: localToCity || null,
                        to_country: toCountry,
                      });
                      if (error) {
                        if (error.code === "23505") {
                          toast.info("Vous avez déjà une alerte pour ce trajet");
                          setAlertCreated(true);
                        } else {
                          throw error;
                        }
                      } else {
                        setAlertCreated(true);
                        toast.success(
                          `Vous serez notifié par email dès qu'un colis ${localFromCity || fromCountry} → ${localToCity || toCountry} sera publié.`,
                        );
                      }
                    } catch (err) {
                      console.error("Error creating alert:", err);
                      toast.error("Erreur lors de la création de l'alerte");
                    } finally {
                      setIsCreatingAlert(false);
                    }
                  }}
                  size="lg"
                  disabled={isCreatingAlert}
                  className="rounded-full px-6 sm:px-8 text-sm sm:text-base shadow-lg shadow-primary/20"
                >
                  {isCreatingAlert ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer une alerte"
                  )}
                </Button>
              </>
            )}

            {/* Cas utilisateur non connecté */}
            {!session && (
              <>
                <p className="text-sm sm:text-base text-gray-500 max-w-md mb-6">
                  Recevez un email dès qu'un colis{" "}
                  <strong>
                    {localFromCity || fromCountry} → {localToCity || toCountry}
                  </strong>{" "}
                  sera publié.
                </p>
                <Button
                  onClick={() => {
                    const searchIntent = {
                      fromCity: localFromCity,
                      toCity: localToCity,
                      fromCountry,
                      toCountry,
                      date: localSearchDate,
                    };
                    localStorage.setItem("searchIntent", JSON.stringify(searchIntent));
                    navigate("/auth?role=traveler&view=signup");
                  }}
                  size="lg"
                  className="rounded-full px-6 sm:px-8 text-sm sm:text-base shadow-lg shadow-primary/20"
                >
                  Créer un compte gratuit
                </Button>
              </>
            )}
          </div>
        )}

        {!isLoading && !error && filteredRequests.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredRequests.map((request) => (
              <ShipmentCard
                key={request.id}
                request={request}
                isAuthenticated={!!session}
                onShipmentClick={handleShipmentClick}
              />
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-8 sm:py-10 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 mb-4 text-xs sm:text-sm">
            <button
              onClick={() => navigate("/securite")}
              className="text-gray-500 hover:text-primary transition-colors"
            >
              Sécurité
            </button>
            <button onClick={() => navigate("/legal")} className="text-gray-500 hover:text-primary transition-colors">
              Mentions légales
            </button>
          </div>
          <p className="text-center text-xs sm:text-sm text-gray-600">© 2025 EDIM3AK. La plateforme de confiance.</p>
        </div>
      </footer>

      {selectedShipment && (
        <ShipmentDetailModal
          isOpen={!!selectedShipment}
          onClose={() => setSelectedShipment(null)}
          shipment={selectedShipment}
          isAuthenticated={!!session}
          onSignUp={handleSignUp}
          onLogin={handleLogin}
          onViewProfile={handleViewProfile}
          userRole={userRole}
        />
      )}
    </div>
  );
};
export default Index;
