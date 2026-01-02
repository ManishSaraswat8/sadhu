import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, Check, X, Mail, Phone, MapPin, Calendar, Briefcase } from "lucide-react";
import { format } from "date-fns";

interface PractitionerApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  years_experience: string;
  specializations: string[];
  certifications: string | null;
  current_practice: string;
  personal_story: string;
  why_join: string;
  availability: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export const PractitionerApplications = () => {
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<PractitionerApplication | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: applications, isLoading } = useQuery({
    queryKey: ["practitioner-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practitioner_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PractitionerApplication[];
    },
  });

  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "approved" | "rejected";
      notes?: string;
    }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const reviewerId = sessionData?.session?.user?.id;

      const { error } = await supabase
        .from("practitioner_applications")
        .update({
          status,
          reviewed_by: reviewerId || null,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq("id", id);

      if (error) throw error;

      // If approved, create practitioner account
      if (status === "approved") {
        const application = applications?.find((app) => app.id === id);
        if (application) {
          let userId: string | null = null;

          // Try to create user account
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: application.email,
            password: crypto.randomUUID(),
            options: {
              data: { full_name: `${application.first_name} ${application.last_name}` },
            },
          });

          if (authError) {
            // If user already exists, try to get user ID from profiles
            if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", application.email)
                .single();

              if (profile) {
                userId = profile.id;
              } else {
                // Try RPC function if it exists
                try {
                  const { data: userIdData } = await supabase
                    .rpc('get_user_id_by_email' as any, { email_input: application.email }) as { data: string | null; error: any };
                  userId = userIdData;
                } catch {
                  // RPC might not exist, that's okay
                }
              }
            } else {
              throw new Error(`Failed to create user account: ${authError.message}`);
            }
          } else if (authData?.user) {
            userId = authData.user.id;
          }

          if (userId) {
            // Check if practitioner already exists
            const { data: existingPractitioner } = await supabase
              .from("practitioners")
              .select("id")
              .eq("user_id", userId)
              .single();

            if (!existingPractitioner) {
              // Create practitioner profile
              const { error: practitionerError } = await supabase
                .from("practitioners")
                .insert({
                  user_id: userId,
                  name: `${application.first_name} ${application.last_name}`,
                  bio: application.personal_story,
                  specialization: application.specializations.join(", "),
                  available: true,
                });

              if (practitionerError) {
                console.error("Error creating practitioner:", practitionerError);
                // Don't throw - application is already marked as approved
              } else {
                // Assign practitioner role
                await supabase
                  .from("user_roles")
                  .upsert({
                    user_id: userId,
                    role: "practitioner",
                  }, { onConflict: 'user_id,role' });
              }
            }
          } else {
            console.warn("Could not create or find user account for approved application");
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practitioner-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-practitioners"] });
      setIsViewDialogOpen(false);
      setReviewNotes("");
      toast.success("Application status updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleView = (application: PractitionerApplication) => {
    setSelectedApplication(application);
    setReviewNotes(application.review_notes || "");
    setIsViewDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedApplication) return;
    updateApplicationStatusMutation.mutate({
      id: selectedApplication.id,
      status: "approved",
      notes: reviewNotes,
    });
  };

  const handleReject = () => {
    if (!selectedApplication) return;
    updateApplicationStatusMutation.mutate({
      id: selectedApplication.id,
      status: "rejected",
      notes: reviewNotes,
    });
  };

  const pendingApplications = applications?.filter((app) => app.status === "pending") || [];
  const reviewedApplications = applications?.filter((app) => app.status !== "pending") || [];

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
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Practitioner Applications
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve new practitioner applications
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            {pendingApplications.length} Pending
          </Badge>
          <Badge variant="outline" className="text-sm">
            {reviewedApplications.length} Reviewed
          </Badge>
        </div>
      </div>

      {/* Pending Applications */}
      {pendingApplications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Pending Review</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">
                      {application.first_name} {application.last_name}
                    </TableCell>
                    <TableCell>{application.email}</TableCell>
                    <TableCell>
                      {application.city}, {application.country}
                    </TableCell>
                    <TableCell>{application.years_experience} years</TableCell>
                    <TableCell>
                      {format(new Date(application.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(application)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Reviewed Applications */}
      {reviewedApplications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Reviewed</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewedApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">
                      {application.first_name} {application.last_name}
                    </TableCell>
                    <TableCell>{application.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={application.status === "approved" ? "default" : "destructive"}
                      >
                        {application.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {application.reviewed_at
                        ? format(new Date(application.reviewed_at), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(application)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {applications?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No applications found.</p>
        </div>
      )}

      {/* View/Review Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Application Review: {selectedApplication?.first_name}{" "}
              {selectedApplication?.last_name}
            </DialogTitle>
            <DialogDescription>
              Review the application details and approve or reject
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedApplication.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedApplication.phone}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedApplication.city}, {selectedApplication.country}
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Experience */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Professional Experience</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Years of Experience</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {selectedApplication.years_experience}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Availability</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {selectedApplication.availability}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Specializations</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedApplication.specializations.map((spec, idx) => (
                      <Badge key={idx} variant="outline">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                {selectedApplication.certifications && (
                  <div>
                    <Label className="text-muted-foreground">Certifications</Label>
                    <p className="mt-2 text-sm whitespace-pre-wrap">
                      {selectedApplication.certifications}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Current Practice</Label>
                  <p className="mt-2 text-sm whitespace-pre-wrap">
                    {selectedApplication.current_practice}
                  </p>
                </div>
              </div>

              {/* Personal Story */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Personal Journey</h3>
                <p className="text-sm whitespace-pre-wrap">{selectedApplication.personal_story}</p>
              </div>

              {/* Why Join */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Why Sadhu?</h3>
                <p className="text-sm whitespace-pre-wrap">{selectedApplication.why_join}</p>
              </div>

              {/* Review Notes */}
              {selectedApplication.status === "pending" && (
                <div className="space-y-2">
                  <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                  <Textarea
                    id="review-notes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add any notes about this application..."
                    className="min-h-[100px]"
                  />
                </div>
              )}

              {selectedApplication.review_notes && (
                <div className="space-y-2">
                  <Label>Previous Review Notes</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedApplication.review_notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedApplication.status === "pending" && (
                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={updateApplicationStatusMutation.isPending}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={updateApplicationStatusMutation.isPending}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

