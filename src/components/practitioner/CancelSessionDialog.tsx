import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

interface CancelSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  session: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    client_id?: string;
    client?: {
      name?: string;
      email?: string;
    };
  } | null;
  isCanceling: boolean;
}

export function CancelSessionDialog({
  open,
  onOpenChange,
  onConfirm,
  session,
  isCanceling,
}: CancelSessionDialogProps) {
  const [reason, setReason] = useState("");

  if (!session) return null;

  const sessionDate = new Date(session.scheduled_at);
  const now = new Date();
  const hoursUntilSession = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  const getCancellationImpact = () => {
    if (hoursUntilSession > 24) {
      return {
        severity: "low",
        message: "This cancellation is well in advance. The client will receive a full credit refund.",
      };
    } else if (hoursUntilSession > 12) {
      return {
        severity: "medium",
        message: "This is a standard cancellation. The client will receive a full credit refund.",
      };
    } else if (hoursUntilSession > 5) {
      return {
        severity: "high",
        message: "This is a late cancellation. A late cancellation fee may apply to the client, but they will receive a credit refund.",
      };
    } else {
      return {
        severity: "critical",
        message: "This is a last-minute cancellation. The client's credit may be forfeited according to the cancellation policy.",
      };
    }
  };

  const impact = getCancellationImpact();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Cancel Session
          </AlertDialogTitle>
          <AlertDialogDescription>
            Please provide a reason for cancelling this session. This information will be shared with the client.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Session Details */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Session Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Date:</span> {format(sessionDate, "MMM d, yyyy")}
              </div>
              <div>
                <span className="font-medium">Time:</span> {format(sessionDate, "h:mm a")}
              </div>
              <div>
                <span className="font-medium">Duration:</span> {session.duration_minutes} minutes
              </div>
              <div>
                <span className="font-medium">Time Until:</span>{" "}
                {hoursUntilSession > 24
                  ? `${Math.floor(hoursUntilSession / 24)} days`
                  : `${Math.floor(hoursUntilSession)} hours`}
              </div>
            </div>
            {session.client && (
              <div className="text-sm text-muted-foreground mt-2">
                <span className="font-medium">Client:</span> {session.client.name || session.client.email || "Unknown"}
              </div>
            )}
          </div>

          {/* Cancellation Impact */}
          <Alert
            variant={
              impact.severity === "critical"
                ? "destructive"
                : impact.severity === "high"
                ? "default"
                : "default"
            }
          >
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Impact:</strong> {impact.message}
            </AlertDescription>
          </Alert>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">
              Cancellation Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="Please explain why you need to cancel this session (e.g., emergency, scheduling conflict, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This reason will be visible to the client and may be used for cancellation policy enforcement.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCanceling}>Keep Session</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || isCanceling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCanceling ? "Cancelling..." : "Cancel Session"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

