import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const { toast } = useToast();

  // Fetch active waiver policy from backend
  const { data: waiverPolicy, isLoading: loadingPolicy } = useQuery({
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
    if (!agreed) {
      toast({
        title: "Agreement Required",
        description: "Please read and agree to the liability waiver to continue.",
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
          Please read and agree to the liability waiver before proceeding with your session booking.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This waiver is required for all sessions. By signing, you acknowledge the risks associated with Sadhu meditation practice.
          </AlertDescription>
        </Alert>

        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
            {getWaiverText()}
          </div>
        </ScrollArea>

        <div className="flex items-start space-x-2 pt-4 border-t">
          <Checkbox
            id="waiver-agreement"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            className="mt-1"
          />
          <Label
            htmlFor="waiver-agreement"
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            I have read, understood, and agree to the terms of this liability waiver. I acknowledge that I am signing this waiver voluntarily and that I understand the risks involved.
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
            disabled={!agreed || signing}
            className="flex-1"
          >
            {signing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              "I Agree & Sign Waiver"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

