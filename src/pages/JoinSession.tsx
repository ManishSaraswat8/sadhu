import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserLayout } from "@/components/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const JoinSession = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roomName, setRoomName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleJoin = async () => {
    if (!roomName.trim()) {
      toast({
        title: "Room Name Required",
        description: "Please enter a channel name to join.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    // Navigate to VideoSession with room parameter
    navigate(`/sessions?room=${encodeURIComponent(roomName.trim())}`);
  };

  if (loading || !user) {
    return null;
  }

  return (
    <UserLayout title="Join a Session">
      <div className="max-w-2xl mx-auto">
        <Card className="animate-fade-in">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-heading text-2xl">Join a Session</CardTitle>
            <p className="text-muted-foreground mt-2">
              Enter your channel name to connect via Agora
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-foreground font-medium mb-2 block">
                Room Name
              </label>
              <Input
                type="text"
                placeholder="Enter room name from your booking"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleJoin();
                  }
                }}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleJoin}
              disabled={!roomName.trim() || isJoining}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Join Session
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default JoinSession;

