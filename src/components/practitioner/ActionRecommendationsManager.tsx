import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Target, Users, Calendar, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ActionRecommendation {
  id: string;
  title: string;
  description: string | null;
  action_type: string;
  frequency: string | null;
  due_date: string | null;
  completed: boolean;
  client_id: string;
  session_id: string;
  client?: {
    email: string;
  };
  session?: {
    scheduled_at: string;
  };
}

interface Client {
  id: string;
  email?: string;
  full_name?: string;
}

interface Session {
  id: string;
  scheduled_at: string;
  client_id: string;
}

interface PractitionerActionRecommendationsManagerProps {
  practitionerId: string;
}

const ACTION_TEMPLATES = [
  {
    title: "Daily Breathing Practice",
    description: "Practice deep breathing exercises for 10 minutes each morning",
    action_type: "daily_practice",
    frequency: "daily",
  },
  {
    title: "Mindful Walking",
    description: "Take a 20-minute mindful walk, focusing on each step",
    action_type: "mindfulness",
    frequency: "daily",
  },
  {
    title: "Body Scan Meditation",
    description: "Perform a full body scan meditation before bed",
    action_type: "mindfulness",
    frequency: "daily",
  },
  {
    title: "Gentle Stretching",
    description: "Do 15 minutes of gentle stretching exercises",
    action_type: "physical",
    frequency: "daily",
  },
  {
    title: "Gratitude Journal",
    description: "Write down 3 things you're grateful for each day",
    action_type: "emotional",
    frequency: "daily",
  },
];

