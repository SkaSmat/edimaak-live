import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Type local pour les notifications (table pas encore dans les types générés)
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  read: boolean;
  created_at: string;
  user_id: string;
}

export const NotificationBell = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userId) {
      loadNotifications();
      const unsubscribe = subscribeToNotifications();
      return unsubscribe;
    }
  }, [userId]);

  const loadNotifications = async () => {
    // Requête typée explicitement avec .returns<>
    const { data, error } = await supabase
      .from("notifications" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<Notification[]>();

    if (error) {
      console.error("Erreur chargement notifications:", error);
      return;
    }

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast.success(newNotif.title, {
            description: newNotif.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications" as any)
      .update({ read: true })
      .eq("id", notificationId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.type === "new_match" && notification.related_id) {
      navigate(`/messages?matchId=${notification.related_id}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="p-2">
          <p className="font-bold text-sm mb-2 px-2">Notifications</p>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aucune notification
            </p>
          ) : (
            <div className="space-y-1">
              {notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`cursor-pointer p-3 flex gap-3 items-start ${
                    !notif.read ? "bg-primary/5 hover:bg-primary/10" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {new Date(notif.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
