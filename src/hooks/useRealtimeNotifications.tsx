import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface MessagePayload {
  sender_id: string;
  content: string;
  match_id: string;
}

const playNotificationSound = (): void => {
  try {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Silently fail if audio cannot play
    });
  } catch (error) {
    // Audio not supported, fail silently
  }
};

const triggerVibration = (): void => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch (e) {
      // Vibration not supported, fail silently
    }
  }
};

const truncateText = (text: string, max: number): string => {
  return text?.length <= max ? text : text.substring(0, max) + "...";
};

export const useRealtimeNotifications = (userId: string | undefined) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Nettoyer l'ancien canal
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Créer un nouveau canal
    channelRef.current = supabase
      .channel(`notifications_${userId}_${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const newMessage = payload.new as MessagePayload;

          // Ignorer les messages envoyés par l'utilisateur lui-même
          if (newMessage.sender_id === userId) return;

          // Vérifier que l'utilisateur est bien impliqué dans ce match
          const { data: matchData } = await supabase
            .from("matches")
            .select(`
              id,
              trips!inner(traveler_id),
              shipment_requests!inner(sender_id)
            `)
            .eq("id", newMessage.match_id)
            .single();

          if (!matchData) return;

          // Vérifier si l'utilisateur est le voyageur ou l'expéditeur de ce match
          const isInvolved = 
            matchData.trips?.traveler_id === userId || 
            matchData.shipment_requests?.sender_id === userId;

          if (!isInvolved) return;

          setUnreadCount((prev) => prev + 1);
          playNotificationSound();
          triggerVibration();

          const matchId = newMessage.match_id;
          
          toast.custom(
            (id) => (
              <div
                onClick={() => {
                  navigate(`/messages?matchId=${matchId}`);
                  toast.dismiss(id);
                }}
                className="flex items-center gap-3 w-full p-4 bg-card border rounded-lg shadow-lg cursor-pointer hover:bg-accent/50 active:scale-[0.98] transition-all"
              >
                <MessageCircle className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">Nouveau message !</p>
                  <p className="text-muted-foreground text-xs truncate">
                    {truncateText(newMessage.content, 40)}
                  </p>
                </div>
                <span className="text-xs text-primary font-medium shrink-0">Voir →</span>
              </div>
            ),
            { duration: 5000 }
          );
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, navigate]);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { unreadCount, resetUnreadCount };
};
