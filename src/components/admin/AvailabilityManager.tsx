import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Practitioner = Tables<"practitioners">;
type Availability = Tables<"practitioner_availability">;

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

interface AvailabilityManagerProps {
  practitioner: Practitioner;
  onBack: () => void;
}

export const AvailabilityManager = ({
  practitioner,
  onBack,
}: AvailabilityManagerProps) => {
  const queryClient = useQueryClient();
  const [newSlot, setNewSlot] = useState({
    day_of_week: "",
    start_time: "09:00",
    end_time: "17:00",
  });

  const { data: availability, isLoading } = useQuery({
    queryKey: ["practitioner-availability", practitioner.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practitioner_availability")
        .select("*")
        .eq("practitioner_id", practitioner.id)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as Availability[];
    },
  });

  const addSlotMutation = useMutation({
    mutationFn: async (slot: typeof newSlot) => {
      const { error } = await supabase.from("practitioner_availability").insert({
        practitioner_id: practitioner.id,
        day_of_week: parseInt(slot.day_of_week),
        start_time: slot.start_time,
        end_time: slot.end_time,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["practitioner-availability", practitioner.id],
      });
      setNewSlot({ day_of_week: "", start_time: "09:00", end_time: "17:00" });
      toast.success("Availability slot added");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("practitioner_availability")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["practitioner-availability", practitioner.id],
      });
      toast.success("Availability slot removed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.day_of_week) {
      toast.error("Please select a day");
      return;
    }
    addSlotMutation.mutate(newSlot);
  };

  const getDayLabel = (dayNum: number) => {
    return DAYS_OF_WEEK.find((d) => d.value === dayNum)?.label || "";
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Manage Availability
          </h2>
          <p className="text-muted-foreground">{practitioner.name}</p>
        </div>
      </div>

      {/* Add New Slot */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-medium text-foreground mb-4">Add Availability Slot</h3>
        <form onSubmit={handleAddSlot} className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 flex-1 min-w-[150px]">
            <Label>Day of Week</Label>
            <Select
              value={newSlot.day_of_week}
              onValueChange={(value) =>
                setNewSlot({ ...newSlot, day_of_week: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
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
          <Button type="submit" disabled={addSlotMutation.isPending}>
            <Plus className="w-4 h-4 mr-2" />
            Add Slot
          </Button>
        </form>
      </div>

      {/* Availability List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availability?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No availability slots configured
                  </TableCell>
                </TableRow>
              )}
              {availability?.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell className="font-medium">
                    {getDayLabel(slot.day_of_week)}
                  </TableCell>
                  <TableCell>{formatTime(slot.start_time)}</TableCell>
                  <TableCell>{formatTime(slot.end_time)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSlotMutation.mutate(slot.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
