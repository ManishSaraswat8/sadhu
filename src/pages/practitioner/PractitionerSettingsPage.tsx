import { PractitionerLayout } from "@/components/practitioner/PractitionerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export default function PractitionerSettingsPage() {
  const queryClient = useQueryClient();

  const { data: practitioner, isLoading } = useQuery({
    queryKey: ["practitioner-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("practitioners")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!practitioner?.id) throw new Error("No practitioner profile");

      const { error } = await supabase
        .from("practitioners")
        .update(updates)
        .eq("id", practitioner.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practitioner-profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get("name") as string,
      bio: formData.get("bio") as string,
      specialization: formData.get("specialization") as string,
      half_hour_rate: parseFloat(formData.get("half_hour_rate") as string) || null,
    };
    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <PractitionerLayout title="Settings">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </PractitionerLayout>
    );
  }

  return (
    <PractitionerLayout title="Settings">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your practitioner profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={practitioner?.name || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                name="specialization"
                defaultValue={practitioner?.specialization || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="half_hour_rate">Half Hour Rate (USD)</Label>
              <Input
                id="half_hour_rate"
                name="half_hour_rate"
                type="number"
                step="0.01"
                defaultValue={practitioner?.half_hour_rate || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                rows={6}
                defaultValue={practitioner?.bio || ""}
              />
            </div>

            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PractitionerLayout>
  );
}

