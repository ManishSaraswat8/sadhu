import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Video, Calendar, Clock, Loader2, Download, BookOpen, Target, ExternalLink } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Session {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  session_location?: string;
  practitioner: {
    name: string;
    avatar_url: string | null;
  };
  recording?: {
    id: string;
    recording_url: string | null;
    status: string;
  };
}

interface CompletedSessionsProps {
  limit?: number;
}

export const CompletedSessions = ({ limit = 5 }: CompletedSessionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
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
        .eq("status", "completed")
        .order("scheduled_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Load recordings for completed sessions
      const sessionsWithRecordings = await Promise.all(
        (data || []).map(async (session: any) => {
          const { data: recording } = await supabase
            .from("session_recordings")
            .select("id, recording_url, status")
            .eq("session_id", session.id)
            .eq("status", "completed")
            .maybeSingle();

          return { ...session, recording: recording || null };
        })
      );

      setSessions(sessionsWithRecordings as Session[]);
    } catch (error) {
      console.error("Error fetching completed sessions:", error);
      toast({
        title: "Error",
        description: "Could not load completed sessions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Completed Sessions
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/sessions">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No completed sessions yet</p>
            <p className="text-sm mt-1">Your completed sessions will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/sessions/${session.id}`)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={session.practitioner.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {session.practitioner.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{session.practitioner.name}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(session.scheduled_at), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(session.scheduled_at), "h:mm a")} • {session.duration_minutes} min
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.recording?.recording_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(session.recording!.recording_url!, '_blank');
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/sessions/${session.id}`);
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

