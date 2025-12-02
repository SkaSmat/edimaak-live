import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, MapPin, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";

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
}

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [shipmentRequests, setShipmentRequests] = useState<ShipmentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ShipmentRequest[]>([]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
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
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      
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

    if (fromCity) {
      filtered = filtered.filter(req => 
        req.from_city.toLowerCase().includes(fromCity.toLowerCase())
      );
    }

    if (toCity) {
      filtered = filtered.filter(req => 
        req.to_city.toLowerCase().includes(toCity.toLowerCase())
      );
    }

    if (searchDate) {
      filtered = filtered.filter(req => {
        const earliest = new Date(req.earliest_date);
        const latest = new Date(req.latest_date);
        const selected = new Date(searchDate);
        return selected >= earliest && selected <= latest;
      });
    }

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
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {hasSearched && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {filteredRequests.length} demande{filteredRequests.length > 1 ? 's' : ''} d'expédition
              </h2>
              <p className="text-muted-foreground">
                Colis à transporter entre la France et l'Algérie
              </p>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(hasSearched ? filteredRequests : shipmentRequests.slice(0, 6)).map((request) => (
              <div
                key={request.id}
                className="group bg-card rounded-2xl overflow-hidden border border-border/40 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setShowAuthDialog(true)}
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 flex items-center justify-center">
                  <Package className="w-16 h-16 text-primary/40" />
                </div>
                
                <div className="p-6">
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

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center text-sm text-muted-foreground">
            © EdiM3ak – 2025
          </div>
        </div>
      </footer>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créez un compte pour continuer</DialogTitle>
            <DialogDescription>
              Inscrivez-vous en tant que voyageur pour contacter les expéditeurs et proposer de transporter leurs colis.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() => navigate("/auth?role=traveler")}
              size="lg"
              className="w-full"
            >
              S'inscrire comme voyageur
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Se connecter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
