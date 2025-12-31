import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, Crown } from "lucide-react";
import { useSessionJoinTimer } from "@/hooks/useSessionJoinTimer";

interface AllSessionsJoinButtonProps {
  session: {
    scheduled_at: string;
    duration_minutes: number;
    room_name: string;
    practitioner?: {
      user_id: string;
    };
  };
  currentUserId?: string;
  onJoin: () => void;
  isUpcoming: boolean;
}

export function AllSessionsJoinButton({
  session,
  currentUserId,
  onJoin,
  isUpcoming,
}: AllSessionsJoinButtonProps) {
  const { canJoin, timeUntilJoin, isInSessionWindow } = useSessionJoinTimer(
    session.scheduled_at,
    session.duration_minutes
  );

  if (!isUpcoming) return null;

  const isHost = session.practitioner?.user_id === currentUserId;

  return (
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
        {isHost && <Crown className="w-4 h-4 mr-1" />}
        <Video className="w-4 h-4 mr-1" />
        Join{isHost ? " as Host" : ""}
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
  );
}

