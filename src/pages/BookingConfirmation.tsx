import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserLayout } from "@/components/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar, Clock, User, MapPin, CheckCircle, Download, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SessionDetails {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  practitioner: {
    id: string;
    name: string;
    avatar_url: string | null;
    specialization: string | null;
  };
  session_location?: string;
  physical_location?: string;
}

const BookingConfirmation = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetails | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (sessionId && user) {
      loadSessionDetails();
    }
  }, [sessionId, user, authLoading]);

  const loadSessionDetails = async () => {
    if (!sessionId) return;

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
          practitioner:practitioners (
            id,
            name,
            avatar_url,
            specialization
          )
        `)
        .eq("id", sessionId)
        .eq("client_id", user!.id)
        .single();

      if (error) throw error;
      if (data) {
        setSession(data as any);
      }
    } catch (error) {
      console.error("Error loading session:", error);
      toast({
        title: "Error",
        description: "Could not load session details.",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const addToCalendar = () => {
    if (!session) return;

    const startDate = new Date(session.scheduled_at);
    const endDate = new Date(startDate.getTime() + session.duration_minutes * 60 * 1000);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Sadhu Meditation Session&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=Session with ${session.practitioner.name}`;

    window.open(calendarUrl, '_blank');
  };

  if (authLoading || loading) {
    return (
      <UserLayout title="Booking Confirmation">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </UserLayout>
    );
  }

  if (!session) {
    return (
      <UserLayout title="Booking Confirmation">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Session not found</p>
            <Button asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </UserLayout>
    );
  }

  const scheduledDate = new Date(session.scheduled_at);

  return (
    <UserLayout title="Booking Confirmed">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Message */}
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-semibold">Booking Confirmed!</h2>
                <p className="text-sm text-muted-foreground">
                  Your session has been successfully booked. A confirmation email has been sent to your email address.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Practitioner */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="w-16 h-16">
                <AvatarImage src={session.practitioner.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {session.practitioner.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium text-lg">{session.practitioner.name}</h3>
                {session.practitioner.specialization && (
                  <Badge variant="secondary" className="mt-1">
                    {session.practitioner.specialization}
                  </Badge>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(scheduledDate, "EEEE, MMMM d, yyyy")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{format(scheduledDate, "h:mm a")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Duration: {session.duration_minutes} minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            {session.session_location === 'in_person' && session.physical_location && (
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{session.physical_location}</p>
                </div>
              </div>
            )}

            {session.session_location === 'online' && (
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">Online Session</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll receive a link to join the session before it starts.
                  </p>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={addToCalendar} variant="outline" className="flex-1">
            <Calendar className="w-4 h-4 mr-2" />
            Add to Calendar
          </Button>
          <Button asChild className="flex-1">
            <Link to="/sessions">
              <User className="w-4 h-4 mr-2" />
              View My Sessions
            </Link>
          </Button>
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  You'll receive a confirmation email with all the details.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Prepare for your session</p>
                <p className="text-sm text-muted-foreground">
                  Review the Getting Started guide if this is your first session.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Join on time</p>
                <p className="text-sm text-muted-foreground">
                  {session.session_location === 'online' 
                    ? "You'll receive a link 15 minutes before your session starts."
                    : "Please arrive 5-10 minutes early for in-person sessions."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="ghost" asChild className="w-full">
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </UserLayout>
  );
};

export default BookingConfirmation;

