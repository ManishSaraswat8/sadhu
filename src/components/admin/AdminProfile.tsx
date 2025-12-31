import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Settings, LogOut, Users, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { subWeeks } from "date-fns";

export function AdminProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [stats, setStats] = useState({
    totalUsers: 0,
    thisWeekRevenue: 0,
    totalOrders: 0,
    activePractitioners: 0,
  });
  
  const isSettingsActive = location.pathname === "/admin/settings";

  useEffect(() => {
    if (user && !collapsed) {
      loadStats();
    }
  }, [user, collapsed]);

  const loadStats = async () => {
    if (!user) return;

    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "user");

      // Get this week revenue
      const weekAgo = subWeeks(new Date(), 1);
      const { data: payments } = await supabase
        .from("session_payments")
        .select("total_amount")
        .gte("created_at", weekAgo.toISOString());

      const weekRevenue = payments?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0;

      // Get total orders
      const { count: ordersCount } = await supabase
        .from("session_payments")
        .select("*", { count: "exact", head: true });

      // Get active practitioners
      const { count: practitionersCount } = await supabase
        .from("practitioners")
        .select("*", { count: "exact", head: true })
        .eq("available", true);

      setStats({
        totalUsers: usersCount || 0,
        thisWeekRevenue: weekRevenue,
        totalOrders: ordersCount || 0,
        activePractitioners: practitionersCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) return null;

  // Get user's name from metadata or email
  const userNameRaw = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.email?.split('@')[0] || 
                      "Admin";
  const userName = userNameRaw
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  const userInitials = userNameRaw.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
                       user.email?.charAt(0).toUpperCase() || 
                       "A";

  if (collapsed) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="w-full justify-center"
                tooltip={userName}
              >
                <div>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {userInitials.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-3 space-y-2.5">
            {/* User Info */}
            <div className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9 ring-1 ring-primary/20">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {userInitials.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-normal truncate text-foreground tracking-tight">
                  {userName}
                </p>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-background/50 border border-primary/10">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">Users</p>
                  <p className="text-xs font-semibold text-foreground leading-tight">{stats.totalUsers}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-background/50 border border-primary/10">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">This Week</p>
                  <p className="text-xs font-semibold text-foreground leading-tight">${stats.thisWeekRevenue.toFixed(0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-background/50 border border-primary/10">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">Orders</p>
                  <p className="text-xs font-semibold text-foreground leading-tight">{stats.totalOrders}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-background/50 border border-primary/10">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">Practitioners</p>
                  <p className="text-xs font-semibold text-foreground leading-tight">{stats.activePractitioners}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Actions */}
            <div className="space-y-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start h-8 text-xs ${
                  isSettingsActive
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : "text-foreground hover:bg-primary/10"
                }`}
                asChild
              >
                <Link to="/admin/settings">
                  <Settings className="w-3 h-3 mr-1.5" />
                  Settings
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive h-8 text-xs"
                onClick={handleSignOut}
              >
                <LogOut className="w-3 h-3 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

