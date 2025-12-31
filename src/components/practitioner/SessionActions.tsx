import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Crown, Eye, X, Loader2, Clock } from "lucide-react";
import { useSessionJoinTimer } from "@/hooks/useSessionJoinTimer";

interface SessionActionsProps {
  session: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
  };
  onViewDetails: () => void;
  onJoin: () => void;
  onCancel: () => void;
  canceling: boolean;
}

export function SessionActions({
  session,
  onViewDetails,
  onJoin,
  onCancel,
  canceling,
}: SessionActionsProps) {
  const { canJoin, timeUntilJoin, minutesUntilJoin, isInSessionWindow } = useSessionJoinTimer(
    session.scheduled_at,
    session.duration_minutes
  );

  // Don't show join button for cancelled or completed sessions
  if (session.status === "cancelled" || session.status === "completed") {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewDetails}
          title="View Details"
        >
          <Eye className="w-4 h-4 mr-1" />
          Details
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={onViewDetails}
        title="View Details"
      >
        <Eye className="w-4 h-4 mr-1" />
        Details
      </Button>

      {/* Join Session Button - Always visible */}
      <div className="flex flex-col items-end gap-1">
        <Button
          size="sm"
          onClick={onJoin}
          disabled={!canJoin}
          title={
            canJoin
              ? "Join session"
              : timeUntilJoin
              ? `Join available ${timeUntilJoin}`
              : "Session has ended"
          }
        >
          <Crown className="w-4 h-4 mr-1" />
          <Video className="w-4 h-4 mr-1" />
          Join
        </Button>
        
        {/* Timer Badge */}
        {!canJoin && timeUntilJoin && (
          <Badge variant="outline" className="text-xs font-mono">
            <Clock className="w-3 h-3 mr-1" />
            {timeUntilJoin}
          </Badge>
        )}
        {isInSessionWindow && (
          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Available now
          </Badge>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        disabled={canceling}
        title="Cancel Session"
      >
        {canceling ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <X className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

