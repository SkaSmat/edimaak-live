import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ChevronDown,
  ArrowRight,
  CheckCircle,
  Loader2,
  Star,
  Eye,
  LayoutDashboard,
} from "lucide-react";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";
import { format } from "date-fns";
import { HeroSection } from "@/components/landing/HeroSection";
import { SearchBarSection } from "@/components/landing/SearchBarSection";
import { getShipmentImageUrl } from "@/lib/shipmentImageHelper";
import { ImageLightbox } from "@/components/ImageLightbox";
import ShareButtons from "@/components/ShareButtons";
import FlexibleMatchBadge from "@/components/FlexibleMatchBadge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatShortName } from "@/lib/nameHelper";
import { ShipmentDetailModal } from "@/components/ShipmentDetailModal";
import { toast } from "sonner";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { isDateInRange } from "@/lib/utils/shipmentHelpers";
import { getFlexibleMatchInfo, getCountryOnlyMatchInfo, areCitiesInSameRegion, FlexibleMatchInfo } from "@/lib/regionMapping";
import { SkeletonCard } from "@/components/SkeletonCard";
import { NotificationBell } from "@/components/NotificationBell";

// Import world countries for intelligent selection
import { WORLD_COUNTRIES, getWorldCountryOptions } from "@/lib/worldData";

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
  price: number | null;
  status: string;

  public_profiles?: {
    id: string;
    display_first_name: string;
    avatar_url: string | null;
  };
  sender_request_count?: number;
  sender_kyc_verified?: boolean;
  sender_rating?: number | null;
  sender_reviews_count?: number;
  _matchInfo?: FlexibleMatchInfo;
  _matchScore?: number;
}

// Liste des pays disponibles - now uses all world countries
const COUNTRIES = WORLD_COUNTRIES.map((c) => c.name);

const safeLocalStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Si le stockage est désactivé, on ignore silencieusement
    }
  },
};

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, userRole, isLoading: authLoading } = useAuth();
  const { unreadCount, resetUnreadCount } = useRealtimeNotifications(session?.user?.id);

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
  const [alertCreated, setAlertCreated] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);

  const currentFromCity = searchParams.get("from") || "";
  const currentToCity = searchParams.get("to") || "";
  const currentSearchDate = searchParams.get("date") || "";
  const isSearching = currentFromCity || currentToCity || currentSearchDate;

  // --- LOGIQUE INTELLIGENTE DES PAYS ---
  // Si on change le départ et qu'il devient égal à l'arrivée, on change l'arrivée
  useEffect(() => {
    if (fromCountry === toCountry) {
      const otherCountry = COUNTRIES.find((c) => c !== fromCountry) || "Algérie";
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
    // Chargement initial des annonces même si l'auth n'est pas encore prête
    fetchShipmentRequests(null);
  }, []);

  useEffect(() => {
    // Lorsque l'utilisateur est connu, on refetch pour exclure ses propres annonces
    if (!authLoading && session?.user?.id) {
      fetchShipmentRequests(session.user.id);
    }
  }, [authLoading, session?.user?.id]);

  const fetchShipmentRequests = async (currentUserId: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Fetch both open and completed shipment requests, exclude expired ones
      const { data, error: fetchError } = await supabase
        .from("shipment_requests")
        .select("*")
        .neq("sender_id", currentUserId || "00000000-0000-0000-0000-000000000000")
        .or(`status.eq.completed,and(status.eq.open,latest_date.gte.${today})`)
        .order("created_at", { ascending: false })
        .limit(30);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map((r) => r.sender_id))];

        // 2. Fetch sender display info, KYC status, and ratings in parallel batches
        const senderInfoMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
        const senderKycMap: Record<string, boolean> = {};
        const senderRatingMap: Record<string, { rating: number | null; reviews_count: number }> = {};

        if (session) {
          // Use batch RPC calls instead of N+1 queries (1 call per batch vs N calls)
          // Cast to any to work around TypeScript types not being regenerated yet
          const [senderInfoResult, kycResult, ratingResult] = await Promise.all([
            supabase.rpc("get_batch_sender_display_info" as any, { sender_uuids: senderIds }),
            supabase.rpc("get_batch_kyc_status" as any, { profile_ids: senderIds }),
            supabase.rpc("get_batch_user_rating" as any, { user_ids: senderIds }),
          ]);

          // Map results to lookup objects
          if (senderInfoResult.data && Array.isArray(senderInfoResult.data)) {
            (senderInfoResult.data as any[]).forEach((sender) => {
              senderInfoMap[sender.sender_uuid] = {
                display_name: sender.display_name,
                avatar_url: sender.avatar_url,
              };
            });
          }

          if (kycResult.data && Array.isArray(kycResult.data)) {
            (kycResult.data as any[]).forEach((kyc) => {
              senderKycMap[kyc.profile_id] = kyc.kyc_verified === true;
            });
          }

          if (ratingResult.data && Array.isArray(ratingResult.data)) {
            (ratingResult.data as any[]).forEach((rating) => {
              senderRatingMap[rating.user_id] = {
                rating: rating.average_rating ? Number(rating.average_rating) : null,
                reviews_count: Number(rating.reviews_count) || 0,
              };
            });
          }
        }

        // 3. Fetch shipment counts per sender
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

        // 4. Enrich data with sender info
        const enrichedData = data.map((r) => ({
          ...r,
          sender_request_count: countMap[r.sender_id] || 0,
          sender_kyc_verified: senderKycMap[r.sender_id] || false,
          sender_rating: senderRatingMap[r.sender_id]?.rating || null,
          sender_reviews_count: senderRatingMap[r.sender_id]?.reviews_count || 0,
          public_profiles: senderInfoMap[r.sender_id]
            ? {
                id: r.sender_id,
                display_first_name: senderInfoMap[r.sender_id].display_name,
                avatar_url: senderInfoMap[r.sender_id].avatar_url,
              }
            : undefined,
        }));

        // Sort: open first, then completed
        const sortedData = enrichedData.sort((a, b) => {
          if (a.status === "open" && b.status === "completed") return -1;
          if (a.status === "completed" && b.status === "open") return 1;
          return 0;
        });

        setShipmentRequests(sortedData);
      } else {
        setShipmentRequests(data || []);
      }
    } catch (err) {
      setError("Impossible de charger les annonces.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    // If no search criteria, return all shipments
    if (!currentFromCity && !currentToCity && !currentSearchDate) {
      return shipmentRequests;
    }

    const normalize = (text: string) => (text ? text.toLowerCase().trim() : "");
    const searchFromCity = normalize(currentFromCity);
    const searchToCity = normalize(currentToCity);

    // Use the same flexible matching system as the traveler dashboard
    return shipmentRequests
      .map((req) => {
        // Origin matching: exact city name or same region
        if (searchFromCity) {
          const reqFromCity = normalize(req.from_city);
          const isExactFrom = reqFromCity.includes(searchFromCity) || searchFromCity.includes(reqFromCity);
          const isSameFromRegion = !isExactFrom && areCitiesInSameRegion(
            currentFromCity, fromCountry,
            req.from_city, req.from_country
          );
          if (!isExactFrom && !isSameFromRegion) return null;
        }

        // Destination matching: use getFlexibleMatchInfo (includes date + city/region)
        if (searchToCity && currentSearchDate) {
          const matchInfo = getFlexibleMatchInfo(
            currentSearchDate,
            currentToCity,
            toCountry,
            req.earliest_date,
            req.latest_date,
            req.to_city,
            req.to_country
          );
          if (matchInfo) return { ...req, _matchScore: matchInfo.score, _matchInfo: matchInfo };

          // Fallback: country-only match
          const countryMatch = getCountryOnlyMatchInfo(
            currentSearchDate,
            toCountry,
            req.earliest_date,
            req.latest_date,
            req.to_country
          );
          if (countryMatch) return { ...req, _matchScore: countryMatch.score, _matchInfo: countryMatch };
          return null;
        }

        // Destination city only (no date)
        if (searchToCity) {
          const reqToCity = normalize(req.to_city);
          const isExactTo = reqToCity.includes(searchToCity) || searchToCity.includes(reqToCity);
          const isSameToRegion = !isExactTo && areCitiesInSameRegion(
            currentToCity, toCountry,
            req.to_city, req.to_country
          );
          if (!isExactTo && !isSameToRegion) return null;
        }

        // Date only (no destination city)
        if (currentSearchDate && !searchToCity) {
          const dateInfo = getFlexibleMatchInfo(
            currentSearchDate,
            req.to_city, req.to_country,
            req.earliest_date, req.latest_date,
            req.to_city, req.to_country
          );
          if (!dateInfo) return null;
          return { ...req, _matchScore: dateInfo.score, _matchInfo: dateInfo };
        }

        return { ...req, _matchScore: 50 };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (b._matchScore || 0) - (a._matchScore || 0)) as typeof shipmentRequests;
  }, [shipmentRequests, currentFromCity, currentToCity, currentSearchDate, fromCountry, toCountry]);

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
        const lastViewed = safeLocalStorage.getItem(viewKey);
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (!lastViewed || now - parseInt(lastViewed) > twentyFourHours) {
          // Incrémenter le compteur dans la base de données
          await supabase.rpc("increment_shipment_view_count", { shipment_id: shipment.id });
          safeLocalStorage.setItem(viewKey, now.toString());
        }
      }
    },
    [session?.user?.id],
  );

  const handleSignUp = useCallback(() => {
    if (selectedShipment) {
      safeLocalStorage.setItem("targetShipmentId", selectedShipment.id);
      navigate("/auth?role=traveler&view=signup");
    }
  }, [selectedShipment, navigate]);

  const handleLogin = useCallback(() => {
    if (selectedShipment) {
      safeLocalStorage.setItem("targetShipmentId", selectedShipment.id);
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
                  aria-label="Mon Dashboard" // Accessibilité
                >
                  <span className="hidden sm:inline">Mon Dashboard</span>
                  {/* Mobile : Icône Dashboard au lieu du texte */}
                  <span className="sm:hidden">
                    <LayoutDashboard className="w-4 h-4" />
                  </span>

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

      <HeroSection />

      <SearchBarSection
        fromCountry={fromCountry}
        toCountry={toCountry}
        localFromCity={localFromCity}
        localToCity={localToCity}
        localSearchDate={localSearchDate}
        countries={COUNTRIES}
        onFromCountryChange={(country) => {
          setFromCountry(country);
          setLocalFromCity("");
        }}
        onToCountryChange={(country) => {
          setToCountry(country);
          setLocalToCity("");
        }}
        onLocalFromCityChange={setLocalFromCity}
        onLocalToCityChange={setLocalToCity}
        onLocalSearchDateChange={setLocalSearchDate}
        onToggleDirection={toggleDirection}
        onSubmit={handleSearchClick}
      />

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
              <SkeletonCard key={`skeleton-${i}`} />
            ))}
          </div>
        )}

        {!isLoading && filteredRequests.length === 0 && (
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
                    safeLocalStorage.setItem("searchIntent", JSON.stringify(searchIntent)); // ✅ SÉCURISÉ
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

        {!isLoading && filteredRequests.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                role={request.status === "completed" ? undefined : "button"}
                className={`group bg-white rounded-xl overflow-hidden border border-gray-100 transition-all duration-300 flex flex-col relative ${
                  request.status === "completed"
                    ? "opacity-70 cursor-default"
                    : "hover:border-gray-200 hover:shadow-xl cursor-pointer"
                }`}
                onClick={() => request.status !== "completed" && handleShipmentClick(request)}
              >
                {/* Header : Badge Type + Prix */}
                <div className="p-3 sm:p-4 pb-2 flex items-center justify-between border-b border-gray-50">
                  <Badge
                    variant="secondary"
                    className="bg-[hsl(var(--badge-primary-bg))] text-[hsl(var(--badge-primary-text))] border-0 text-xs flex items-center gap-1 font-semibold"
                  >
                    <Package className="w-3 h-3" />
                    {request.item_type}
                  </Badge>
                  {request.price ? (
                    <div className="bg-[hsl(var(--badge-emerald-bg))] text-white text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      💶 {request.price}€
                    </div>
                  ) : (
                    <div className="bg-[hsl(var(--badge-orange-bg))] text-white text-[10px] sm:text-xs font-medium px-2 py-1 rounded-md">
                      Prix à discuter
                    </div>
                  )}
                </div>

                {/* Image with overlay */}
                <div className="relative h-32 sm:h-40 bg-gray-100">
                  <div className={`h-full ${request.status === "completed" ? "pointer-events-none" : ""}`}>
                    <ImageLightbox
                      src={getShipmentImageUrl(request.image_url, request.item_type)}
                      alt={request.item_type}
                      className="w-full h-full"
                      loading="lazy"
                    />
                  </div>
                  {/* View count overlay badge */}
                  {request.view_count > 5 && (
                    <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm text-white text-[13px] font-medium px-3 py-1.5 rounded-[20px] flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {request.view_count} vues
                    </div>
                  )}
                </div>

                {/* Trajet Principal */}
                <div className="px-3 sm:px-4 pt-3 pb-2">
                  <h3 className="font-bold text-gray-900 text-lg sm:text-xl leading-tight">
                    {request.from_city} → {request.to_city}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {format(new Date(request.earliest_date), "dd MMM")} -{" "}
                      {format(new Date(request.latest_date), "dd MMM")}
                    </span>
                  </div>
                </div>

                {/* Badge de matching flexible */}
                {isSearching && request._matchInfo && (
                  <div className="px-3 sm:px-4 pb-1">
                    <FlexibleMatchBadge
                      matchInfo={request._matchInfo}
                      tripDate={currentSearchDate ? format(new Date(currentSearchDate), "dd MMM") : undefined}
                      shipmentDateRange={`${format(new Date(request.earliest_date), "dd MMM")} - ${format(new Date(request.latest_date), "dd MMM")}`}
                    />
                  </div>
                )}

                {/* Expéditeur + Poids */}
                <div className="px-3 sm:px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <UserAvatar
                      fullName={session ? request.public_profiles?.display_first_name || "" : ""}
                      avatarUrl={session ? request.public_profiles?.avatar_url : null}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      {session ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/user/${request.sender_id}`);
                            }}
                            className="text-xs sm:text-sm font-medium text-gray-900 truncate hover:underline hover:text-primary transition-colors text-left flex items-center gap-1"
                          >
                            {request.public_profiles?.display_first_name || "Utilisateur"}
                            {request.sender_rating && request.sender_rating > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-500 font-medium ml-1">
                                <Star className="w-3 h-3 fill-current" />
                                {request.sender_rating.toFixed(1)}
                              </span>
                            )}
                          </button>
                          {request.sender_kyc_verified && (
                            <p className="text-[10px] sm:text-xs text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Identité vérifiée
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                          Utilisateur anonyme
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-200 text-gray-800 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 flex-shrink-0 ml-2">
                    📦 {request.weight_kg} kg
                  </div>
                </div>

                {/* Tags si description */}
                {request.notes && (
                  <div className="px-3 sm:px-4 pb-2 flex flex-wrap gap-1">
                    <span className="bg-amber-50 text-amber-700 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full">
                      📝 Description disponible
                    </span>
                  </div>
                )}

                {/* Bouton CTA */}
                <div className="p-3 sm:p-4 pt-2 mt-auto space-y-2">
                  {request.status === "completed" ? (
                    <div className="w-full bg-green-100 text-green-800 border border-green-300 font-medium text-xs sm:text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-default">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Colis livre
                    </div>
                  ) : (
                    <div className="w-full bg-primary/15 hover:bg-primary/20 text-[hsl(var(--primary-dark))] font-semibold text-xs sm:text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors group-hover:bg-primary group-hover:text-white">
                      Proposer mon voyage
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {/* Boutons de partage */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <ShareButtons
                      title={`Colis ${request.from_city} → ${request.to_city}`}
                      text={`Quelqu'un cherche un voyageur pour transporter un colis de ${request.from_city} vers ${request.to_city} (${request.weight_kg}kg) sur EdiMaak`}
                      url={`https://edimaak.com/?from=${encodeURIComponent(request.from_city)}&to=${encodeURIComponent(request.to_city)}`}
                    />
                  </div>
                </div>
              </div>
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
              className="text-gray-500 hover:text-primary transition-colors min-h-[44px] px-3"
            >
              Sécurité
            </button>
            <button onClick={() => navigate("/legal")} className="text-gray-500 hover:text-primary transition-colors min-h-[44px] px-3">
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
