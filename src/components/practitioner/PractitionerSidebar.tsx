import { Calendar, Users, Clock, DollarSign, Target, FileText, LayoutDashboard } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
import { useEffect, useState } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { PractitionerProfile } from "./PractitionerProfile";
import { NavLink } from "@/components/NavLink";

type Practitioner = Tables<"practitioners">;

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/practitioner" },
  { icon: Calendar, label: "Sessions", href: "/practitioner/sessions" },
  { icon: Users, label: "Clients", href: "/practitioner/clients" },
  { icon: Clock, label: "Availability", href: "/practitioner/availability" },
  { icon: DollarSign, label: "Earnings", href: "/practitioner/earnings" },
  { icon: Target, label: "Action Plans", href: "/practitioner/actions" },
  { icon: FileText, label: "Contract", href: "/practitioner/contract" },
];

export function PractitionerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("practitioners")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setPractitioner(data);
        });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    // For dashboard, only match exact path
    if (path === "/practitioner") {
      return location.pathname === "/practitioner" || location.pathname === "/practitioner/";
    }
    // For other paths, match if pathname starts with the path followed by / or is exactly the path
    // But ensure it doesn't match /practitioner itself
    if (location.pathname === "/practitioner" || location.pathname === "/practitioner/") {
      return false;
    }
    return location.pathname.startsWith(path + "/") || location.pathname === path;
  };

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
            <span className="font-heading text-lg text-foreground">Practitioner Portal</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={collapsed ? item.label : undefined}
                  >
                    <NavLink
                      to={item.href}
                      end={item.href === "/practitioner"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/50">
        <PractitionerProfile />
      </SidebarFooter>
    </Sidebar>
  );
}

