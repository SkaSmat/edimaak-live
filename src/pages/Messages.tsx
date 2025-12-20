import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ArrowLeft } from "lucide-react";
import ConversationList from "@/components/ConversationList";
import ChatWindow from "@/components/ChatWindow";
import { EmptyState } from "@/components/ui/empty-state";
import { DashboardLayout } from "@/components/DashboardLayout";

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // NOUVELLE FONCTION : Marquer comme lu avec signal de rafraîchissement
  const markAsRead = (matchId: string) => {
    try {
      const storage = localStorage.getItem("unreadMatches");
      if (storage) {
        let unreadList = JSON.parse(storage);

        // On vérifie si l'ID est bien présent avant de modifier
        if (unreadList.includes(matchId)) {
          unreadList = unreadList.filter((id: string) => id !== matchId);
          localStorage.setItem("unreadMatches", JSON.stringify(unreadList));

          // LIGNE DE CODE CRITIQUE : Force la mise à jour globale
          window.dispatchEvent(new Event("unread-change"));
        }
      }
    } catch (error) {
      // Corrupted localStorage, skip
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const matchIdFromUrl = urlParams.get("matchId");

    if (matchIdFromUrl) {
      setSelectedMatchId(matchIdFromUrl);
      // On marque comme lu immédiatement dès l'arrivée sur la conversation via URL
      markAsRead(matchIdFromUrl);
    }
  }, [location.search]);

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
    // ... Déconnexion ...
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "/";
  };

  const handleBack = () => {
    if (selectedMatchId) {
      setSelectedMatchId(null);
      navigate("/messages");
    } else {
      navigate(-1);
    }
  };

  // MISE À JOUR : Appel à markAsRead qui contient maintenant le signal de rafraîchissement
  const handleSelectMatch = (id: string) => {
    setSelectedMatchId(id);
    navigate(`/messages?matchId=${id}`);
    markAsRead(id); // <--- Ligne qui déclenche la mise à jour globale
  };

  if (loading) return null;
  if (!user || !profile) return null;

  return (
    <DashboardLayout role={profile.role} fullName={profile.full_name} isAdmin={profile.role === "admin"}>
      <div className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)] flex flex-col">
        <div className="md:hidden flex items-center justify-between mb-3 sm:mb-4">
          {selectedMatchId && (
            <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2 text-xs sm:text-sm">
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              Retour
            </Button>
          )}
          {!selectedMatchId && <h1 className="text-lg sm:text-xl font-bold">Messagerie</h1>}
        </div>

        <div className="flex-1 grid md:grid-cols-3 gap-3 sm:gap-6 h-full min-h-0">
          <Card
            className={`md:col-span-1 flex flex-col h-full border-0 shadow-none md:border md:shadow-sm ${selectedMatchId ? "hidden md:flex" : "flex"}`}
          >
            <CardHeader className="py-2 sm:py-3 px-3 sm:px-4 border-b hidden md:block">
              <CardTitle className="text-base sm:text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ConversationList userId={user.id} onSelectMatch={handleSelectMatch} selectedMatchId={selectedMatchId} />
            </CardContent>
          </Card>

          <Card
            className={`md:col-span-2 flex flex-col h-full border-0 shadow-none md:border md:shadow-sm ${!selectedMatchId ? "hidden md:flex" : "flex"}`}
          >
            <CardHeader className="py-2 sm:py-3 px-3 sm:px-4 border-b hidden md:block">
              <CardTitle className="text-base sm:text-lg">
                {selectedMatchId ? "Discussion" : "Sélectionnez une conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-background md:bg-card">
              {selectedMatchId ? (
                <div className="flex-1 p-0 md:p-3 lg:p-4 overflow-hidden h-full">
                  <ChatWindow matchId={selectedMatchId} userId={user.id} />
                </div>
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title="Aucune conversation sélectionnée"
                  description="Sélectionne une conversation dans la liste à gauche pour commencer à discuter."
                  className="py-6 sm:py-8 h-full flex flex-col justify-center"
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
