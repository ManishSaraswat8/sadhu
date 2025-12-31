import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export const TestAgoraFunctions = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    room?: any;
    token?: any;
    error?: string;
  }>({});

  const testFunctions = async () => {
    if (!user) {
      setResults({ error: "Please log in first" });
      return;
    }

    setTesting(true);
    setResults({});

    try {
      const channelName = `test-${Date.now()}`;

      // Test 1: Create room
      console.log("Testing create-agora-room...");
      const { data: roomData, error: roomError } = await supabase.functions.invoke(
        "create-agora-room",
        {
          body: {
            channelName,
            isGroup: false,
          },
        }
      );

      if (roomError) {
        throw new Error(`Room creation failed: ${roomError.message}`);
      }

      console.log("✅ Room created:", roomData);
      setResults((prev) => ({ ...prev, room: roomData }));

      // Test 2: Get token
      console.log("Testing create-agora-token...");
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
        "create-agora-token",
        {
          body: {
            channelName: roomData.channelName,
            role: "publisher",
          },
        }
      );

      if (tokenError) {
        throw new Error(`Token generation failed: ${tokenError.message}`);
      }

      console.log("✅ Token generated:", tokenData);
      setResults((prev) => ({ ...prev, token: tokenData }));

      console.log("✅ Both functions working!");
    } catch (error: any) {
      console.error("Test failed:", error);
      setResults({ error: error.message || "Unknown error occurred" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Test Agora Functions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Please log in first to test the functions
            </p>
          </div>
        )}

        <Button
          onClick={testFunctions}
          disabled={testing || !user}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Agora Functions"
          )}
        </Button>

        {results.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-red-700 mt-2">{results.error}</p>
          </div>
        )}

        {results.room && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Room Created</span>
            </div>
            <pre className="text-xs bg-white p-2 rounded overflow-auto">
              {JSON.stringify(results.room, null, 2)}
            </pre>
          </div>
        )}

        {results.token && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Token Generated</span>
            </div>
            <div className="text-sm space-y-1">
              <p>
                <strong>App ID:</strong> {results.token.appId}
              </p>
              <p>
                <strong>Channel:</strong> {results.token.channelName}
              </p>
              <p>
                <strong>UID:</strong> {results.token.uid}
              </p>
              <p>
                <strong>Role:</strong> {results.token.role}
              </p>
              <p>
                <strong>Token:</strong>{" "}
                <span className="font-mono text-xs">
                  {results.token.token.substring(0, 50)}...
                </span>
              </p>
            </div>
          </div>
        )}

        {results.room && results.token && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ✅ <strong>Success!</strong> Both functions are working correctly.
              You can now integrate Agora into your video sessions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

