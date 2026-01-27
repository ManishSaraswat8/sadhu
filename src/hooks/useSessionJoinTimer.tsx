import { useState, useEffect } from "react";

interface UseSessionJoinTimerResult {
  canJoin: boolean;
  timeUntilJoin: string | null;
  minutesUntilJoin: number | null;
  isInSessionWindow: boolean;
}

function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} Hr`;
  } else if (minutes > 0) {
    return `00:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} Min`;
  } else {
    return `00:00:${seconds.toString().padStart(2, '0')} Sec`;
  }
}

export function useSessionJoinTimer(scheduledAt: string, durationMinutes: number = 60): UseSessionJoinTimerResult {
  const [canJoin, setCanJoin] = useState(false);
  const [timeUntilJoin, setTimeUntilJoin] = useState<string | null>(null);
  const [minutesUntilJoin, setMinutesUntilJoin] = useState<number | null>(null);
  const [isInSessionWindow, setIsInSessionWindow] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const sessionTime = new Date(scheduledAt);
      const now = new Date();
      const fifteenMinutesBefore = new Date(sessionTime.getTime() - 15 * 60 * 1000);
      const sessionEnd = new Date(sessionTime.getTime() + durationMinutes * 60 * 1000);

      // Check if we're in the join window (15 min before to session end)
      const inWindow = now >= fifteenMinutesBefore && now <= sessionEnd;
      setIsInSessionWindow(inWindow);
      setCanJoin(inWindow);

      if (!inWindow) {
        if (now < fifteenMinutesBefore) {
          // Before join window - show countdown in HH:MM:SS format
          const msUntil = fifteenMinutesBefore.getTime() - now.getTime();
          const minutesUntil = Math.ceil(msUntil / (1000 * 60));
          setMinutesUntilJoin(minutesUntil);
          setTimeUntilJoin(formatTimeRemaining(msUntil));
        } else {
          // After class
          setTimeUntilJoin(null);
          setMinutesUntilJoin(null);
        }
      } else {
        // In class
        setTimeUntilJoin(null);
        setMinutesUntilJoin(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [scheduledAt, durationMinutes]);

  return {
    canJoin,
    timeUntilJoin,
    minutesUntilJoin,
    isInSessionWindow,
  };
}
