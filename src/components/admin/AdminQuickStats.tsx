import { useSidebar } from "@/components/ui/sidebar";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { subWeeks } from "date-fns";

export function AdminQuickStats() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [stats, setStats] = useState({
    totalUsers: 0,
    thisWeekRevenue: 0,
    totalOrders: 0,
    activePractitioners: 0,
  });

  useEffect(() => {
    if (collapsed) return;
    
    const fetchStats = async () => {
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
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [collapsed]);

  if (collapsed) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
        Quick Stats
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-3 space-y-2.5">
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
          </CardContent>
        </Card>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

