import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Loader2, Calendar, Users, UserPlus, FlaskConical, Mic, MicOff, Camera, CameraOff, Share2, Copy, Check, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SessionScheduler } from "@/components/SessionScheduler";
import { AllSessions } from "@/components/AllSessions";
import { PractitionerSessionCreator } from "@/components/PractitionerSessionCreator";
import { supabase } from "@/integrations/supabase/client";
import { UserLayout } from "@/components/UserLayout";
import AIChatBot from "@/components/AIChatBot";
import AgoraRTC, { IAgoraRTCClient, ILocalVideoTrack, ILocalAudioTrack } from "agora-rtc-sdk-ng";
import { SessionCompletionModal } from "@/components/SessionCompletionModal";

const VideoSession = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [roomName, setRoomName] = useState("");
  const [roomUrl, setRoomUrl] = useState("");
  const [isInSession, setIsInSession] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isPractitioner, setIsPractitioner] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Check if user is a practitioner
  useEffect(() => {
    const checkPractitioner = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("practitioners")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (error) {
          // Table might not exist yet - silently fail
          console.warn('Could not check practitioner status:', error.message);
          setIsPractitioner(false);
          return;
        }
        
        setIsPractitioner(!!data);
      } catch (err) {
        console.warn('Error checking practitioner status:', err);
        setIsPractitioner(false);
      }
    };
    checkPractitioner();
  }, [user]);

  const [channelName, setChannelName] = useState("");
  const [appId, setAppId] = useState("");
  const [token, setToken] = useState("");
  const [uid, setUid] = useState<number | null>(null);
  
  // Agora SDK state
  const agoraClient = useRef<IAgoraRTCClient | null>(null);
  const localVideoTrack = useRef<ILocalVideoTrack | null>(null);
  const localAudioTrack = useRef<ILocalAudioTrack | null>(null);
  const remoteUsers = useRef<Map<number, any>>(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [remoteUsersList, setRemoteUsersList] = useState<any[]>([]);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const [shareLink, setShareLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Check for room parameter in URL (channel name)
  useEffect(() => {
    const roomParam = searchParams.get('room');
    const hostParam = searchParams.get('host');
    const sessionIdParam = searchParams.get('sessionId');
    
    if (hostParam === 'true') {
      setIsHost(true);
    }
    
    if (roomParam) {
      setRoomName(roomParam);
      // If sessionId is provided, join the session immediately
      if (sessionIdParam) {
        setCurrentSessionId(sessionIdParam);
        joinSessionWithChannel(roomParam, sessionIdParam);
      }
    }
  }, [searchParams]);

  // Create an Agora room/channel via the edge function
  const createAgoraRoom = async (channel: string, sessionId?: string): Promise<{ channelName: string; appId: string } | null> => {
    try {
      setIsCreatingRoom(true);
      
      const { data, error } = await supabase.functions.invoke('create-agora-room', {
        body: { 
          channelName: channel,
          isGroup: false,
          ...(sessionId && { sessionId })
        },
      });

      if (error) {
        console.error('Error creating Agora room:', error);
        toast({
          title: "Room Creation Failed",
          description: "Could not create video room. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      console.log('Agora room created:', data);
      
      // Use App ID from response, or fallback to env variable (App ID is safe to expose)
      const appId = data.appId;
      
      // Validate response
      if (!appId || !data.channelName) {
        console.error('Invalid response from create-agora-room:', data);
        toast({
          title: "Invalid Response",
          description: "Server returned invalid room data. Please check Agora credentials.",
          variant: "destructive",
        });
        return null;
      }
      
      return { channelName: data.channelName, appId };
    } catch (err) {
      console.error('Error creating room:', err);
      return null;
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Get Agora token for joining the channel
  const getAgoraToken = async (channelName: string, role: 'publisher' | 'subscriber' = 'publisher'): Promise<{ token: string; uid: number } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('create-agora-token', {
        body: { 
          channelName,
          role,
        },
      });

      if (error) {
        console.error('Error getting Agora token:', error);
        toast({
          title: "Token Generation Failed",
          description: "Could not generate access token. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      console.log('Agora token generated:', data);
      return { token: data.token, uid: data.uid };
    } catch (err) {
      console.error('Error getting token:', err);
      return null;
    }
  };

  const joinSessionWithChannel = async (channel: string, sessionId?: string) => {
    // Create/get room info
    const roomInfo = await createAgoraRoom(channel, sessionId);
    if (!roomInfo) return;

    setChannelName(roomInfo.channelName);
    setAppId(roomInfo.appId);

    // Get token
    const tokenInfo = await getAgoraToken(roomInfo.channelName, 'publisher');
    if (!tokenInfo) return;

    setToken(tokenInfo.token);
    setUid(tokenInfo.uid);
    setRoomName(roomInfo.channelName);
    setIsInSession(true);
    
    // Track session info for completion modal
    if (sessionId) {
      setCurrentSessionId(sessionId);
      setSessionStartTime(new Date());
    }
    
    // Generate shareable link
    const shareUrl = `${window.location.origin}/sessions?room=${encodeURIComponent(roomInfo.channelName)}`;
    setShareLink(shareUrl);
    
    toast({
      title: "Joining Session",
      description: "Connecting to your video session...",
    });

    // Initialize and join Agora channel
    await initializeAgoraClient(roomInfo.appId, roomInfo.channelName, tokenInfo.token, tokenInfo.uid);
  };

  // Initialize Agora client and join channel
  const initializeAgoraClient = async (appId: string, channel: string, token: string, userId: number) => {
    try {
      // Validate inputs
      if (!appId || appId.trim() === '') {
        throw new Error('App ID is missing or invalid');
      }
      if (!channel || channel.trim() === '') {
        throw new Error('Channel name is missing or invalid');
      }
      if (!token || token.trim() === '') {
        throw new Error('Token is missing or invalid');
      }

      console.log('Initializing Agora with:', { appId, channel, userId, tokenLength: token.length });
      
      // Create Agora client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      agoraClient.current = client;

      // Set up event handlers
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        console.log("User published:", user.uid, mediaType);

        if (mediaType === "video") {
          remoteUsers.current.set(Number(user.uid), user);
          setRemoteUsersList(Array.from(remoteUsers.current.values()));
          // Play remote video
          setTimeout(() => {
            const videoElement = document.getElementById(`remote-video-${user.uid}`);
            if (videoElement && user.videoTrack) {
              user.videoTrack.play(videoElement as HTMLElement);
              // Ensure proper styling
              (videoElement as HTMLElement).style.width = "100%";
              (videoElement as HTMLElement).style.height = "100%";
            }
          }, 100);
        }

        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        console.log("User unpublished:", user.uid, mediaType);
        if (mediaType === "video") {
          remoteUsers.current.delete(Number(user.uid));
          setRemoteUsersList(Array.from(remoteUsers.current.values()));
        }
      });

      client.on("user-left", (user) => {
        console.log("User left:", user.uid);
        remoteUsers.current.delete(Number(user.uid));
        setRemoteUsersList(Array.from(remoteUsers.current.values()));
      });

      // Join the channel - App ID must be a string
      console.log('Attempting to join channel with:', { 
        appId: appId, 
        appIdType: typeof appId, 
        appIdLength: appId?.length,
        channel,
        userId,
        tokenLength: token?.length,
        hasToken: !!token
      });
      
      // Try joining with token, fallback to null if token is invalid
      try {
        console.log('Joining channel with:', { appId, channel, token, userId });
        await client.join(appId, channel, token || null, userId);
      } catch (joinError: any) {
        // If join fails with token, try without token (for testing)
        if (token && (joinError?.message?.includes('token') || joinError?.code === 'INVALID_TOKEN')) {
          console.warn('Join with token failed, trying without token:', joinError);
          await client.join(appId, channel, null, userId);
        } else {
          throw joinError;
        }
      }
      console.log("Successfully joined Agora channel:", channel, "as UID:", userId);

      // Create and publish local tracks
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      
      localAudioTrack.current = audioTrack;
      localVideoTrack.current = videoTrack;

      // Play local video - Agora needs a container element
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
        // Ensure the container has proper styling
        localVideoRef.current.style.width = "100%";
        localVideoRef.current.style.height = "100%";
        localVideoRef.current.style.display = "block";
      }

      // Publish tracks
      await client.publish([audioTrack, videoTrack]);
      console.log("Published local tracks");

      toast({
        title: "Connected",
        description: "You are now in the video session.",
      });
      } catch (error: any) {
        console.error("Error initializing Agora:", error);
        const errorMessage = error?.message || error?.toString() || "Unknown error";
        
        // Check for specific Agora errors
        if (errorMessage.includes("invalid vendor key") || errorMessage.includes("can not find appid")) {
          toast({
            title: "Agora Configuration Error",
            description: "Invalid Agora App ID or Certificate. Please check your Agora credentials in Supabase settings.",
            variant: "destructive",
          });
        } else if (errorMessage.includes("token")) {
          toast({
            title: "Token Error",
            description: "Invalid or expired token. Please try creating a new session.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Connection Error",
            description: `Failed to connect: ${errorMessage}`,
            variant: "destructive",
          });
        }
      }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (localVideoTrack.current) {
      if (isVideoEnabled) {
        await localVideoTrack.current.setEnabled(false);
        setIsVideoEnabled(false);
      } else {
        await localVideoTrack.current.setEnabled(true);
        setIsVideoEnabled(true);
      }
    }
  };

  // Toggle audio
  const toggleAudio = async () => {
    if (localAudioTrack.current) {
      if (isAudioEnabled) {
        await localAudioTrack.current.setEnabled(false);
        setIsAudioEnabled(false);
      } else {
        await localAudioTrack.current.setEnabled(true);
        setIsAudioEnabled(true);
      }
    }
  };

  // Test mode: Create and join a test session without payment
  const createTestSession = async () => {
    if (!user) return;

    try {
      setIsCreatingRoom(true);
      
      // Generate a unique test channel name
      const testChannelName = `test-${user.id.substring(0, 8)}-${Date.now()}`;
      
      // Create Agora room
      const roomInfo = await createAgoraRoom(testChannelName);
      if (!roomInfo) return;

      setChannelName(roomInfo.channelName);
      setAppId(roomInfo.appId);

      // Get token
      const tokenInfo = await getAgoraToken(roomInfo.channelName, 'publisher');
      if (!tokenInfo) return;

      setToken(tokenInfo.token);
      setUid(tokenInfo.uid);
      setRoomName(roomInfo.channelName);
      setIsInSession(true);
      
      // Generate shareable link
      const shareUrl = `${window.location.origin}/sessions?room=${encodeURIComponent(roomInfo.channelName)}`;
      setShareLink(shareUrl);
      
      toast({
        title: "Test Session Created",
        description: "You can now test the Agora video session.",
      });

      // Initialize and join Agora channel
      await initializeAgoraClient(roomInfo.appId, roomInfo.channelName, tokenInfo.token, tokenInfo.uid);
    } catch (err) {
      console.error('Error creating test session:', err);
      toast({
        title: "Test Session Failed",
        description: "Could not create test session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const joinSession = async () => {
    if (!roomName.trim()) {
      toast({
        title: "Room Name Required",
        description: "Please enter a channel name to join.",
        variant: "destructive",
      });
      return;
    }

    await joinSessionWithChannel(roomName);
  };

  const leaveSession = async () => {
    // Clean up Agora resources
    try {
      if (localVideoTrack.current) {
        localVideoTrack.current.stop();
        localVideoTrack.current.close();
        localVideoTrack.current = null;
      }

      if (localAudioTrack.current) {
        localAudioTrack.current.stop();
        localAudioTrack.current.close();
        localAudioTrack.current = null;
      }

      if (agoraClient.current) {
        await agoraClient.current.leave();
        agoraClient.current = null;
      }

      remoteUsers.current.clear();
      setRemoteUsersList([]);
    } catch (error) {
      console.error("Error cleaning up Agora:", error);
    }

    // If this was a real session (has sessionId), show completion modal
    if (currentSessionId && sessionStartTime) {
      setIsInSession(false);
      setShowCompletionModal(true);
    } else {
      // For test sessions or sessions without ID, just navigate away
      handleSessionEnd();
    }
  };

  const handleSessionEnd = () => {
    setIsInSession(false);
    setRoomName("");
    setChannelName("");
    setRoomUrl("");
    setToken("");
    setUid(null);
    setAppId("");
    setIsHost(false);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setCurrentSessionId(null);
    setSessionStartTime(null);
    navigate('/sessions');
    toast({
      title: "Session Ended",
      description: "You have left the video session.",
    });
  };

  const handleCompletionModalClose = () => {
    setShowCompletionModal(false);
    handleSessionEnd();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Header actions for when in session
  const headerActions = isInSession ? (
    <div className="flex items-center gap-2">
      {shareLink && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            navigator.clipboard.writeText(shareLink);
            setLinkCopied(true);
            toast({
              title: "Link Copied",
              description: "Share this link to invite others to join the session.",
            });
            setTimeout(() => setLinkCopied(false), 2000);
          }}
        >
          {linkCopied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </>
          )}
        </Button>
      )}
      <Button variant="destructive" size="sm" onClick={leaveSession}>
        Leave Session
      </Button>
    </div>
  ) : undefined;

  return (
    <>
      <UserLayout 
        title={isInSession ? "Video Session" : "Sessions"}
        headerActions={headerActions}
      >
      {!isInSession ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-end">
            <Button 
              onClick={() => navigate("/sessions/book")}
              size="sm"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Book Session
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate("/sessions/join")}
            >
              <Video className="w-4 h-4 mr-1" />
              Join Session
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate("/sessions/test")}
            >
              <FlaskConical className="w-4 h-4 mr-1" />
              Test Session
            </Button>
          </div>

          {/* Default View: Single Grid */}
          {!searchParams.get('tab') && !searchParams.get('room') && (
            <AllSessions />
          )}

          {/* Tabbed View */}
          {searchParams.get('tab') && (
            <Tabs 
              value={searchParams.get('tab') || 'book'} 
              onValueChange={(value) => {
                const newParams = new URLSearchParams(searchParams);
                if (value === 'book' && !searchParams.get('room')) {
                  newParams.delete('tab');
                } else {
                  newParams.set('tab', value);
                }
                setSearchParams(newParams, { replace: true });
              }}
              className="space-y-6"
            >
              <TabsList className={`grid w-full ${isPractitioner ? 'grid-cols-5' : 'grid-cols-4'}`}>
                <TabsTrigger value="book" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Book Session
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  My Sessions
                </TabsTrigger>
                <TabsTrigger value="join" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Join Now
                </TabsTrigger>
                <TabsTrigger value="test" className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  Test Session
                </TabsTrigger>
                {isPractitioner && (
                  <TabsTrigger value="create" className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Session
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="book">
                <SessionScheduler onSessionBooked={() => setRefreshKey(k => k + 1)} />
              </TabsContent>

              <TabsContent value="upcoming">
                <UpcomingSessions key={refreshKey} onRefresh={() => setRefreshKey(k => k + 1)} />
              </TabsContent>

              {isPractitioner && (
                <TabsContent value="create">
                  <PractitionerSessionCreator onSessionCreated={() => setRefreshKey(k => k + 1)} />
                </TabsContent>
              )}

              <TabsContent value="join">
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
                      <input
                        type="text"
                        placeholder="Enter room name from your booking"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={joinSession}
                      disabled={!roomName.trim() || isCreatingRoom}
                    >
                      {isCreatingRoom ? (
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
              </TabsContent>

              <TabsContent value="test">
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
                      disabled={isCreatingRoom}
                      size="lg"
                    >
                      {isCreatingRoom ? (
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
              </TabsContent>
            </Tabs>
          )}
        </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Agora Video Session */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  {/* Video Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 min-h-[500px]">
                    {/* Local Video */}
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                      <div 
                        ref={localVideoRef}
                        className="w-full h-full"
                        style={{ minHeight: '200px', position: 'relative' }}
                      />
                      {!isVideoEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                          <Video className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-10">
                        You {uid !== null && `(UID: ${uid})`}
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2 z-10">
                        {!isVideoEnabled && (
                          <div className="bg-red-500 text-white p-1 rounded">
                            <CameraOff className="w-4 h-4" />
                          </div>
                        )}
                        {!isAudioEnabled && (
                          <div className="bg-red-500 text-white p-1 rounded">
                            <MicOff className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Remote Videos */}
                    {remoteUsersList.map((user) => (
                      <div key={user.uid} className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                        <div 
                          id={`remote-video-${user.uid}`}
                          className="w-full h-full"
                          style={{ minHeight: '200px' }}
                        />
                        {!user.hasVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                            <Video className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-10">
                          User {user.uid}
                        </div>
                      </div>
                    ))}

                    {/* Placeholder for additional remote users */}
                    {remoteUsersList.length === 0 && (
                      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <Users className="w-16 h-16 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Waiting for others to join...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="bg-gray-900 border-t border-gray-700 p-4 flex items-center justify-center gap-4">
                    <Button
                      variant={isAudioEnabled ? "default" : "destructive"}
                      size="icon"
                      onClick={toggleAudio}
                      className="rounded-full"
                    >
                      {isAudioEnabled ? (
                        <Mic className="w-5 h-5" />
                      ) : (
                        <MicOff className="w-5 h-5" />
                      )}
                    </Button>
                    <Button
                      variant={isVideoEnabled ? "default" : "destructive"}
                      size="icon"
                      onClick={toggleVideo}
                      className="rounded-full"
                    >
                      {isVideoEnabled ? (
                        <Camera className="w-5 h-5" />
                      ) : (
                        <CameraOff className="w-5 h-5" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={leaveSession}
                      className="rounded-full"
                    >
                      Leave Session
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-4 space-y-3">
              {/* Share Link Section */}
              {shareLink && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Share this link to invite others:</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-muted-foreground"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(shareLink);
                          setLinkCopied(true);
                          toast({
                            title: "Link Copied!",
                            description: "Share this link with others to join the session.",
                          });
                          setTimeout(() => setLinkCopied(false), 2000);
                        }}
                      >
                        {linkCopied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  {isHost && (
                    <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                      <Crown className="w-4 h-4" />
                      Host Mode
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Powered by Agora
                </p>
              </div>
            </div>
          </div>
        )}
      </UserLayout>
      
      {/* Session Completion Modal */}
      {currentSessionId && sessionStartTime && (
        <SessionCompletionModal
          open={showCompletionModal}
          sessionId={currentSessionId}
          sessionDuration={Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000)}
          onClose={handleCompletionModalClose}
        />
      )}
    </>
    );
  };

export default VideoSession;
