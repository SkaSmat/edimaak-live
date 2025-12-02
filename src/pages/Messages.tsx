import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import ConversationList from "@/components/ConversationList";
import ChatWindow from "@/components/ChatWindow";

const Messages = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    
    // Check if there's a matchId in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const matchIdFromUrl = urlParams.get('matchId');
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
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-xl font-bold">Messagerie</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <ConversationList
                userId={user.id}
                onSelectMatch={setSelectedMatchId}
                selectedMatchId={selectedMatchId}
              />
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedMatchId ? "Discussion" : "Sélectionnez une conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMatchId ? (
                <ChatWindow matchId={selectedMatchId} userId={user.id} />
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Sélectionnez une conversation pour commencer à échanger
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
