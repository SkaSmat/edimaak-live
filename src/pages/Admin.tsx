import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Users, Plane, Package, Handshake, LogOut, Home } from "lucide-react";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminUsers from "@/components/AdminUsers";
import AdminTrips from "@/components/AdminTrips";
import AdminShipments from "@/components/AdminShipments";
import AdminMatches from "@/components/AdminMatches";
import { AdminStats } from "@/components/AdminStats";

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData?.role !== "admin") {
      navigate("/");
      toast.error("Accès non autorisé");
      return;
    }

    setUser(session.user);
    setProfile(profileData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Déconnexion réussie");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LogoEdiM3ak iconSize="sm" onClick={() => navigate("/")} />
            <Badge variant="destructive" className="hidden sm:flex">
              Administration
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Accueil</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord Admin</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs, voyages, demandes et matches
          </p>
        </div>

        {/* Stats Section */}
        <AdminStats />

        {/* Tabs Section */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4 hidden sm:block" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="trips" className="gap-2">
              <Plane className="w-4 h-4 hidden sm:block" />
              Voyages
            </TabsTrigger>
            <TabsTrigger value="shipments" className="gap-2">
              <Package className="w-4 h-4 hidden sm:block" />
              Demandes
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2">
              <Handshake className="w-4 h-4 hidden sm:block" />
              Matches
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Liste des utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminUsers />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trips">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Liste des voyages</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminTrips />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipments">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Liste des demandes d'expédition</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminShipments />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Liste des matches</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminMatches />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
