import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, setHours, setMinutes, isBefore, isAfter, startOfDay } from "date-fns";
import { Loader2, Clock, User, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Package, Video, MapPin, Users, User as UserIcon, Link2, FileText, ShoppingCart } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/hooks/useCurrency";
import { LiabilityWaiver } from "@/components/LiabilityWaiver";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";

// Component for displaying waiver already signed message
const WaiverAlreadySigned = ({ onContinue }: { onContinue: () => void }) => {
  const [showPolicy, setShowPolicy] = useState(false);

  // Fetch active waiver policy from backend
  const { data: waiverPolicy, isLoading: loadingPolicy } = useQuery({
    queryKey: ["waiver-policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waiver_policy" as never)
        .select("*")
        .eq("is_active", true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as any;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Format waiver text with current date
  const getWaiverText = () => {
    if (!waiverPolicy?.policy_text) return "";
    return waiverPolicy.policy_text.replace(
      "[Date of signing]",
      new Date().toLocaleDateString()
    );
  };

  return (
    <>
      <div className="p-6 bg-primary/10 border border-primary/30 rounded-lg text-center">
        <p className="text-sm font-medium text-primary mb-2">✓ Waiver Already Signed</p>
        <p className="text-xs text-muted-foreground">
          You have already signed the liability waiver. You can proceed with booking.
        </p>
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline"
            className="flex-1" 
            onClick={() => setShowPolicy(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            View Policy
          </Button>
          <Button 
            className="flex-1" 
            onClick={onContinue}
          >
            Continue to Confirmation
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <Dialog open={showPolicy} onOpenChange={setShowPolicy}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Liability Waiver Policy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
            {loadingPolicy ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {getWaiverText() || "Unable to load waiver policy."}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface Practitioner {
  id: string;
  user_id: string;
  name: string;
  bio: string | null;
  specialization: string | null;
  avatar_url: string | null;
  half_hour_rate: number | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface SessionSchedulerProps {
  onSessionBooked?: () => void;
}

export const SessionScheduler = ({ onSessionBooked }: SessionSchedulerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  
  // Load initial state from URL
  const loadStateFromURL = () => {
    const urlStep = searchParams.get('step') as 'sessionType' | 'practitioner' | 'datetime' | 'waiver' | 'confirm' | null;
    const urlPractitionerId = searchParams.get('practitioner_id');
    const urlDate = searchParams.get('date');
    const urlTime = searchParams.get('time');
    const urlDuration = searchParams.get('duration');
    const urlSessionType = searchParams.get('session_type');
    const urlIsGroup = searchParams.get('is_group');
    const urlLocation = searchParams.get('session_location');
    const urlPhysicalLocation = searchParams.get('physical_location');

    return {
      step: urlStep || 'sessionType',
      practitionerId: urlPractitionerId,
      date: urlDate ? new Date(urlDate) : undefined,
      time: urlTime,
      duration: urlDuration ? parseInt(urlDuration) as 20 | 45 | 60 : 60,
      sessionType: (urlSessionType as 'standing' | 'laying') || 'standing',
      isGroup: urlIsGroup === 'true',
      location: (urlLocation as 'online' | 'in_person') || 'online',
      physicalLocation: urlPhysicalLocation || '',
    };
  };

  const initialState = loadStateFromURL();
  
  // Default to today's date if no date is provided
  const getInitialDate = () => {
    if (initialState.date) return initialState.date;
    return new Date();
  };
  
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(getInitialDate());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialState.time);
  const [selectedDuration, setSelectedDuration] = useState<20 | 45 | 60>(initialState.duration);
  const [selectedSessionType, setSelectedSessionType] = useState<'standing' | 'laying'>(initialState.sessionType);
  const [isGroup, setIsGroup] = useState(initialState.isGroup);
  const [sessionLocation, setSessionLocation] = useState<'online' | 'in_person'>(initialState.location);
  const [availableSessionTypes, setAvailableSessionTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [checkingCredits, setCheckingCredits] = useState(false);
  const [hasCredits, setHasCredits] = useState(false);
  const [sessionTypeId, setSessionTypeId] = useState<string | null>(null);
  const [step, setStep] = useState<'sessionType' | 'practitioner' | 'datetime' | 'waiver' | 'confirm'>(initialState.step);
  const [physicalLocation, setPhysicalLocation] = useState<string>(initialState.physicalLocation);
  const [selectedStudioLocation, setSelectedStudioLocation] = useState<string | null>(null);
  const [studioLocations, setStudioLocations] = useState<Array<{ id: string; name: string; address: string; city?: string; province_state?: string; country?: string; postal_code?: string }>>([]);
  const [userHasAnyCredits, setUserHasAnyCredits] = useState<boolean | null>(null);

  // Update URL with current state
  const updateURL = (updates: {
    step?: 'sessionType' | 'practitioner' | 'datetime' | 'waiver' | 'confirm';
    practitionerId?: string | null;
    date?: Date | undefined;
    time?: string | null;
    duration?: number;
    sessionType?: 'standing' | 'laying';
    isGroup?: boolean;
    location?: 'online' | 'in_person';
    physicalLocation?: string;
  }) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (updates.step !== undefined) {
      if (updates.step) newParams.set('step', updates.step);
      else newParams.delete('step');
    }
    if (updates.practitionerId !== undefined) {
      if (updates.practitionerId) newParams.set('practitioner_id', updates.practitionerId);
      else newParams.delete('practitioner_id');
    }
    if (updates.date !== undefined) {
      if (updates.date && !isNaN(updates.date.getTime())) {
        newParams.set('date', updates.date.toISOString());
      } else {
        newParams.delete('date');
      }
    }
    if (updates.time !== undefined) {
      if (updates.time) newParams.set('time', updates.time);
      else newParams.delete('time');
    }
    if (updates.duration !== undefined) {
      newParams.set('duration', updates.duration.toString());
    }
    if (updates.sessionType !== undefined) {
      newParams.set('session_type', updates.sessionType);
    }
    if (updates.isGroup !== undefined) {
      newParams.set('is_group', updates.isGroup.toString());
    }
    if (updates.location !== undefined) {
      newParams.set('session_location', updates.location);
    }
    if (updates.physicalLocation !== undefined) {
      if (updates.physicalLocation) newParams.set('physical_location', updates.physicalLocation);
      else newParams.delete('physical_location');
    }
    
    setSearchParams(newParams, { replace: true });
  };

  // Update step and URL
  const updateStep = (newStep: 'sessionType' | 'practitioner' | 'datetime' | 'waiver' | 'confirm') => {
    setStep(newStep);
    updateURL({ step: newStep });
  };
  const [waiverSigned, setWaiverSigned] = useState(false);
  const [checkingWaiver, setCheckingWaiver] = useState(false);
  const [groupSessions, setGroupSessions] = useState<any[]>([]);
  const [availableGroupClasses, setAvailableGroupClasses] = useState<any[]>([]);
  const [selectedGroupSession, setSelectedGroupSession] = useState<any | null>(null);
  const [correlatedSessions, setCorrelatedSessions] = useState<Map<string, any>>(new Map());
  const { currency, formatPrice } = useCurrency();

  useEffect(() => {
    fetchSessionTypes();
    fetchPractitioners();
    fetchStudioLocations();
  }, []);

  const fetchStudioLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("studio_locations" as any)
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching studio locations:", error);
      } else {
        setStudioLocations((data || []) as unknown as Array<{ id: string; name: string; address: string; city?: string; province_state?: string; country?: string; postal_code?: string }>);
      }
    } catch (error) {
      console.error("Error fetching studio locations:", error);
    }
  };

  // Load practitioner from URL on mount
  useEffect(() => {
    if (initialState.practitionerId && practitioners.length > 0) {
      const practitioner = practitioners.find(p => p.id === initialState.practitionerId);
      if (practitioner) {
        setSelectedPractitioner(practitioner);
      }
    }
  }, [practitioners, initialState.practitionerId]);

  // Sync state changes to URL (skip initial mount to avoid overwriting URL)
  const [isInitialMount, setIsInitialMount] = useState(true);
  useEffect(() => {
    setIsInitialMount(false);
  }, []);

  useEffect(() => {
    if (!isInitialMount && selectedPractitioner) {
      updateURL({ practitionerId: selectedPractitioner.id });
    }
  }, [selectedPractitioner, isInitialMount]);

  useEffect(() => {
    if (!isInitialMount) {
      updateURL({ date: selectedDate });
    }
  }, [selectedDate, isInitialMount]);

  useEffect(() => {
    if (!isInitialMount) {
      updateURL({ time: selectedTime });
    }
  }, [selectedTime, isInitialMount]);

  useEffect(() => {
    if (!isInitialMount) {
      updateURL({ duration: selectedDuration });
    }
  }, [selectedDuration, isInitialMount]);

  useEffect(() => {
    if (!isInitialMount) {
      updateURL({ sessionType: selectedSessionType });
    }
  }, [selectedSessionType, isInitialMount]);

  useEffect(() => {
    if (!isInitialMount) {
      updateURL({ isGroup });
    }
  }, [isGroup, isInitialMount]);

  useEffect(() => {
    if (!isInitialMount) {
      updateURL({ location: sessionLocation });
    }
  }, [sessionLocation, isInitialMount]);

  useEffect(() => {
    if (!isInitialMount) {
      updateURL({ physicalLocation });
    }
  }, [physicalLocation, isInitialMount]);

  // Refetch session types when currency changes
  useEffect(() => {
    fetchSessionTypes();
  }, [currency]);

  // Load session type when selections change
  useEffect(() => {
    if (selectedDuration && selectedSessionType !== undefined && isGroup !== undefined) {
      loadSessionType();
    }
  }, [selectedDuration, selectedSessionType, isGroup]);

  const fetchSessionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("session_types")
        .select("*")
        .eq("is_active", true)
        .order("duration_minutes", { ascending: true });

      if (!error && data) {
        setAvailableSessionTypes(data);
        console.log("Session types loaded:", data.length, "types");
        console.log("Current currency:", currency);
        // Log a sample price for debugging
        if (data.length > 0) {
          const sample = data[0];
          console.log("Sample price - CAD:", sample.price_cad, "USD:", sample.price_usd);
        }
      } else if (error) {
        console.error("Error fetching session types:", error);
      }
    } catch (error) {
      console.error("Error fetching session types:", error);
    }
  };

  useEffect(() => {
    if (isGroup) {
      // For group sessions, fetch all available pre-scheduled classes
      fetchAvailableGroupClasses();
    } else if (selectedPractitioner) {
      // If practitioner is selected but no date, set today's date
      if (!selectedDate) {
        const today = new Date();
        setSelectedDate(today);
      }
    }
  }, [selectedPractitioner, isGroup, sessionLocation]);

  // Separate effect to generate time slots when both practitioner and date are available
  useEffect(() => {
    if (!isGroup && selectedPractitioner && selectedDate) {
      // For 1:1 sessions, generate time slots based on practitioner availability
      generateTimeSlots();
      fetchCorrelatedSessions();
    }
  }, [selectedPractitioner, selectedDate, isGroup, sessionLocation, selectedDuration, selectedSessionType]);

  // Check waiver status when moving to waiver step
  useEffect(() => {
    if (step === 'waiver' && user) {
      checkWaiverStatus();
    }
  }, [step, user]);

  // Load session type ID when duration changes
  useEffect(() => {
    if (selectedDuration) {
      loadSessionType();
    }
  }, [selectedDuration]);

  // Check for credits when user is available or when session type changes
  useEffect(() => {
    if (user && sessionTypeId) {
      checkCredits();
    } else if (user && !sessionTypeId) {
      // If no session type selected, reset credits
      setHasCredits(false);
    }
  }, [user, sessionTypeId]);

  const loadSessionType = async () => {
    const { data, error } = await supabase
      .from("session_types")
      .select("id")
      .eq("duration_minutes", selectedDuration)
      .eq("session_type", selectedSessionType)
      .eq("is_group", isGroup)
      .eq("is_active", true)
      .single();

    if (!error && data) {
      setSessionTypeId(data.id);
    } else {
      setSessionTypeId(null);
    }
  };

  const getSelectedSessionTypePrice = () => {
    if (!sessionTypeId) return 0;
    const sessionType = availableSessionTypes.find(st => (st as any).id === sessionTypeId) as any;
    if (!sessionType) return 0;
    return currency === 'cad' ? sessionType.price_cad : sessionType.price_usd;
  };

  const checkCredits = async () => {
    if (!user || !sessionTypeId) {
      setHasCredits(false);
      return;
    }

    try {
      setCheckingCredits(true);
      // Get fresh session token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        setHasCredits(false);
        return;
      }

      // Check for credits matching this specific session type (includes duration)
      // Package credits (session_type_id is null) can be used for any session
      // Session-type-specific credits must match exactly
      const { data: packageCredits } = await supabase
        .from("user_session_credits")
        .select("id, credits_remaining")
        .eq("user_id", user.id)
        .is("session_type_id", null)
        .gt("credits_remaining", 0)
        .or("expires_at.is.null,expires_at.gt.now()")
        .limit(1)
        .maybeSingle();

      if (packageCredits && packageCredits.credits_remaining > 0) {
        setHasCredits(true);
        return;
      }

      // Check for session-type-specific credits
      const { data: typeCredits } = await supabase
        .from("user_session_credits")
        .select("id, credits_remaining")
        .eq("user_id", user.id)
        .eq("session_type_id", sessionTypeId)
        .gt("credits_remaining", 0)
        .or("expires_at.is.null,expires_at.gt.now()")
        .limit(1)
        .maybeSingle();

      setHasCredits(!!(typeCredits && typeCredits.credits_remaining > 0));
    } catch (error) {
      console.error("Error checking credits:", error);
      setHasCredits(false);
    } finally {
      setCheckingCredits(false);
    }
  };

  const fetchPractitioners = async () => {
    const { data, error } = await supabase
      .from("practitioners")
      .select("*")
      .eq("available", true);

    if (error) {
      console.error("Error fetching practitioners:", error);
    } else {
      setPractitioners(data || []);
    }
    setLoading(false);
  };

  const generateTimeSlots = async () => {
    if (!selectedPractitioner || !selectedDate) return;

    // Get existing sessions for this practitioner on this date
    const startOfSelectedDay = startOfDay(selectedDate);
    const endOfSelectedDay = addDays(startOfSelectedDay, 1);

    const { data: existingSessions } = await supabase
      .from("session_schedules")
      .select("scheduled_at, duration_minutes, max_participants, current_participants")
      .eq("practitioner_id", selectedPractitioner.id)
      .gte("scheduled_at", startOfSelectedDay.toISOString())
      .lt("scheduled_at", endOfSelectedDay.toISOString())
      .neq("status", "cancelled");

    const bookedTimes = new Set(
      existingSessions?.map(s => {
        if (!s?.scheduled_at) return null;
        const date = new Date(s.scheduled_at);
        return isNaN(date.getTime()) ? null : format(date, "HH:mm");
      }).filter(Boolean) || []
    );

    // Generate time slots from 9 AM to 6 PM
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour < 18; hour++) {
      const timeString = `${hour.toString().padStart(2, "0")}:00`;
      const slotTime = setMinutes(setHours(selectedDate, hour), 0);
      
      // For group sessions, check if there's an existing group session at this time
      let available = !bookedTimes.has(timeString) && isAfter(slotTime, new Date());
      
      if (isGroup && available) {
        // Check if there's a group session with available spots (max_participants > 1 indicates group)
        const groupSession = existingSessions?.find(
          s => {
            if (!s?.scheduled_at) return false;
            const date = new Date(s.scheduled_at);
            return !isNaN(date.getTime()) && 
                   format(date, "HH:mm") === timeString &&
                   (s.max_participants || 1) > 1 && 
                   (s.current_participants || 0) < (s.max_participants || 1);
          }
        );
        if (groupSession) {
          available = true; // Can join existing group
        }
      }
      
      slots.push({
        time: timeString,
        available,
      });
    }

    setTimeSlots(slots);
    setSelectedTime(null);
  };

  const fetchGroupSessions = async () => {
    if (!selectedPractitioner || !selectedDate || !isGroup) return;

    const startOfSelectedDay = startOfDay(selectedDate);
    const endOfSelectedDay = addDays(startOfSelectedDay, 1);

    const { data } = await supabase
      .from("session_schedules")
      .select("id, scheduled_at, max_participants, current_participants")
      .eq("practitioner_id", selectedPractitioner.id)
      .gt("max_participants", 1) // Group sessions have max_participants > 1
      .gte("scheduled_at", startOfSelectedDay.toISOString())
      .lt("scheduled_at", endOfSelectedDay.toISOString())
      .neq("status", "cancelled");

    setGroupSessions(data || []);
  };

  // Fetch all available pre-scheduled group classes (admin-created)
  const fetchAvailableGroupClasses = async () => {
    if (!isGroup) {
      setAvailableGroupClasses([]);
      return;
    }

    try {
      // Fetch all group sessions (max_participants > 1) that:
      // 1. Are scheduled in the future
      // 2. Have available spots
      // 3. Match the selected session type and duration
      const now = new Date();
      
      let query = supabase
        .from("session_schedules")
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          max_participants,
          current_participants,
          session_location,
          physical_location,
          class_name,
          practitioner:practitioners (
            id,
            name,
            bio,
            specialization,
            avatar_url
          )
        `)
        .gt("max_participants", 1) // Group sessions only
        .gte("scheduled_at", now.toISOString())
        .neq("status", "cancelled")
        .order("scheduled_at", { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching group classes:", error);
        return;
      }

      // Filter by session type and duration if selected
      let filtered = data || [];
      
      if (selectedDuration && selectedSessionType) {
        // Get session type ID to match
        const { data: sessionTypeData } = await supabase
          .from("session_types")
          .select("id")
          .eq("duration_minutes", selectedDuration)
          .eq("session_type", selectedSessionType)
          .eq("is_group", true)
          .eq("is_active", true)
          .single();

        if (sessionTypeData) {
          // Note: We can't filter by session_type_id directly from session_schedules
          // So we'll show all group classes and let user filter by duration
          // In a real implementation, you'd want to add session_type_id to session_schedules
        }
      }

      // Filter to only show classes with available spots
      filtered = filtered.filter((session: any) => {
        const current = session.current_participants || 0;
        const max = session.max_participants || 1;
        return current < max;
      });

      // Group classes by practitioner for better organization
      const groupedByPractitioner = filtered.reduce((acc: any, session: any) => {
        const practitionerId = session.practitioner?.id || 'unknown';
        if (!acc[practitionerId]) {
          acc[practitionerId] = {
            practitioner: session.practitioner,
            classes: []
          };
        }
        acc[practitionerId].classes.push(session);
        return acc;
      }, {});

      // Flatten back to array but keep practitioner grouping in display
      setAvailableGroupClasses(filtered || []);
    } catch (error) {
      console.error("Error fetching available group classes:", error);
      setAvailableGroupClasses([]);
    }
  };

  const fetchCorrelatedSessions = async () => {
    if (!selectedPractitioner || !selectedDate) return;

    const startOfSelectedDay = startOfDay(selectedDate);
    const endOfSelectedDay = addDays(startOfSelectedDay, 1);

    try {
      const { data, error } = await supabase
        .from("session_schedules")
        .select(`
          id,
          scheduled_at,
          session_location,
          physical_location,
          correlated_session_id,
          correlated_session:session_schedules!correlated_session_id (
            id,
            scheduled_at,
            session_location,
            physical_location
          )
        `)
        .eq("practitioner_id", selectedPractitioner.id)
        .gte("scheduled_at", startOfSelectedDay.toISOString())
        .lt("scheduled_at", endOfSelectedDay.toISOString())
        .in("status", ["scheduled", "in_progress"]);

      if (error) throw error;

      // Create a map of session ID -> correlated session
      const correlationMap = new Map();
      (data || []).forEach((session: any) => {
        if (session.correlated_session) {
          correlationMap.set(session.id, session.correlated_session);
          // Also map the reverse
          correlationMap.set(session.correlated_session.id, {
            id: session.id,
            scheduled_at: session.scheduled_at,
            session_location: session.session_location,
            physical_location: session.physical_location,
          });
        }
      });

      setCorrelatedSessions(correlationMap);
    } catch (error) {
      console.error("Error fetching correlated sessions:", error);
    }
  };

  const checkWaiverStatus = async () => {
    if (!user) return;

    try {
      setCheckingWaiver(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('get-liability-waiver-status', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!error && data?.has_signed) {
        setWaiverSigned(true);
      }
    } catch (error) {
      console.error("Error checking waiver status:", error);
    } finally {
      setCheckingWaiver(false);
    }
  };

  const handleSelectPractitioner = (practitioner: Practitioner) => {
    setSelectedPractitioner(practitioner);
      updateStep('datetime');
  };

  const calculateSessionPrice = (duration: number = selectedDuration) => {
    if (!selectedPractitioner?.half_hour_rate) return 0;
    return (selectedPractitioner.half_hour_rate / 30) * duration;
  };

  const handleBookWithCredit = async () => {
    if (isGroup && !selectedGroupSession) {
      toast({
        title: "Missing Information",
        description: "Please select a group class.",
        variant: "destructive",
      });
      return;
    }

    if (!isGroup && (!user || !selectedPractitioner || !selectedDate || !selectedTime)) {
      toast({
        title: "Missing Information",
        description: "Please select all required fields.",
        variant: "destructive",
      });
      return;
    }

    setBooking(true);

    try {
      let scheduledAt: Date;
      let practitionerId: string;
      let duration: number;
      let location: 'online' | 'in_person';
      let physicalLoc: string | null = null;

      if (isGroup && selectedGroupSession) {
        // For group sessions, use the selected group class details
        scheduledAt = new Date(selectedGroupSession.scheduled_at);
        practitionerId = selectedGroupSession.practitioner?.id || selectedGroupSession.practitioner_id;
        duration = selectedGroupSession.duration_minutes || selectedDuration;
        location = selectedGroupSession.session_location || sessionLocation;
        physicalLoc = selectedGroupSession.physical_location || null;
      } else {
        // For 1:1 sessions, use selected date/time
        const [hours, minutes] = selectedTime!.split(":").map(Number);
        scheduledAt = setMinutes(setHours(selectedDate!, hours), minutes);
        practitionerId = selectedPractitioner!.id;
        duration = selectedDuration;
        location = sessionLocation;
        physicalLoc = sessionLocation === 'in_person' ? physicalLocation : null;
      }

      // Get fresh session token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      if (isGroup && selectedGroupSession) {
        // For group sessions, join existing session (increment participant count)
        // First, increment the participant count on the master group session
        const { error: updateError } = await supabase
          .from("session_schedules")
          .update({
            current_participants: (selectedGroupSession.current_participants || 0) + 1,
          })
          .eq("id", selectedGroupSession.id);

        if (updateError) throw updateError;

        // Create a booking record for this user (links them to the group session)
        // Use the same room_name so they join the same video room
        const { error: bookingError } = await supabase
          .from("session_schedules")
          .insert({
            practitioner_id: practitionerId,
            client_id: user!.id,
            scheduled_at: scheduledAt.toISOString(),
            duration_minutes: duration,
            room_name: selectedGroupSession.room_name || `group-${selectedGroupSession.id}`,
            max_participants: selectedGroupSession.max_participants || 1,
            current_participants: 1, // Individual entry, but part of the group
            session_location: location,
            physical_location: physicalLoc,
            status: "scheduled",
            notes: `Joined group class: ${selectedGroupSession.id}`,
          });

        if (bookingError) throw bookingError;

        // Deduct credit for joining the group class
        // Find an available credit
        const { data: packageCredit } = await supabase
          .from("user_session_credits")
          .select("id, credits_remaining")
          .eq("user_id", user!.id)
          .is("session_type_id", null)
          .gt("credits_remaining", 0)
          .or("expires_at.is.null,expires_at.gt.now()")
          .limit(1)
          .maybeSingle();

        if (packageCredit) {
          await supabase
            .from("user_session_credits")
            .update({ credits_remaining: packageCredit.credits_remaining - 1 })
            .eq("id", packageCredit.id);
        } else if (sessionTypeId) {
          const { data: typeCredit } = await supabase
            .from("user_session_credits")
            .select("id, credits_remaining")
            .eq("user_id", user!.id)
            .eq("session_type_id", sessionTypeId)
            .gt("credits_remaining", 0)
            .or("expires_at.is.null,expires_at.gt.now()")
            .limit(1)
            .maybeSingle();

          if (typeCredit) {
            await supabase
              .from("user_session_credits")
              .update({ credits_remaining: typeCredit.credits_remaining - 1 })
              .eq("id", typeCredit.id);
          }
        }

        toast({
          title: "Class Joined!",
          description: "You have successfully joined the group class.",
        });
      } else {
        // For 1:1 sessions, use the existing credit booking flow
        const { data, error } = await supabase.functions.invoke('book-session-with-credit', {
          body: {
            practitioner_id: practitionerId,
            scheduled_at: scheduledAt.toISOString(),
            duration_minutes: duration,
            session_type_id: sessionTypeId,
            session_type: selectedSessionType,
            is_group: false,
            session_location: location,
            physical_location: physicalLoc,
            notes: null,
          },
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });

        if (error) throw error;
        if (!data?.success) {
          throw new Error(data?.error || "Failed to book session");
        }

        toast({
          title: "Session Booked!",
          description: "Your session has been booked using a credit.",
        });
      }

      // Refresh credits
      checkCredits();

      // Reset state
      setSelectedPractitioner(null);
      setSelectedDate(undefined);
      setSelectedTime(null);
      setSelectedGroupSession(null);
      updateStep('sessionType');
      onSessionBooked?.();
      
      // Navigate to sessions page
      navigate('/sessions');
    } catch (error) {
      console.error("Error booking with credit:", error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Could not book session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  const handleBookSession = async () => {
    if (isGroup && !selectedGroupSession) {
      toast({
        title: "Missing Information",
        description: "Please select a group class.",
        variant: "destructive",
      });
      return;
    }

    if (!isGroup && (!user || !selectedPractitioner || !selectedDate || !selectedTime)) {
      console.error("Missing required fields:", {
        user: !!user,
        selectedPractitioner: !!selectedPractitioner,
        selectedDate: !!selectedDate,
        selectedTime: !!selectedTime,
      });
      toast({
        title: "Missing Information",
        description: "Please select all required fields.",
        variant: "destructive",
      });
      return;
    }

    setBooking(true);

    try {
      let scheduledAt: Date;
      let practitionerId: string;
      let duration: number;
      let location: 'online' | 'in_person';
      let physicalLoc: string | null = null;

      if (isGroup && selectedGroupSession) {
        // For group sessions, use the selected group class details
        scheduledAt = new Date(selectedGroupSession.scheduled_at);
        practitionerId = selectedGroupSession.practitioner?.id || selectedGroupSession.practitioner_id;
        duration = selectedGroupSession.duration_minutes || selectedDuration;
        location = selectedGroupSession.session_location || sessionLocation;
        physicalLoc = selectedGroupSession.physical_location || null;
      } else {
        // For 1:1 sessions, use selected date/time
        const [hours, minutes] = selectedTime!.split(":").map(Number);
        scheduledAt = setMinutes(setHours(selectedDate!, hours), minutes);
        practitionerId = selectedPractitioner!.id;
        duration = selectedDuration;
        location = sessionLocation;
        physicalLoc = sessionLocation === 'in_person' ? physicalLocation : null;
      }
      
      // Build payment page URL with session details
      const params = new URLSearchParams({
        practitioner_id: practitionerId,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: duration.toString(),
        session_type: selectedSessionType,
        is_group: isGroup.toString(),
        session_location: location,
        ...(sessionTypeId && { session_type_id: sessionTypeId }),
        ...(physicalLoc && { physical_location: physicalLoc }),
        ...(isGroup && selectedGroupSession && { group_session_id: selectedGroupSession.id }),
      });

      const paymentUrl = `/sessions/payment?${params.toString()}`;
      console.log("Redirecting to payment page:", paymentUrl);
      console.log("Params:", Object.fromEntries(params.entries()));

      // Redirect to payment page - use window.location.href for full navigation
      window.location.href = paymentUrl;
      
      // Don't reset state here as we're navigating away
    } catch (error) {
      console.error("Error preparing booking:", error);
      toast({
        title: "Error",
        description: "Could not prepare booking. Please try again.",
        variant: "destructive",
      });
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-xl">
            {step === 'sessionType' && 'Select Session Type'}
            {step === 'practitioner' && 'Choose a Practitioner'}
            {step === 'datetime' && 'Select Date & Time'}
            {step === 'waiver' && 'Liability Waiver'}
            {step === 'confirm' && 'Confirm Booking'}
          </CardTitle>
          {step !== 'sessionType' && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                if (step === 'confirm') updateStep('waiver');
                else if (step === 'waiver') updateStep('datetime');
                else if (step === 'datetime') updateStep('practitioner');
                else if (step === 'practitioner') updateStep('sessionType');
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {step === 'sessionType' && (
          <div className="space-y-6">
            {/* Show "Buy Credits" prompt if no credits */}
            {userHasAnyCredits === false && (
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="font-medium text-primary">No Class Credits Available</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  You need class credits to book a session. Purchase credits in your wallet.
                </p>
                <Button
                  variant="default"
                  onClick={() => navigate('/wallet')}
                  className="w-full"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Class Credits
                </Button>
              </div>
            )}

            {/* Location Selection - Online/In-Person Tabs */}
            <Tabs value={sessionLocation} onValueChange={(value) => setSessionLocation(value as 'online' | 'in_person')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="online" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Online
                </TabsTrigger>
                <TabsTrigger value="in_person" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  In-Person
                </TabsTrigger>
              </TabsList>

              <TabsContent value="online" className="mt-6">
                <div className="space-y-6">
                  {/* Online: Show scheduled group classes + 1:1 booking option */}
                  <div>
                    <p className="text-sm font-medium mb-3">Available Group Classes</p>
                    {availableGroupClasses.filter((c: any) => c.session_location === 'online').length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No online group classes scheduled</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {availableGroupClasses
                          .filter((c: any) => c.session_location === 'online')
                          .map((groupClass: any) => {
                            const scheduledDate = new Date(groupClass.scheduled_at);
                            const spotsLeft = (groupClass.max_participants || 1) - (groupClass.current_participants || 0);
                            
                            return (
                              <Card
                                key={groupClass.id}
                                className="cursor-pointer hover:border-primary/50 transition-all"
                                onClick={() => {
                                  setSelectedGroupSession(groupClass);
                                  setIsGroup(true);
                                  setSelectedDuration(groupClass.duration_minutes || 60);
                                  updateStep('datetime');
                                }}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <Avatar className="w-10 h-10">
                                          <AvatarImage src={groupClass.practitioner?.avatar_url || undefined} />
                                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                            {groupClass.practitioner?.name?.split(" ").map((n: string) => n[0]).join("") || "P"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-sm">{groupClass.practitioner?.name || 'Practitioner'}</p>
                                          {groupClass.class_name && (
                                            <p className="text-sm font-semibold text-primary mt-1">
                                              {groupClass.class_name}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <CalendarIcon className="w-4 h-4" />
                                          {format(scheduledDate, "MMM d, yyyy")}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          {format(scheduledDate, "h:mm a")}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          {groupClass.duration_minutes || 60} min
                                        </div>
                                      </div>
                                    </div>
                                    <Badge variant={spotsLeft > 0 ? "default" : "destructive"}>
                                      {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* 1:1 Booking Option */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">Book 1:1 Session</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Book a personalized 1:1 session when practitioners are available
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsGroup(false);
                        updateStep('practitioner');
                      }}
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      Book 1:1 Session
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="in_person" className="mt-6">
                <div className="space-y-6">
                  {/* Studio Location Selection */}
                  <div>
                    <Label htmlFor="studio-location" className="text-sm font-medium mb-2 block">
                      Select Studio Location
                    </Label>
                    <Select value={selectedStudioLocation || ''} onValueChange={setSelectedStudioLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a studio location..." />
                      </SelectTrigger>
                      <SelectContent>
                        {studioLocations.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No studio locations available
                          </div>
                        ) : (
                          studioLocations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name} - {location.address}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Studio locations are managed by administrators
                    </p>
                  </div>

                  {/* In-Person: Show scheduled group classes + 1:1 booking option */}
                  {selectedStudioLocation && (
                    <>
                      <div>
                        <p className="text-sm font-medium mb-3">Available Group Classes</p>
                        {availableGroupClasses.filter((c: any) => c.session_location === 'in_person' && c.physical_location === selectedStudioLocation).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No group classes scheduled at this location</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {availableGroupClasses
                          .filter((c: any) => c.session_location === 'in_person' && (selectedStudioLocation ? c.physical_location === selectedStudioLocation : true))
                              .map((groupClass: any) => {
                                const scheduledDate = new Date(groupClass.scheduled_at);
                                const spotsLeft = (groupClass.max_participants || 1) - (groupClass.current_participants || 0);
                                
                                return (
                                  <Card
                                    key={groupClass.id}
                                    className="cursor-pointer hover:border-primary/50 transition-all"
                                    onClick={() => {
                                      setSelectedGroupSession(groupClass);
                                      setIsGroup(true);
                                      setSelectedDuration(groupClass.duration_minutes || 60);
                                      setPhysicalLocation(groupClass.physical_location || '');
                                      // Set session type from group class if available, otherwise default to standing
                                      if (groupClass.session_type) {
                                        setSelectedSessionType(groupClass.session_type as 'standing' | 'laying');
                                      }
                                      updateStep('waiver');
                                    }}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                            <Avatar className="w-10 h-10">
                                              <AvatarImage src={groupClass.practitioner?.avatar_url || undefined} />
                                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                {groupClass.practitioner?.name?.split(" ").map((n: string) => n[0]).join("") || "P"}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <p className="font-medium text-sm">{groupClass.practitioner?.name || 'Practitioner'}</p>
                                              {groupClass.class_name && (
                                                <p className="text-sm font-semibold text-primary mt-1">
                                                  {groupClass.class_name}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <CalendarIcon className="w-4 h-4" />
                                              {format(scheduledDate, "MMM d, yyyy")}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Clock className="w-4 h-4" />
                                              {format(scheduledDate, "h:mm a")}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <MapPin className="w-4 h-4" />
                                              {groupClass.physical_location || selectedStudioLocation}
                                            </div>
                                          </div>
                                        </div>
                                        <Badge variant={spotsLeft > 0 ? "default" : "destructive"}>
                                          {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      {/* 1:1 Booking Option */}
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-3">Book 1:1 Session</p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Book a personalized 1:1 session when practitioners are available
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setIsGroup(false);
                            setPhysicalLocation(selectedStudioLocation || '');
                            // Set default values for 1:1 booking
                            setSelectedSessionType('standing');
                            setSelectedDuration(60);
                            updateStep('practitioner');
                          }}
                        >
                          <UserIcon className="w-4 h-4 mr-2" />
                          Book 1:1 Session
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === 'practitioner' && (
          <div className="space-y-6">
            {/* Practice Type Selection for 1:1 */}
            <div>
              <p className="text-sm font-medium mb-3">Practice Type</p>
              <RadioGroup
                value={selectedSessionType}
                onValueChange={(value) => setSelectedSessionType(value as 'standing' | 'laying')}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <RadioGroupItem value="standing" id="standing" className="peer sr-only" />
                  <Label
                    htmlFor="standing"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="font-medium">Standing</span>
                    <span className="text-xs text-muted-foreground mt-1">Traditional practice</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="laying" id="laying" className="peer sr-only" />
                  <Label
                    htmlFor="laying"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="font-medium">Laying</span>
                    <span className="text-xs text-muted-foreground mt-1">Deep relaxation</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Duration Selection for 1:1 */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[20, 45, 60].map((duration) => (
                  <Button
                    key={duration}
                    variant={selectedDuration === duration ? "default" : "outline"}
                    onClick={() => setSelectedDuration(duration as 20 | 45 | 60)}
                    className="h-auto py-3"
                  >
                    <span className="font-medium">{duration} min</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Practitioner Selection */}
            <div>
              <p className="text-sm font-medium mb-3">Choose a Practitioner</p>
              {practitioners.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No practitioners available at the moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {practitioners.map((practitioner) => (
                    <div
                      key={practitioner.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
                      onClick={() => handleSelectPractitioner(practitioner)}
                    >
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={practitioner.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {practitioner.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium">{practitioner.name}</h3>
                        {practitioner.specialization && (
                          <Badge variant="secondary" className="mt-1">
                            {practitioner.specialization}
                          </Badge>
                        )}
                        {practitioner.bio && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {practitioner.bio}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'datetime' && (
          <div className="space-y-6">
            {/* Session Type Summary */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Session Type</p>
              <p className="text-sm font-medium">
                {selectedDuration} min {selectedSessionType} • {isGroup ? 'Group Class' : '1:1 Session'} • {sessionLocation === 'online' ? 'Online' : 'In-Person'}
              </p>
            </div>

            {isGroup ? (
              // Group Classes: Show pre-scheduled classes only
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Available Group Classes
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Group classes are pre-scheduled by administrators. Select a class below to join.
                  </p>
                  
                  {availableGroupClasses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No group classes available at this time</p>
                      <p className="text-xs mt-1">Check back later or contact support for upcoming classes</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {availableGroupClasses.map((groupClass: any) => {
                        const scheduledDate = new Date(groupClass.scheduled_at);
                        const spotsLeft = (groupClass.max_participants || 1) - (groupClass.current_participants || 0);
                        const isSelected = selectedGroupSession?.id === groupClass.id;
                        
                        return (
                          <Card
                            key={groupClass.id}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                            }`}
                            onClick={() => {
                              setSelectedGroupSession(groupClass);
                              setSelectedPractitioner(groupClass.practitioner);
                              setSelectedDate(scheduledDate);
                              setSelectedTime(format(scheduledDate, "HH:mm"));
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Avatar className="w-10 h-10">
                                      <AvatarImage src={groupClass.practitioner?.avatar_url || undefined} />
                                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                        {groupClass.practitioner?.name?.split(" ").map((n: string) => n[0]).join("") || "P"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-sm">{groupClass.practitioner?.name || 'Practitioner'}</p>
                                      {groupClass.class_name && (
                                        <p className="text-sm font-semibold text-primary mt-1">
                                          {groupClass.class_name}
                                        </p>
                                      )}
                                      {groupClass.practitioner?.specialization && (
                                        <Badge variant="secondary" className="text-xs mt-1">
                                          {groupClass.practitioner.specialization}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <CalendarIcon className="w-4 h-4" />
                                      {format(scheduledDate, "MMM d, yyyy")}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {format(scheduledDate, "h:mm a")}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {groupClass.duration_minutes || selectedDuration} min
                                    </div>
                                    {groupClass.session_location === 'in_person' && groupClass.physical_location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {groupClass.physical_location}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <Badge variant={spotsLeft > 0 ? "default" : "destructive"} className="mb-2">
                                    {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">
                                    {groupClass.current_participants || 0} / {groupClass.max_participants || 1} participants
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // 1:1 Sessions: Show practitioner availability and time slots
              selectedPractitioner && (
                <>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar>
                      <AvatarImage src={selectedPractitioner.avatar_url || undefined} />
                      <AvatarFallback>{selectedPractitioner.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{selectedPractitioner.name}</p>
                      {selectedPractitioner.specialization && (
                        <Badge variant="secondary" className="mt-1">
                          {selectedPractitioner.specialization}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Select Date
                      </p>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(date);
                          }
                        }}
                        disabled={(date) => isBefore(date, startOfDay(new Date()))}
                        className="rounded-md border"
                      />
                    </div>

                    {selectedDate && (
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Available Times
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                          {timeSlots.map((slot) => (
                            <Button
                              key={slot.time}
                              variant={selectedTime === slot.time ? "default" : "outline"}
                              size="sm"
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.time)}
                              className="w-full"
                            >
                              {slot.time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )
            )}

            {/* In-Person Location Input */}
            {sessionLocation === 'in_person' && (
              <div>
                <Label htmlFor="physical-location" className="text-sm font-medium mb-2 block">
                  Location Address
                </Label>
                <Input
                  id="physical-location"
                  placeholder="Enter address or location"
                  value={physicalLocation}
                  onChange={(e) => setPhysicalLocation(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Please provide the address where the session will take place.
                </p>
              </div>
            )}

            {/* Continue button */}
            {isGroup ? (
              // For group classes, need to select a class
              selectedGroupSession && (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => updateStep('waiver')}
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )
            ) : (
              // For 1:1 sessions, need date, time, and location
              selectedDate && selectedTime && (sessionLocation === 'online' || physicalLocation) && (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => updateStep('waiver')}
                  disabled={sessionLocation === 'in_person' && !physicalLocation}
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )
            )}
          </div>
        )}

        {step === 'waiver' && (
          <div className="space-y-4">
            {checkingWaiver ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : waiverSigned ? (
              <WaiverAlreadySigned onContinue={() => updateStep('confirm')} />
            ) : (
              <LiabilityWaiver
                onSigned={() => {
                  setWaiverSigned(true);
                  updateStep('confirm');
                }}
                onCancel={() => updateStep('datetime')}
              />
            )}
          </div>
        )}

        {step === 'confirm' && (
          (isGroup && selectedGroupSession) || 
          (!isGroup && selectedPractitioner && selectedDate && selectedTime)
        ) && (
          <div className="space-y-6">
            {/* Correlated Session Notice */}
            {(() => {
              // Check if there's a correlated session available for this time slot
              const [hours, minutes] = selectedTime.split(":").map(Number);
              const slotTime = setMinutes(setHours(selectedDate, hours), minutes);
              
              // Find if any correlated session exists at this time
              const hasCorrelated = Array.from(correlatedSessions.values()).some((correlated: any) => {
                if (!correlated?.scheduled_at) return false;
                const correlatedTime = new Date(correlated.scheduled_at);
                // Check if date is valid
                if (isNaN(correlatedTime.getTime())) return false;
                // Check if slotTime is valid
                if (!selectedDate || !selectedTime || isNaN(slotTime.getTime())) return false;
                return (
                  format(correlatedTime, "yyyy-MM-dd HH:mm") === format(slotTime, "yyyy-MM-dd HH:mm") &&
                  correlated.session_location !== sessionLocation
                );
              });
              
              if (!hasCorrelated) return null;
              
              const oppositeLocation = sessionLocation === 'online' ? 'in_person' : 'online';
              return (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Link2 className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Correlated Session Available</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          This session can be linked with a {oppositeLocation === 'online' ? 'online' : 'in-person'} session. 
                          You can book both to offer clients flexibility.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Note: Correlated sessions must be created by an administrator.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
            
            <div className="p-6 bg-muted/50 rounded-lg space-y-4">
              <h3 className="font-heading text-lg">Session Details</h3>
              
              {(() => {
                const practitioner = isGroup && selectedGroupSession 
                  ? selectedGroupSession.practitioner 
                  : selectedPractitioner;
                const sessionDate = isGroup && selectedGroupSession
                  ? new Date(selectedGroupSession.scheduled_at)
                  : selectedDate!;
                const sessionTime = isGroup && selectedGroupSession
                  ? format(new Date(selectedGroupSession.scheduled_at), "HH:mm")
                  : selectedTime!;
                const sessionDuration = isGroup && selectedGroupSession
                  ? selectedGroupSession.duration_minutes || selectedDuration
                  : selectedDuration;
                const sessionLoc = isGroup && selectedGroupSession
                  ? selectedGroupSession.session_location || sessionLocation
                  : sessionLocation;
                const sessionPhysicalLoc = isGroup && selectedGroupSession
                  ? selectedGroupSession.physical_location || physicalLocation
                  : physicalLocation;
                const spotsLeft = isGroup && selectedGroupSession
                  ? (selectedGroupSession.max_participants || 1) - (selectedGroupSession.current_participants || 0)
                  : null;

                return (
                  <>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={practitioner?.avatar_url || undefined} />
                        <AvatarFallback>{(practitioner?.name || 'P')[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{practitioner?.name || 'Practitioner'}</p>
                        {practitioner?.specialization && (
                          <p className="text-sm text-muted-foreground">{practitioner.specialization}</p>
                        )}
                        {isGroup && spotsLeft !== null && (
                          <Badge variant="outline" className="mt-1">
                            {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} available
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{format(sessionDate, "EEEE, MMMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">
                          {isGroup && selectedGroupSession
                            ? format(new Date(selectedGroupSession.scheduled_at), "h:mm a")
                            : selectedTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{selectedSessionType} • {isGroup ? 'Group Class' : '1:1 Session'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{sessionLoc === 'online' ? 'Online' : 'In-Person'}</p>
                        {sessionLoc === 'in_person' && sessionPhysicalLoc && (
                          <p className="text-xs text-muted-foreground mt-1">{sessionPhysicalLoc}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{sessionDuration} minutes</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {hasCredits ? (
              <div className="space-y-3">
                <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">You have session credits available</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Use a credit to book this session, or purchase a new session/package.
                  </p>
                </div>
                <div className="flex gap-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleBookWithCredit}
                  disabled={booking || !user || (isGroup ? !selectedGroupSession : (!selectedPractitioner || !selectedDate || !selectedTime))}
                >
                  {booking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4 mr-2" />
                      Use Credit to Book
                    </>
                  )}
                </Button>

                <Button 
                  variant="outline"
                  className="w-full" 
                  size="lg"
                  onClick={handleBookSession}
                  disabled={booking || !user || (isGroup ? !selectedGroupSession : (!selectedPractitioner || !selectedDate || !selectedTime))}
                >
                  {booking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Purchase New Session"
                  )}
                </Button>
                </div>
              </div>
            ) : (
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleBookSession}
                disabled={booking || !user || (isGroup ? !selectedGroupSession : (!selectedPractitioner || !selectedDate || !selectedTime))}
              >
                {booking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
