import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Plane, Package, MessageCircle, User, LogOut, Handshake, ShieldCheck } from "lucide-react";
import { LogoEdiM3ak } from "./LogoEdiM3ak";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { FeedbackButton } from "./FeedbackButton";

interface DashboardSidebarProps {
  role: "traveler" | "sender" | "admin";
  isAdmin?: boolean;
  onLogout: () => void;
}

export const DashboardSidebar = ({ role, isAdmin, onLogout }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  // On récupère isMobile et setOpenMobile pour gérer la fermeture auto
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";

  // Fonction intelligente de navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    // Si on est sur mobile, on ferme le menu après le clic
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const travelerNavItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard/traveler" },
    { title: "Mes voyages", icon: Plane, path: "/dashboard/traveler/trips" },
    { title: "Mes matches", icon: Handshake, path: "/dashboard/traveler/matches" },
    { title: "Messages", icon: MessageCircle, path: "/messages" },
  ];

  const senderNavItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard/sender" },
    { title: "Mes demandes", icon: Package, path: "/dashboard/sender/shipments" },
    { title: "Mes matches", icon: Handshake, path: "/dashboard/sender/matches" },
    { title: "Messages", icon: MessageCircle, path: "/messages" },
  ];

  const adminNavItems = [{ title: "Administration", icon: ShieldCheck, path: "/admin" }];

  const mainNavItems = role === "admin" ? adminNavItems : role === "traveler" ? travelerNavItems : senderNavItems;

  const accountNavItems = [{ title: "Mon profil", icon: User, path: "/profile" }];

  if (isAdmin && role !== "admin") {
    accountNavItems.push({
      title: "Administration",
      icon: ShieldCheck,
      path: "/admin",
    });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card">
      <SidebarHeader className="p-4">
        <button
          onClick={() => handleNavigation("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          type="button"
        >
          <LogoEdiM3ak iconSize={collapsed ? "sm" : "md"} className={collapsed ? "justify-center" : ""} />
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                    className={cn(
                      "transition-all duration-200",
                      isActive(item.path) && "bg-primary/10 text-primary font-medium",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2 mx-4" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                    className={cn(
                      "transition-all duration-200",
                      isActive(item.path) && "bg-primary/10 text-primary font-medium",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Separator className="mb-2" />
        <FeedbackButton variant="sidebar" collapsed={collapsed} />
        <SidebarMenuButton
          onClick={onLogout}
          tooltip="Déconnexion"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
};

export const DashboardMobileHeader = ({ fullName, onLogout }: { fullName: string; onLogout: () => void }) => {
  const navigate = useNavigate();

  return (
    <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border/50 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {/* C'est ce bouton qui ouvre le menu */}
        <SidebarTrigger className="h-9 w-9 border border-border/50" />
        <LogoEdiM3ak iconSize="sm" onClick={() => navigate("/")} />
      </div>

      <button
        onClick={onLogout}
        className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-muted/50"
        aria-label="Déconnexion"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </header>
  );
};