export const ActionRecommendationsManager = ({
  practitionerId,
}: PractitionerActionRecommendationsManagerProps) => {
  const { toast } = useToast();
  const [actions, setActions] = useState<ActionRecommendation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clientNames, setClientNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<string>('daily_practice');
  const [frequency, setFrequency] = useState<string>('not_specified');
  const [dueDate, setDueDate] = useState<string>('');

  useEffect(() => {
    fetchActions();
    fetchClients();
  }, [practitionerId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientSessions(selectedClientId);
    }
  }, [selectedClientId]);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('action_recommendations')
        .select(`
          *,
          session:session_schedules (
            scheduled_at
          )
        `)
        .eq('practitioner_id', practitionerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching actions:', error);
        throw error;
      }
      
      console.log('Fetched actions:', data);
      setActions((data as any) || []);
      
      // Fetch client names for display
      if (data && data.length > 0) {
        const clientIds = [...new Set(data.map((a: any) => a.client_id))];
        const { data: profiles } = await supabase
          .from('profiles' as never)
          .select('id, full_name, email')
          .in('id', clientIds);
        
        if (profiles) {
          const nameMap = new Map<string, string>();
          profiles.forEach(profile => {
            nameMap.set((profile as any).id as string, (profile as any).full_name || (profile as any).email || `Client ${(profile as any).id.slice(0, 8)}...`);
          });
          setClientNames(nameMap);
        }
      }
    } catch (error: any) {
      console.error('Error fetching actions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not load action recommendations.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      // Get clients from practitioner assignments
      const { data: assignmentsData } = await supabase
        .from('practitioner_assignments')
        .select('client_id')
        .eq('practitioner_id', practitionerId);

      // Also get clients from sessions
      const { data: sessionsData } = await supabase
        .from('session_schedules')
        .select('client_id')
        .eq('practitioner_id', practitionerId)
        .not('client_id', 'is', null);

      const allClientIds = [
        ...(assignmentsData?.map(a => a.client_id) || []),
        ...(sessionsData?.map(s => s.client_id) || []),
      ];
      const uniqueClientIds = [...new Set(allClientIds)];

      if (uniqueClientIds.length === 0) {
        setClients([]);
        return;
      }

      // Fetch client profiles from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles' as never)
        .select('id, full_name, email')
        .in('id', uniqueClientIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Fallback to IDs if profile fetch fails
        const clientList = uniqueClientIds.map(id => ({
          id,
          email: id.substring(0, 8) + '...',
        }));
        setClients(clientList);
        return;
      }

      // Create a map of client_id to profile data
      const profileMap = new Map((profiles || []).map((p: any) => [(p as any).id as string, p]));

      // Create client list with profile information
      const clientList = uniqueClientIds.map(id => {
        const profile = profileMap.get(id);
        return {
          id,
          full_name: (profile as any).full_name || undefined,
          email: (profile as any).email || undefined,
        };
      });

      setClients(clientList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchClientSessions = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('session_schedules')
        .select('id, scheduled_at, client_id')
        .eq('practitioner_id', practitionerId)
        .eq('client_id', clientId)
        .order('scheduled_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessions((data || []) as Session[]);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleCreateAction = async () => {
    if (!selectedClientId || !title) {
      toast({
        title: 'Missing Information',
        description: 'Please select a client and enter a title.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      const { error } = await supabase
        .from('action_recommendations')
        .insert({
          practitioner_id: practitionerId,
          client_id: selectedClientId,
          session_id: selectedSessionId && selectedSessionId !== 'none' ? selectedSessionId : null,
          title,
          description: description || null,
          action_type: actionType,
          frequency: frequency && frequency !== 'not_specified' ? frequency : null,
          due_date: dueDate || null,
        });

      if (error) throw error;

      toast({
        title: 'Action Created',
        description: 'Action recommendation has been created for the client.',
      });

      // Reset form
      setSelectedClientId('');
      setSelectedSessionId('');
      setTitle('');
      setDescription('');
      setActionType('daily_practice');
      setFrequency('not_specified');
      setDueDate('');
      setDialogOpen(false);

      await fetchActions();
    } catch (error: any) {
      console.error('Error creating action:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not create action recommendation.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const useTemplate = (template: typeof ACTION_TEMPLATES[0]) => {
    setTitle(template.title);
    setDescription(template.description);
    setActionType(template.action_type);
    setFrequency(template.frequency);
  };

  const getActionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      daily_practice: "bg-blue-500/10 text-blue-500",
      mindfulness: "bg-purple-500/10 text-purple-500",
      physical: "bg-green-500/10 text-green-500",
      emotional: "bg-pink-500/10 text-pink-500",
      other: "bg-gray-500/10 text-gray-500",
    };
    return colors[type] || colors.other;
  };

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Action Recommendations
              </CardTitle>
              <CardDescription>
                Create and manage action recommendations for your clients
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Action
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Action Recommendation</DialogTitle>
                  <DialogDescription>
                    Assign a practice or action for your client to complete
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Templates */}
                  <div>
                    <Label>Quick Templates</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {ACTION_TEMPLATES.map((template, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => useTemplate(template)}
                          className="text-left h-auto py-2"
                        >
                          <div className="flex-1">
                            <p className="text-xs font-medium">{template.title}</p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Client Selection */}
                  <div>
                    <Label htmlFor="client">Client *</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger id="client">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.full_name || client.email || `Client ${client.id.slice(0, 8)}...`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Session Selection (Optional) */}
                  {selectedClientId && sessions.length > 0 && (
                    <div>
                      <Label htmlFor="session">Link to Session (Optional)</Label>
                      <Select 
                        value={selectedSessionId || 'none'} 
                        onValueChange={(value) => setSelectedSessionId(value === 'none' ? '' : value)}
                      >
                        <SelectTrigger id="session">
                          <SelectValue placeholder="Select a session" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific session</SelectItem>
                          {sessions.map((session) => (
                            <SelectItem key={session.id} value={session.id}>
                              {format(new Date(session.scheduled_at), 'MMM d, yyyy')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Daily Breathing Practice"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide details about the action..."
                      rows={3}
                    />
                  </div>

                  {/* Action Type */}
                  <div>
                    <Label htmlFor="action-type">Action Type *</Label>
                    <Select value={actionType} onValueChange={setActionType}>
                      <SelectTrigger id="action-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily_practice">Daily Practice</SelectItem>
                        <SelectItem value="mindfulness">Mindfulness</SelectItem>
                        <SelectItem value="physical">Physical</SelectItem>
                        <SelectItem value="emotional">Emotional</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Frequency */}
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_specified">Not specified</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="as needed">As Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <Label htmlFor="due-date">Due Date (Optional)</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAction} disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Action'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No action recommendations created yet</p>
              <p className="text-sm mt-1">Create your first action recommendation above</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell className="capitalize">
                      {clientNames.get(action.client_id) || `Client ${action.client_id.substring(0, 8)}...`}
                    </TableCell>
                    <TableCell className="font-medium">{action.title}</TableCell>
                    <TableCell>
                      <Badge className={getActionTypeColor(action.action_type)}>
                        {action.action_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{action.frequency || 'N/A'}</TableCell>
                    <TableCell>
                      {action.due_date
                        ? format(new Date(action.due_date), 'MMM d, yyyy')
                        : 'No due date'}
                    </TableCell>
                    <TableCell>
                      {action.completed ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
                          Pending
                        </Badge>
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
  );
};

