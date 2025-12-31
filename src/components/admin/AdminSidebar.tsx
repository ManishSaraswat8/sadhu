import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  UserCog,
  ShoppingCart,
  Link2,
  Video,
  FileText,
} from "lucide-react";
import sadhuLogo from "@/assets/sadhu-logo.png";
import { useAuth } from "@/hooks/useAuth";
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
import { NavLink } from "@/components/NavLink";
import { AdminProfile } from "./AdminProfile";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: UserCog, label: "Practitioners", href: "/admin/practitioners" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Package, label: "Products", href: "/admin/products" },
  { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
  { icon: CreditCard, label: "Subscriptions", href: "/admin/subscriptions" },
  { icon: Link2, label: "Group Sessions", href: "/admin/group-sessions" },
  { icon: Video, label: "Videos", href: "/admin/videos" },
  { icon: FileText, label: "Policies", href: "/admin/policies" },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => {
    // For dashboard, only match exact path
    if (href === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    // For other paths, match if pathname starts with the path followed by / or is exactly the path
    // But ensure it doesn't match /admin itself
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      return false;
    }
    return location.pathname.startsWith(href + "/") || location.pathname === href;
  };

  // Get user's name from metadata or email
  const userNameRaw = user?.user_metadata?.full_name || 
                      user?.user_metadata?.name || 
                      user?.email?.split('@')[0] || 
                      "Admin";
  const userName = userNameRaw
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

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
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg text-foreground">Admin Portal</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                Admin
              </span>
            </div>
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
                      end={item.href === "/admin"}
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
        <AdminProfile />
      </SidebarFooter>
    </Sidebar>
  );
}
