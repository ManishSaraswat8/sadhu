import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface WelcomeVideoDialogProps {
  userId: string;
}

const WELCOME_SEEN_KEY = "sadhu_welcome_seen";

export const WelcomeVideoDialog = ({ userId }: WelcomeVideoDialogProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seenUsers = JSON.parse(localStorage.getItem(WELCOME_SEEN_KEY) || "[]");
    if (!seenUsers.includes(userId)) {
      setOpen(true);
    }
  }, [userId]);

  const handleClose = () => {
    const seenUsers = JSON.parse(localStorage.getItem(WELCOME_SEEN_KEY) || "[]");
    if (!seenUsers.includes(userId)) {
      seenUsers.push(userId);
      localStorage.setItem(WELCOME_SEEN_KEY, JSON.stringify(seenUsers));
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-[90vw] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-heading">
              Welcome to Sadhu
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-6 pt-4">
          <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
            {/* Replace this placeholder with your actual video */}
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground text-lg">
                  Welcome Video Placeholder
                </p>
                <p className="text-sm text-muted-foreground">
                  Replace with your video embed (YouTube, Vimeo, etc.)
                </p>
              </div>
            </div>
            {/* Example YouTube embed - uncomment and replace VIDEO_ID:
            <iframe
              src="https://www.youtube.com/embed/VIDEO_ID?autoplay=1"
              title="Welcome to Sadhu"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
            */}
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="teal" size="lg" onClick={handleClose}>
              Begin Your Practice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
