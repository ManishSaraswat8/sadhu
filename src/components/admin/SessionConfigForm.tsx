import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";
import { CustomDialog, CustomDialogField } from "@/components/ui/custom-dialog";

interface SessionConfig {
  durations: number[];
  practiceTypes: { value: string; label: string }[];
  formats: { value: boolean; label: string }[];
}

interface SessionConfigFormProps {
  config: SessionConfig;
  onConfigUpdated: () => void;
}

export function SessionConfigForm({ config, onConfigUpdated }: SessionConfigFormProps) {
  const queryClient = useQueryClient();
  const [durations, setDurations] = useState<number[]>(config.durations);
  const [practiceTypes, setPracticeTypes] = useState<{ value: string; label: string }[]>(config.practiceTypes);
  const [formats, setFormats] = useState<{ value: boolean; label: string }[]>(config.formats);
  
  // Dialog states
  const [durationDialogOpen, setDurationDialogOpen] = useState(false);
  const [practiceTypeDialogOpen, setPracticeTypeDialogOpen] = useState(false);
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);

  const updateConfigMutation = useMutation({
    mutationFn: async () => {
      // Get current user for change log
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Update durations
      await supabase
        .from("settings")
        .update({
          value: { options: durations, default: durations[Math.floor(durations.length / 2)] },
          updated_by: user.id,
        })
        .eq("key", "session_durations");

      // Update practice types
      const practiceTypeValue = {
        options: practiceTypes.map(pt => pt.value),
        labels: practiceTypes.reduce((acc, pt) => ({ ...acc, [pt.value]: pt.label }), {} as Record<string, string>)
      };
      await supabase
        .from("settings")
        .update({
          value: practiceTypeValue,
          updated_by: user.id,
        })
        .eq("key", "session_practice_types");

      // Update formats
      await supabase
        .from("settings")
        .update({
          value: { options: formats },
          updated_by: user.id,
        })
        .eq("key", "session_formats");

      // Create change log
      await (supabase.from("session_type_changes" as never) as any).insert({
        session_type_id: null,
        change_type: "updated",
        changed_by: user.id,
        old_data: config,
        new_data: { durations, practiceTypes, formats },
        change_summary: "Session configuration options updated",
        notify_users: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-session-config"] });
      queryClient.invalidateQueries({ queryKey: ["admin-session-types"] });
      toast.success("Configuration updated successfully. Users will be notified.");
      onConfigUpdated();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleAddDuration = (values: Record<string, string | number | boolean>) => {
    const duration = Number(values.duration);
    if (!isNaN(duration) && duration > 0 && !durations.includes(duration)) {
      setDurations([...durations, duration].sort((a, b) => a - b));
      toast.success("Duration added successfully");
    } else if (durations.includes(duration)) {
      toast.error("This duration already exists");
    } else {
      toast.error("Please enter a valid positive number");
    }
  };

  const removeDuration = (duration: number) => {
    setDurations(durations.filter(d => d !== duration));
  };

  const handleAddPracticeType = (values: Record<string, string | number | boolean>) => {
    const value = values.value as string;
    const label = values.label as string;
    if (value && label && !practiceTypes.find(pt => pt.value === value)) {
      setPracticeTypes([...practiceTypes, { value, label }]);
      toast.success("Practice type added successfully");
    } else if (practiceTypes.find(pt => pt.value === value)) {
      toast.error("This practice type value already exists");
    }
  };

  const removePracticeType = (value: string) => {
    setPracticeTypes(practiceTypes.filter(pt => pt.value !== value));
  };

  const handleAddFormat = (values: Record<string, string | number | boolean>) => {
    const label = values.label as string;
    const isGroup = values.isGroup as boolean;
    if (label && !formats.find(f => f.label === label)) {
      setFormats([...formats, { value: isGroup, label }]);
      toast.success("Format added successfully");
    } else if (formats.find(f => f.label === label)) {
      toast.error("This format label already exists");
    }
  };

  const removeFormat = (value: boolean) => {
    setFormats(formats.filter(f => f.value !== value));
  };

  const durationFields: CustomDialogField[] = [
    {
      id: "duration",
      label: "Duration (minutes)",
      type: "number",
      placeholder: "e.g., 20, 45, 60",
      required: true,
      min: 1,
    },
  ];

  const practiceTypeFields: CustomDialogField[] = [
    {
      id: "value",
      label: "Value",
      type: "text",
      placeholder: "e.g., standing",
      required: true,
    },
    {
      id: "label",
      label: "Label",
      type: "text",
      placeholder: "e.g., Standing",
      required: true,
    },
  ];

  const formatFields: CustomDialogField[] = [
    {
      id: "label",
      label: "Format Label",
      type: "text",
      placeholder: "e.g., 1:1 Session",
      required: true,
    },
    {
      id: "isGroup",
      label: "Group Session",
      type: "switch",
      placeholder: "Enable if this is a group session format",
      defaultValue: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Durations */}
      <Card>
        <CardHeader>
          <CardTitle>Session Durations</CardTitle>
          <CardDescription>Available duration options in minutes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {durations.map((dur) => (
              <div key={dur} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
                <span>{dur} min</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => removeDuration(dur)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setDurationDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Duration
          </Button>
        </CardContent>
      </Card>

      {/* Practice Types */}
      <Card>
        <CardHeader>
          <CardTitle>Practice Types</CardTitle>
          <CardDescription>Available practice type options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {practiceTypes.map((pt) => (
              <div key={pt.value} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
                <span className="font-medium">{pt.label}</span>
                <span className="text-muted-foreground text-sm">({pt.value})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-auto"
                  onClick={() => removePracticeType(pt.value)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setPracticeTypeDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Practice Type
          </Button>
        </CardContent>
      </Card>

      {/* Formats */}
      <Card>
        <CardHeader>
          <CardTitle>Session Formats</CardTitle>
          <CardDescription>Available session format options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {formats.map((fmt) => (
              <div key={String(fmt.value)} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
                <span className="font-medium">{fmt.label}</span>
                <span className="text-muted-foreground text-sm">({fmt.value ? 'Group' : '1:1'})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-auto"
                  onClick={() => removeFormat(fmt.value)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setFormatDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Format
          </Button>
        </CardContent>
      </Card>

      <Button
        onClick={() => updateConfigMutation.mutate()}
        disabled={updateConfigMutation.isPending}
        className="w-full"
      >
        {updateConfigMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Configuration"
        )}
      </Button>

      {/* Add Duration Dialog */}
      <CustomDialog
        open={durationDialogOpen}
        onOpenChange={setDurationDialogOpen}
        onConfirm={handleAddDuration}
        title="Add Duration"
        description="Enter the duration in minutes (e.g., 20, 45, 60)"
        fields={durationFields}
        confirmText="Add Duration"
        cancelText="Cancel"
      />

      {/* Add Practice Type Dialog */}
      <CustomDialog
        open={practiceTypeDialogOpen}
        onOpenChange={setPracticeTypeDialogOpen}
        onConfirm={handleAddPracticeType}
        title="Add Practice Type"
        description="Enter the practice type value and display label"
        fields={practiceTypeFields}
        confirmText="Add Practice Type"
        cancelText="Cancel"
      />

      {/* Add Format Dialog */}
      <CustomDialog
        open={formatDialogOpen}
        onOpenChange={setFormatDialogOpen}
        onConfirm={handleAddFormat}
        title="Add Session Format"
        description="Enter the format label and select if it's a group session"
        fields={formatFields}
        confirmText="Add Format"
        cancelText="Cancel"
      />
    </div>
  );
}

