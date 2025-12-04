import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, MapPin, Calendar, ShieldCheck, Bell, MessageCircle } from "lucide-react";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { format } from "date-fns";
import { getShipmentImageUrl } from "@/lib/shipmentImageHelper";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatShortName } from "@/lib/nameHelper";
import { ShipmentDetailModal } from "@/components/ShipmentDetailModal";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ============================================================================
// TYPES
// ============================================================================
interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

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
  profiles?: Profile;
  sender_request_count?: number;
}

type UserRole = "sender" | "traveler" | "admin" | null;

interface MessagePayload {
  sender_id: string;
  content: string;
  match_id: string;
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================
const playNotificationSound = (): void => {
  try {
    const audio = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3"); // Lien audio corrigé (plus fiable)
    audio.volume = 0.5;
    audio.play().catch((err) => {
      // Ignorer silencieusement si l'utilisateur n'a pas encore interagi avec la page
    });
  } catch (error) {
    console.warn("Audio non supporté:", error);
  }
};

const triggerVibration = (): void => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch (error) {
      console.warn("Vibration non supportée:", error);
    }
  }
};

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const isDateInRange = (request: ShipmentRequest, searchDate: string): boolean => {
  if (!request.earliest_date || !request.latest_date) return true;

  const selectedDate = new Date(searchDate);
  const earliest = new Date(request.earliest_date);
  const latest = new Date(request.latest_date);

  return selectedDate >= earliest && selectedDate <= latest;
};

const getDashboardPath = (userRole: UserRole): string => {
  if (userRole === "sender") return "/dashboard/sender";
  if (userRole === "admin") return "/admin";
  return "/dashboard/traveler";
};

// ============================================================================
// HOOKS PERSONNALISÉS
// ============================================================================

/**
 * Hook pour gérer les notifications en temps réel
 */
