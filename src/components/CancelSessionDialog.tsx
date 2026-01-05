import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInHours } from "date-fns";
import { Loader2, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Session {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  practitioner_id: string;
  client_id: string;
  status: string;
  session_type_id?: string | null;
}

interface CancelSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onCancelled: () => void;
  isAdmin?: boolean;
}

export const CancelSessionDialog = ({ open, onOpenChange, session, onCancelled, isAdmin = false }: CancelSessionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [cancellationType, setCancellationType] = useState<'standard' | 'grace' | null>(null);
  const [canCancel, setCanCancel] = useState<{ allowed: boolean; reason?: string; hoursUntil?: number; creditReturned?: boolean }>({ allowed: true });
  const [graceCancellationUsed, setGraceCancellationUsed] = useState(false);

  useEffect(() => {
    if (open && session && !isAdmin) {
      checkCancellationPolicy();
    } else if (open && session && isAdmin) {
      setCanCancel({ allowed: true });
    }
  }, [open, session, isAdmin]);

  const checkCancellationPolicy = async () => {
    if (!session || !user) return;

    const sessionTime = new Date(session.scheduled_at);
    const now = new Date();
    const hoursUntil = differenceInHours(sessionTime, now);

    // Standard cancellation window: 3 hours before
    if (hoursUntil < 3) {
      // Check if user has used grace cancellation
      const hasUsedGrace = await checkGraceCancellation();
      setGraceCancellationUsed(hasUsedGrace);

      if (hasUsedGrace) {
        setCanCancel({
          allowed: false,
          reason: "You have already used your one-time grace cancellation. Cancellations within 3 hours will result in credit forfeiture.",
          hoursUntil,
          creditReturned: false
        });
      } else {
        setCanCancel({
          allowed: true,
          reason: "This is a last-minute cancellation (< 3 hours). You can use your one-time grace cancellation to return the credit, or the credit will be forfeited.",
          hoursUntil,
          creditReturned: false
        });
        setCancellationType('grace');
      }
    } else {
      // Standard cancellation - credit will be returned
      setCanCancel({
        allowed: true,
        reason: "Cancellation is allowed. Your credit will be returned to your wallet.",
        hoursUntil,
        creditReturned: true
      });
      setCancellationType('standard');
    }
  };

  const checkGraceCancellation = async (): Promise<boolean> => {
    if (!user) return false;

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

  const handleCancel = async () => {
    if (!session || !user) return;

    setCancelling(true);

    try {
      const sessionTime = new Date(session.scheduled_at);
      const now = new Date();
      const hoursUntil = differenceInHours(sessionTime, now);
      const isLastMinute = hoursUntil < 3;
      const useGrace = cancellationType === 'grace' && !graceCancellationUsed;

      // Update session status
      const { error: sessionError } = await supabase
        .from("session_schedules")
        .update({
          status: "cancelled",
          notes: reason ? `Cancelled: ${reason}${useGrace ? ' (Grace cancellation used)' : ''}` : `Cancelled${useGrace ? ' (Grace cancellation used)' : ''}`,
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      if (sessionError) throw sessionError;

      // Handle credit return/forfeiture
      if (isLastMinute && !useGrace) {
        // Last-minute cancellation without grace - credit forfeited
        // Find and mark the credit as used
        const { data: credits } = await supabase
          .from("user_session_credits")
          .select("id, credits_remaining, session_type_id")
          .eq("user_id", user.id)
          .gt("credits_remaining", 0)
          .or("expires_at.is.null,expires_at.gt.now()")
          .order("purchased_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (credits) {
          // Deduct credit (forfeit)
          await supabase
            .from("user_session_credits")
            .update({ credits_remaining: credits.credits_remaining - 1 })
            .eq("id", credits.id);
        }

        toast({
          title: "Session Cancelled",
          description: "Your session has been cancelled. The credit has been forfeited per cancellation policy.",
          variant: "destructive",
        });
      } else {
        // Standard cancellation or grace cancellation - return credit
        // Find matching credit
        let creditToReturn = null;

        // Try to find exact match by session_type_id first
        if (session.session_type_id) {
          const { data: typeCredits } = await supabase
            .from("user_session_credits")
            .select("id, credits_remaining, session_type_id")
            .eq("user_id", user.id)
            .eq("session_type_id", session.session_type_id)
            .gt("credits_remaining", 0)
            .or("expires_at.is.null,expires_at.gt.now()")
            .order("purchased_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (typeCredits) {
            creditToReturn = typeCredits;
          }
        }

        // If no exact match, use package credit (generic)
        if (!creditToReturn) {
          const { data: packageCredits } = await supabase
            .from("user_session_credits")
            .select("id, credits_remaining")
            .eq("user_id", user.id)
            .is("session_type_id", null)
            .gt("credits_remaining", 0)
            .or("expires_at.is.null,expires_at.gt.now()")
            .order("purchased_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (packageCredits) {
            creditToReturn = packageCredits;
          }
        }

        if (creditToReturn) {
          // Return credit
          await supabase
            .from("user_session_credits")
            .update({ credits_remaining: creditToReturn.credits_remaining + 1 })
            .eq("id", creditToReturn.id);

          // Mark grace cancellation as used if applicable
          if (useGrace) {
            await supabase
              .from("user_session_credits")
              .update({ grace_cancellation_used: true })
              .eq("id", creditToReturn.id);
          }

          toast({
            title: "Session Cancelled",
            description: useGrace 
              ? "Your session has been cancelled. Credit returned using grace cancellation."
              : "Your session has been cancelled. Credit has been returned to your wallet.",
          });
        } else {
          toast({
            title: "Session Cancelled",
            description: "Your session has been cancelled. No matching credit found to return.",
          });
        }
      }

      onCancelled();
      onOpenChange(false);
      setReason("");
      setCancellationType(null);
    } catch (error: any) {
      console.error("Error cancelling session:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  if (!session) return null;

  const sessionDate = new Date(session.scheduled_at);
  const hoursUntil = differenceInHours(sessionDate, new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Session</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this session?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Session Details</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Date: {format(sessionDate, "EEEE, MMMM d, yyyy")}</p>
              <p>Time: {format(sessionDate, "h:mm a")}</p>
              <p>Duration: {session.duration_minutes} minutes</p>
            </div>
          </div>

          {/* Cancellation Policy Warning */}
          {!isAdmin && canCancel.reason && (
            <Alert variant={canCancel.creditReturned ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {canCancel.reason}
                {hoursUntil < 3 && hoursUntil > 0 && (
                  <span className="block mt-2">
                    Session is in {Math.round(hoursUntil * 10) / 10} hours.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Grace Cancellation Option */}
          {!isAdmin && hoursUntil < 3 && !graceCancellationUsed && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
              <Label className="text-sm font-medium mb-2 block">Cancellation Type</Label>
              <RadioGroup value={cancellationType || undefined} onValueChange={(value) => setCancellationType(value as 'standard' | 'grace')}>
                <div className="flex items-start space-x-2 space-y-0">
                  <RadioGroupItem value="grace" id="grace" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="grace" className="text-sm font-medium leading-none cursor-pointer">
                      Use Grace Cancellation (One-time)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Return credit to wallet. This is a one-time option per client.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 space-y-0">
                  <RadioGroupItem value="standard" id="standard" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="standard" className="text-sm font-medium leading-none cursor-pointer">
                      Standard Cancellation
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Credit will be forfeited per cancellation policy.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Admin Override Notice */}
          {isAdmin && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Admin override: Cancellation allowed at any time. Credit will be returned.
              </AlertDescription>
            </Alert>
          )}

          {/* Reason Input */}
          <div>
            <Label htmlFor="reason">Cancellation Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Session
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelling || (!isAdmin && hoursUntil < 3 && !cancellationType)}
          >
            {cancelling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

