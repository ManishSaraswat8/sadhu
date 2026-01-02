import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2, Plus, Link2, Unlink, Calendar, Video, MapPin, Users, Search, Check, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Session = Tables<"session_schedules"> & {
  class_name?: string | null;
  practitioner?: {
    name: string;
  };
  correlated_session?: Session | null;
};

// Helper function to safely format dates
const safeFormatDate = (dateString: string | null | undefined, formatString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return format(date, formatString);
};

export const AdminGroupSessions = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'all' | 'correlated' | 'uncorrelated'>('all');
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);

  // Form state for creating correlated sessions
  const [onlineSessionId, setOnlineSessionId] = useState<string>('');
  const [inPersonSessionId, setInPersonSessionId] = useState<string>('');

  // Form state for creating group sessions
  const [groupPractitionerId, setGroupPractitionerId] = useState<string>('');
  const [groupDate, setGroupDate] = useState<string>('');
  const [groupTime, setGroupTime] = useState<string>('');
  const [groupDuration, setGroupDuration] = useState<number>(60);
  const [groupMaxParticipants, setGroupMaxParticipants] = useState<number>(10);
  const [groupLocation, setGroupLocation] = useState<'online' | 'in_person'>('online');
  const [groupPhysicalLocation, setGroupPhysicalLocation] = useState<string>('');
  const [groupClassName, setGroupClassName] = useState<string>('');
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editingClassName, setEditingClassName] = useState<string>('');

  useEffect(() => {
    fetchSessions();
    fetchPractitioners();
  }, [filter]);

  const fetchPractitioners = async () => {
    try {
      const { data, error } = await supabase
        .from("practitioners")
        .select("id, name")
        .eq("available", true)
        .order("name");

      if (error) throw error;
      setPractitioners(data || []);
    } catch (error: any) {
      console.error("Error fetching practitioners:", error);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("session_schedules")
        .select(`
          *,
          practitioner:practitioners (
            name
          ),
          correlated_session:session_schedules!correlated_session_id (
            id,
            scheduled_at,
            session_location,
            physical_location,
            max_participants,
            current_participants,
            practitioner:practitioners (
              name
            )
          )
        `)
        .order("scheduled_at", { ascending: false });

      // Apply filter
      if (filter === 'correlated') {
        query = query.not('correlated_session_id', 'is', null);
      } else if (filter === 'uncorrelated') {
        query = query.is('correlated_session_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: error.message || "Could not load sessions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCorrelation = async () => {
    if (!onlineSessionId || !inPersonSessionId) {
      toast({
        title: "Missing Information",
        description: "Please select both online and in-person sessions.",
        variant: "destructive",
      });
      return;
    }

    if (onlineSessionId === inPersonSessionId) {
      toast({
        title: "Invalid Selection",
        description: "Online and in-person sessions must be different.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      // Verify sessions exist and have correct locations
      const { data: sessionsData, error: fetchError } = await supabase
        .from("session_schedules")
        .select("id, session_location")
        .in("id", [onlineSessionId, inPersonSessionId]);

      if (fetchError || !sessionsData || sessionsData.length !== 2) {
        throw new Error("Could not verify sessions");
      }

      const onlineSession = sessionsData.find(s => s.id === onlineSessionId);
      const inPersonSession = sessionsData.find(s => s.id === inPersonSessionId);

      if (!onlineSession || onlineSession.session_location !== 'online') {
        throw new Error("First session must be an online session");
      }

      if (!inPersonSession || inPersonSession.session_location !== 'in_person') {
        throw new Error("Second session must be an in-person session");
      }

      // Create bidirectional correlation
      // Link online -> in-person
      const { error: error1 } = await supabase
        .from("session_schedules")
        .update({ correlated_session_id: inPersonSessionId })
        .eq("id", onlineSessionId);

      if (error1) throw error1;

      // Link in-person -> online
      const { error: error2 } = await supabase
        .from("session_schedules")
        .update({ correlated_session_id: onlineSessionId })
        .eq("id", inPersonSessionId);

      if (error2) throw error2;

      toast({
        title: "Sessions Correlated",
        description: "The sessions have been successfully linked.",
      });

      setDialogOpen(false);
      setOnlineSessionId('');
      setInPersonSessionId('');
      await fetchSessions();
    } catch (error: any) {
      console.error("Error creating correlation:", error);
      toast({
        title: "Error",
        description: error.message || "Could not create correlation.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGroupSession = async () => {
    if (!groupPractitionerId || !groupDate || !groupTime || !groupMaxParticipants || !groupClassName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including class name.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      // Parse date and time
      const [hours, minutes] = groupTime.split(":").map(Number);
      const scheduledDate = new Date(groupDate);
      scheduledDate.setHours(hours, minutes, 0, 0);

      // Generate unique room name
      const roomName = `group-${groupPractitionerId.substring(0, 8)}-${Date.now()}`;

      // Get admin user ID for placeholder client_id (or use first admin)
      const { data: adminUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1);

      const placeholderClientId = adminUsers?.[0]?.user_id;
      if (!placeholderClientId) {
        throw new Error("No admin user found for placeholder");
      }

      // Create group session
      const sessionData: any = {
        practitioner_id: groupPractitionerId,
        client_id: placeholderClientId, // Placeholder - will be replaced when clients join
        scheduled_at: scheduledDate.toISOString(),
        duration_minutes: groupDuration,
        max_participants: groupMaxParticipants,
        current_participants: 0, // Start with 0, clients will join
        session_location: groupLocation,
        physical_location: groupLocation === 'in_person' ? groupPhysicalLocation : null,
        room_name: roomName,
        class_name: groupClassName, // Custom class name set by admin
        status: "scheduled",
        notes: "Pre-scheduled group class created by admin",
      };
      
      const { error } = await supabase
        .from("session_schedules")
        .insert(sessionData);

      if (error) throw error;

      toast({
        title: "Group Class Created",
        description: "The group class has been successfully created.",
      });

      setCreateGroupDialogOpen(false);
      // Reset form
      setGroupPractitionerId('');
      setGroupDate('');
      setGroupTime('');
      setGroupDuration(60);
      setGroupMaxParticipants(10);
      setGroupLocation('online');
      setGroupPhysicalLocation('');
      setGroupClassName('');
      await fetchSessions();
    } catch (error: any) {
      console.error("Error creating group session:", error);
      toast({
        title: "Error",
        description: error.message || "Could not create group class.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateClassName = async (sessionId: string, newClassName: string) => {
    try {
      const { error } = await supabase
        .from("session_schedules")
        .update({ class_name: newClassName || null } as any)
        .eq("id", sessionId);

      if (error) throw error;

      toast({
        title: "Class Name Updated",
        description: "The class name has been successfully updated.",
      });

      setEditingSession(null);
      setEditingClassName('');
      await fetchSessions();
    } catch (error: any) {
      console.error("Error updating class name:", error);
      toast({
        title: "Error",
        description: error.message || "Could not update class name.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCorrelation = async (sessionId: string) => {
    try {
      // Get the correlated session ID
      const session = sessions.find(s => s.id === sessionId);
      if (!session?.correlated_session_id) return;

      const correlatedId = session.correlated_session_id;

      // Remove correlation from both sessions
      const { error: error1 } = await supabase
        .from("session_schedules")
        .update({ correlated_session_id: null })
        .eq("id", sessionId);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from("session_schedules")
        .update({ correlated_session_id: null })
        .eq("id", correlatedId);

      if (error2) throw error2;

      toast({
        title: "Correlation Removed",
        description: "The sessions have been unlinked.",
      });

      await fetchSessions();
    } catch (error: any) {
      console.error("Error removing correlation:", error);
      toast({
        title: "Error",
        description: error.message || "Could not remove correlation.",
        variant: "destructive",
      });
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        session.practitioner?.name?.toLowerCase().includes(searchLower) ||
        session.physical_location?.toLowerCase().includes(searchLower) ||
        session.id.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Get available sessions for correlation dropdowns
  const availableOnlineSessions = sessions.filter(
    s => s.session_location === 'online' && !s.correlated_session_id
  );
  const availableInPersonSessions = sessions.filter(
    s => s.session_location === 'in_person' && !s.correlated_session_id
  );

  return (
    <AdminLayout title="Group Session Correlation">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading font-bold">Group Session Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Link online and in-person sessions to create correlated group sessions
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={createGroupDialogOpen} onOpenChange={setCreateGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group Class
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Group Class</DialogTitle>
                  <DialogDescription>
                    Create a pre-scheduled group class that clients can join.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="group-practitioner">Practitioner *</Label>
                    <Select value={groupPractitionerId} onValueChange={setGroupPractitionerId}>
                      <SelectTrigger id="group-practitioner">
                        <SelectValue placeholder="Select practitioner" />
                      </SelectTrigger>
                      <SelectContent>
                        {practitioners.map((practitioner) => (
                          <SelectItem key={practitioner.id} value={practitioner.id}>
                            {practitioner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="group-class-name">Class Name *</Label>
                    <Input
                      id="group-class-name"
                      placeholder="e.g., Letting Go, Morning Flow, Deep Release"
                      value={groupClassName}
                      onChange={(e) => setGroupClassName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Give this class a unique name that identifies it (e.g., "Letting Go" for Emma Rodrigues' 11:00 class)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="group-date">Date *</Label>
                      <Input
                        id="group-date"
                        type="date"
                        value={groupDate}
                        onChange={(e) => setGroupDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="group-time">Time *</Label>
                      <Input
                        id="group-time"
                        type="time"
                        value={groupTime}
                        onChange={(e) => setGroupTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="group-duration">Duration (minutes) *</Label>
                      <Select value={groupDuration.toString()} onValueChange={(v) => setGroupDuration(parseInt(v))}>
                        <SelectTrigger id="group-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">60 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="group-max-participants">Max Participants *</Label>
                      <Input
                        id="group-max-participants"
                        type="number"
                        min="2"
                        value={groupMaxParticipants}
                        onChange={(e) => setGroupMaxParticipants(parseInt(e.target.value) || 10)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="group-location">Location *</Label>
                    <Select value={groupLocation} onValueChange={(v) => setGroupLocation(v as 'online' | 'in_person')}>
                      <SelectTrigger id="group-location">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="in_person">In-Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {groupLocation === 'in_person' && (
                    <div>
                      <Label htmlFor="group-physical-location">Physical Location *</Label>
                      <Input
                        id="group-physical-location"
                        placeholder="Enter studio address"
                        value={groupPhysicalLocation}
                        onChange={(e) => setGroupPhysicalLocation(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreateGroupDialogOpen(false);
                        setGroupPractitionerId('');
                        setGroupDate('');
                        setGroupTime('');
                        setGroupDuration(60);
                        setGroupMaxParticipants(10);
                        setGroupLocation('online');
                        setGroupPhysicalLocation('');
                        setGroupClassName('');
                      }}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateGroupSession} disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Group Class
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Link2 className="w-4 h-4 mr-2" />
                  Link Sessions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Session Correlation</DialogTitle>
                <DialogDescription>
                  Link an online session with an in-person session to create a correlated group session.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="online-session">Online Session *</Label>
                  <Select value={onlineSessionId} onValueChange={setOnlineSessionId}>
                    <SelectTrigger id="online-session">
                      <SelectValue placeholder="Select online session" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOnlineSessions.length === 0 ? (
                        <SelectItem value="none" disabled>No available online sessions</SelectItem>
                      ) : (
                        availableOnlineSessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {safeFormatDate(session.scheduled_at, "MMM d, yyyy h:mm a")} - {session.practitioner?.name} ({session.max_participants} max)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="in-person-session">In-Person Session *</Label>
                  <Select value={inPersonSessionId} onValueChange={setInPersonSessionId}>
                    <SelectTrigger id="in-person-session">
                      <SelectValue placeholder="Select in-person session" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInPersonSessions.length === 0 ? (
                        <SelectItem value="none" disabled>No available in-person sessions</SelectItem>
                      ) : (
                        availableInPersonSessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {safeFormatDate(session.scheduled_at, "MMM d, yyyy h:mm a")} - {session.practitioner?.name} ({session.max_participants} max)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setOnlineSessionId('');
                      setInPersonSessionId('');
                    }}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCorrelation} disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 mr-2" />
                        Create Correlation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by practitioner, location, or session ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="correlated">Correlated Only</SelectItem>
              <SelectItem value="uncorrelated">Uncorrelated Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>
              Manage session correlations and participant limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No sessions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Practitioner</TableHead>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Correlated Session</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {safeFormatDate(session.scheduled_at, "MMM d, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {safeFormatDate(session.scheduled_at, "h:mm a")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {session.practitioner?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {editingSession?.id === session.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingClassName}
                              onChange={(e) => setEditingClassName(e.target.value)}
                              className="h-8 w-40"
                              placeholder="Class name"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateClassName(session.id, editingClassName)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingSession(null);
                                setEditingClassName('');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={session.class_name ? 'font-medium' : 'text-muted-foreground italic'}>
                              {session.class_name || 'No name'}
                            </span>
                            {(session.max_participants || 1) > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingSession(session);
                                  setEditingClassName(session.class_name || '');
                                }}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {session.session_location === 'online' ? (
                            <Video className="w-4 h-4 text-primary" />
                          ) : (
                            <MapPin className="w-4 h-4 text-primary" />
                          )}
                          <div>
                            <Badge variant="outline">
                              {session.session_location === 'online' ? 'Online' : 'In-Person'}
                            </Badge>
                            {session.physical_location && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {session.physical_location}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {session.current_participants || 0} / {session.max_participants || 1}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {session.correlated_session ? (
                          <div className="space-y-1">
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <Link2 className="w-3 h-3" />
                              Linked
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {safeFormatDate(session.correlated_session?.scheduled_at, "MMM d, h:mm a")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {session.correlated_session.session_location === 'online' ? 'Online' : 'In-Person'}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline">Not Linked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.correlated_session ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveCorrelation(session.id)}
                          >
                            <Unlink className="w-4 h-4 mr-2" />
                            Unlink
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminGroupSessions;

