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
    audio.play().catch((err) => console.warn("Son impossible:", err));
  } catch (error) {
    console.warn("Audio non supporté");
  }
};

const triggerVibration = (): void => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch (e) {
      console.warn("Vibration non supportée");
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
        (payload) => {
          const newMessage = payload.new as MessagePayload;

          if (newMessage.sender_id === userId) return;

          setUnreadCount((prev) => prev + 1);
          playNotificationSound();
          triggerVibration();

          toast.message("Nouveau message !", {
            description: truncateText(newMessage.content, 40),
            icon: <MessageCircle className="w-5 h-5 text-primary" />,
            duration: 5000,
            action: {
              label: "Voir",
              onClick: () => navigate(`/messages?matchId=${newMessage.match_id}`),
            },
          });
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
