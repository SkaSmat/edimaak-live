import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Users, Plane, Package, Handshake } from "lucide-react";
import AdminUsers from "@/components/AdminUsers";
import AdminTrips from "@/components/AdminTrips";
import AdminShipments from "@/components/AdminShipments";
import AdminMatches from "@/components/AdminMatches";
import AdminStatsEnhanced from "@/components/AdminStatsEnhanced";
import { DashboardLayout } from "@/components/DashboardLayout";

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

    // Use server-side has_role function via user_roles table for proper admin validation
    const { data: isAdminResult, error: adminError } = await supabase
      .rpc('has_role', { _user_id: session.user.id, _role: 'admin' });

    if (adminError || !isAdminResult) {
      navigate("/");
      toast.error("Accès non autorisé");
      return;
    }

    // Fetch profile data for display purposes only (not for authorization)
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

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
    <DashboardLayout
      role="admin"
      fullName={profile.full_name}
      isAdmin={true}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord Admin</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs, voyages et demandes d'expédition
          </p>
        </div>

        {/* Stats Section */}
        <AdminStatsEnhanced />

        {/* Tabs Section */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4 hidden sm:block" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="shipments" className="gap-2">
              <Package className="w-4 h-4 hidden sm:block" />
              Demandes
            </TabsTrigger>
            <TabsTrigger value="trips" className="gap-2">
              <Plane className="w-4 h-4 hidden sm:block" />
              Voyages
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
    </DashboardLayout>
  );
};

export default Admin;
