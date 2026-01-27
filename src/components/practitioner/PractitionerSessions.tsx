import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, isToday } from "date-fns";
import { formatDateEastern, formatTimeEastern } from "@/lib/dateUtils";
import { Video, Calendar, Clock, X, Loader2, Crown, Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PractitionerSessionCreator } from "@/components/PractitionerSessionCreator";
import { CancelSessionDialog } from "./CancelSessionDialog";
import { SessionActions } from "./SessionActions";

interface Session {
  id: string;
  client_id: string;
  scheduled_at: string;
  duration_minutes: number;
  room_name: string;
  host_room_url: string | null;
  status: string;
  notes: string | null;
  client?: {
    id: string;
    full_name?: string;
    email?: string;
  };
}

interface PractitionerSessionsProps {
  practitionerId: string;
}

export const PractitionerSessions = ({ practitionerId }: PractitionerSessionsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [practitionerId]);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("session_schedules")
      .select("*")
      .eq("practitioner_id", practitionerId)
      .in("status", ["scheduled", "in_progress"])
      .order("scheduled_at", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Could not load sessions.",
        variant: "destructive",
      });
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  };

  const handleCancelClick = (session: Session) => {
    setSessionToCancel(session);
    setCancelDialogOpen(true);
  };

  const handleCancelSession = async (reason: string) => {
    if (!sessionToCancel) return;

    setCancelingId(sessionToCancel.id);

    const { error } = await supabase
      .from("session_schedules")
      .update({ 
        status: "cancelled",
        notes: reason ? `Cancelled by practitioner: ${reason}` : (sessionToCancel.notes || "Cancelled by practitioner"),
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", sessionToCancel.id);

    if (error) {
      toast({
        title: "Error",
        description: "Could not cancel the session.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Session Cancelled",
        description: "The session has been cancelled and the client has been notified.",
      });
      fetchSessions();
    }

    setCancelingId(null);
    setCancelDialogOpen(false);
    setSessionToCancel(null);
  };

  const handleJoinSession = (session: Session) => {
    const roomUrl = session.host_room_url || session.room_name;
    navigate(`/sessions?room=${encodeURIComponent(roomUrl)}&host=true`);
  };

  // Removed canJoin function - using useSessionJoinTimer hook instead

  const getStatusBadge = (status: string, scheduledAt: string) => {
    if (status === "in_progress") {
      return <Badge className="bg-green-500">In Progress</Badge>;
    }
    if (status === "completed") {
      return <Badge variant="default">Completed</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
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

  if (showCreator) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setShowCreator(false)}>
          ← Back to Sessions
        </Button>
        <PractitionerSessionCreator 
          practitionerId={practitionerId} 
          onSessionCreated={() => {
            setShowCreator(false);
            fetchSessions();
          }} 
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Your Sessions
        </CardTitle>
        <Button size="sm" onClick={() => setShowCreator(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Session
        </Button>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No upcoming sessions</p>
            <p className="text-sm mt-1">Create a session with a client</p>
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
                    <span className="font-medium">Session</span>
                    {getStatusBadge(session.status, session.scheduled_at)}
                    <Badge variant="outline">
                      {session.duration_minutes} min
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateEastern(session.scheduled_at, "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeEastern(session.scheduled_at, "h:mm a")}
                    </span>
                  </div>
                  {session.notes && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      {session.notes}
                    </p>
                  )}
                </div>
                <SessionActions
                  session={session}
                  onViewDetails={() => navigate(`/practitioner/sessions/${session.id}`)}
                  onJoin={() => handleJoinSession(session)}
                  onCancel={() => handleCancelClick(session)}
                  canceling={cancelingId === session.id}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CancelSessionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelSession}
        session={sessionToCancel ? {
          ...sessionToCancel,
          client: sessionToCancel.client ? {
            name: sessionToCancel.client.full_name,
            email: sessionToCancel.client.email,
          } : undefined,
        } : null}
        isCanceling={cancelingId !== null}
      />
    </Card>
  );
};
