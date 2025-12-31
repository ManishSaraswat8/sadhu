import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, VolumeX, Loader2, Clock, Heart, Brain, ChevronDown, ChevronUp, Check, Crown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { UserLayout } from "@/components/UserLayout";
import aiAvatar from "@/assets/ai-avatar.jpg";
import "@/types/speech.d.ts";
import AIChatBot from "@/components/AIChatBot";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type SpeechRecognitionType = typeof window.SpeechRecognition extends new () => infer R ? R : never;

const START_PHRASE = "the universe is within me";
const STOP_PHRASE = "thank you";

// Visual Analogue Scale labels for stress (1-10)
const getStressLabel = (value: number): { label: string; description: string; color: string } => {
  if (value <= 2) return { label: "Very Low", description: "Calm and relaxed", color: "bg-green-500" };
  if (value <= 4) return { label: "Low", description: "Comfortable, minimal pressure", color: "bg-green-400" };
  if (value <= 5) return { label: "Moderate", description: "Balanced, manageable stress", color: "bg-yellow-400" };
  if (value <= 6) return { label: "Elevated", description: "Noticeable stress, still coping", color: "bg-yellow-500" };
  if (value <= 7) return { label: "High", description: "Feeling pressured or overwhelmed", color: "bg-orange-400" };
  if (value <= 8) return { label: "Very High", description: "Significant stress, struggling", color: "bg-orange-500" };
  if (value <= 9) return { label: "Severe", description: "Intense stress, anxiety or panic", color: "bg-red-500" };
  return { label: "Extreme", description: "Crisis level, burnout", color: "bg-red-700" };
};

// Holmes-Rahe Stress Inventory Events
const STRESS_EVENTS = [
  { event: "Death of spouse", value: 100 },
  { event: "Divorce", value: 73 },
  { event: "Marital Separation", value: 65 },
  { event: "Detention in jail or institution", value: 63 },
  { event: "Death of a close family member", value: 63 },
  { event: "Major personal injury or illness", value: 53 },
  { event: "Marriage", value: 50 },
  { event: "Being fired at work", value: 47 },
  { event: "Marital reconciliation", value: 45 },
  { event: "Retirement from work", value: 45 },
  { event: "Health change in family member", value: 44 },
  { event: "Pregnancy", value: 40 },
  { event: "Sexual difficulties", value: 39 },
  { event: "New family member", value: 39 },
  { event: "Major business readjustment", value: 39 },
  { event: "Major change in financial state", value: 38 },
  { event: "Death of a close friend", value: 37 },
  { event: "Changing career field", value: 36 },
  { event: "More arguments with spouse", value: 35 },
  { event: "Taking on a mortgage", value: 31 },
  { event: "Foreclosure on mortgage or loan", value: 30 },
  { event: "Change in work responsibilities", value: 29 },
  { event: "Child leaving home", value: 29 },
  { event: "In-law troubles", value: 29 },
  { event: "Outstanding personal achievement", value: 28 },
  { event: "Spouse starting/stopping work", value: 26 },
  { event: "Starting or ending school", value: 26 },
  { event: "Major change in living conditions", value: 25 },
  { event: "Revision of personal habits", value: 24 },
  { event: "Troubles with boss", value: 23 },
  { event: "Change in work hours/conditions", value: 20 },
  { event: "Change in residence", value: 20 },
  { event: "Changing schools", value: 20 },
  { event: "Change in recreation", value: 19 },
  { event: "Change in church activities", value: 19 },
  { event: "Change in social activities", value: 18 },
  { event: "Taking on a loan", value: 17 },
  { event: "Change in sleeping habits", value: 16 },
  { event: "Change in family gatherings", value: 15 },
  { event: "Change in eating habits", value: 15 },
  { event: "Vacation", value: 13 },
  { event: "Major holidays", value: 12 },
  { event: "Minor law violations", value: 11 },
];

