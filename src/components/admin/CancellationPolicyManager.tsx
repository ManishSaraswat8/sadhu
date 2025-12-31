import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export function CancellationPolicyManager() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    policy_text: "",
    standard_cancellation_hours: 12,
    late_cancellation_hours: 5,
    late_cancellation_fee_usd: 25.00,
    late_cancellation_fee_cad: 34.25,
    grace_cancellations_allowed: 1,
    is_active: true,
  });

  // Fetch current cancellation policy
  const { data: policy, isLoading } = useQuery({
    queryKey: ["cancellation-policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cancellation_policy")
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
        standard_cancellation_hours: policy.standard_cancellation_hours || 12,
        late_cancellation_hours: policy.late_cancellation_hours || 5,
        late_cancellation_fee_usd: Number(policy.late_cancellation_fee_usd) || 25.00,
        late_cancellation_fee_cad: Number(policy.late_cancellation_fee_cad) || 34.25,
        grace_cancellations_allowed: policy.grace_cancellations_allowed || 1,
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
          .from("cancellation_policy")
          .update({ is_active: false })
          .eq("id", policy.id);
      }

      // Create new policy version
      const { data, error } = await supabase
        .from("cancellation_policy")
        .insert({
          policy_text: formData.policy_text,
          standard_cancellation_hours: formData.standard_cancellation_hours,
          late_cancellation_hours: formData.late_cancellation_hours,
          late_cancellation_fee_usd: formData.late_cancellation_fee_usd,
          late_cancellation_fee_cad: formData.late_cancellation_fee_cad,
          grace_cancellations_allowed: formData.grace_cancellations_allowed,
          is_active: formData.is_active,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cancellation-policy"] });
      toast.success("Cancellation policy updated successfully");
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
        <h2 className="text-3xl font-heading font-light mb-2">Cancellation Policy</h2>
        <p className="text-muted-foreground">
          Manage the cancellation policy that clients must agree to before checkout
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Settings</CardTitle>
          <CardDescription>
            Configure cancellation windows, fees, and policy text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Policy Text */}
          <div className="space-y-2">
            <Label htmlFor="policy_text">Policy Text *</Label>
            <Textarea
              id="policy_text"
              value={formData.policy_text}
              onChange={(e) => setFormData({ ...formData, policy_text: e.target.value })}
              placeholder="Enter the full cancellation policy text..."
              rows={15}
              className="font-mono text-sm"
              required
            />
          </div>

          {/* Cancellation Windows */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="standard_cancellation_hours">Standard Cancellation Window (hours) *</Label>
              <Input
                id="standard_cancellation_hours"
                type="number"
                min="1"
                value={formData.standard_cancellation_hours}
                onChange={(e) => setFormData({ ...formData, standard_cancellation_hours: parseInt(e.target.value) || 12 })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Full credit returned if cancelled before this time
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="late_cancellation_hours">Late Cancellation Window (hours) *</Label>
              <Input
                id="late_cancellation_hours"
                type="number"
                min="1"
                value={formData.late_cancellation_hours}
                onChange={(e) => setFormData({ ...formData, late_cancellation_hours: parseInt(e.target.value) || 5 })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Fee applies if cancelled between standard and this time
              </p>
            </div>
          </div>

          {/* Late Cancellation Fees */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="late_cancellation_fee_usd">Late Cancellation Fee (USD) *</Label>
              <Input
                id="late_cancellation_fee_usd"
                type="number"
                step="0.01"
                min="0"
                value={formData.late_cancellation_fee_usd}
                onChange={(e) => {
                  const usd = parseFloat(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    late_cancellation_fee_usd: usd,
                    late_cancellation_fee_cad: (usd * 1.37).toFixed(2),
                  });
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late_cancellation_fee_cad">Late Cancellation Fee (CAD) *</Label>
              <Input
                id="late_cancellation_fee_cad"
                type="number"
                step="0.01"
                min="0"
                value={formData.late_cancellation_fee_cad}
                onChange={(e) => {
                  const cad = parseFloat(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    late_cancellation_fee_cad: cad,
                    late_cancellation_fee_usd: (cad / 1.37).toFixed(2),
                  });
                }}
                required
              />
            </div>
          </div>

          {/* Grace Cancellations */}
          <div className="space-y-2">
            <Label htmlFor="grace_cancellations_allowed">Grace Cancellations Allowed *</Label>
            <Input
              id="grace_cancellations_allowed"
              type="number"
              min="0"
              value={formData.grace_cancellations_allowed}
              onChange={(e) => setFormData({ ...formData, grace_cancellations_allowed: parseInt(e.target.value) || 0 })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Number of grace cancellations allowed per client (one-time emergency exceptions)
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
                Save Cancellation Policy
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

