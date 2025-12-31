import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, BookOpen, Heart, Sparkles } from "lucide-react";

interface SessionCompletionModalProps {
  open: boolean;
  sessionId: string;
  sessionDuration: number;
  onClose: () => void;
}

const emotions = [
  { emoji: "🪷", label: "Peaceful", value: "peaceful" },
  { emoji: "☁️", label: "Neutral", value: "neutral" },
  { emoji: "🔥", label: "Challenged", value: "challenged" },
  { emoji: "✨", label: "Energized", value: "energized" },
  { emoji: "🌊", label: "Calm", value: "calm" },
  { emoji: "💪", label: "Strong", value: "strong" },
];

export const SessionCompletionModal = ({
  open,
  sessionId,
  sessionDuration,
  onClose,
}: SessionCompletionModalProps) => {
  const navigate = useNavigate();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  const handleJournal = () => {
    // Navigate to journal with session ID and pre-selected emotion
    const params = new URLSearchParams({
      session_id: sessionId,
      ...(selectedEmotion && { mood: selectedEmotion }),
    });
    navigate(`/journal?${params.toString()}`);
    onClose();
  };

  const handleLater = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Session Complete!
          </DialogTitle>
          <DialogDescription className="text-center">
            Great work! You completed a {sessionDuration}-minute session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Emotion Selector */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium mb-3 text-center">
                How are you feeling right now?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {emotions.map((emotion) => (
                  <button
                    key={emotion.value}
                    onClick={() => setSelectedEmotion(emotion.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedEmotion === emotion.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-2xl mb-1">{emotion.emoji}</div>
                    <div className="text-xs font-medium">{emotion.label}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleJournal}
              className="w-full"
              size="lg"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Journal Your Experience
            </Button>
            <Button
              onClick={handleLater}
              variant="outline"
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          {/* Next Steps */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">What's Next?</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Review any action recommendations from your practitioner</li>
                    <li>• Check your progress in the dashboard</li>
                    <li>• Book your next session</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

