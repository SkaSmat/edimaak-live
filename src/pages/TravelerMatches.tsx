import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MyMatches from "@/components/MyMatches";
import { DashboardLayout } from "@/components/DashboardLayout";

const TravelerMatches = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

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

    setUser(session.user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData?.role !== "traveler") {
      navigate("/auth");
      toast.error("Accès non autorisé");
      return;
    }

    setProfile(profileData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Déconnexion réussie");
  };

  if (!user || !profile) return null;

  return (
    <DashboardLayout
      role="traveler"
      fullName={profile.full_name}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Mes matches acceptés</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Expéditions que vous avez acceptées
            </p>
          </div>
          <MyMatches userId={user.id} />
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TravelerMatches;