// Coping Wheel Emotions
const FEELINGS = {
  negative: [
    { name: "Insecure", category: "fear" },
    { name: "Nervous", category: "fear" },
    { name: "Panic", category: "fear" },
    { name: "Worry", category: "fear" },
    { name: "Shock", category: "fear" },
    { name: "Stress", category: "fear" },
    { name: "Sad", category: "sadness" },
    { name: "Lonely", category: "sadness" },
    { name: "Hurt", category: "sadness" },
    { name: "Neglected", category: "sadness" },
    { name: "Isolated", category: "sadness" },
    { name: "Weak", category: "sadness" },
    { name: "Rage", category: "anger" },
    { name: "Annoyed", category: "anger" },
    { name: "Jealous", category: "anger" },
    { name: "Ashamed", category: "shame" },
  ],
  positive: [
    { name: "Happy", category: "happiness" },
    { name: "Jolly", category: "happiness" },
    { name: "Glee", category: "happiness" },
    { name: "Joy", category: "happiness" },
    { name: "Fun", category: "happiness" },
    { name: "Cheerful", category: "happiness" },
    { name: "Relief", category: "peace" },
    { name: "Mellow", category: "peace" },
    { name: "Present", category: "peace" },
    { name: "Comfort", category: "peace" },
    { name: "Trusting", category: "peace" },
    { name: "Focused", category: "confidence" },
    { name: "Powerful", category: "confidence" },
    { name: "Fearless", category: "confidence" },
    { name: "Strong", category: "confidence" },
    { name: "Proud", category: "confidence" },
    { name: "Respected", category: "confidence" },
    { name: "Valued", category: "confidence" },
    { name: "Worthy", category: "confidence" },
  ],
};

