import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Trash2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface PractitionerMyAvailabilityProps {
  practitionerId: string;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const PractitionerMyAvailability = ({ practitionerId }: PractitionerMyAvailabilityProps) => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day_of_week: "1",
    start_time: "09:00",
    end_time: "17:00",
  });

  useEffect(() => {
    fetchSlots();
  }, [practitionerId]);

  const fetchSlots = async () => {
    const { data, error } = await supabase
      .from("practitioner_availability")
      .select("*")
      .eq("practitioner_id", practitionerId)
      .order("day_of_week", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Could not load availability.",
        variant: "destructive",
      });
    } else {
      setSlots(data || []);
    }
    setLoading(false);
  };

  const handleAddSlot = async () => {
    setSaving(true);
    const { error } = await supabase.from("practitioner_availability").insert({
      practitioner_id: practitionerId,
      day_of_week: parseInt(newSlot.day_of_week),
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Could not add availability slot.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Availability slot added.",
      });
      fetchSlots();
    }
    setSaving(false);
  };

  const handleDeleteSlot = async (id: string) => {
    const { error } = await supabase
      .from("practitioner_availability")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Could not delete slot.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Availability slot removed.",
      });
      fetchSlots();
    }
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
    <div className="space-y-6">
      {/* Add New Slot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select
                value={newSlot.day_of_week}
                onValueChange={(value) =>
                  setNewSlot({ ...newSlot, day_of_week: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={newSlot.start_time}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, start_time: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={newSlot.end_time}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, end_time: e.target.value })
                }
              />
            </div>
            <Button onClick={handleAddSlot} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Slot
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Your Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No availability set</p>
              <p className="text-sm mt-1">Add time slots when you're available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium min-w-[100px]">
                      {DAYS[slot.day_of_week]}
                    </span>
                    <span className="text-muted-foreground">
                      {slot.start_time} - {slot.end_time}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSlot(slot.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
