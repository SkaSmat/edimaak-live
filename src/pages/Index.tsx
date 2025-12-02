import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, MapPin, Calendar, Shield, TrendingUp, Zap, User } from "lucide-react";
import { format } from "date-fns";
import { getShipmentImageUrl } from "@/lib/shipmentImageHelper";
import { AvatarInitials } from "@/components/ui/avatar-initials";
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
  profiles?: {
    id: string;
    full_name: string;
  };
}

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
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
            if (data?.role === "traveler") {
              navigate("/dashboard/traveler");
            } else if (data?.role === "sender") {
              navigate("/dashboard/sender");
            } else if (data?.role === "admin") {
              navigate("/admin");
            }
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchShipmentRequests = async () => {
      const { data } = await supabase
        .from("shipment_requests")
        .select(`
          *,
          profiles:sender_id (
            id,
            full_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (data) {
        setShipmentRequests(data);
        setFilteredRequests(data);
      }
    };

    fetchShipmentRequests();
  }, []);

  const handleSearch = () => {
    setHasSearched(true);
    let filtered = shipmentRequests;

    // Filtre par ville de départ (insensible à la casse)
    if (fromCity.trim()) {
      filtered = filtered.filter(req => 
        req.from_city.toLowerCase().includes(fromCity.toLowerCase().trim())
      );
    }

    // Filtre par ville d'arrivée (insensible à la casse)
    if (toCity.trim()) {
      filtered = filtered.filter(req => 
        req.to_city.toLowerCase().includes(toCity.toLowerCase().trim())
      );
    }

    // Date ignorée pour l'instant pour simplifier

    setFilteredRequests(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <Package className="w-7 h-7 text-primary" />
              <span className="text-2xl font-semibold text-foreground">EdiM3ak</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth?role=sender")}
                className="text-foreground hover:bg-muted/50"
              >
                Devenir expéditeur
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="rounded-full px-6"
              >
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Transportez des colis lors de vos voyages
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Trouvez des demandes d'expédition compatibles avec votre trajet France-Algérie
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-full shadow-lg border border-border/40 p-2 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center px-4 py-2 gap-2 border-r border-border/40 sm:border-r-0">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Ville de départ"
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex-1 flex items-center px-4 py-2 gap-2 border-r border-border/40 sm:border-r-0">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Ville d'arrivée"
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex-1 flex items-center px-4 py-2 gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <Input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
                />
              </div>

              <Button
                onClick={handleSearch}
                size="lg"
                className="rounded-full w-full sm:w-auto px-8"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-foreground mb-3">
              Demandes d'expédition disponibles
            </h2>
            <p className="text-lg text-muted-foreground mb-2">
              Colis à transporter entre la France et l'Algérie
            </p>
            <p className="text-sm text-muted-foreground/70">
              {hasSearched ? filteredRequests.length : shipmentRequests.length} demande{(hasSearched ? filteredRequests.length : shipmentRequests.length) !== 1 ? 's' : ''} trouvée{(hasSearched ? filteredRequests.length : shipmentRequests.length) !== 1 ? 's' : ''}
            </p>
          </div>

          {hasSearched && filteredRequests.length === 0 && (
            <div className="text-center py-16 px-4">
              <Package className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Aucune demande ne correspond encore à ce trajet
              </h3>
              <p className="text-muted-foreground mb-6">
                Crée ton compte voyageur et reviens plus tard, de nouvelles demandes arrivent régulièrement.
              </p>
              <Button
                onClick={() => navigate("/auth?role=traveler")}
                size="lg"
                className="rounded-full px-8"
              >
                Créer mon compte voyageur
              </Button>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(hasSearched ? filteredRequests : shipmentRequests.slice(0, 6)).map((request) => (
              <div
                key={request.id}
                className="group bg-card rounded-2xl overflow-hidden border border-border/40 hover:shadow-lg transition-all duration-300 animate-fade-in"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={getShipmentImageUrl(request.image_url, request.item_type)}
                    alt={request.item_type}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <div className="p-6">
                  {/* Bloc expéditeur */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/40">
                    {request.profiles ? (
                      <>
                        <AvatarInitials fullName={request.profiles.full_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Expéditeur</p>
                          <p className="text-sm font-medium text-foreground truncate">
                            {formatShortName(request.profiles.full_name)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Expéditeur</p>
                          <p className="text-sm font-medium text-foreground">Utilisateur</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium text-foreground">
                      {request.from_city} → {request.to_city}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {request.item_type}
                  </h3>

                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center justify-between">
                      <span>Poids</span>
                      <span className="font-medium text-foreground">{request.weight_kg} kg</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dates</span>
                      <span className="font-medium text-foreground">
                        {format(new Date(request.earliest_date), "dd/MM")} - {format(new Date(request.latest_date), "dd/MM")}
                      </span>
                    </div>
                  </div>

                  {request.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {request.notes}
                    </p>
                  )}

                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => setSelectedShipment(request)}
                  >
                    Voir plus
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
                Voir toutes les demandes
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Why EdiM3ak Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sécurité
              </h3>
              <p className="text-muted-foreground">
                Discutez directement avec l'expéditeur avant de vous engager
              </p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Économie
              </h3>
              <p className="text-muted-foreground">
                Partagez vos trajets pour arrondir vos fins de mois
              </p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Rapidité
              </h3>
              <p className="text-muted-foreground">
                Un matching instantané selon votre trajet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center text-sm text-muted-foreground">
            © EdiM3ak – 2025
          </div>
        </div>
      </footer>

      {/* Shipment Detail Modal */}
      {selectedShipment && (
        <ShipmentDetailModal
          isOpen={!!selectedShipment}
          onClose={() => setSelectedShipment(null)}
          shipment={selectedShipment}
          isAuthenticated={!!session}
          onSignUp={() => navigate("/auth?role=traveler")}
          onLogin={() => navigate("/auth")}
        />
      )}
    </div>
  );
};

export default Index;
