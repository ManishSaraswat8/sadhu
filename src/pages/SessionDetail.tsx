import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserLayout } from "@/components/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Clock, User, Video, Download, BookOpen, Target, ArrowLeft, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface Session {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  session_location?: string;
  physical_location?: string | null;
  room_name: string;
  notes?: string | null;
  practitioner: {
    id: string;
    name: string;
    avatar_url: string | null;
    bio?: string | null;
  };
  recording?: {
    id: string;
    recording_url: string | null;
    status: string;
  };
}

const SessionDetail = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId && user) {
      fetchSession();
    }
  }, [sessionId, user]);

  const fetchSession = async () => {
    if (!sessionId || !user) return;

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
          physical_location,
          room_name,
          notes,
          practitioner:practitioners (
            id,
            name,
            avatar_url,
            bio
          )
        `)
        .eq("id", sessionId)
        .eq("client_id", user.id)
        .single();

      if (error) throw error;

      // Load recording if session is completed
      if (data.status === 'completed') {
        const { data: recording } = await supabase
          .from("session_recordings")
          .select("id, recording_url, status")
          .eq("session_id", sessionId)
          .eq("status", "completed")
          .maybeSingle();

        setSession({ ...data, recording: recording || undefined } as Session);
      } else {
        setSession(data as Session);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      toast({
        title: "Error",
        description: "Could not load session details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canJoin = (scheduledAt: string) => {
    const sessionTime = new Date(scheduledAt);
    const now = new Date();
    const fifteenMinutesBefore = new Date(sessionTime.getTime() - 15 * 60 * 1000);
    const sessionEnd = new Date(sessionTime.getTime() + 60 * 60 * 1000);
    
    return now >= fifteenMinutesBefore && now <= sessionEnd;
  };

  const handleJoinSession = () => {
    if (!session) return;
    navigate(`/sessions?room=${encodeURIComponent(session.room_name)}&sessionId=${session.id}`);
  };

  if (loading) {
    return (
      <UserLayout title="Session Details">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </UserLayout>
    );
  }

  if (!session) {
    return (
      <UserLayout title="Session Not Found">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Session not found or you don't have access to it.</p>
            <Button asChild>
              <Link to="/sessions">Back to Sessions</Link>
            </Button>
          </CardContent>
        </Card>
      </UserLayout>
    );
  }

  const scheduledDate = new Date(session.scheduled_at);
  const isUpcoming = session.status === 'scheduled' || session.status === 'in_progress';
  const isCompleted = session.status === 'completed';

  return (
    <UserLayout title="Session Details">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/sessions">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Session Details</CardTitle>
              <Badge
                variant={
                  session.status === 'completed' ? 'default' :
                  session.status === 'in_progress' ? 'default' :
                  session.status === 'cancelled' ? 'destructive' :
                  'secondary'
                }
                className="text-sm"
              >
                {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Practitioner Info */}
            <div className="flex items-start gap-4 pb-4 border-b">
              <Avatar className="w-16 h-16">
                <AvatarImage src={session.practitioner.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {session.practitioner.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">{session.practitioner.name}</h3>
                {session.practitioner.bio && (
                  <p className="text-sm text-muted-foreground">{session.practitioner.bio}</p>
                )}
              </div>
            </div>

            {/* Session Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">{format(scheduledDate, "EEEE, MMMM d, yyyy")}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div className="font-medium">{format(scheduledDate, "h:mm a")} ({session.duration_minutes} min)</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {session.session_location === 'online' ? (
                  <Video className="w-5 h-5 text-primary" />
                ) : (
                  <MapPin className="w-5 h-5 text-primary" />
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-medium">
                    {session.session_location === 'online' ? 'Online' : session.physical_location || 'In-Person'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="font-medium">1:1 Session</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {session.notes && (
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">Notes</div>
                <p className="text-sm">{session.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {isUpcoming && canJoin(scheduledDate) && (
                <Button onClick={handleJoinSession}>
                  <Video className="w-4 h-4 mr-2" />
                  Join Session
                </Button>
              )}
              {isCompleted && session.recording?.recording_url && (
                <Button variant="outline" asChild>
                  <a href={session.recording.recording_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download Recording
                  </a>
                </Button>
              )}
              {isCompleted && (
                <Button variant="outline" asChild>
                  <Link to={`/journal?session_id=${session.id}`}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Journal Entry
                  </Link>
                </Button>
              )}
              {isCompleted && (
                <Button variant="outline" asChild>
                  <Link to={`/dashboard?tab=actions&session_id=${session.id}`}>
                    <Target className="w-4 h-4 mr-2" />
                    View Actions
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default SessionDetail;

