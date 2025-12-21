import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Plane, Package, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ActivityBadge, VerifiedBadge } from "@/components/UserProfileBadges";
import TransactionTracking from "@/components/TransactionTracking";
import ReviewModal from "@/components/ReviewModal";

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

interface MatchTracking {
  status: string;
  sender_handed_over: boolean;
  traveler_picked_up: boolean;
  traveler_delivered: boolean;
  sender_received: boolean;
  completed_at: string | null;
  trip_id: string;
  shipment_request_id: string;
}

const ChatWindow = ({ matchId, userId }: ChatWindowProps) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [matchDetails, setMatchDetails] = useState<any | null>(null);
  const [matchTracking, setMatchTracking] = useState<MatchTracking | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUserProfile | null>(null);
  const [otherUserPrivateInfo, setOtherUserPrivateInfo] = useState<OtherUserPrivateInfo | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isSender, setIsSender] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    fetchMatchDetails();
    fetchCurrentUserName();

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
        () => {
          fetchMessages();
        },
      )
      .subscribe();

    // Subscribe to match updates for tracking
    const matchChannel = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        () => {
          fetchMatchTracking();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(matchChannel);
    };
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if should show review modal when match becomes completed
  useEffect(() => {
    if (matchTracking?.status === "completed" && !hasReviewed && otherUser) {
      checkIfReviewed();
    }
  }, [matchTracking?.status, otherUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchCurrentUserName = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    if (data) setCurrentUserName(data.full_name || "Vous");
  };

  const checkIfReviewed = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id")
      .eq("match_id", matchId)
      .eq("reviewer_id", userId)
      .maybeSingle();

    if (!data) {
      setShowReviewModal(true);
    } else {
      setHasReviewed(true);
    }
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
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchTracking = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select("status, sender_handed_over, traveler_picked_up, traveler_delivered, sender_received, completed_at, trip_id, shipment_request_id")
        .eq("id", matchId)
        .maybeSingle();

      if (error) throw error;
      if (data) setMatchTracking(data as MatchTracking);
    } catch (error) {
      // Error handled silently
    }
  };

  const fetchMatchDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          status, sender_handed_over, traveler_picked_up, traveler_delivered, sender_received, completed_at, trip_id, shipment_request_id,
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
      setMatchTracking({
        status: data.status,
        sender_handed_over: data.sender_handed_over || false,
        traveler_picked_up: data.traveler_picked_up || false,
        traveler_delivered: data.traveler_delivered || false,
        sender_received: data.sender_received || false,
        completed_at: data.completed_at,
        trip_id: data.trip_id,
        shipment_request_id: data.shipment_request_id,
      });

      let targetUserId = null;
      const trip = data.trips as any;
      const request = data.shipment_requests as any;

      // Determine if current user is sender
      const userIsSender = request?.sender_id === userId;
      setIsSender(userIsSender);

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
      setAccessDenied(true);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim().slice(0, 2000);
    if (!trimmedMessage) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: userId,
        content: trimmedMessage,
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      toast.error("Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  };

  // Check if user is verified (phone + ID)
  const isOtherUserVerified = Boolean(
    otherUserPrivateInfo?.phone?.trim() &&
      otherUserPrivateInfo?.id_type?.trim() &&
      otherUserPrivateInfo?.id_number?.trim(),
  );

  // Get names for tracking display
  const senderName = isSender ? currentUserName : (otherUser?.full_name || "Expéditeur");
  const travelerName = !isSender ? currentUserName : (otherUser?.full_name || "Voyageur");

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
    <div className="flex flex-col h-full">
      {/* Header with other user info */}
      {otherUser && (
        <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-card rounded-lg border shadow-sm flex-shrink-0">
          <button
            onClick={() => navigate(`/user/${otherUser.id}`)}
            className="flex items-center gap-2 sm:gap-3 w-full hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors group"
          >
            <UserAvatar
              fullName={otherUser.full_name}
              avatarUrl={otherUser.avatar_url}
              size="sm"
              className="sm:w-10 sm:h-10"
            />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                  {otherUser.full_name}
                </p>
                <VerifiedBadge isVerified={isOtherUserVerified} size="sm" />
              </div>
              <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                <ActivityBadge isActive={true} role={otherUser.role as "traveler" | "sender"} />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Transaction Tracking - Only show for accepted matches */}
      {matchTracking && matchTracking.status !== "pending" && (
        <div className="flex-shrink-0 mb-2 sm:mb-3">
          <TransactionTracking
            matchId={matchId}
            tripId={matchTracking.trip_id}
            shipmentRequestId={matchTracking.shipment_request_id}
            userId={userId}
            isSender={isSender}
            senderHandedOver={matchTracking.sender_handed_over}
            travelerPickedUp={matchTracking.traveler_picked_up}
            travelerDelivered={matchTracking.traveler_delivered}
            senderReceived={matchTracking.sender_received}
            senderName={senderName}
            travelerName={travelerName}
            onUpdate={fetchMatchTracking}
          />
        </div>
      )}

      {/* Match details */}
      {matchDetails && matchDetails.trips && (
        <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800 text-xs sm:text-sm flex-shrink-0">
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
      <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 p-2 sm:p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50 min-h-[300px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
            <Send className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
            <p className="text-xs sm:text-sm">Dites bonjour pour démarrer la discussion !</p>
          </div>
        ) : (
          messages.map((message: any) => {
            const isOwn = message.sender_id === userId;
            const senderDisplayName = message.profiles?.full_name || "Utilisateur inconnu";

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
                    <p className="text-[10px] sm:text-[11px] font-bold mb-1 opacity-50 uppercase tracking-wider truncate">
                      {senderDisplayName}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-[10px] sm:text-[11px] mt-1 text-right ${isOwn ? "opacity-70" : "text-muted-foreground"}`}
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
      <form onSubmit={handleSend} className="flex gap-2 mt-2 sm:mt-3 flex-shrink-0">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value.slice(0, 2000))}
          placeholder="Écrivez votre message..."
          disabled={sending}
          maxLength={2000}
          className="flex-1 text-sm h-11 sm:h-10"
        />
        <Button type="submit" disabled={sending || !newMessage.trim()} size="icon" className="h-11 w-11 sm:h-10 sm:w-10">
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {/* Review Modal */}
      {otherUser && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setHasReviewed(true);
          }}
          matchId={matchId}
          reviewerId={userId}
          reviewedId={otherUser.id}
          reviewedName={otherUser.full_name}
        />
      )}
    </div>
  );
};

export default ChatWindow;
