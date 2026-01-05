import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, addHours, isBefore, setHours, setMinutes, startOfDay, endOfDay } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Session {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  practitioner_id: string;
  client_id: string;
  status: string;
}

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onRescheduled: () => void;
  isAdmin?: boolean;
}

export const RescheduleDialog = ({ open, onOpenChange, session, onRescheduled, isAdmin = false }: RescheduleDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [rescheduling, setRescheduling] = useState(false);
  const [practitionerAvailability, setPractitionerAvailability] = useState<any[]>([]);
  const [existingSessions, setExistingSessions] = useState<any[]>([]);
  const [canReschedule, setCanReschedule] = useState<{ allowed: boolean; reason?: string; hoursUntil?: number }>({ allowed: true });

  useEffect(() => {
    if (open && session) {
      const sessionDate = new Date(session.scheduled_at);
      setSelectedDate(sessionDate);
      setSelectedTime(format(sessionDate, "HH:mm"));
      
      // Check if rescheduling is allowed based on cancellation policy
      if (!isAdmin) {
        checkReschedulePolicy();
      }
      
      fetchPractitionerAvailability();
    }
  }, [open, session, isAdmin]);

  useEffect(() => {
    if (selectedDate && session) {
      generateTimeSlots();
    }
  }, [selectedDate, session, practitionerAvailability, existingSessions]);

  const checkReschedulePolicy = () => {
    if (!session) return;

    const sessionTime = new Date(session.scheduled_at);
    const now = new Date();
    const hoursUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Standard cancellation window: 3 hours before
    if (hoursUntil < 3) {
      // Check if user has used grace cancellation
      checkGraceCancellation().then((usedGrace) => {
        if (usedGrace) {
          setCanReschedule({
            allowed: false,
            reason: "You have already used your one-time grace cancellation. Rescheduling is not allowed within 3 hours of the session.",
            hoursUntil
          });
        } else {
          setCanReschedule({
            allowed: false,
            reason: "Rescheduling is only allowed up to 3 hours before the session. You can use your one-time grace cancellation for emergencies.",
            hoursUntil
          });
        }
      });
    } else {
      setCanReschedule({ allowed: true });
    }
  };

  const checkGraceCancellation = async (): Promise<boolean> => {
    if (!user || !session) return false;

    try {
      // Check if user has used grace cancellation for any credit
      const { data: credits } = await supabase
        .from("user_session_credits")
        .select("grace_cancellation_used")
        .eq("user_id", user.id)
        .eq("grace_cancellation_used", true)
        .limit(1)
        .maybeSingle();

      return !!credits;
    } catch (error) {
      console.error("Error checking grace cancellation:", error);
      return false;
    }
  };

  const fetchPractitionerAvailability = async () => {
    if (!session) return;

    try {
      // Fetch practitioner availability
      const { data: availability } = await supabase
        .from("practitioner_availability")
        .select("*")
        .eq("practitioner_id", session.practitioner_id);

      setPractitionerAvailability(availability || []);

      // Fetch existing sessions for the practitioner
      const { data: sessions } = await supabase
        .from("session_schedules")
        .select("scheduled_at, duration_minutes")
        .eq("practitioner_id", session.practitioner_id)
        .in("status", ["scheduled", "in_progress"])
        .neq("id", session.id); // Exclude current session

      setExistingSessions(sessions || []);
    } catch (error) {
      console.error("Error fetching practitioner availability:", error);
    }
  };

  const generateTimeSlots = () => {
    if (!selectedDate || !session) return;

    const slots: string[] = [];
    const dayOfWeek = selectedDate.getDay();

    // Get availability for this day
    const dayAvailability = practitionerAvailability.find(a => a.day_of_week === dayOfWeek);
    
    if (!dayAvailability) {
      setTimeSlots([]);
      return;
    }

    const [startHour, startMin] = dayAvailability.start_time.split(":").map(Number);
    const [endHour, endMin] = dayAvailability.end_time.split(":").map(Number);
    
    const startTime = setMinutes(setHours(selectedDate, startHour), startMin);
    const endTime = setMinutes(setHours(selectedDate, endHour), endMin);

    // Generate slots every 30 minutes
    let currentTime = startTime;
    while (currentTime < endTime) {
      const timeString = format(currentTime, "HH:mm");
      
      // Check if this slot conflicts with existing sessions
      const hasConflict = existingSessions.some(existing => {
        const existingTime = new Date(existing.scheduled_at);
        const existingEnd = new Date(existingTime.getTime() + existing.duration_minutes * 60000);
        const slotEnd = new Date(currentTime.getTime() + session.duration_minutes * 60000);
        
        return (
          (currentTime >= existingTime && currentTime < existingEnd) ||
          (slotEnd > existingTime && slotEnd <= existingEnd) ||
          (currentTime <= existingTime && slotEnd >= existingEnd)
        );
      });

      // Only add if no conflict and not in the past
      if (!hasConflict && currentTime > new Date()) {
        slots.push(timeString);
      }

      currentTime = new Date(currentTime.getTime() + 30 * 60000); // Add 30 minutes
    }

    setTimeSlots(slots);
  };

  const handleReschedule = async () => {
    if (!session || !selectedDate || !selectedTime || !user) return;

    setRescheduling(true);

    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const newScheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

      // Update session
      const { error } = await supabase
        .from("session_schedules")
        .update({
          scheduled_at: newScheduledAt.toISOString(),
          notes: session.notes ? `${session.notes}\n\nRescheduled on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}` : `Rescheduled on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`
        })
        .eq("id", session.id);

      if (error) throw error;

      toast({
        title: "Session Rescheduled",
        description: `Your session has been rescheduled to ${format(newScheduledAt, "MMM d, yyyy 'at' h:mm a")}.`,
      });

      onRescheduled();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error rescheduling session:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRescheduling(false);
    }
  };

  if (!session) return null;

  const sessionDate = new Date(session.scheduled_at);
  const hoursUntil = (sessionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reschedule Session</DialogTitle>
          <DialogDescription>
            Select a new date and time for your session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Session Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Current Session</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Date: {format(sessionDate, "EEEE, MMMM d, yyyy")}</p>
              <p>Time: {format(sessionDate, "h:mm a")}</p>
              <p>Duration: {session.duration_minutes} minutes</p>
            </div>
          </div>

          {/* Cancellation Policy Warning */}
          {!isAdmin && !canReschedule.allowed && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {canReschedule.reason}
                {hoursUntil < 3 && hoursUntil > 0 && (
                  <span className="block mt-2">
                    Session is in {Math.round(hoursUntil * 10) / 10} hours.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Admin Override Notice */}
          {isAdmin && hoursUntil < 3 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Admin override: Rescheduling allowed despite being within 3-hour window.
              </AlertDescription>
            </Alert>
          )}

          {/* Date Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select New Date</label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => isBefore(date, startOfDay(new Date()))}
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <label className="text-sm font-medium mb-2 block">Select New Time</label>
              {timeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No available time slots for this date.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={rescheduling || !selectedDate || !selectedTime || (!isAdmin && !canReschedule.allowed) || timeSlots.length === 0}
          >
            {rescheduling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rescheduling...
              </>
            ) : (
              "Reschedule Session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

