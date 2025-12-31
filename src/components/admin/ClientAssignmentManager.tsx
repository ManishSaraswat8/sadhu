import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Practitioner = Tables<"practitioners">;

interface ClientAssignmentManagerProps {
  practitioner: Practitioner;
  onBack: () => void;
}

interface Assignment {
  id: string;
  client_id: string;
  created_at: string;
}

export const ClientAssignmentManager = ({
  practitioner,
  onBack,
}: ClientAssignmentManagerProps) => {
  const queryClient = useQueryClient();
  const [clientEmail, setClientEmail] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; email: string }[] | null
  >(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["practitioner-assignments", practitioner.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practitioner_assignments")
        .select("*")
        .eq("practitioner_id", practitioner.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Assignment[];
    },
  });

  const searchClients = async () => {
    if (!clientEmail.trim()) return;
    
    setIsSearching(true);
    try {
      // Since we can't query auth.users directly, we'll need to match by checking
      // if the user exists when we try to assign them
      setSearchResults([{ id: clientEmail, email: clientEmail }]);
    } finally {
      setIsSearching(false);
    }
  };

  const assignClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      // Check if already assigned
      const { data: existing } = await supabase
        .from("practitioner_assignments")
        .select("id")
        .eq("practitioner_id", practitioner.id)
        .eq("client_id", clientId)
        .maybeSingle();

      if (existing) {
        throw new Error("Client is already assigned to this practitioner");
      }

      const { error } = await supabase.from("practitioner_assignments").insert({
        practitioner_id: practitioner.id,
        client_id: clientId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["practitioner-assignments", practitioner.id],
      });
      setClientEmail("");
      setSearchResults(null);
      toast.success("Client assigned successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const unassignClientMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("practitioner_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["practitioner-assignments", practitioner.id],
      });
      toast.success("Client unassigned successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Manage Client Assignments
          </h2>
          <p className="text-muted-foreground">{practitioner.name}</p>
        </div>
      </div>

      {/* Assign New Client */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-medium text-foreground mb-4">Assign Client</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Client User ID</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter client user ID (UUID)"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (clientEmail.trim()) {
                      assignClientMutation.mutate(clientEmail.trim());
                    }
                  }}
                  disabled={!clientEmail.trim() || assignClientMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Assign
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the UUID of the client you want to assign to this practitioner.
                You can find user IDs in the backend Users section.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Clients List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground">Assigned Clients</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Assigned On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No clients assigned yet
                  </TableCell>
                </TableRow>
              )}
              {assignments?.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-mono text-sm">
                    {assignment.client_id}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(assignment.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to unassign this client?")) {
                          unassignClientMutation.mutate(assignment.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
