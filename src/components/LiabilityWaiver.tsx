import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LiabilityWaiverProps {
  sessionId?: string;
  onSigned: () => void;
  onCancel?: () => void;
}

export const LiabilityWaiver = ({ sessionId, onSigned, onCancel }: LiabilityWaiverProps) => {
  const [waiverCompleted, setWaiverCompleted] = useState(false);
  const [signing, setSigning] = useState(false);
  const { toast } = useToast();

  // Fetch active waiver policy from backend
  const { data: waiverPolicy, isLoading: loadingPolicy } = useQuery({
    queryKey: ["waiver-policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waiver_policy" as never)
        .select("*")
        .eq("is_active", true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as any;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Format waiver text with current date
  const getWaiverText = () => {
    if (!waiverPolicy?.policy_text) return "";
    return waiverPolicy.policy_text.replace(
      "[Date of signing]",
      new Date().toLocaleDateString()
    );
  };

  const handleSign = async () => {
    if (!waiverCompleted) {
      toast({
        title: "Waiver Required",
        description: "Please complete the waiver in the form above and confirm below.",
        variant: "destructive",
      });
      return;
    }

    setSigning(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("Not authenticated");
      }

      // Get user's IP and user agent
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown');
      
      const userAgent = navigator.userAgent;

      // Create liability waiver record
      const { error } = await supabase.functions.invoke('create-liability-waiver', {
        body: {
          session_id: sessionId,
          waiver_text: getWaiverText(),
          waiver_policy_id: waiverPolicy?.id,
          waiver_policy_version: waiverPolicy?.version,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Waiver Signed",
        description: "Thank you for signing the liability waiver.",
      });

      onSigned();
    } catch (error) {
      console.error("Error signing waiver:", error);
      toast({
        title: "Error",
        description: "Failed to sign waiver. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  if (loadingPolicy) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!waiverPolicy) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load waiver policy. Please contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Liability Waiver Required
        </CardTitle>
        <CardDescription>
          Please sign the digital waiver before proceeding with your session booking.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This waiver is required for all sessions. By signing, you acknowledge the risks associated with Sadhu meditation practice.
          </AlertDescription>
        </Alert>

        {/* SmartWaiver iframe */}
        <div className="space-y-4">
          <div className="border-2 border-primary/30 rounded-lg bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground mb-3 text-center">
              Sign the Digital Waiver Below
            </p>
            <div className="border border-border rounded-lg overflow-hidden bg-white">
              <iframe
                src="https://waiver.smartwaiver.com/w/ep4bgmdkenazyz8ugsphrn/web/"
                className="w-full h-[600px] border-0"
                title="Digital Waiver"
                allow="camera; microphone"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              After completing the waiver above, check the confirmation below and click "I Confirm & Continue".
            </p>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div className="flex items-center space-x-2 pt-4 border-t">
          <Checkbox
            id="waiver-completed"
            checked={waiverCompleted}
            onCheckedChange={(checked) => setWaiverCompleted(checked === true)}
          />
          <Label
            htmlFor="waiver-completed"
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            I confirm that I have completed and signed the digital waiver in the form above.
          </Label>
        </div>

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={signing}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSign}
            disabled={!waiverCompleted || signing}
            className="flex-1"
          >
            {signing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              "I Confirm & Continue"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

