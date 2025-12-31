import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Calendar, Users, DollarSign } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Practitioner = Tables<"practitioners">;

interface PractitionerFormData {
  name: string;
  email: string;
  bio: string;
  specialization: string;
  half_hour_rate: string;
  available: boolean;
}

interface PractitionerListProps {
  onManageAvailability: (practitioner: Practitioner) => void;
  onManageClients: (practitioner: Practitioner) => void;
  onManageEarnings: (practitioner: Practitioner) => void;
}

export const PractitionerList = ({
  onManageAvailability,
  onManageClients,
  onManageEarnings,
}: PractitionerListProps) => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPractitioner, setEditingPractitioner] = useState<Practitioner | null>(null);
  const [formData, setFormData] = useState<PractitionerFormData>({
    name: "",
    email: "",
    bio: "",
    specialization: "",
    half_hour_rate: "",
    available: true,
  });

  const { data: practitioners, isLoading } = useQuery({
    queryKey: ["admin-practitioners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practitioners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Practitioner[];
    },
  });

  const createPractitionerMutation = useMutation({
    mutationFn: async (data: PractitionerFormData) => {
      let userId: string;

      // Try to create a new user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: crypto.randomUUID(),
        options: {
          data: { full_name: data.name },
        },
      });

      if (authError) {
        // If user already exists, look up their ID via database function
        if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
          const { data: existingUserId, error: lookupError } = await supabase
            .rpc('get_user_id_by_email' as any, { email_input: data.email }) as { data: string | null; error: any };
          
          if (lookupError || !existingUserId) {
            throw new Error(`User ${data.email} exists but cannot be linked. Please contact support.`);
          }
          userId = existingUserId;
        } else {
          throw authError;
        }
      } else if (!authData.user) {
        throw new Error("Failed to create user");
      } else {
        userId = authData.user.id;
      }

      // Check if practitioner profile already exists
      const { data: existingPractitioner } = await supabase
        .from("practitioners")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingPractitioner) {
        throw new Error("This user is already a practitioner");
      }

      // Create practitioner profile
      const { error: practitionerError } = await supabase
        .from("practitioners")
        .insert({
          user_id: userId,
          name: data.name,
          bio: data.bio || null,
          specialization: data.specialization || null,
          half_hour_rate: data.half_hour_rate ? parseFloat(data.half_hour_rate) : null,
          available: data.available,
        });

      if (practitionerError) throw practitionerError;

      // Assign practitioner role (if not already assigned)
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: "practitioner",
        }, { onConflict: 'user_id,role' });

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-practitioners"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("Practitioner added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updatePractitionerMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PractitionerFormData>;
    }) => {
      const { error } = await supabase
        .from("practitioners")
        .update({
          name: data.name,
          bio: data.bio || null,
          specialization: data.specialization || null,
          half_hour_rate: data.half_hour_rate ? parseFloat(data.half_hour_rate) : null,
          available: data.available,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-practitioners"] });
      setEditingPractitioner(null);
      resetForm();
      toast.success("Practitioner updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deletePractitionerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("practitioners")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-practitioners"] });
      toast.success("Practitioner removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      bio: "",
      specialization: "",
      half_hour_rate: "",
      available: true,
    });
  };

  const handleEdit = (practitioner: Practitioner) => {
    setEditingPractitioner(practitioner);
    setFormData({
      name: practitioner.name,
      email: "",
      bio: practitioner.bio || "",
      specialization: practitioner.specialization || "",
      half_hour_rate: (practitioner as any).half_hour_rate?.toString() || "",
      available: practitioner.available,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPractitioner) {
      updatePractitionerMutation.mutate({
        id: editingPractitioner.id,
        data: formData,
      });
    } else {
      createPractitionerMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-semibold text-foreground">
          Practitioners
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Practitioner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Practitioner</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                  placeholder="e.g., Stress Management, Pain Therapy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Brief description about the practitioner..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="half_hour_rate">½ Hour Rate ($)</Label>
                <Input
                  id="half_hour_rate"
                  type="number"
                  step="0.01"
                  value={formData.half_hour_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, half_hour_rate: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="available">Available for Booking</Label>
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, available: checked })
                  }
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createPractitionerMutation.isPending}
              >
                {createPractitionerMutation.isPending
                  ? "Adding..."
                  : "Add Practitioner"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingPractitioner}
        onOpenChange={(open) => !open && setEditingPractitioner(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Practitioner</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-specialization">Specialization</Label>
              <Input
                id="edit-specialization"
                value={formData.specialization}
                onChange={(e) =>
                  setFormData({ ...formData, specialization: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-half_hour_rate">½ Hour Rate ($)</Label>
              <Input
                id="edit-half_hour_rate"
                type="number"
                step="0.01"
                value={formData.half_hour_rate}
                onChange={(e) =>
                  setFormData({ ...formData, half_hour_rate: e.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-available">Available for Booking</Label>
              <Switch
                id="edit-available"
                checked={formData.available}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, available: checked })
                }
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={updatePractitionerMutation.isPending}
            >
              {updatePractitionerMutation.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Practitioners Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {practitioners?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No practitioners added yet
                </TableCell>
              </TableRow>
            )}
            {practitioners?.map((practitioner) => (
              <TableRow key={practitioner.id}>
                <TableCell className="font-medium">{practitioner.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {practitioner.specialization || "—"}
                </TableCell>
                <TableCell>
                  {(practitioner as any).half_hour_rate
                    ? `$${(practitioner as any).half_hour_rate}/30min`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={practitioner.available ? "default" : "secondary"}>
                    {practitioner.available ? "Available" : "Unavailable"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onManageAvailability(practitioner)}
                      title="Manage Availability"
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onManageClients(practitioner)}
                      title="Manage Clients"
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onManageEarnings(practitioner)}
                      title="View Earnings"
                    >
                      <DollarSign className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(practitioner)}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to remove this practitioner?")) {
                          deletePractitionerMutation.mutate(practitioner.id);
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
