import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, MapPin, Calendar, Shield, TrendingUp, Zap, ShieldCheck } from "lucide-react";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { format } from "date-fns";
import { getShipmentImageUrl } from "@/lib/shipmentImageHelper";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatShortName } from "@/lib/nameHelper";
import { ShipmentDetailModal } from "@/components/ShipmentDetailModal";

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
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [shipmentRequests, setShipmentRequests] = useState<ShipmentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ShipmentRequest[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRequest | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.role || null);
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.role || null);
          });
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getDashboardPath = () => {
    if (userRole === "sender") return "/dashboard/sender";
    if (userRole === "admin") return "/admin";
    return "/dashboard/traveler";
  };

  useEffect(() => {
    const fetchShipmentRequests = async () => {
      const { data } = await supabase
        .from("shipment_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        const senderIds = [...new Set(data.map((r) => r.sender_id))];

        const senderInfoPromises = senderIds.map(async (senderId) => {
          const { data: senderData } = await supabase.rpc("get_sender_display_info", { sender_uuid: senderId });
          return { senderId, info: senderData?.[0] || null };
        });

        const countsPromises = senderIds.map(async (senderId) => {
          const { count } = await supabase
            .from("shipment_requests")
            .select("*", { count: "exact", head: true })
            .eq("sender_id", senderId);
          return { senderId, count: count || 0 };
        });

        const [senderInfos, counts] = await Promise.all([Promise.all(senderInfoPromises), Promise.all(countsPromises)]);

        const senderInfoMap = Object.fromEntries(senderInfos.map((s) => [s.senderId, s.info]));
        const countMap = Object.fromEntries(counts.map((c) => [c.senderId, c.count]));

        const enrichedData = data.map((r) => ({
          ...r,
          profiles: senderInfoMap[r.sender_id]
            ? {
                id: r.sender_id,
                full_name: senderInfoMap[r.sender_id].display_name || "Utilisateur",
                avatar_url: senderInfoMap[r.sender_id].avatar_url,
              }
            : null,
          sender_request_count: countMap[r.sender_id] || 0,
        }));

        setShipmentRequests(enrichedData);
        setFilteredRequests(enrichedData);
      }
    };

    fetchShipmentRequests();
  }, []);

  const handleSearch = () => {
    setHasSearched(true);
    let filtered = shipmentRequests;

    if (fromCity.trim()) {
      const searchFrom = fromCity.toLowerCase().trim();
      filtered = filtered.filter((req) => req.from_city.toLowerCase().includes(searchFrom));
    }

    if (toCity.trim()) {
      const searchTo = toCity.toLowerCase().trim();
      filtered = filtered.filter((req) => req.to_city.toLowerCase().includes(searchTo));
    }

    if (searchDate) {
      const selectedDate = new Date(searchDate);
      filtered = filtered.filter((req) => {
        if (!req.earliest_date || !req.latest_date) return true;
        const earliest = new Date(req.earliest_date);
        const latest = new Date(req.latest_date);
        return selectedDate >= earliest && selectedDate <= latest;
      });
    }

    setFilteredRequests(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <LogoEdiM3ak iconSize="lg" onClick={() => navigate("/")} />

            <div className="flex items-center gap-3 sm:gap-6">
              {session ? (
                <Button onClick={() => navigate(getDashboardPath())} className="rounded-full px-4 sm:px-6 text-sm">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/auth?role=sender")}
                    className="text-foreground hover:bg-muted/50 hidden sm:inline-flex"
                  >
                    Devenir expéditeur
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/auth")} className="rounded-full px-4 sm:px-6">
                    Se connecter
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
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

      {/* Barre de Recherche CORRIGÉE (Plus de sticky mobile, plus de transparence) */}
      <div className="relative md:sticky md:top-20 z-40 py-4 sm:py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="bg-white dark:bg-card rounded-2xl shadow-xl border border-border/40 p-3 sm:p-2 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center px-4 py-3 gap-3 border border-border/50 rounded-xl bg-background shadow-sm sm:border-0 sm:shadow-none">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <CityAutocomplete placeholder="Départ (ex: Paris)" value={fromCity} onChange={setFromCity} />
            </div>

            <div className="flex-1 flex items-center px-4 py-3 gap-3 border border-border/50 rounded-xl bg-background shadow-sm sm:border-0 sm:shadow-none">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <CityAutocomplete placeholder="Arrivée (ex: Alger)" value={toCity} onChange={setToCity} />
            </div>

            <div className="flex-1 flex items-center px-4 py-3 gap-3 border border-border/50 rounded-xl bg-background shadow-sm sm:border-0 sm:shadow-none">
              <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground w-full p-0 h-auto"
              />
            </div>

            <Button
              onClick={handleSearch}
              size="lg"
              className="rounded-xl sm:rounded-full w-full sm:w-auto px-8 h-12 sm:h-auto font-semibold shadow-lg shadow-primary/20"
            >
              <Search className="w-5 h-5 mr-2 sm:mr-0" />
              <span className="sm:hidden">Rechercher</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mb-6 sm:mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">Annonces récentes</h2>
              <p className="text-sm text-muted-foreground">
                {hasSearched ? filteredRequests.length : shipmentRequests.length} demande(s) disponible(s)
              </p>
            </div>
          </div>

          {hasSearched && filteredRequests.length === 0 && (
            <div className="text-center py-16 px-4 bg-muted/20 rounded-3xl border border-dashed border-border/60">
              <Package className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Aucun résultat pour cette recherche</h3>
              <p className="text-muted-foreground mb-6">Essayez d'autres villes ou d'autres dates.</p>
              <Button onClick={() => navigate("/auth?role=traveler")} size="lg" className="rounded-full px-8">
                Créer une alerte voyageur
              </Button>
            </div>
          )}

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(hasSearched ? filteredRequests : shipmentRequests.slice(0, 6)).map((request) => (
              <div
                key={request.id}
                className="group bg-card rounded-2xl overflow-hidden border border-border/40 hover:shadow-lg hover:border-primary/20 transition-all duration-300 animate-fade-in"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={getShipmentImageUrl(request.image_url, request.item_type)}
                    alt={request.item_type}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {request.weight_kg} kg
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/40">
                    <UserAvatar
                      fullName={request.profiles?.full_name || ""}
                      avatarUrl={request.profiles?.avatar_url}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {request.profiles?.full_name ? formatShortName(request.profiles.full_name) : "Utilisateur"}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Expéditeur</span>
                        {(request.sender_request_count || 0) > 2 && (
                          <ShieldCheck className="w-3 h-3 text-green-500 ml-1" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground text-sm sm:text-base truncate">
                      {request.from_city} → {request.to_city}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground mb-4 bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span>Objet</span>
                      <span className="font-medium text-foreground">{request.item_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dates</span>
                      <span className="font-medium text-foreground">
                        {format(new Date(request.earliest_date), "dd/MM")} -{" "}
                        {format(new Date(request.latest_date), "dd/MM")}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                    onClick={() => setSelectedShipment(request)}
                  >
                    Voir l'annonce
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {!hasSearched && shipmentRequests.length > 6 && (
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setHasSearched(true);
                  setFilteredRequests(shipmentRequests);
                }}
                className="rounded-full px-8"
              >
                Voir plus d'annonces
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-12 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center text-sm text-muted-foreground">© EDIM3AK – 2025. Connecter les voyageurs.</div>
        </div>
      </footer>

      {/* Shipment Detail Modal */}
      {selectedShipment && (
        <ShipmentDetailModal
          isOpen={!!selectedShipment}
          onClose={() => setSelectedShipment(null)}
          shipment={selectedShipment}
          isAuthenticated={!!session}
          onSignUp={() => {
            localStorage.setItem("targetShipmentId", selectedShipment.id);
            navigate("/auth?role=traveler");
          }}
          onLogin={() => {
            localStorage.setItem("targetShipmentId", selectedShipment.id);
            navigate("/auth");
          }}
        />
      )}
    </div>
  );
};

export default Index;
