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
  onLogout?: () => void;
}

export const DashboardLayout = ({ children, role, fullName, isAdmin = false }: DashboardLayoutProps) => {
  const firstName = fullName?.split(" ")[0] || "Utilisateur";
  const roleLabel = role === "traveler" ? "Voyageur" : role === "sender" ? "Expéditeur" : "Administrateur";
  const effectiveIsAdmin = isAdmin || role === "admin";

  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  // Fonction pour charger et mettre à jour le compteur depuis le localStorage
  const updateCountFromStorage = () => {
    const storage = localStorage.getItem("unreadMatches");
    const unreadList = storage ? JSON.parse(storage) : [];
    setUnreadCount(unreadList.length);
  };

  // 1. Initialisation et Écouteur d'événements interne pour la synchronisation
  useEffect(() => {
    // Charge le compteur immédiatement au montage
    updateCountFromStorage();

    // Écouteur pour mettre à jour le compteur quand une autre conversation est lue
    window.addEventListener("unread-change", updateCountFromStorage);

    return () => {
      window.removeEventListener("unread-change", updateCountFromStorage);
    };
  }, []);

  // Le reste de la logique (déconnexion, Realtime) reste inchangé...

  const handleInternalLogout = async () => {
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

  // Système de notification (Realtime)
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
            // --- MISE À JOUR PERSISTANTE ---
            const storage = localStorage.getItem("unreadMatches");
            const currentUnread = storage ? JSON.parse(storage) : [];

            if (!currentUnread.includes(newMessage.match_id)) {
              const newList = [...currentUnread, newMessage.match_id];
              localStorage.setItem("unreadMatches", JSON.stringify(newList));

              // On notifie les autres composants de mettre à jour le compteur
              window.dispatchEvent(new Event("unread-change"));
            }
            // ------------------------------------

            // Le reste des toasts/sons
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

  // Réinitialisation du compteur quand on va sur la page Messages (inutile de le faire ici, on le fait dans Messages.tsx)

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background relative">
        <DashboardSidebar
          role={role === "admin" ? "traveler" : role}
          isAdmin={effectiveIsAdmin}
          onLogout={handleInternalLogout}
          unreadCount={unreadCount}
        />

        <SidebarInset className="flex-1 w-full flex flex-col min-h-screen overflow-x-hidden">
          <div className="md:hidden sticky top-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
            <DashboardMobileHeader fullName={fullName} onLogout={handleInternalLogout} unreadCount={unreadCount} />
          </div>

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
              onClick={handleInternalLogout}
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
