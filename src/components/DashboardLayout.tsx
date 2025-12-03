import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar, DashboardMobileHeader } from "./DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar role={role === "admin" ? "traveler" : role} isAdmin={effectiveIsAdmin} onLogout={onLogout} />

        <SidebarInset className="flex-1 w-full flex flex-col min-h-screen overflow-x-hidden">
          {/* Header Mobile : On le met en sticky pour qu'il reste en haut, avec un z-index élevé */}
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
