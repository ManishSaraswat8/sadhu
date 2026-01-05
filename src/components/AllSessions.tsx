import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Video, Calendar, Clock, Loader2, Download, BookOpen, Target, User, MapPin, Filter, X, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { AllSessionsJoinButton } from "./AllSessionsJoinButton";
import { RescheduleDialog } from "./RescheduleDialog";
import { useNavigate, Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Session {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  session_location?: string;
  physical_location?: string | null;
  room_name: string;
  practitioner: {
    name: string;
    avatar_url: string | null;
    user_id: string;
  };
  recording?: {
    id: string;
    recording_url: string | null;
    status: string;
  };
}

export const AllSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPractitioner, setIsPractitioner] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [practitionerFilter, setPractitionerFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [sessionToReschedule, setSessionToReschedule] = useState<Session | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSessions();
      checkIfPractitioner();
      checkIfAdmin();
    }
  }, [user]);

  const checkIfAdmin = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (!error && data === true) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
    }
  };

  const checkIfPractitioner = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("practitioners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    setIsPractitioner(!!data);
  };

  const fetchSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch sessions as client
      const { data: clientSessions, error: clientError } = await supabase
        .from("session_schedules")
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          status,
          session_location,
          physical_location,
          room_name,
          practitioner:practitioners (
            name,
            avatar_url,
            user_id
          )
        `)
        .eq("client_id", user.id)
        .in("status", ["scheduled", "in_progress", "completed"])
        .order("scheduled_at", { ascending: false });

      if (clientError) {
        console.error("Error fetching client sessions:", clientError);
        toast({
          title: "Error",
          description: "Could not load sessions. Please refresh the page.",
          variant: "destructive",
        });
      }

      // Also fetch sessions as practitioner
      const { data: practitionerData } = await supabase
        .from("practitioners")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let practitionerSessions: Session[] = [];
      if (practitionerData) {
        const { data, error: practitionerError } = await supabase
          .from("session_schedules")
          .select(`
            id,
            scheduled_at,
            duration_minutes,
            status,
            session_location,
            physical_location,
            room_name,
            practitioner:practitioners (
              name,
              avatar_url,
              user_id
            )
          `)
          .eq("practitioner_id", practitionerData.id)
          .in("status", ["scheduled", "in_progress", "completed"])
          .order("scheduled_at", { ascending: false });
        
        if (!practitionerError && data) {
          practitionerSessions = (data as unknown as Session[]);
        }
      }

      // Combine and deduplicate sessions
      const allSessions = [...(clientSessions || []), ...practitionerSessions] as Session[];
      const uniqueSessions = allSessions.filter((session, index, self) =>
        index === self.findIndex((s) => s.id === session.id)
      );

      // Load recordings for completed sessions
      const sessionsWithRecordings = await Promise.all(
        uniqueSessions.map(async (session: any) => {
          if (session.status === 'completed') {
            const { data: recording } = await supabase
              .from("session_recordings" as any)
              .select("id, recording_url, status")
              .eq("session_id", session.id)
              .eq("status", "completed")
              .maybeSingle();

            return { ...session, recording: recording || null };
          }
          return session;
        })
      );

      const sortedSessions = sessionsWithRecordings.sort((a, b) => 
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
      );
      setAllSessions(sortedSessions);
      setSessions(sortedSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...allSessions];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Type filter (online/in-person)
    if (typeFilter !== 'all') {
      filtered = filtered.filter(s => s.session_location === typeFilter);
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(s => {
        const sessionDate = new Date(s.scheduled_at);
        return sessionDate.toDateString() === filterDate.toDateString();
      });
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(s => {
        const sessionDate = new Date(s.scheduled_at);
        if (timeFilter === 'upcoming') {
          return sessionDate > now;
        } else if (timeFilter === 'past') {
          return sessionDate < now;
        } else if (timeFilter === 'today') {
          return sessionDate.toDateString() === now.toDateString();
        }
        return true;
      });
    }

    // Practitioner filter
    if (practitionerFilter !== 'all') {
      filtered = filtered.filter(s => s.practitioner.name.toLowerCase().includes(practitionerFilter.toLowerCase()));
    }

    // Search term
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.practitioner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.physical_location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setSessions(filtered);
  }, [allSessions, statusFilter, typeFilter, dateFilter, timeFilter, practitionerFilter, searchTerm]);

  // Removed canJoin function - using useSessionJoinTimer hook in component

  const handleJoinSession = (session: Session) => {
    const isSessionPractitioner = session.practitioner?.user_id === user?.id;
    navigate(`/sessions?room=${encodeURIComponent(session.room_name)}&host=${isSessionPractitioner}&sessionId=${session.id}`);
  };

  const getStatusBadge = (status: string) => {
    if (status === "in_progress") {
      return <Badge className="bg-green-500">In Progress</Badge>;
    }
    if (status === "completed") {
      return <Badge variant="default">Completed</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    return <Badge variant="secondary">Scheduled</Badge>;
  };

  const uniquePractitioners = Array.from(new Set(allSessions.map(s => s.practitioner.name))).sort();

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('');
    setTimeFilter('all');
    setPractitionerFilter('all');
    setSearchTerm('');
  };

  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || dateFilter || timeFilter !== 'all' || practitionerFilter !== 'all' || searchTerm;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            All Sessions
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
              {showFilters ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
        {/* Filters */}
        {showFilters && (
          <div className="mb-6 space-y-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="lg:col-span-3">
              <Input
                placeholder="Search by practitioner name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in_person">In-Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Time</label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            {/* Practitioner Filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Practitioner</label>
              <Select value={practitionerFilter} onValueChange={setPractitionerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Practitioners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Practitioners</SelectItem>
                  {uniquePractitioners.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        )}
        <CardContent>

        {/* Results count */}
        {hasActiveFilters && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {sessions.length} of {allSessions.length} sessions
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No sessions yet</p>
            <p className="text-sm mt-1">Book your first session to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Sessions Section */}
            {sessions.filter(s => s.status === 'scheduled' || s.status === 'in_progress').length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border"></div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Upcoming Sessions
                  </h3>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions
                    .filter(s => s.status === 'scheduled' || s.status === 'in_progress')
                    .map((session) => {
                      const scheduledDate = new Date(session.scheduled_at);
                      const isUpcoming = session.status === 'scheduled' || session.status === 'in_progress';
                      const isCompleted = session.status === 'completed';
                      
                      return (
                        <div
                          key={session.id}
                          className="p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={session.practitioner.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {session.practitioner.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{session.practitioner.name}</span>
                                {getStatusBadge(session.status)}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(scheduledDate, "MMM d, yyyy")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(scheduledDate, "h:mm a")} • {session.duration_minutes} min
                                </span>
                                {session.session_location && (
                                  <span className="flex items-center gap-1">
                                    {session.session_location === 'online' ? (
                                      <Video className="w-3 h-3" />
                                    ) : (
                                      <MapPin className="w-3 h-3" />
                                    )}
                                    {session.session_location === 'online' ? 'Online' : session.physical_location || 'In-Person'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/sessions/${session.id}`)}
                            >
                              View Details
                            </Button>
                            {isUpcoming && (
                              <AllSessionsJoinButton
                                session={session}
                                currentUserId={user?.id}
                                onJoin={() => handleJoinSession(session)}
                                isUpcoming={isUpcoming}
                              />
                            )}
                            {isCompleted && session.recording?.recording_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(session.recording!.recording_url!, '_blank')}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Recording
                              </Button>
                            )}
                            {isCompleted && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link to={`/journal?session_id=${session.id}`}>
                                  <BookOpen className="w-4 h-4 mr-1" />
                                  Journal
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Completed Sessions Section */}
            {sessions.filter(s => s.status === 'completed').length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border"></div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Completed Sessions
                  </h3>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions
                    .filter(s => s.status === 'completed')
                    .map((session) => {
                      const scheduledDate = new Date(session.scheduled_at);
                      const isUpcoming = session.status === 'scheduled' || session.status === 'in_progress';
                      const isCompleted = session.status === 'completed';
                      
                      return (
                        <div
                          key={session.id}
                          className="p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={session.practitioner.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {session.practitioner.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{session.practitioner.name}</span>
                                {getStatusBadge(session.status)}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(scheduledDate, "MMM d, yyyy")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(scheduledDate, "h:mm a")} • {session.duration_minutes} min
                                </span>
                                {session.session_location && (
                                  <span className="flex items-center gap-1">
                                    {session.session_location === 'online' ? (
                                      <Video className="w-3 h-3" />
                                    ) : (
                                      <MapPin className="w-3 h-3" />
                                    )}
                                    {session.session_location === 'online' ? 'Online' : session.physical_location || 'In-Person'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/sessions/${session.id}`)}
                            >
                              View Details
                            </Button>
                            {isUpcoming && (
                              <AllSessionsJoinButton
                                session={session}
                                currentUserId={user?.id}
                                onJoin={() => handleJoinSession(session)}
                                isUpcoming={isUpcoming}
                              />
                            )}
                            {isCompleted && session.recording?.recording_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(session.recording!.recording_url!, '_blank')}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Recording
                              </Button>
                            )}
                            {isCompleted && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link to={`/journal?session_id=${session.id}`}>
                                  <BookOpen className="w-4 h-4 mr-1" />
                                  Journal
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Other Status Sessions (cancelled, etc.) */}
            {sessions.filter(s => s.status !== 'scheduled' && s.status !== 'in_progress' && s.status !== 'completed').length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border"></div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Other Sessions
                  </h3>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions
                    .filter(s => s.status !== 'scheduled' && s.status !== 'in_progress' && s.status !== 'completed')
                    .map((session) => {
                      const scheduledDate = new Date(session.scheduled_at);
                      const isUpcoming = session.status === 'scheduled' || session.status === 'in_progress';
                      const isCompleted = session.status === 'completed';
                      
                      return (
                        <div
                          key={session.id}
                          className="p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={session.practitioner.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {session.practitioner.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{session.practitioner.name}</span>
                                {getStatusBadge(session.status)}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(scheduledDate, "MMM d, yyyy")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(scheduledDate, "h:mm a")} • {session.duration_minutes} min
                                </span>
                                {session.session_location && (
                                  <span className="flex items-center gap-1">
                                    {session.session_location === 'online' ? (
                                      <Video className="w-3 h-3" />
                                    ) : (
                                      <MapPin className="w-3 h-3" />
                                    )}
                                    {session.session_location === 'online' ? 'Online' : session.physical_location || 'In-Person'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/sessions/${session.id}`)}
                            >
                              View Details
                            </Button>
                            {isUpcoming && (
                              <AllSessionsJoinButton
                                session={session}
                                currentUserId={user?.id}
                                onJoin={() => handleJoinSession(session)}
                                isUpcoming={isUpcoming}
                              />
                            )}
                            {isCompleted && session.recording?.recording_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(session.recording!.recording_url!, '_blank')}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Recording
                              </Button>
                            )}
                            {isCompleted && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link to={`/journal?session_id=${session.id}`}>
                                  <BookOpen className="w-4 h-4 mr-1" />
                                  Journal
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Reschedule Dialog */}
      <RescheduleDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        session={sessionToReschedule}
        onRescheduled={() => {
          fetchSessions();
          setRescheduleDialogOpen(false);
          setSessionToReschedule(null);
        }}
        isAdmin={isAdmin}
      />

      {/* Cancel Dialog */}
      <CancelSessionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        session={sessionToCancel}
        onCancelled={() => {
          fetchSessions();
          setCancelDialogOpen(false);
          setSessionToCancel(null);
        }}
        isAdmin={isAdmin}
      />
    </Card>
  );
};

