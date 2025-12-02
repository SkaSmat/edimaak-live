import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Plane, 
  Package, 
  MessageCircle, 
  User, 
  Shield, 
  LogOut,
  Menu
} from "lucide-react";
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

interface DashboardSidebarProps {
  role: "traveler" | "sender";
  onLogout: () => void;
}

export const DashboardSidebar = ({ role, onLogout }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const dashboardPath = role === "traveler" ? "/dashboard/traveler" : "/dashboard/sender";

  const mainNavItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: dashboardPath,
    },
    {
      title: role === "traveler" ? "Mes voyages" : "Mes demandes",
      icon: role === "traveler" ? Plane : Package,
      path: dashboardPath,
    },
    {
      title: "Messages",
      icon: MessageCircle,
      path: "/messages",
    },
  ];

  const accountNavItems = [
    {
      title: "Mon profil",
      icon: User,
      path: "/profile",
    },
    {
      title: "Vérification KYC",
      icon: Shield,
      path: "/profile",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <LogoEdiM3ak 
            iconSize={collapsed ? "sm" : "md"} 
            onClick={() => navigate("/")}
            className={collapsed ? "justify-center" : ""}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                    className={cn(
                      "transition-all duration-200",
                      isActive(item.path) && "bg-primary/10 text-primary font-medium"
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
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                    className={cn(
                      "transition-all duration-200",
                      isActive(item.path) && "bg-primary/10 text-primary font-medium"
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              tooltip="Déconnexion"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export const DashboardMobileHeader = ({ fullName }: { fullName: string }) => {
  return (
    <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border/50">
      <SidebarTrigger className="h-9 w-9" />
      <LogoEdiM3ak iconSize="sm" />
      <div className="w-9" /> {/* Spacer for alignment */}
    </header>
  );
};
