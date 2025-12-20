import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ArrowLeft, Send, Package, Plane } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface Participant {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface ConversationContext {
  shipment?: {
    id: string;
    from_city: string;
    to_city: string;
    earliest_date: string;
    latest_date: string;
  };
  trip?: {
    id: string;
    from_city: string;
    to_city: string;
    departure_date: string;
  };
}

const DirectChatPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<Participant | null>(null);
  const [context, setContext] = useState<ConversationContext>({});
  const [userRole, setUserRole] = useState<string>("sender");
  const [userName, setUserName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`direct-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(session.user.id);

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setUserRole(profile.role);
      setUserName(profile.full_name);
    }

    await fetchConversationData(session.user.id);
  };

  const fetchConversationData = async (userId: string) => {
    if (!conversationId) return;
    setLoading(true);

    try {
      // Fetch conversation details
      const { data: conversation, error: convError } = await supabase
        .from("direct_conversations")
        .select("*, shipment_requests(*), trips(*)")
        .eq("id", conversationId)
        .single();

      if (convError) throw convError;

      // Determine other participant
      const otherUserId = conversation.participant_1_id === userId
        ? conversation.participant_2_id
        : conversation.participant_1_id;

      // Fetch other participant info
      const { data: otherUser } = await supabase.rpc("get_sender_display_info", {
        sender_uuid: otherUserId,
      });

      if (otherUser && otherUser.length > 0) {
        setOtherParticipant({
          id: otherUserId,
          display_name: otherUser[0].display_name,
          avatar_url: otherUser[0].avatar_url,
        });
      }

      // Set context
      const ctx: ConversationContext = {};
      if (conversation.shipment_requests) {
        ctx.shipment = {
          id: conversation.shipment_requests.id,
          from_city: conversation.shipment_requests.from_city,
          to_city: conversation.shipment_requests.to_city,
          earliest_date: conversation.shipment_requests.earliest_date,
          latest_date: conversation.shipment_requests.latest_date,
        };
      }
      if (conversation.trips) {
        ctx.trip = {
          id: conversation.trips.id,
          from_city: conversation.trips.from_city,
          to_city: conversation.trips.to_city,
          departure_date: conversation.trips.departure_date,
        };
      }
      setContext(ctx);

      // Fetch messages
      const { data: msgs, error: msgsError } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (msgsError) throw msgsError;
      setMessages(msgs || []);

      // Mark unread messages as read
      const unreadMsgs = (msgs || []).filter(
        (m) => m.sender_id !== userId && !m.read_at
      );
      if (unreadMsgs.length > 0) {
        await supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadMsgs.map((m) => m.id));
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
      toast.error("Erreur lors du chargement de la conversation");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !conversationId) return;

    setSending(true);
    try {
      const { error } = await supabase.from("direct_messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage.trim().slice(0, 2000),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Déconnexion réussie");
  };

  if (loading) {
    return (
      <DashboardLayout role={userRole as any} fullName={userName} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={userRole as any} fullName={userName} onLogout={handleLogout}>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-card rounded-t-xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {otherParticipant && (
            <div className="flex items-center gap-3">
              <UserAvatar
                fullName={otherParticipant.display_name}
                avatarUrl={otherParticipant.avatar_url}
                size="sm"
              />
              <div>
                <h2 className="font-semibold">{otherParticipant.display_name}</h2>
                <p className="text-xs text-muted-foreground">Message direct</p>
              </div>
            </div>
          )}
        </div>

        {/* Context info */}
        {(context.shipment || context.trip) && (
          <div className="p-3 bg-muted/30 border-b space-y-2">
            {context.shipment && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-primary" />
                <span className="font-medium">
                  Colis : {context.shipment.from_city} → {context.shipment.to_city}
                </span>
                <span className="text-muted-foreground">
                  ({format(new Date(context.shipment.earliest_date), "d MMM")} - {format(new Date(context.shipment.latest_date), "d MMM")})
                </span>
              </div>
            )}
            {context.trip && (
              <div className="flex items-center gap-2 text-sm">
                <Plane className="w-4 h-4 text-blue-500" />
                <span className="font-medium">
                  Voyage : {context.trip.from_city} → {context.trip.to_city}
                </span>
                <span className="text-muted-foreground">
                  ({format(new Date(context.trip.departure_date), "d MMMM", { locale: fr })})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Aucun message pour le moment.</p>
              <p className="text-sm mt-1">Commencez la conversation !</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {format(new Date(message.created_at), "HH:mm")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-card rounded-b-xl">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default DirectChatPage;
