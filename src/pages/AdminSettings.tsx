import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StudioLocationsManager } from "@/components/admin/StudioLocationsManager";
import { Loader2, Save, Globe, Mail, Shield, DollarSign, MapPin } from "lucide-react";
import { toast } from "sonner";

const AdminSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    siteName: "Sadhu",
    siteDescription: "Meditation and wellness platform",
    supportEmail: "support@sadhu.com",
    privacyEmail: "privacy@sadhu.com",
    currency: "usd",
    maintenanceMode: false,
    allowRegistrations: true,
  });

  // Fetch settings from database
  const { data: dbSettings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*");

      if (error) throw error;

      // Convert settings array to object
      const settingsObj: Record<string, any> = {};
      (data || []).forEach((setting) => {
        settingsObj[setting.key] = setting.value;
      });

      return {
        siteName: settingsObj.site_name || "Sadhu",
        siteDescription: settingsObj.site_description || "Meditation and wellness platform",
        supportEmail: settingsObj.support_email || "support@sadhu.com",
        privacyEmail: settingsObj.privacy_email || "privacy@sadhu.com",
        currency: settingsObj.default_currency || "usd",
        maintenanceMode: settingsObj.maintenance_mode === true,
        allowRegistrations: settingsObj.allow_registrations !== false,
      };
    },
  });

  // Update local state when DB settings load
  useEffect(() => {
    if (dbSettings) {
      setSettings(dbSettings);
    }
  }, [dbSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      const updates = [
        { key: "site_name", value: newSettings.siteName },
        { key: "site_description", value: newSettings.siteDescription },
        { key: "support_email", value: newSettings.supportEmail },
        { key: "privacy_email", value: newSettings.privacyEmail },
        { key: "default_currency", value: newSettings.currency },
        { key: "maintenance_mode", value: newSettings.maintenanceMode },
        { key: "allow_registrations", value: newSettings.allowRegistrations },
      ];

      // Upsert each setting
      for (const update of updates) {
        const { error } = await supabase
          .from("settings")
          .upsert(
            {
              key: update.key,
              value: update.value,
              updated_by: user?.id || null,
            },
            { onConflict: "key" }
          );

        if (error) throw error;
      }

      return newSettings;
    },
    onSuccess: () => {
      toast.success("Settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Configure basic platform settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="privacyEmail">Privacy Email</Label>
              <Input
                id="privacyEmail"
                type="email"
                value={settings.privacyEmail}
                onChange={(e) => setSettings({ ...settings, privacyEmail: e.target.value })}
                placeholder="privacy@sadhu.com"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable public access to the site
                </p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, maintenanceMode: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowRegistrations">Allow New Registrations</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable new user registrations
                </p>
              </div>
              <Switch
                id="allowRegistrations"
                checked={settings.allowRegistrations}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowRegistrations: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payment Settings
            </CardTitle>
            <CardDescription>
              Configure payment and currency settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select
                value={settings.currency}
                onValueChange={(value) => setSettings({ ...settings, currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD - US Dollar</SelectItem>
                  <SelectItem value="cad">CAD - Canadian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Stripe API keys and webhook configuration should be managed
                through your Supabase project settings or environment variables.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Studio Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Studio Locations
            </CardTitle>
            <CardDescription>
              Manage in-person session studio locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudioLocationsManager />
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage security and access control settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Security settings are managed through Supabase Auth and RLS policies.
                Review your database migrations and RLS policies for security configuration.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
            size="lg"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;

