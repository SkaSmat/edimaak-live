import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Plane, Package, MessageCircle, User, LogOut, Handshake, ShieldCheck, RefreshCw } from "lucide-react";
import { LogoEdiM3ak } from "./LogoEdiM3ak";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { FeedbackButton } from "./FeedbackButton";
import { Badge } from "@/components/ui/badge";
interface DashboardSidebarProps {
  role: "traveler" | "sender" | "admin";
  isAdmin?: boolean;
  onLogout: () => void;
  unreadCount?: number;
  pendingMatchCount?: number;
}
export const DashboardSidebar = ({
  role,
  isAdmin,
  onLogout,
  unreadCount = 0,
  pendingMatchCount = 0
}: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    state,
    isMobile,
    setOpenMobile
  } = useSidebar();
  const collapsed = state === "collapsed";
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) setOpenMobile(false);
  };
  const travelerNavItems = [{
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard/traveler"
  }, {
    title: "Mes voyages",
    icon: Plane,
    path: "/dashboard/traveler/trips"
  }, {
    title: "Mes matches",
    icon: Handshake,
    path: "/dashboard/traveler/matches"
  }, {
    title: "Messages",
    icon: MessageCircle,
    path: "/messages",
    hasBadge: true
  }];
  const senderNavItems = [{
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard/sender"
  }, {
    title: "Mes demandes",
    icon: Package,
    path: "/dashboard/sender/shipments"
  }, {
    title: "Mes matches",
    icon: Handshake,
    path: "/dashboard/sender/matches"
  }, {
    title: "Messages",
    icon: MessageCircle,
    path: "/messages",
    hasBadge: true
  }];
  const adminNavItems = [{
    title: "Administration",
    icon: ShieldCheck,
    path: "/admin"
  }];
  const mainNavItems = role === "admin" ? adminNavItems : role === "traveler" ? travelerNavItems : senderNavItems;
  const accountNavItems = [{
    title: "Mon profil",
    icon: User,
    path: "/profile"
  }];
  if (isAdmin && role !== "admin") {
    accountNavItems.push({
      title: "Administration",
      icon: ShieldCheck,
      path: "/admin"
    });
  }
  const isActive = (path: string) => location.pathname === path;
  return <Sidebar collapsible="icon" className="border-r border-border/50 bg-background z-50 h-full">
      <SidebarHeader className="p-4 bg-background">
        <button onClick={() => handleNavigation("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <LogoEdiM3ak iconSize={collapsed ? "sm" : "md"} className={collapsed ? "justify-center" : ""} />
        </button>
      </SidebarHeader>

      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item: any) => {
              const isMessagesLink = item.path === "/messages";
              const isMatchesLink = item.path.includes("/matches");
              let badgeCount = 0;
              if (isMessagesLink) badgeCount = unreadCount;
              if (isMatchesLink) badgeCount = pendingMatchCount;
              const showBadge = badgeCount > 0;
              return <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton onClick={() => handleNavigation(item.path)} isActive={isActive(item.path)} tooltip={item.title} className={cn("transition-all duration-200 justify-between group relative", isActive(item.path) && "bg-primary/10 text-primary font-medium")}>
                      <div className="flex items-center gap-2">
                        <item.icon className="h-5 w-5" />
                        
                      </div>
                      {showBadge && !collapsed && <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] animate-in zoom-in">
                          {badgeCount}
                        </Badge>}
                      {showBadge && collapsed && <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background animate-pulse" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2 mx-4" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={() => handleNavigation(item.path)} isActive={isActive(item.path)} tooltip={item.title} className={cn("transition-all duration-200", isActive(item.path) && "bg-primary/10 text-primary font-medium")}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 bg-background">
        <Separator className="mb-2" />
        <FeedbackButton variant="sidebar" collapsed={collapsed} />
        <SidebarMenuButton onClick={onLogout} tooltip="Déconnexion" className="text-muted-foreground hover:text-destructive hover:bg-red-500/10 transition-colors">
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>;
};
export const DashboardMobileHeader = ({
  fullName,
  onLogout,
  unreadCount = 0,
  role,
  onSwitchRole
}: {
  fullName: string;
  onLogout: () => void;
  unreadCount?: number;
  role?: "traveler" | "sender" | "admin";
  onSwitchRole?: () => void;
}) => {
  const navigate = useNavigate();
  return <header className="md:hidden flex items-center justify-between p-4 bg-background border-b border-border/50 sticky top-0 z-40 w-full">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <SidebarTrigger className="h-9 w-9 border border-border/50 bg-background text-foreground" />
          {unreadCount > 0 && <div className="absolute -top-1 -right-1 z-50 pointer-events-none">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-background items-center justify-center"></span>
              </span>
            </div>}
        </div>
        <div onClick={() => navigate("/")} className="cursor-pointer">
          <LogoEdiM3ak iconSize="sm" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {role && role !== "admin" && onSwitchRole && (
          <button 
            onClick={onSwitchRole} 
            className="h-9 px-3 flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/50 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{role === "traveler" ? "Expéditeur" : "Voyageur"}</span>
          </button>
        )}
        <button onClick={onLogout} className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-muted/50">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>;
};