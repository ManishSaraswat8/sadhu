import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit2, MapPin, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface StudioLocation {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  province_state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const StudioLocationsManager = () => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<StudioLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StudioLocation | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    province_state: "",
    country: "CA",
    postal_code: "",
    is_active: true,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("studio_locations" as any)
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setLocations((data || []) as StudioLocation[]);
    } catch (error: any) {
      console.error("Error fetching studio locations:", error);
      toast({
        title: "Error",
        description: "Failed to load studio locations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (location?: StudioLocation) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address,
        city: location.city || "",
        province_state: location.province_state || "",
        country: location.country || "CA",
        postal_code: location.postal_code || "",
        is_active: location.is_active,
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: "",
        address: "",
        city: "",
        province_state: "",
        country: "CA",
        postal_code: "",
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.address) {
      toast({
        title: "Validation Error",
        description: "Name and address are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      if (editingLocation) {
        // Update existing location
        const { error } = await supabase
          .from("studio_locations" as any)
          .update({
            name: formData.name,
            address: formData.address,
            city: formData.city || null,
            province_state: formData.province_state || null,
            country: formData.country,
            postal_code: formData.postal_code || null,
            is_active: formData.is_active,
          })
          .eq("id", editingLocation.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Studio location updated successfully.",
        });
      } else {
        // Create new location
        const { error } = await supabase
          .from("studio_locations" as any)
          .insert({
            name: formData.name,
            address: formData.address,
            city: formData.city || null,
            province_state: formData.province_state || null,
            country: formData.country,
            postal_code: formData.postal_code || null,
            is_active: formData.is_active,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Studio location created successfully.",
        });
      }

      setDialogOpen(false);
      fetchLocations();
    } catch (error: any) {
      console.error("Error saving studio location:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save studio location.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this studio location?")) return;

    try {
      const { error } = await supabase
        .from("studio_locations" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Studio location deleted successfully.",
      });

      fetchLocations();
    } catch (error: any) {
      console.error("Error deleting studio location:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete studio location.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (location: StudioLocation) => {
    try {
      const { error } = await supabase
        .from("studio_locations" as any)
        .update({ is_active: !location.is_active })
        .eq("id", location.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Studio location ${!location.is_active ? 'activated' : 'deactivated'} successfully.`,
      });

      fetchLocations();
    } catch (error: any) {
      console.error("Error toggling studio location:", error);
      toast({
        title: "Error",
        description: "Failed to update studio location.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
              <CardTitle>Studio Locations</CardTitle>
              <CardDescription>
                Manage in-person session studio locations
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No studio locations</h3>
              <p className="text-muted-foreground mb-4">
                Add your first studio location to enable in-person bookings.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{location.name}</h3>
                          {!location.is_active && (
                            <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {location.address}
                          {location.city && `, ${location.city}`}
                          {location.province_state && `, ${location.province_state}`}
                          {location.postal_code && ` ${location.postal_code}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={location.is_active}
                      onCheckedChange={() => handleToggleActive(location)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(location)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(location.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Edit Studio Location" : "Add Studio Location"}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? "Update the studio location details."
                : "Add a new studio location for in-person sessions."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Studio - Downtown"
              />
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>

              <div>
                <Label htmlFor="province_state">Province/State</Label>
                <Input
                  id="province_state"
                  value={formData.province_state}
                  onChange={(e) => setFormData({ ...formData, province_state: e.target.value })}
                  placeholder="Province or State"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country"
                />
              </div>

              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="Postal code"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {editingLocation ? "Update" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

