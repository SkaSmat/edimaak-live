import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageSquare } from "lucide-react";
import ConversationList from "@/components/ConversationList";
import ChatWindow from "@/components/ChatWindow";
import { EmptyState } from "@/components/ui/empty-state";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak"; // ✅ Import du logo

const Messages = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();

    // Check if there's a matchId in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const matchIdFromUrl = urlParams.get("matchId");
    if (matchIdFromUrl) {
      setSelectedMatchId(matchIdFromUrl);
    }
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
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* --- HEADER MODIFIÉ --- */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
          {/* Bouton Retour (À gauche) */}
          <Button variant="ghost" size="sm" onClick={handleBack} className="z-10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Retour</span>
          </Button>

          {/* Logo Centré (Absolu pour être parfaitement au milieu) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <LogoEdiM3ak
              iconSize="sm"
              onClick={() => navigate("/")} // Redirige vers l'accueil (qui renverra au Dashboard)
            />
          </div>

          {/* Espace vide à droite pour équilibrer (Optionnel mais propre) */}
          <div className="w-16"></div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="md:col-span-1 h-[calc(100vh-8rem)] flex flex-col">
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ConversationList userId={user.id} onSelectMatch={setSelectedMatchId} selectedMatchId={selectedMatchId} />
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="md:col-span-2 h-[calc(100vh-8rem)] flex flex-col">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-lg">
                {selectedMatchId ? "Discussion" : "Sélectionnez une conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              {selectedMatchId ? (
                <div className="flex-1 p-4 overflow-hidden">
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
    </div>
  );
};

export default Messages;
