import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export function WaiverPolicyManager() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    policy_text: "",
    is_active: true,
  });

  // Fetch current waiver policy
  const { data: policy, isLoading } = useQuery({
    queryKey: ["waiver-policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waiver_policy")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Update form when policy loads
  useEffect(() => {
    if (policy) {
      setFormData({
        policy_text: policy.policy_text || "",
        is_active: policy.is_active ?? true,
      });
    }
  }, [policy]);

  const updatePolicyMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Deactivate old policy
      if (policy?.id) {
        await supabase
          .from("waiver_policy")
          .update({ is_active: false })
          .eq("id", policy.id);
      }

      // Get next version number
      const { data: latestPolicy } = await supabase
        .from("waiver_policy")
        .select("version")
        .order("version", { ascending: false })
        .limit(1)
        .single();

      const nextVersion = latestPolicy?.version ? latestPolicy.version + 1 : 1;

      // Create new policy version
      const { data, error } = await supabase
        .from("waiver_policy")
        .insert({
          version: nextVersion,
          policy_text: formData.policy_text,
          is_active: formData.is_active,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiver-policy"] });
      toast.success("Waiver policy updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-heading font-light mb-2">Liability Waiver Policy</h2>
        <p className="text-muted-foreground">
          Manage the liability waiver that clients must sign before booking sessions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Settings</CardTitle>
          <CardDescription>
            Configure the liability waiver text that clients must agree to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Policy Text */}
          <div className="space-y-2">
            <Label htmlFor="policy_text">Waiver Text *</Label>
            <Textarea
              id="policy_text"
              value={formData.policy_text}
              onChange={(e) => setFormData({ ...formData, policy_text: e.target.value })}
              placeholder="Enter the full liability waiver text..."
              rows={20}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              This text will be displayed to clients before they can book a session. Use [Date of signing] as a placeholder for the signing date.
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Active</Label>
              <p className="text-sm text-muted-foreground">
                Only active policy will be shown to clients
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <Button
            onClick={() => updatePolicyMutation.mutate()}
            disabled={updatePolicyMutation.isPending || !formData.policy_text}
            className="w-full"
          >
            {updatePolicyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Waiver Policy
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

