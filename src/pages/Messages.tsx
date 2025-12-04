import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Ajout de useLocation
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ArrowLeft } from "lucide-react";
import ConversationList from "@/components/ConversationList";
import ChatWindow from "@/components/ChatWindow";
import { EmptyState } from "@/components/ui/empty-state";
import { DashboardLayout } from "@/components/DashboardLayout";
import { toast } from "sonner";

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook essentiel pour écouter l'URL
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Initialisation Auth
  useEffect(() => {
    checkAuth();
  }, []);

  // 2. Écouteur de changement d'URL (C'est la correction !)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const matchIdFromUrl = urlParams.get("matchId");

    if (matchIdFromUrl && matchIdFromUrl !== selectedMatchId) {
      console.log("URL a changé, nouvelle sélection :", matchIdFromUrl);
      setSelectedMatchId(matchIdFromUrl);
    }
  }, [location.search]); // Se déclenche à chaque fois que l'URL change

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      setProfile(profileData);
    } catch (error) {
      console.error("Erreur auth:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "/";
  };

  const handleBack = () => {
    if (selectedMatchId) {
      setSelectedMatchId(null);
      // On retire le paramètre de l'URL proprement
      navigate("/messages");
    } else {
      navigate(-1);
    }
  };

  // Handler pour quand on clique manuellement sur une conversation
  const handleSelectMatch = (id: string) => {
    setSelectedMatchId(id);
    // On met à jour l'URL pour que ce soit cohérent (et partageable)
    navigate(`/messages?matchId=${id}`);
  };

  if (loading) return null;
  if (!user || !profile) return null;

  return (
    <DashboardLayout
      role={profile.role}
      fullName={profile.full_name}
      isAdmin={profile.role === "admin"}
      onLogout={handleLogout}
    >
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="md:hidden flex items-center justify-between mb-4">
          {selectedMatchId && (
            <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux discussions
            </Button>
          )}
          {!selectedMatchId && <h1 className="text-xl font-bold">Messagerie</h1>}
        </div>

        <div className="flex-1 grid md:grid-cols-3 gap-6 h-full min-h-0">
          <Card
            className={`md:col-span-1 flex flex-col h-full border-0 shadow-none md:border md:shadow-sm ${selectedMatchId ? "hidden md:flex" : "flex"}`}
          >
            <CardHeader className="py-3 px-4 border-b hidden md:block">
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ConversationList
                userId={user.id}
                onSelectMatch={handleSelectMatch} // Utilise notre nouveau handler
                selectedMatchId={selectedMatchId}
              />
            </CardContent>
          </Card>

          <Card
            className={`md:col-span-2 flex flex-col h-full border-0 shadow-none md:border md:shadow-sm ${!selectedMatchId ? "hidden md:flex" : "flex"}`}
          >
            <CardHeader className="py-3 px-4 border-b hidden md:block">
              <CardTitle className="text-lg">
                {selectedMatchId ? "Discussion" : "Sélectionnez une conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-background md:bg-card">
              {selectedMatchId ? (
                <div className="flex-1 p-0 md:p-4 overflow-hidden h-full">
                  <ChatWindow matchId={selectedMatchId} userId={user.id} />
                </div>
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title="Aucune conversation sélectionnée"
                  description="Sélectionne une conversation dans la liste à gauche pour commencer à discuter."
                  className="py-8 h-full flex flex-col justify-center"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
