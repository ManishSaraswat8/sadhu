import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, Clock, User, Video, Download, BookOpen, Target, Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Session {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  session_location?: string;
  physical_location?: string | null;
  practitioner: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  recording?: {
    id: string;
    recording_url: string | null;
    status: string;
  };
}

export const SessionHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'upcoming' | 'cancelled'>('all');
  const [sessionTypeFilter, setSessionTypeFilter] = useState<'all' | 'online' | 'in_person'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, filter, sessionTypeFilter]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from("session_schedules")
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          status,
          session_location,
          physical_location,
          practitioner:practitioners (
            id,
            name,
            avatar_url
          )
        `)
        .eq("client_id", user.id)
        .order("scheduled_at", { ascending: false });

      // Apply status filter
      if (filter === 'completed') {
        query = query.eq("status", "completed");
      } else if (filter === 'upcoming') {
        query = query.in("status", ["scheduled", "in_progress"]);
      } else if (filter === 'cancelled') {
        query = query.eq("status", "cancelled");
      }

      // Apply location filter
      if (sessionTypeFilter === 'online') {
        query = query.eq("session_location", "online");
      } else if (sessionTypeFilter === 'in_person') {
        query = query.eq("session_location", "in_person");
      }

      const { data, error } = await query;

      if (error) throw error;

      // Load recordings for completed sessions
      const sessionsWithRecordings = await Promise.all(
        (data || []).map(async (session: any) => {
          if (session.status === 'completed') {
            const { data: recording } = await supabase
              .from("session_recordings")
              .select("id, recording_url, status")
              .eq("session_id", session.id)
              .eq("status", "completed")
              .single();

            return { ...session, recording: recording || null };
          }
          return session;
        })
      );

      setSessions(sessionsWithRecordings as Session[]);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast({
        title: "Error",
        description: "Could not load session history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        session.practitioner.name.toLowerCase().includes(searchLower) ||
        (session.physical_location && session.physical_location.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: "default",
      in_progress: "default",
      completed: "secondary",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by practitioner or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sessionTypeFilter} onValueChange={(v) => setSessionTypeFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="in_person">In-Person</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-medium mb-2">No Sessions Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search filters." : "You haven't booked any sessions yet."}
            </p>
            <Button asChild>
              <Link to="/sessions">Book Your First Session</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const scheduledDate = new Date(session.scheduled_at);
            const isPast = scheduledDate < new Date();
            
            return (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={session.practitioner.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {session.practitioner.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{session.practitioner.name}</h3>
                          {getStatusBadge(session.status)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(scheduledDate, "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(scheduledDate, "h:mm a")} • {session.duration_minutes} min
                          </div>
                          <div className="flex items-center gap-1">
                            {session.session_location === 'online' ? (
                              <Video className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                            {session.session_location === 'online' ? 'Online' : 'In-Person'}
                          </div>
                          {session.physical_location && (
                            <div className="flex items-center gap-1">
                              <span>{session.physical_location}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions for completed sessions */}
                        {session.status === 'completed' && (
                          <div className="flex items-center gap-2 pt-2">
                            {session.recording && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={session.recording.recording_url || '#'} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Recording
                                </a>
                              </Button>
                            )}
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/journal?session_id=${session.id}`}>
                                <BookOpen className="w-4 h-4 mr-2" />
                                View Journal Entry
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/dashboard?tab=actions&session_id=${session.id}`}>
                                <Target className="w-4 h-4 mr-2" />
                                View Actions
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/sessions/${session.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        )}

                        {/* Join button for upcoming sessions */}
                        {!isPast && session.status === 'scheduled' && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/sessions/${session.id}`}>
                              <Video className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        )}
                        
                        {/* View Details button for all sessions */}
                        <Button variant="ghost" size="sm" asChild className="mt-2">
                          <Link to={`/sessions/${session.id}`}>
                            View Full Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

