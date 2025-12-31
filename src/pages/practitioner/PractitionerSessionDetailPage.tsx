import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PractitionerLayout } from "@/components/practitioner/PractitionerLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Clock, User, Video, ArrowLeft, MapPin, FileText, Crown } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { CancelSessionDialog } from "@/components/practitioner/CancelSessionDialog";
import { useSessionJoinTimer } from "@/hooks/useSessionJoinTimer";

interface Session {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  session_location?: string;
  physical_location?: string | null;
  room_name: string;
  notes?: string | null;
  cancelled_at?: string | null;
  client_id: string;
  client?: {
    id: string;
    email?: string;
    full_name?: string;
  };
  recording?: {
    id: string;
    recording_url: string | null;
    status: string;
  };
}

export default function PractitionerSessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      
      // First get the practitioner ID to ensure RLS policy works
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: practitionerData } = await supabase
        .from("practitioners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!practitionerData) throw new Error("Practitioner not found");

      // Fetch session - RLS will ensure practitioner can only see their own sessions
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
          cancelled_at,
          client_id,
          practitioner_id
        `)
        .eq("id", sessionId)
        .eq("practitioner_id", practitionerData.id)
        .single();

      if (error) throw error;

      // Fetch client info from profiles table
      const { data: clientData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", data.client_id)
        .maybeSingle();

      // Load recording if session is completed
      let recording = null;
      if (data.status === 'completed') {
        const { data: recordingData } = await supabase
          .from("session_recordings")
          .select("id, recording_url, status")
          .eq("session_id", sessionId)
          .eq("status", "completed")
          .maybeSingle();
        recording = recordingData;
      }

      setSession({
        ...data,
        client: clientData || undefined,
        recording: recording || undefined,
      } as Session);
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

  const handleCancelSession = async (reason: string) => {
    if (!session) return;

    setCanceling(true);
    const { error } = await supabase
      .from("session_schedules")
      .update({
        status: "cancelled",
        notes: reason ? `Cancelled: ${reason}` : session.notes,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", session.id);

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
      fetchSession();
    }

    setCanceling(false);
    setCancelDialogOpen(false);
  };

  const handleJoinSession = () => {
    if (!session) return;
    const roomUrl = session.room_name;
    navigate(`/sessions?room=${encodeURIComponent(roomUrl)}&host=true&sessionId=${session.id}`);
  };

  const { canJoin, timeUntilJoin, minutesUntilJoin, isInSessionWindow } = useSessionJoinTimer(
    session?.scheduled_at || "",
    session?.duration_minutes || 60
  );

  const getStatusBadge = () => {
    if (!session) return null;
    const status = session.status;
    if (status === "completed") {
      return <Badge className="bg-green-500">Completed</Badge>;
    }
    if (status === "in_progress") {
      return <Badge className="bg-blue-500">In Progress</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    // Status badge doesn't need canJoin check - timer shows availability
    return <Badge variant="outline">Scheduled</Badge>;
  };

  if (loading) {
    return (
      <PractitionerLayout title="Session Details">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PractitionerLayout>
    );
  }

  if (!session) {
    return (
      <PractitionerLayout title="Session Details">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Session not found</p>
            <Button variant="outline" onClick={() => navigate("/practitioner/sessions")} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Button>
          </CardContent>
        </Card>
      </PractitionerLayout>
    );
  }

  const sessionDate = new Date(session.scheduled_at);

  return (
    <PractitionerLayout
      title="Session Details"
      headerActions={
        <Button variant="outline" onClick={() => navigate("/practitioner/sessions")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Session Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Session Details
                  {getStatusBadge()}
                </CardTitle>
                <CardDescription>
                  {format(sessionDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </CardDescription>
              </div>
              {session.status === "scheduled" && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleJoinSession}
                      disabled={!canJoin}
                      title={
                        canJoin
                          ? "Join session"
                          : timeUntilJoin
                          ? `Join available ${timeUntilJoin}`
                          : "Session has ended"
                      }
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      <Video className="w-4 h-4 mr-2" />
                      Join as Host
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={canceling}
                    >
                      Cancel Session
                    </Button>
                  </div>
                  {/* Timer Display */}
                  {!canJoin && timeUntilJoin && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Join available in: <span className="font-mono font-semibold">{timeUntilJoin}</span></span>
                    </div>
                  )}
                  {isInSessionWindow && (
                    <div className="flex items-center gap-2 text-sm text-green-500">
                      <Clock className="w-4 h-4" />
                      <span>Session is available now</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Info */}
            {session.client && (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <Avatar>
                  <AvatarImage src={undefined} />
                  <AvatarFallback>
                    {session.client.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{session.client.full_name || "Client"}</div>
                  <div className="text-sm text-muted-foreground">{session.client.email}</div>
                </div>
              </div>
            )}

            {/* Session Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">{format(sessionDate, "MMMM d, yyyy")}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div className="font-medium">{format(sessionDate, "h:mm a")}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-medium">{session.duration_minutes} minutes</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-medium">
                    {session.session_location === "online" ? "Online" : session.physical_location || "In-Person"}
                  </div>
                </div>
              </div>

              {session.room_name && (
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Room</div>
                    <div className="font-medium font-mono text-sm">{session.room_name}</div>
                  </div>
                </div>
              )}

              {session.cancelled_at && (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Cancelled At</div>
                    <div className="font-medium">{format(new Date(session.cancelled_at), "MMM d, yyyy h:mm a")}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {session.notes && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-2">Notes</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">{session.notes}</div>
              </div>
            )}

            {/* Recording */}
            {session.recording && session.recording.recording_url && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-2">Session Recording</div>
                <Button
                  variant="outline"
                  onClick={() => window.open(session.recording!.recording_url!, "_blank")}
                >
                  <Video className="w-4 h-4 mr-2" />
                  View Recording
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CancelSessionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelSession}
        session={session ? {
          ...session,
          client: session.client ? {
            name: session.client.full_name,
            email: session.client.email,
          } : undefined,
        } : null}
        isCanceling={canceling}
      />
    </PractitionerLayout>
  );
}