const MeditationGuide = () => {
  const { user, loading } = useAuth();
  const { subscribed, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Assessment state
  const [showAssessment, setShowAssessment] = useState(true);
  const [showStressInventory, setShowStressInventory] = useState(false);
  const [showFeelings, setShowFeelings] = useState(true); // Always show feelings by default
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [stressScore, setStressScore] = useState<number | null>(null);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [needsHolmesRahe, setNeedsHolmesRahe] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);


  // Check if Holmes-Rahe assessment is needed (every 6 months)
  useEffect(() => {
    const lastAssessmentDate = localStorage.getItem('sadhu_holmes_rahe_date');
    const savedScore = localStorage.getItem('sadhu_holmes_rahe_score');
    
    if (lastAssessmentDate && savedScore) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const assessmentDate = new Date(lastAssessmentDate);
      
      if (assessmentDate > sixMonthsAgo) {
        // Less than 6 months, use saved score
        setStressScore(parseInt(savedScore, 10));
        setNeedsHolmesRahe(false);
      } else {
        // More than 6 months, need new assessment
        setNeedsHolmesRahe(true);
      }
    } else {
      // Never done assessment
      setNeedsHolmesRahe(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Stopwatch interval
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    } else if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
    }

    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    };
  }, [isStopwatchRunning]);

  // Calculate stress score when events change
  useEffect(() => {
    const score = STRESS_EVENTS
      .filter(e => selectedEvents.includes(e.event))
      .reduce((sum, e) => sum + e.value, 0);
    setStressScore(score);
  }, [selectedEvents]);

  // Check for trigger phrases in transcript
  const checkForTriggerPhrases = (text: string) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes(START_PHRASE) && !isStopwatchRunning) {
      setIsStopwatchRunning(true);
      setStopwatchTime(0);
      setSessionComplete(false);
      toast({
        title: "Practice Started",
        description: "Your session timer has begun. Say 'thank you' to complete.",
      });
    }
    
    if (lowerText.includes(STOP_PHRASE) && isStopwatchRunning) {
      setIsStopwatchRunning(false);
      setSessionComplete(true);
      toast({
        title: "Practice Complete",
        description: `Session duration: ${formatTime(stopwatchTime)}`,
      });
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }
        
        // Check interim results for trigger phrases too
        if (interimTranscript) {
          setTranscript(interimTranscript);
          checkForTriggerPhrases(interimTranscript);
        }
        
        if (finalTranscript) {
          setTranscript('');
          checkForTriggerPhrases(finalTranscript);
          handleSendMessage(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Error",
          description: "There was an issue with voice recognition. Please try again.",
          variant: "destructive",
        });
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isStopwatchRunning, stopwatchTime]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-meditation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: updatedMessages,
          stressScore: stressScore,
          stressLevel: stressLevel,
          currentFeelings: selectedFeelings,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        if (response.status === 402) {
          throw new Error("AI credits exhausted. Please add funds to continue.");
        }
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      const assistantMessage: Message = { role: "assistant", content: data.message };
      setMessages([...updatedMessages, assistantMessage]);
      speakText(data.message);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const resetStopwatch = () => {
    setStopwatchTime(0);
    setIsStopwatchRunning(false);
    setSessionComplete(false);
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const toggleFeeling = (feeling: string) => {
    setSelectedFeelings(prev => 
      prev.includes(feeling) 
        ? prev.filter(f => f !== feeling)
        : [...prev, feeling]
    );
  };

  const getStressLevel = () => {
    if (stressScore === null || stressScore === 0) return null;
    if (stressScore <= 150) return { level: "Low", color: "text-green-500", bg: "bg-green-500/10" };
    if (stressScore <= 300) return { level: "Moderate", color: "text-yellow-500", bg: "bg-yellow-500/10" };
    return { level: "High", color: "text-red-500", bg: "bg-red-500/10" };
  };

  const completeAssessment = () => {
    // Save Holmes-Rahe assessment if it was done
    if (needsHolmesRahe && selectedEvents.length > 0) {
      localStorage.setItem('sadhu_holmes_rahe_date', new Date().toISOString());
      localStorage.setItem('sadhu_holmes_rahe_score', String(stressScore || 0));
    }
    
    setAssessmentComplete(true);
    setShowAssessment(false);
    
    // Start initial conversation with context including stress level
    const stressInfo = getStressLabel(stressLevel);
    let initialMessage = `My current stress level is ${stressLevel}/10 (${stressInfo.label.toLowerCase()})`;
    if (selectedFeelings.length > 0) {
      initialMessage += `, and I'm experiencing ${selectedFeelings.join(', ')}`;
    }
    initialMessage += ". I'm ready to begin my practice.";
    
    handleSendMessage(initialMessage);
  };

  const holmesRaheStressInfo = getStressLevel();

  if (loading || !user) {
    return null;
  }

  return (
    <UserLayout
      title="AI Meditation Guide"
      headerActions={
        <div className="flex items-center gap-2">
            {holmesRaheStressInfo && (
              <span className={`text-sm px-2 py-1 rounded ${holmesRaheStressInfo.bg} ${holmesRaheStressInfo.color}`}>
                {holmesRaheStressInfo.level} Stress
              </span>
            )}
            <Clock className={`w-5 h-5 ${isStopwatchRunning ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            <span className={`font-mono text-xl ${isStopwatchRunning ? 'text-primary' : sessionComplete ? 'text-accent' : 'text-muted-foreground'}`}>
              {formatTime(stopwatchTime)}
            </span>
            {sessionComplete && (
              <Button variant="ghost" size="sm" onClick={resetStopwatch}>
                Reset
              </Button>
            )}
        </div>
      }
    >

      {/* Stopwatch Status Banner */}
      {(isStopwatchRunning || sessionComplete) && (
        <div className={`py-2 px-4 text-center text-sm ${isStopwatchRunning ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
          {isStopwatchRunning ? (
            <span>🧘 Practice in session... Say "<strong>Thank You</strong>" to complete</span>
          ) : (
            <span>✨ Session complete! Duration: {formatTime(stopwatchTime)}</span>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Assessment Panel */}
          {showAssessment && !assessmentComplete && (
            <Card className="bg-card border-primary/20 animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Pre-Session Assessment
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Help us personalize your meditation by sharing your current state
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Stress Visual Analogue Scale - Always shown */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="font-medium">How stressed are you right now?</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Slide to indicate your current stress level (1 = no stress, 10 = extreme stress)
                  </p>
                  
                  {/* Gradient bar */}
                  <div className="relative mb-2">
                    <div className="h-3 rounded-full bg-gradient-to-r from-green-500 via-yellow-400 via-orange-400 to-red-600" />
                  </div>
                  
                  {/* Slider */}
                  <Slider
                    value={[stressLevel]}
                    onValueChange={(value) => setStressLevel(value[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="mb-4"
                  />
                  
                  {/* Scale labels */}
                  <div className="flex justify-between text-xs text-muted-foreground mb-4">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                    <span>6</span>
                    <span>7</span>
                    <span>8</span>
                    <span>9</span>
                    <span>10</span>
                  </div>
                  
                  {/* Current level indicator */}
                  <div className={`p-3 rounded-lg ${getStressLabel(stressLevel).color}/20 border border-border`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${getStressLabel(stressLevel).color}`} />
                      <span className="font-medium">{stressLevel}/10 - {getStressLabel(stressLevel).label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{getStressLabel(stressLevel).description}</p>
                  </div>
                </div>

                {/* Stress Inventory Section - Only if 6+ months since last assessment */}
                {needsHolmesRahe && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setShowStressInventory(!showStressInventory)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Life Events Assessment</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">
                          Due every 6 months
                        </span>
                        {stressScore !== null && stressScore > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded ${holmesRaheStressInfo?.bg} ${holmesRaheStressInfo?.color}`}>
                            Score: {stressScore}
                          </span>
                        )}
                      </div>
                      {showStressInventory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {showStressInventory && (
                      <div className="p-4 pt-0 border-t border-border max-h-64 overflow-y-auto">
                        <p className="text-xs text-muted-foreground mb-3">
                          Select any life events you've experienced in the past year (Holmes-Rahe Inventory)
                        </p>
                        <div className="space-y-2">
                          {STRESS_EVENTS.map((item) => (
                            <label
                              key={item.event}
                              className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedEvents.includes(item.event)}
                                onCheckedChange={() => toggleEvent(item.event)}
                              />
                              <span className="text-sm flex-1">{item.event}</span>
                              <span className="text-xs text-muted-foreground">{item.value} pts</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Feelings Section */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowFeelings(!showFeelings)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Current Feelings</span>
                      {selectedFeelings.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {selectedFeelings.length} selected
                        </span>
                      )}
                    </div>
                    {showFeelings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {showFeelings && (
                    <div className="p-4 pt-0 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-3">
                        Select how you're feeling right now (Coping Wheel)
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Challenging Feelings</p>
                          <div className="flex flex-wrap gap-2">
                            {FEELINGS.negative.map((feeling) => (
                              <button
                                key={feeling.name}
                                onClick={() => toggleFeeling(feeling.name)}
                                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                  selectedFeelings.includes(feeling.name)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                }`}
                              >
                                {feeling.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Positive Feelings</p>
                          <div className="flex flex-wrap gap-2">
                            {FEELINGS.positive.map((feeling) => (
                              <button
                                key={feeling.name}
                                onClick={() => toggleFeeling(feeling.name)}
                                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                  selectedFeelings.includes(feeling.name)
                                    ? 'bg-accent text-accent-foreground'
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                }`}
                              >
                                {feeling.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Start Button */}
                <Button 
                  onClick={completeAssessment} 
                  className="w-full"
                  variant="teal"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Begin Meditation Session
                </Button>
                
                <button
                  onClick={() => {
                    setAssessmentComplete(true);
                    setShowAssessment(false);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip assessment
                </button>
              </CardContent>
            </Card>
          )}

          {/* Chat Messages */}
          {assessmentComplete && messages.length === 0 && !isLoading && (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden shadow-glow">
                <img src={aiAvatar} alt="AI Guide" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-2xl font-heading mb-2">Session Starting...</h2>
              <p className="text-muted-foreground mb-6">
                Your personalized meditation is being prepared
              </p>
            </div>
          )}

          {messages.length === 0 && !showAssessment && !assessmentComplete && (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden shadow-glow">
                <img src={aiAvatar} alt="AI Guide" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-2xl font-heading mb-2">Begin Your Practice</h2>
              <p className="text-muted-foreground mb-6">
                Speak or type to start your guided meditation session
              </p>
              
              {/* Voice Commands Info */}
              <Card className="bg-primary/5 border-primary/20 text-left max-w-md mx-auto">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">Voice Commands:</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>🕐 Say "<span className="text-primary font-medium">The Universe Is Within Me</span>" to start timer</p>
                    <p>✨ Say "<span className="text-primary font-medium">Thank You</span>" to complete session</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border-primary/20"
                }`}
              >
                <CardContent className="p-4">
                  <p>{message.content}</p>
                </CardContent>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-card border-primary/20">
                <CardContent className="p-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-muted-foreground">Thinking...</span>
                </CardContent>
              </Card>
            </div>
          )}

          {transcript && (
            <div className="flex justify-end">
              <Card className="bg-primary/50 text-primary-foreground">
                <CardContent className="p-4">
                  <p className="italic">{transcript}...</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls */}
      {(assessmentComplete || !showAssessment) && (
        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-6">
          <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
            <Button
              variant={isListening ? "destructive" : "teal"}
              size="lg"
              className="rounded-full w-16 h-16"
              onClick={toggleListening}
              disabled={isLoading}
            >
              {isListening ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>

            {isSpeaking && (
              <Button
                variant="outline"
                size="lg"
                className="rounded-full w-16 h-16"
                onClick={stopSpeaking}
              >
                <VolumeX className="w-6 h-6" />
              </Button>
            )}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isListening ? "Listening... speak now" : "Tap the microphone to speak"}
          </p>
        </div>
      )}

      <AIChatBot />
    </UserLayout>
  );
};

export default MeditationGuide;
