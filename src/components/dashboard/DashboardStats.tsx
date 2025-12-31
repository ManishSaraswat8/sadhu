import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calendar, BookOpen, Target, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const DashboardStats = () => {
  const { user } = useAuth();

  // Fetch credits
  const { data: creditsData, isLoading: creditsLoading } = useQuery({
    queryKey: ["user-credits", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) return null;

      const { data, error } = await supabase.functions.invoke("check-session-credits", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch upcoming sessions
  const { data: upcomingSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["upcoming-sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("session_schedules")
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          status,
          session_location,
          practitioner:practitioners (
            name
          )
        `)
        .eq("client_id", user.id)
        .in("status", ["scheduled", "in_progress"])
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch journal entries count
  const { data: journalCount, isLoading: journalLoading } = useQuery({
    queryKey: ["journal-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("meditation_memories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Fetch action recommendations
  const { data: actionRecommendations, isLoading: actionsLoading } = useQuery({
    queryKey: ["action-recommendations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("action_recommendations" as any)
        .select("*")
        .eq("client_id", user.id)
        .eq("completed", false)
        .order("due_date", { ascending: true })
        .limit(5);

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  // Fetch completed sessions count
  const { data: completedSessions, isLoading: completedLoading } = useQuery({
    queryKey: ["completed-sessions", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("session_schedules")
        .select("*", { count: "exact", head: true })
        .eq("client_id", user.id)
        .eq("status", "completed");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const isLoading = creditsLoading || sessionsLoading || journalLoading || actionsLoading || completedLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalCredits = creditsData?.total_credits || 0;
  const upcomingCount = upcomingSessions?.length || 0;
  const pendingActions = actionRecommendations?.length || 0;
  const completedCount = completedSessions || 0;

  return (
    <div className="space-y-6 mb-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Session Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{totalCredits}</div>
            <p className="text-xs text-muted-foreground">
              {totalCredits === 0 ? "No credits available" : `${totalCredits} session${totalCredits !== 1 ? 's' : ''} remaining`}
            </p>
            {totalCredits === 0 && (
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link to="/sessions/payment">Purchase Credits</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingCount === 0 ? "No upcoming sessions" : "Scheduled sessions"}
            </p>
            {upcomingCount > 0 && (
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link to="/sessions?tab=upcoming">View Sessions</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Total sessions completed
            </p>
            {completedCount > 0 && (
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link to="/dashboard?tab=history">View History</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Journal Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{journalCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {journalCount === 0 ? "Start your journal" : "Total entries"}
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
              <Link to="/journal">Open Journal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions & Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Sessions
              </CardTitle>
              {upcomingCount > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/sessions?tab=upcoming">View All</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {upcomingCount === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No upcoming sessions</p>
                <Button asChild>
                  <Link to="/sessions">Book Your First Session</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions?.slice(0, 3).map((session: any) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {session.practitioner?.name || "Practitioner"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(session.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {session.session_location === "in_person" ? "In-Person" : "Online"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {session.duration_minutes} min
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/sessions?session=${session.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Action Items
              </CardTitle>
              {pendingActions > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard?tab=actions">View All</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingActions === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending action items</p>
                <p className="text-xs mt-2">Your practitioner will assign actions after sessions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actionRecommendations?.slice(0, 3).map((action: any) => (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{action.title}</div>
                      {action.description && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {action.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {action.action_type.replace("_", " ")}
                        </Badge>
                        {action.due_date && (
                          <Badge
                            variant={
                              new Date(action.due_date) < new Date() ? "destructive" : "secondary"
                            }
                            className="text-xs"
                          >
                            Due: {format(new Date(action.due_date), "MMM d")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

