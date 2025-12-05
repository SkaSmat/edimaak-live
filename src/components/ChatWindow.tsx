import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Plane, Package, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ActivityBadge, VerifiedBadge } from "@/components/UserProfileBadges";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

interface ChatWindowProps {
  matchId: string;
  userId: string;
}

interface OtherUserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: "traveler" | "sender" | "admin";
}

interface OtherUserPrivateInfo {
  phone: string | null;
  id_type: string | null;
  id_number: string | null;
}

const ChatWindow = ({ matchId, userId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [matchDetails, setMatchDetails] = useState<any | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUserProfile | null>(null);
  const [otherUserPrivateInfo, setOtherUserPrivateInfo] = useState<OtherUserPrivateInfo | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    fetchMatchDetails();

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
        },
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
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          trips:trip_id(from_city, to_city, departure_date, traveler_id),
          shipment_requests:shipment_request_id(from_city, to_city, item_type, sender_id)
        `,
        )
        .eq("id", matchId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setAccessDenied(true);
        return;
      }

      setMatchDetails(data);

      let targetUserId = null;
      const trip = data.trips as any;
      const request = data.shipment_requests as any;

      if (trip?.traveler_id === userId) {
        targetUserId = request?.sender_id;
      } else if (request?.sender_id === userId) {
        targetUserId = trip?.traveler_id;
      } else {
        targetUserId = trip?.traveler_id;
      }

      if (targetUserId) {
        // Fetch profile data (public info)
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role")
          .eq("id", targetUserId)
          .maybeSingle();

        if (profileData) setOtherUser(profileData as OtherUserProfile);

        // Fetch private_info for verified status (only if matched - RLS allows this)
        const { data: privateData } = await supabase
          .from("private_info")
          .select("phone, id_type, id_number")
          .eq("id", targetUserId)
          .maybeSingle();

        if (privateData) setOtherUserPrivateInfo(privateData as OtherUserPrivateInfo);
      }
    } catch (error) {
      console.error("Error fetching match details:", error);
      setAccessDenied(true);
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
      toast.error("Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  };

  // Check if user is verified (phone + ID)
  const isOtherUserVerified = Boolean(
    otherUserPrivateInfo?.phone?.trim() &&
    otherUserPrivateInfo?.id_type?.trim() &&
    otherUserPrivateInfo?.id_number?.trim()
  );

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement de la conversation...</div>;
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-6 bg-muted/20 rounded-lg">
        <AlertTriangle className="w-10 h-10 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold">Conversation inaccessible</h3>
        <p className="text-muted-foreground mt-2">
          Vous n'avez pas les droits pour accéder à cet échange ou il n'existe plus.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] sm:h-[500px] md:h-[600px]">
      {/* Header with other user info */}
      {otherUser && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <UserAvatar fullName={otherUser.full_name} avatarUrl={otherUser.avatar_url} size="sm" className="sm:w-10 sm:h-10" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground text-sm sm:text-base truncate">{otherUser.full_name}</p>
                <VerifiedBadge isVerified={isOtherUserVerified} size="sm" />
              </div>
              <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                <ActivityBadge isActive={true} role={otherUser.role as "traveler" | "sender"} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match details */}
      {matchDetails && matchDetails.trips && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
              <span className="font-medium truncate">
                {(matchDetails.trips as any).from_city} → {(matchDetails.trips as any).to_city}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">{(matchDetails.shipment_requests as any).item_type}</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
            <Send className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
            <p className="text-xs sm:text-sm">Dites bonjour pour démarrer la discussion !</p>
          </div>
        ) : (
          messages.map((message: any) => {
            const isOwn = message.sender_id === userId;
            const senderName = message.profiles?.full_name || "Utilisateur inconnu";

            return (
              <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-2.5 sm:p-3 px-3 sm:px-4 ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-white dark:bg-slate-800 border shadow-sm rounded-bl-sm"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-[9px] sm:text-[10px] font-bold mb-1 opacity-50 uppercase tracking-wider truncate">{senderName}</p>
                  )}
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-[9px] sm:text-[10px] mt-1 text-right ${isOwn ? "opacity-70" : "text-muted-foreground"}`}>
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
      <form onSubmit={handleSend} className="flex gap-2 mt-3 sm:mt-4">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          disabled={sending}
          className="flex-1 text-sm h-9 sm:h-10"
        />
        <Button type="submit" disabled={sending || !newMessage.trim()} size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatWindow;