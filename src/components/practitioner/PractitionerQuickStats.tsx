import { useSidebar } from "@/components/ui/sidebar";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { format, subWeeks } from "date-fns";

interface PractitionerQuickStatsProps {
  practitionerId: string;
}

export function PractitionerQuickStats({ practitionerId }: PractitionerQuickStatsProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [stats, setStats] = useState({
    upcomingSessions: 0,
    thisWeekEarnings: 0,
    totalClients: 0,
    completedSessions: 0,
  });

  useEffect(() => {
    if (collapsed || !practitionerId) return;
    
    const fetchStats = async () => {
      try {
        // Get upcoming sessions
        const { count: upcomingCount } = await supabase
          .from("session_schedules")
          .select("*", { count: "exact", head: true })
          .eq("practitioner_id", practitionerId)
          .in("status", ["scheduled", "in_progress"])
          .gte("scheduled_at", new Date().toISOString());

        // Get this week earnings
        const weekAgo = subWeeks(new Date(), 1);
        const { data: payments } = await supabase
          .from("session_payments")
          .select("practitioner_share")
          .eq("practitioner_id", practitionerId)
          .gte("created_at", weekAgo.toISOString());

        const weekEarnings = payments?.reduce((sum, p) => sum + Number(p.practitioner_share || 0), 0) || 0;

        // Get total unique clients
        const { data: sessions } = await supabase
          .from("session_schedules")
          .select("client_id")
          .eq("practitioner_id", practitionerId);
        
        const uniqueClients = new Set(sessions?.map(s => s.client_id) || []).size;

        // Get completed sessions
        const { count: completedCount } = await supabase
          .from("session_schedules")
          .select("*", { count: "exact", head: true })
          .eq("practitioner_id", practitionerId)
          .eq("status", "completed");

        setStats({
          upcomingSessions: upcomingCount || 0,
          thisWeekEarnings: weekEarnings,
          totalClients: uniqueClients,
          completedSessions: completedCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [practitionerId, collapsed]);

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
                  <Calendar className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">Upcoming</p>
                  <p className="text-xs font-semibold text-foreground leading-tight">{stats.upcomingSessions}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-background/50 border border-primary/10">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">This Week</p>
                  <p className="text-xs font-semibold text-foreground leading-tight">${stats.thisWeekEarnings.toFixed(0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-background/50 border border-primary/10">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">Clients</p>
                  <p className="text-xs font-semibold text-foreground leading-tight">{stats.totalClients}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-background/50 border border-primary/10">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">Completed</p>
                  <p className="text-xs font-semibold text-foreground leading-tight">{stats.completedSessions}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

