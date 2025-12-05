import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar, DashboardMobileHeader } from "./DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, MessageCircle, RefreshCw, Handshake } from "lucide-react";
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
  const [pendingMatchCount, setPendingMatchCount] = useState(0);
  const location = useLocation();

  // --- FONCTION SWITCH ROLE (CORRIGÉE) ---
  const switchRole = async () => {
    try {
      const newRole = role === "traveler" ? "sender" : "traveler";
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Session expirée");
        return;
      }

      // On tente la mise à jour
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", session.user.id);

      if (error) {
        console.error("Erreur RLS:", error);
        toast.error("Erreur de droits. Demandez à l'admin d'activer la policy SQL.");
        return;
      }

      toast.success(`Vous êtes passé en mode ${newRole === "traveler" ? "Voyageur" : "Expéditeur"} !`);

      // On recharge la page vers le bon dashboard
      window.location.href = newRole === "traveler" ? "/dashboard/traveler" : "/dashboard/sender";
    } catch (error) {
      console.error(error);
      toast.error("Impossible de changer de mode");
    }
  };

  const handleInternalLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch (error) {
      window.location.href = "/";
    }
  };

  const updateCountsFromStorage = () => {
    const msgStorage = localStorage.getItem("unreadMatches");
    const msgList = msgStorage ? JSON.parse(msgStorage) : [];
    setUnreadCount(msgList.length);

    const matchStorage = localStorage.getItem("newMatches");
    const matchList = matchStorage ? JSON.parse(matchStorage) : [];
    setPendingMatchCount(matchList.length);
  };

  useEffect(() => {
    updateCountsFromStorage();
    window.addEventListener("unread-change", updateCountsFromStorage);
    window.addEventListener("match-change", updateCountsFromStorage);
    return () => {
      window.removeEventListener("unread-change", updateCountsFromStorage);
      window.removeEventListener("match-change", updateCountsFromStorage);
    };
  }, []);

  useEffect(() => {
    const setupRealtimeListener = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const currentUserId = session.user.id;

      const channel = supabase
        .channel("global_notifications")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.sender_id !== currentUserId) {
            const storage = localStorage.getItem("unreadMatches");
            const currentUnread = storage ? JSON.parse(storage) : [];
            if (!currentUnread.includes(newMessage.match_id)) {
              localStorage.setItem("unreadMatches", JSON.stringify([...currentUnread, newMessage.match_id]));
              window.dispatchEvent(new Event("unread-change"));
            }
            triggerNotification("Nouveau message !", "Vous avez reçu un message.");
          }
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches" }, (payload) => {
          const newMatch = payload.new as any;
          if (newMatch.status === "pending") {
            const storage = localStorage.getItem("newMatches");
            const currentMatches = storage ? JSON.parse(storage) : [];
            if (!currentMatches.includes(newMatch.id)) {
              localStorage.setItem("newMatches", JSON.stringify([...currentMatches, newMatch.id]));
              window.dispatchEvent(new Event("match-change"));
              triggerNotification("Nouvelle proposition !", "Un voyageur propose de prendre votre colis !", "match");
            }
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };
    setupRealtimeListener();
  }, []);

  const triggerNotification = (title: string, desc: string, type: "message" | "match" = "message") => {
    try {
      const audio = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch (e) {}

    toast.message(title, {
      description: desc,
      icon:
        type === "message" ? (
          <MessageCircle className="w-5 h-5 text-primary" />
        ) : (
          <Handshake className="w-5 h-5 text-green-500" />
        ),
      duration: 5000,
    });
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background relative">
        <DashboardSidebar
          role={role === "admin" ? "traveler" : role}
          isAdmin={effectiveIsAdmin}
          onLogout={handleInternalLogout}
          unreadCount={unreadCount}
          pendingMatchCount={pendingMatchCount}
        />

        <SidebarInset className="flex-1 w-full flex flex-col min-h-screen overflow-x-hidden">
          <div className="md:hidden sticky top-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
            <DashboardMobileHeader
              fullName={fullName}
              onLogout={handleInternalLogout}
              unreadCount={unreadCount + pendingMatchCount}
            />
          </div>

          <header className="hidden md:flex items-center justify-between px-6 py-4 bg-card/50 border-b border-border/30 sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground">Bonjour, {firstName}</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                {roleLabel}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {/* BOUTON CHANGER DE MODE (Bien visible et à gauche de déconnexion) */}
              {role !== "admin" && (
                <Button
                  // Style 'default' (rempli) ou 'outline' avec couleur forte pour être visible
                  variant="outline"
                  size="sm"
                  onClick={switchRole}
                  className="gap-2 border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                  title={`Cliquez pour passer au mode ${role === "traveler" ? "Expéditeur" : "Voyageur"}`}
                >
                  <RefreshCw className="h-4 w-4" />
                  Passer au mode {role === "traveler" ? "Expéditeur" : "Voyageur"}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleInternalLogout}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
