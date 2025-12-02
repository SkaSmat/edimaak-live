import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface ChatWindowProps {
  matchId: string;
  userId: string;
}

interface MatchDetails {
  trips: {
    from_city: string;
    to_city: string;
    departure_date: string;
  };
  shipment_requests: {
    from_city: string;
    to_city: string;
    item_type: string;
  };
}

const ChatWindow = ({ matchId, userId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    fetchMatchDetails();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles:sender_id(full_name)")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Erreur lors du chargement des messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          trips:trip_id(from_city, to_city, departure_date),
          shipment_requests:shipment_request_id(from_city, to_city, item_type)
        `)
        .eq("id", matchId)
        .single();

      if (error) throw error;
      setMatchDetails(data as any);
    } catch (error) {
      console.error("Error fetching match details:", error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: userId,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Match Info */}
      {matchDetails && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg border text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Voyage: {matchDetails.trips.from_city} → {matchDetails.trips.to_city}
              </p>
              <p className="text-muted-foreground">
                Expédition: {matchDetails.shipment_requests.item_type}
              </p>
            </div>
            <p className="text-muted-foreground">
              {format(new Date(matchDetails.trips.departure_date), "d MMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded-lg bg-muted/20">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun message. Commencez la conversation !
          </div>
        ) : (
          messages.map((message: any) => {
            const isOwn = message.sender_id === userId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {message.profiles.full_name}
                    </p>
                  )}
                  <p className="text-sm break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? "opacity-70" : "text-muted-foreground"
                    }`}
                  >
                    {format(new Date(message.created_at), "HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 mt-4">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !newMessage.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatWindow;
