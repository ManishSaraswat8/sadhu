import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, User, ClipboardList, Loader2 } from "lucide-react";
import { ActionChecklist } from "@/components/ActionChecklist";

interface Client {
  id: string;
  client_id: string;
  full_name?: string;
  email?: string;
}

interface PractitionerClientsProps {
  practitionerId: string;
}

export const PractitionerClients = ({ practitionerId }: PractitionerClientsProps) => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, [practitionerId]);

  const fetchClients = async () => {
    try {
      // First, get clients from practitioner_assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from("practitioner_assignments")
        .select("id, client_id")
        .eq("practitioner_id", practitionerId);

      // Also get unique clients from sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("session_schedules")
        .select("client_id")
        .eq("practitioner_id", practitionerId);

      if (assignmentsError || sessionsError) {
        toast({
          title: "Error",
          description: "Could not load clients.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Combine both sources and get unique client IDs
      const assignmentClientIds = new Set((assignments || []).map(a => a.client_id));
      const sessionClientIds = new Set((sessions || []).map(s => s.client_id));
      
      // Merge both sets
      const allClientIds = Array.from(new Set([...assignmentClientIds, ...sessionClientIds]));

      if (allClientIds.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      // Fetch client profiles for all unique client IDs
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles" as never)
        .select("id, full_name, email")
        .in("id", allClientIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        // Still show clients even if profile fetch fails
      }

      // Create a map of client_id to profile data
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Create client objects with profile information
      const clientsList = allClientIds.map(clientId => {
        const profile = profileMap.get(clientId);
        return {
          id: clientId,
          client_id: clientId,
          full_name: profile?.full_name || undefined,
          email: profile?.email || undefined,
        };
      });

      setClients(clientsList);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "Could not load clients.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (selectedClientId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedClientId(null)}>
          ← Back to Clients
        </Button>
        <ActionChecklist clientId={selectedClientId} practitionerId={practitionerId} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Your Clients
        </CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No clients assigned yet</p>
            <p className="text-sm mt-1">Contact an admin to get clients assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-background"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground capitalize">
                      {client.full_name || "Client"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {client.email || `ID: ${client.client_id.slice(0, 8)}...`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedClientId(client.client_id)}
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Manage Checklist
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
