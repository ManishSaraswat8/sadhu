import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionScheduler } from "@/components/SessionScheduler";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Video, Users, Clock, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface UpcomingSession {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  practitioner: {
    name: string;
    avatar_url: string | null;
  };
}

export const OnlineSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUpcomingSessions();
    }
  }, [user]);

  const loadUpcomingSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("session_schedules")
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          status,
          session_location,
          practitioner:practitioners (
            name,
            avatar_url
          )
        `)
        .eq("client_id", user.id)
        .eq("session_location", "online")
        .in("status", ["scheduled", "in_progress"])
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5);

      if (error) throw error;
      setUpcomingSessions((data as any) || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast({
        title: "Error",
        description: "Could not load upcoming sessions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-light mb-2">Online Sessions</h1>
        <p className="text-muted-foreground">
          Book 1:1 sessions or group classes with experienced practitioners
        </p>
      </div>

      <Tabs defaultValue="book" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="book" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Book Session
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Upcoming Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Book an Online Session</CardTitle>
              <CardDescription>
                Choose from 1:1 sessions or group classes. Select Standing or Laying practice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SessionScheduler onSessionBooked={loadUpcomingSessions} />
            </CardContent>
          </Card>

          {/* Session Type Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  1:1 Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Personalized guidance</li>
                  <li>• Focused attention</li>
                  <li>• Customized practice</li>
                  <li>• Action recommendations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Group Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Community practice</li>
                  <li>• Lower cost per session</li>
                  <li>• Shared experience</li>
                  <li>• Group energy</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          ) : upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No Upcoming Sessions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book your first online session to get started.
                </p>
                <Button asChild>
                  <Link to="/sessions">Book a Session</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => {
                const scheduledDate = new Date(session.scheduled_at);
                return (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{session.practitioner.name}</h3>
                            <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                              {session.status === 'scheduled' ? 'Scheduled' : 'In Progress'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(scheduledDate, "MMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(scheduledDate, "h:mm a")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Video className="w-4 h-4" />
                              {session.duration_minutes} min
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/sessions?room=${session.id}`}>
                            Join Session
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/sessions">View All Sessions</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

