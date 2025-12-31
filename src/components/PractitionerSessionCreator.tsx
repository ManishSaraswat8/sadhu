import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format, setHours, setMinutes, isBefore, startOfDay } from "date-fns";
import { Loader2, Clock, User, Calendar as CalendarIcon, Plus } from "lucide-react";

interface Client {
  client_id: string;
  email: string;
}

interface PractitionerSessionCreatorProps {
  practitionerId?: string;
  onSessionCreated?: () => void;
}

export const PractitionerSessionCreator = ({ practitionerId: propPractitionerId, onSessionCreated }: PractitionerSessionCreatorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [practitionerId, setPractitionerId] = useState<string | null>(propPractitionerId || null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<30 | 60>(60);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (propPractitionerId) {
      setPractitionerId(propPractitionerId);
      fetchClients(propPractitionerId);
    } else if (user) {
      fetchPractitionerData();
    }
  }, [user, propPractitionerId]);

  const fetchClients = async (pracId: string) => {
    const { data: assignments } = await supabase
      .from("practitioner_assignments")
      .select("client_id")
      .eq("practitioner_id", pracId);

    if (assignments && assignments.length > 0) {
      const clientsWithEmails: Client[] = assignments.map(assignment => ({
        client_id: assignment.client_id,
        email: `Client ${assignment.client_id.substring(0, 8)}...`,
      }));
      setClients(clientsWithEmails);
    }
    setLoading(false);
  };

  const fetchPractitionerData = async () => {
    if (!user) return;

    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!practitioner) {
      setLoading(false);
      return;
    }

    setPractitionerId(practitioner.id);
    fetchClients(practitioner.id);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  };

  const handleCreateSession = async () => {
    if (!user || !practitionerId || !selectedClient || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);
      
      // Generate channel name
      const channelName = `session-${practitionerId.substring(0, 8)}-${selectedClient.substring(0, 8)}-${Date.now()}`;

      // Create Agora room/channel via edge function
      let roomName = channelName;

      try {
        const { data: agoraData, error: agoraError } = await supabase.functions.invoke('create-agora-room', {
          body: { 
            channelName,
            isGroup: false,
          },
        });

        if (!agoraError && agoraData) {
          roomName = agoraData.channelName;
        }
      } catch (err) {
        console.log("Agora room creation failed, using fallback");
      }

      // Create session directly in database (no payment required)
      const { error } = await supabase
        .from("session_schedules")
        .insert({
          practitioner_id: practitionerId,
          client_id: selectedClient,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: selectedDuration,
          room_name: roomName,
          host_room_url: null, // Agora doesn't use separate host URLs
          notes: notes || null,
          status: "scheduled",
        });

      if (error) throw error;

      toast({
        title: "Session Created",
        description: `Session scheduled for ${format(scheduledAt, "MMM d, yyyy 'at' h:mm a")}`,
      });

      // Reset form
      setSelectedClient("");
      setSelectedDate(undefined);
      setSelectedTime("");
      setSelectedDuration(60);
      setNotes("");
      onSessionCreated?.();
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Could not create session. Please try again.",
        variant: "destructive",
      });
    }

    setCreating(false);
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

  if (!practitionerId) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-xl flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Create Session for Client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <User className="w-4 h-4" />
            Select Client
          </label>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.length === 0 ? (
                <SelectItem value="none" disabled>
                  No assigned clients
                </SelectItem>
              ) : (
                clients.map((client) => (
                  <SelectItem key={client.client_id} value={client.client_id}>
                    {client.email}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Duration Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Duration
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={selectedDuration === 30 ? "default" : "outline"}
              onClick={() => setSelectedDuration(30)}
            >
              30 minutes
            </Button>
            <Button
              type="button"
              variant={selectedDuration === 60 ? "default" : "outline"}
              onClick={() => setSelectedDuration(60)}
            >
              60 minutes
            </Button>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Select Date
          </label>
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
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Time
            </label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time" />
              </SelectTrigger>
              <SelectContent>
                {generateTimeSlots().map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Session Notes (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes for this session..."
            rows={3}
          />
        </div>

        {/* Create Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleCreateSession}
          disabled={creating || !selectedClient || !selectedDate || !selectedTime}
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Session (No Payment)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
