import { ReactNode, useEffect, useRef } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar, DashboardMobileHeader } from "./DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase
import { toast } from "sonner"; // Import des notifications

interface DashboardLayoutProps {
  children: ReactNode;
  role: "traveler" | "sender" | "admin";
  fullName: string;
  isAdmin?: boolean;
  onLogout: () => void;
}

export const DashboardLayout = ({ children, role, fullName, isAdmin = false, onLogout }: DashboardLayoutProps) => {
  const firstName = fullName?.split(" ")[0] || "Utilisateur";
  const roleLabel = role === "traveler" ? "Voyageur" : role === "sender" ? "Expéditeur" : "Administrateur";
  const effectiveIsAdmin = isAdmin || role === "admin";

  // Ref pour éviter de jouer le son deux fois si le composant remonte
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 1. Initialiser le son de notification
    audioRef.current = new Audio("/notification.mp3"); // On utilisera un son par défaut si celui-ci n'existe pas

    const setupRealtimeListener = async () => {
      // On récupère l'ID de l'utilisateur actuel
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const currentUserId = session.user.id;

      // 2. On s'abonne aux nouveaux messages
      const channel = supabase
        .channel("global_messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const newMessage = payload.new as any;

            // Si le message ne vient pas de moi, c'est une notification !
            if (newMessage.sender_id !== currentUserId) {
              // A. Jouer un petit son (si possible)
              // Note: Les navigateurs bloquent parfois le son sans interaction, c'est normal.
              try {
                // On utilise un son système simple encodé en base64 pour éviter d'avoir à gérer un fichier mp3
                const audio = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3");
                audio.volume = 0.5;
                audio.play().catch((e) => console.log("Audio play blocked", e));
              } catch (e) {
                console.error("Erreur audio", e);
              }

              // B. Afficher la notification visuelle
              toast.message("Nouveau message !", {
                description:
                  newMessage.content.length > 50 ? newMessage.content.substring(0, 50) + "..." : newMessage.content,
                icon: <MessageCircle className="w-5 h-5 text-primary" />,
                duration: 5000,
                // On pourrait ajouter un bouton pour aller direct au message
                action: {
                  label: "Voir",
                  onClick: () => (window.location.href = `/messages?matchId=${newMessage.match_id}`),
                },
              });
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanupPromise = setupRealtimeListener();

    return () => {
      cleanupPromise.then((cleanup) => cleanup && cleanup());
    };
  }, []);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background relative">
        <DashboardSidebar role={role === "admin" ? "traveler" : role} isAdmin={effectiveIsAdmin} onLogout={onLogout} />

        <SidebarInset className="flex-1 w-full flex flex-col min-h-screen overflow-x-hidden">
          {/* Header Mobile */}
          <div className="md:hidden sticky top-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
            <DashboardMobileHeader fullName={fullName} onLogout={onLogout} />
          </div>

          {/* Desktop header bar */}
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
              onClick={onLogout}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
