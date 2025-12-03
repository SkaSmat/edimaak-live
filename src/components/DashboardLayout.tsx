import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar, DashboardMobileHeader } from "./DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "traveler" | "sender" | "admin";
  fullName: string;
  isAdmin?: boolean;
  onLogout?: () => void; // Optionnel car géré en interne
}

export const DashboardLayout = ({ children, role, fullName, isAdmin = false }: DashboardLayoutProps) => {
  const firstName = fullName?.split(" ")[0] || "Utilisateur";
  const roleLabel = role === "traveler" ? "Voyageur" : role === "sender" ? "Expéditeur" : "Administrateur";
  const effectiveIsAdmin = isAdmin || role === "admin";

  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  // --- FONCTION DE DÉCONNEXION (Hard Logout) ---
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch (error) {
      console.error("Erreur déco", error);
      window.location.href = "/";
    }
  };

  // Reset compteur sur page messages
  useEffect(() => {
    if (location.pathname === "/messages") {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  // Système de notification
  useEffect(() => {
    const setupRealtimeListener = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const currentUserId = session.user.id;

      const channel = supabase
        .channel("global_messages")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.sender_id !== currentUserId) {
            if (window.location.pathname !== "/messages") {
              setUnreadCount((prev) => prev + 1);
            }

            // Son + Vibration
            try {
              const audio = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3");
              audio.volume = 0.5;
              audio.play().catch(() => {});
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
              }
            } catch (e) {}

            toast.message("Nouveau message !", {
              description: newMessage.content.substring(0, 40) + "...",
              icon: <MessageCircle className="w-5 h-5 text-primary" />,
              duration: 5000,
              action: {
                label: "Voir",
                onClick: () => (window.location.href = `/messages?matchId=${newMessage.match_id}`),
              },
            });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };
    setupRealtimeListener();
  }, []);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background relative">
        <DashboardSidebar
          role={role === "admin" ? "traveler" : role}
          isAdmin={effectiveIsAdmin}
          onLogout={handleLogout} // Utilise la fonction interne
          unreadCount={unreadCount}
        />

        <SidebarInset className="flex-1 w-full flex flex-col min-h-screen overflow-x-hidden">
          {/* Header Mobile */}
          <div className="md:hidden sticky top-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
            <DashboardMobileHeader
              fullName={fullName}
              onLogout={handleLogout} // Utilise la fonction interne
              unreadCount={unreadCount}
            />
          </div>

          {/* Desktop Header */}
          <header className="hidden md:flex items-center justify-between px-6 py-4 bg-card/50 border-b border-border/30 sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground">Bonjour, {firstName}</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                {roleLabel}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout} // Utilise la fonction interne
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
