import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionScheduler } from "@/components/SessionScheduler";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface UpcomingSession {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  physical_location: string | null;
  practitioner: {
    name: string;
    avatar_url: string | null;
  };
}

export const InPersonSessions = () => {
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
          physical_location,
          session_location,
          practitioner:practitioners (
            name,
            avatar_url
          )
        `)
        .eq("client_id", user.id)
        .eq("session_location", "in_person")
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
        <h1 className="text-3xl font-heading font-light mb-2">In-Person Sessions</h1>
        <p className="text-muted-foreground">
          Book in-person sessions at our studio locations
        </p>
      </div>

      <Tabs defaultValue="book" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="book" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Book Session
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Upcoming Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Book an In-Person Session</CardTitle>
              <CardDescription>
                Choose from 1:1 or group sessions at our studio locations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SessionScheduler onSessionBooked={loadUpcomingSessions} />
            </CardContent>
          </Card>

          {/* Location Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Studio Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-1">Main Studio</h4>
                  <p className="text-sm text-muted-foreground">
                    123 Meditation Street, Toronto, ON M5H 2N2
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Open Monday - Saturday, 9 AM - 8 PM
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-1">West End Studio</h4>
                  <p className="text-sm text-muted-foreground">
                    456 Practice Avenue, Toronto, ON M6K 1M3
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Open Tuesday - Sunday, 10 AM - 7 PM
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What to Expect */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">What to Expect</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Arrive 5-10 minutes early for check-in</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Wear comfortable clothing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>All equipment (Sadhu Boards) provided</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Parking available at both locations</span>
                </li>
              </ul>
            </CardContent>
          </Card>
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
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No Upcoming Sessions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book your first in-person session to get started.
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
                      <div className="space-y-4">
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
                                <Users className="w-4 h-4" />
                                {session.duration_minutes} min
                              </div>
                            </div>
                          </div>
                        </div>
                        {session.physical_location && (
                          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                            <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">Location</p>
                              <p className="text-sm text-muted-foreground">{session.physical_location}</p>
                            </div>
                          </div>
                        )}
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

