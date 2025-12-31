import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserLayout } from "@/components/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const TestSession = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const createTestSession = async () => {
    if (!user) return;

    try {
      setIsCreating(true);
      
      // Generate a unique test channel name
      const testChannelName = `test-${user.id.substring(0, 8)}-${Date.now()}`;
      
      // Create Agora room
      const { data, error } = await supabase.functions.invoke('create-agora-room', {
        body: { 
          channelName: testChannelName,
          isGroup: false,
        },
      });

      if (error) {
        console.error('Error creating Agora room:', error);
        toast({
          title: "Room Creation Failed",
          description: "Could not create test session. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!data?.channelName) {
        toast({
          title: "Invalid Response",
          description: "Server returned invalid room data. Please check Agora credentials.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Test Session Created",
        description: "Redirecting to video session...",
      });

      // Navigate to VideoSession with room parameter
      navigate(`/sessions?room=${encodeURIComponent(data.channelName)}`);
    } catch (err) {
      console.error('Error creating test session:', err);
      toast({
        title: "Test Session Failed",
        description: "Could not create test session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <UserLayout title="Test Agora Session">
      <div className="max-w-2xl mx-auto">
        <Card className="animate-fade-in border-2 border-dashed border-primary/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-heading text-2xl">Test Agora Session</CardTitle>
            <p className="text-muted-foreground mt-2">
              Create a test session to verify Agora integration without payment
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Test Mode Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Instant session creation (no payment required)</li>
                <li>Full Agora channel and token generation</li>
                <li>Test video streaming capabilities</li>
                <li>Perfect for development and testing</li>
              </ul>
            </div>
            <Button 
              className="w-full" 
              onClick={createTestSession}
              disabled={isCreating}
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Test Session...
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Create Test Session
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              This will create a temporary test channel for Agora video testing
            </p>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default TestSession;

