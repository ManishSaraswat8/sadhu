import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, isFuture, isToday } from "date-fns";
import { Video, Calendar, Clock, X, Loader2, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AllSessionsJoinButton } from "./AllSessionsJoinButton";

interface Session {
  id: string;
  practitioner_id: string;
  scheduled_at: string;
  duration_minutes: number;
  room_name: string;
  host_room_url: string | null;
  status: string;
  practitioner: {
    name: string;
    avatar_url: string | null;
    user_id: string;
  };
}

interface UpcomingSessionsProps {
  onRefresh?: () => void;
}

export const UpcomingSessions = ({ onRefresh }: UpcomingSessionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [isPractitioner, setIsPractitioner] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSessions();
      checkIfPractitioner();
    }
  }, [user]);

  const checkIfPractitioner = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("practitioners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    setIsPractitioner(!!data);
  };

  const fetchSessions = async () => {
    if (!user) return;

    // Fetch sessions as client
    const { data: clientSessions, error: clientError } = await supabase
      .from("session_schedules")
      .select(`
        *,
        practitioner:practitioners(name, avatar_url, user_id)
      `)
      .eq("client_id", user.id)
      .in("status", ["scheduled", "in_progress"])
      .order("scheduled_at", { ascending: true });

    if (clientError) {
      console.error("Error fetching client sessions:", clientError);
      toast({
        title: "Error",
        description: "Could not load sessions. Please refresh the page.",
        variant: "destructive",
      });
    }

    // Also fetch sessions as practitioner
    const { data: practitionerData } = await supabase
      .from("practitioners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let practitionerSessions: Session[] = [];
    if (practitionerData) {
      const { data } = await supabase
        .from("session_schedules")
        .select(`
          *,
          practitioner:practitioners(name, avatar_url, user_id)
        `)
        .eq("practitioner_id", practitionerData.id)
        .in("status", ["scheduled", "in_progress"])
        .order("scheduled_at", { ascending: true });
      
      practitionerSessions = (data || []) as Session[];
    }

    // Combine and deduplicate sessions
    const allSessions = [...(clientSessions || []), ...practitionerSessions] as Session[];
    const uniqueSessions = allSessions.filter((session, index, self) =>
      index === self.findIndex((s) => s.id === session.id)
    );

    console.log("Fetched sessions:", {
      clientSessions: clientSessions?.length || 0,
      practitionerSessions: practitionerSessions.length,
      uniqueSessions: uniqueSessions.length,
      userId: user.id
    });

    setSessions(uniqueSessions.sort((a, b) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    ));
    setLoading(false);
  };

  const handleCancelSession = async (sessionId: string) => {
    setCancelingId(sessionId);

    const { error } = await supabase
      .from("session_schedules")
      .update({ status: "cancelled" })
      .eq("id", sessionId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not cancel the session.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Session Cancelled",
        description: "Your session has been cancelled.",
      });
      fetchSessions();
      onRefresh?.();
    }

    setCancelingId(null);
  };

  const handleJoinSession = (session: Session) => {
    // Check if the current user is the practitioner for this session
    const isSessionPractitioner = session.practitioner?.user_id === user?.id;
    
    // For Agora, we use the channel name (room_name) for both client and practitioner
    // The role (publisher/subscriber) is determined by the token generation
    const channelName = session.room_name;
    
    navigate(`/sessions?room=${encodeURIComponent(channelName)}&host=${isSessionPractitioner}&sessionId=${session.id}`);
  };

  const canJoin = (scheduledAt: string) => {
    const sessionTime = new Date(scheduledAt);
    const now = new Date();
    const fifteenMinutesBefore = new Date(sessionTime.getTime() - 15 * 60 * 1000);
    const sessionEnd = new Date(sessionTime.getTime() + 60 * 60 * 1000);
    
    return now >= fifteenMinutesBefore && now <= sessionEnd;
  };

  const getStatusBadge = (status: string, scheduledAt: string) => {
    if (status === "in_progress") {
      return <Badge className="bg-green-500">In Progress</Badge>;
    }
    if (canJoin(scheduledAt)) {
      return <Badge className="bg-primary">Ready to Join</Badge>;
    }
    if (isToday(new Date(scheduledAt))) {
      return <Badge variant="secondary">Today</Badge>;
    }
    return <Badge variant="outline">Scheduled</Badge>;
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Upcoming Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No upcoming sessions</p>
            <p className="text-sm mt-1">Book a session with a practitioner</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-background"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{session.practitioner?.name}</span>
                    {getStatusBadge(session.status, session.scheduled_at)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(session.scheduled_at), "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(session.scheduled_at), "h:mm a")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AllSessionsJoinButton
                    session={{
                      scheduled_at: session.scheduled_at,
                      duration_minutes: session.duration_minutes,
                      room_name: session.room_name,
                      practitioner: session.practitioner,
                    }}
                    currentUserId={user?.id}
                    onJoin={() => handleJoinSession(session)}
                    isUpcoming={true}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelSession(session.id)}
                    disabled={cancelingId === session.id}
                  >
                    {cancelingId === session.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
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