const useRealtimeNotifications = (userId: string | undefined) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`notifications_${userId}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as MessagePayload;

          if (newMessage.sender_id === userId) return;

          setUnreadCount((prev) => prev + 1);
          playNotificationSound();
          triggerVibration();

          toast.message("Nouveau message !", {
            description: truncateText(newMessage.content, 40),
            icon: <MessageCircle className="w-5 h-5 text-primary" />,
            duration: 5000,
            action: {
              label: "Voir",
              onClick: () => navigate(`/messages?matchId=${newMessage.match_id}`),
            },
          });
        },
      )
      .subscribe((status) => {
        // CORRECTION ICI : "CHANNEL_ERROR" est le bon type attendu par TypeScript
        if (status === "CHANNEL_ERROR") {
          console.error("Erreur de souscription au canal de notifications");
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, navigate]);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { unreadCount, resetUnreadCount };
};

/**
 * Hook pour gérer l'authentification
 */
const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        setSession(session);
        if (session) {
          await fetchUserRole(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erreur d'initialisation de l'authentification:", error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single();

      if (error) throw error;

      setUserRole((data?.role as UserRole) || null);
    } catch (error) {
      console.error("Erreur lors de la récupération du rôle:", error);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { session, userRole, isLoading };
};

// ============================================================================
// COMPOSANT SKELETON
// ============================================================================
const SkeletonCard = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
    <div className="aspect-[4/3] bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-6 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded" />
      </div>
      <div className="flex items-center gap-3 pt-4">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        <div className="h-4 bg-gray-200 rounded flex-1" />
      </div>
    </div>
  </div>
);

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
const Index = () => {
  const navigate = useNavigate();
  const { session, userRole, isLoading: authLoading } = useAuth();
  const { unreadCount, resetUnreadCount } = useRealtimeNotifications(session?.user?.id);

  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [shipmentRequests, setShipmentRequests] = useState<ShipmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRequest | null>(null);

  // ============================================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================================
  useEffect(() => {
    fetchShipmentRequests();
  }, []);

  const fetchShipmentRequests = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("shipment_requests")
        .select(
          `
          *,
          profiles!sender_id (
            id,
            full_name,
            avatar_url
          )
        `,
        )
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      if (data) {
        const senderIds = [...new Set(data.map((r) => r.sender_id))];

        if (senderIds.length > 0) {
          const { data: counts, error: countError } = await supabase
            .from("shipment_requests")
            .select("sender_id")
            .in("sender_id", senderIds);

          if (countError) {
            console.warn("Erreur lors du comptage des annonces:", countError);
          }

          const countMap: Record<string, number> = (counts || []).reduce(
            (acc, item) => {
              acc[item.sender_id] = (acc[item.sender_id] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          const enrichedData: ShipmentRequest[] = data.map((r) => ({
            ...r,
            sender_request_count: countMap[r.sender_id] || 0,
          }));

          setShipmentRequests(enrichedData);
        } else {
          setShipmentRequests(data);
        }
      }
    } catch (err) {
      console.error("Erreur de chargement:", err);
      setError("Impossible de charger les annonces. Veuillez réessayer.");
      toast.error("Erreur de chargement des annonces");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // LOGIQUE DE RECHERCHE
  // ============================================================================
  const filteredRequests = useMemo(() => {
    if (!isSearching) return shipmentRequests;

    return shipmentRequests.filter((req) => {
      const matchFrom = !fromCity.trim() || req.from_city.toLowerCase().includes(fromCity.toLowerCase().trim());

      const matchTo = !toCity.trim() || req.to_city.toLowerCase().includes(toCity.toLowerCase().trim());

      const matchDate = !searchDate || isDateInRange(req, searchDate);

      return matchFrom && matchTo && matchDate;
    });
  }, [shipmentRequests, fromCity, toCity, searchDate, isSearching]);

  const handleSearch = useCallback(() => {
    const hasFilters = fromCity.trim() || toCity.trim() || searchDate;
    setIsSearching(!!hasFilters);
  }, [fromCity, toCity, searchDate]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleShipmentClick = useCallback((shipment: ShipmentRequest) => {
    setSelectedShipment(shipment);
  }, []);

  const handleSignUp = useCallback(() => {
    if (selectedShipment) {
      // Sauvegarde explicite en plus de l'état
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

  // ============================================================================
  // RENDER
  // ============================================================================
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
                  <span
                    className="absolute -top-1 -right-1 flex h-5 w-5 animate-bounce items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white z-50"
                    aria-label={`${unreadCount} message${unreadCount > 1 ? "s" : ""} non lu${unreadCount > 1 ? "s" : ""}`}
                  >
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
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              Faites voyager vos colis <br className="hidden sm:block" /> en toute confiance.
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              La 1ère plateforme de mise en relation sécurisée entre voyageurs et expéditeurs France ⇄ Algérie.
            </p>
          </div>
        </div>
      </section>

      {/* BARRE DE RECHERCHE */}
      <div className="relative md:sticky md:top-20 z-40 py-4 sm:py-6 mt-[-1rem]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-white dark:bg-card rounded-3xl shadow-xl border border-border/40 p-3 sm:p-2 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center px-4 py-3 gap-3 border border-border/50 rounded-xl bg-gray-50/50 sm:bg-transparent sm:border-0 transition-colors hover:bg-gray-50">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="w-full">
                <CityAutocomplete placeholder="Départ (ex: Paris)" value={fromCity} onChange={setFromCity} />
              </div>
            </div>

            <div className="w-px h-8 bg-gray-200 my-auto hidden sm:block" />

            <div className="flex-1 flex items-center px-4 py-3 gap-3 border border-border/50 rounded-xl bg-gray-50/50 sm:bg-transparent sm:border-0 transition-colors hover:bg-gray-50">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="w-full">
                <CityAutocomplete placeholder="Arrivée (ex: Alger)" value={toCity} onChange={setToCity} />
              </div>
            </div>

            <div className="w-px h-8 bg-gray-200 my-auto hidden sm:block" />

            <div className="flex-1 flex items-center px-4 py-3 gap-3 border border-border/50 rounded-xl bg-gray-50/50 sm:bg-transparent sm:border-0 transition-colors hover:bg-gray-50">
              <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground w-full p-0 h-auto cursor-pointer"
                aria-label="Date de voyage"
              />
            </div>

            <Button
              onClick={handleSearch}
              size="lg"
              className="rounded-xl sm:rounded-full w-full sm:w-auto px-8 h-12 sm:h-auto font-semibold shadow-lg shadow-primary/20 shrink-0"
            >
              <Search className="w-5 h-5 mr-2 sm:mr-0" />
              <span className="sm:hidden">Rechercher</span>
            </Button>
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <main className="container mx-auto px-4 max-w-7xl pb-20 pt-8">
        <div className="mb-8">
          {isSearching ? (
            <h2 className="text-2xl font-bold text-gray-900">
              Résultats pour votre recherche
              <span className="text-muted-foreground font-normal text-lg ml-2">
                ({filteredRequests.length} annonce{filteredRequests.length > 1 ? "s" : ""})
              </span>
            </h2>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dernières annonces publiées</h2>
              <p className="text-gray-500">Trouvez un colis à transporter et rentabilisez votre voyage.</p>
            </>
          )}
        </div>

        {/* État d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
            <Bell className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              <button onClick={fetchShipmentRequests} className="text-sm underline mt-1 hover:text-red-900">
                Réessayer
              </button>
            </div>
          </div>
        )}

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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun trajet ne correspond (pour l'instant)</h3>
            <p className="text-gray-500 max-w-md mb-8">
              Ne repartez pas les mains vides ! Créez une alerte voyageur et nous vous préviendrons dès qu'un colis
              correspondant est publié.
            </p>
            <Button
              onClick={() => navigate("/auth?role=traveler")}
              size="lg"
              className="rounded-full px-8 text-base shadow-lg shadow-primary/20"
            >
              Créer une alerte voyageur
            </Button>
          </div>
        )}

        {/* Grille de cartes */}
        {!isLoading && filteredRequests.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                role="button"
                tabIndex={0}
                aria-label={`Voir l'annonce de ${
                  request.profiles?.full_name || "Utilisateur"
                } pour transporter un colis de ${request.from_city} à ${request.to_city}`}
                className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => handleShipmentClick(request)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleShipmentClick(request);
                  }
                }}
              >
                <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
                  <img
                    src={getShipmentImageUrl(request.image_url, request.item_type)}
                    alt={`Photo de ${request.item_type}`}
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
                      <div
                        className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
                        aria-label="Expéditeur fiable"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        FIABLE
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
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{request.item_type}</span>
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

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-8 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left text-sm text-gray-400">
            © 2025 EDIM3AK. La plateforme de confiance.
          </div>
          <div className="flex gap-6 text-sm">
            <button onClick={() => navigate("/legal")} className="text-gray-400 hover:text-primary transition-colors">
              Conditions Générales (CGU)
            </button>
            <button onClick={() => navigate("/legal")} className="text-gray-400 hover:text-primary transition-colors">
              Confidentialité
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL DE DÉTAIL */}
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
