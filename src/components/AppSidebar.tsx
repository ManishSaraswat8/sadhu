import { Video, Mail, Home, BookOpen, Calendar, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

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
  useSidebar,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

import sadhuLogo from "@/assets/sadhu-logo.png";
import { PastPurchases } from "@/components/PastPurchases";
import { UserProfile } from "@/components/sidebar/UserProfile";
import { HelpfulVideos } from "@/components/sidebar/HelpfulVideos";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Journal", url: "/journal", icon: BookOpen },
  { title: "Classes", url: "/sessions", icon: Calendar },
  { title: "Wallet", url: "/purchases", icon: Receipt },
  { title: "Step-by-Step", url: "/step-by-step", icon: Video },
  { title: "Contact", url: "/contact", icon: Mail },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar
      className="border-r border-border/50 bg-card"
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-border/50">
        <Link 
          to="/" 
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img
            src={sadhuLogo}
            alt="Sadhu"
            className="h-8 w-8 object-contain"
          />
          {!collapsed && (
            <span className="font-heading text-lg text-foreground">Sadhu</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Past Purchases Section */}
        <PastPurchases />

        {/* Helpful Videos Section */}
        <HelpfulVideos />
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/50">
        <UserProfile />
      </SidebarFooter>
    </Sidebar>
  );
}
