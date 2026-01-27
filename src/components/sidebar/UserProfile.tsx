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
import { Settings, LogOut, Package, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function UserProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [creditsCount, setCreditsCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  
  const isSettingsActive = location.pathname === "/settings";

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      // Get credits count
      // Get fresh session token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        return;
      }

      const { data: creditsData } = await supabase.functions.invoke('check-session-credits', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });
      setCreditsCount(creditsData?.total_credits || 0);

      // Get completed sessions count
      const { count } = await supabase
        .from("session_schedules")
        .select("*", { count: "exact", head: true })
        .eq("client_id", user.id)
        .eq("status", "completed");

      setSessionsCount(count || 0);
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
                      "User";
  // Capitalize first letter of each word
  const userName = userNameRaw
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  const userInitials = userNameRaw.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
                       user.email?.charAt(0).toUpperCase() || 
                       "U";

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
                  <Package className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">Credits</p>
                  <p className="text-xs font-semibold text-foreground leading-tight">{creditsCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-background/50 border border-primary/10">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">Sessions</p>
                  <p className="text-xs font-semibold text-foreground leading-tight">{sessionsCount}</p>
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
                <Link to="/settings">
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

