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
import { Loader2, Plus, Link2, Unlink, Calendar, Video, MapPin, Users, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Session = Tables<"session_schedules"> & {
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

  // Form state for creating correlated sessions
  const [onlineSessionId, setOnlineSessionId] = useState<string>('');
  const [inPersonSessionId, setInPersonSessionId] = useState<string>('');

  useEffect(() => {
    fetchSessions();
  }, [filter]);

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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Correlation
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

