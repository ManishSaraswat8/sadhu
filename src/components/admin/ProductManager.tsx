import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, DollarSign, Check, X, Loader2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SessionConfigForm } from "./SessionConfigForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface SessionType {
  id: string;
  name: string;
  duration_minutes: number;
  session_type: 'standing' | 'laying';
  is_group: boolean;
  price_cad: number;
  price_usd: number;
  stripe_price_id_cad: string | null;
  stripe_price_id_usd: string | null;
  is_active: boolean;
}

interface SessionPackage {
  id: string;
  name: string;
  session_count: number;
  price_cad: number;
  price_usd: number;
  stripe_price_id_cad: string | null;
  stripe_price_id_usd: string | null;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  price_cad: number;
  price_usd: number;
  stripe_price_id_cad: string | null;
  stripe_price_id_usd: string | null;
  is_active: boolean;
}

interface SessionConfig {
  durations: number[];
  practiceTypes: { value: string; label: string }[];
  formats: { value: boolean; label: string }[];
}

export function ProductManager() {
  const queryClient = useQueryClient();
  const { toast: uiToast } = useToast();
  const [activeTab, setActiveTab] = useState<'session-types' | 'packages' | 'products'>('session-types');
  const [editingSessionType, setEditingSessionType] = useState<SessionType | null>(null);
  const [creatingSessionType, setCreatingSessionType] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SessionPackage | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sessionTypeToDelete, setSessionTypeToDelete] = useState<SessionType | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // Fetch session configuration
  const { data: sessionConfig, refetch: refetchSessionConfig } = useQuery({
    queryKey: ["admin-session-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["session_durations", "session_practice_types", "session_formats"]);

      if (error) throw error;

      const durations = data.find(s => s.key === "session_durations")?.value as any;
      const practiceTypes = data.find(s => s.key === "session_practice_types")?.value as any;
      const formats = data.find(s => s.key === "session_formats")?.value as any;

      const config: SessionConfig = {
        durations: durations?.options || [20, 45, 60],
        practiceTypes: practiceTypes?.options?.map((opt: string) => ({
          value: opt,
          label: practiceTypes?.labels?.[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)
        })) || [
          { value: "standing", label: "Standing" },
          { value: "laying", label: "Laying" }
        ],
        formats: formats?.options || [
          { value: false, label: "1:1 Session" },
          { value: true, label: "Group Session" }
        ],
      };

      return config;
    },
  });

  // Fetch session types
  const { data: sessionTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ["admin-session-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_types")
        .select("*")
        .order("duration_minutes", { ascending: true })
        .order("session_type", { ascending: true })
        .order("is_group", { ascending: true });

      if (error) throw error;
      return data as SessionType[];
    },
  });

  // Fetch packages
  const { data: packages, isLoading: loadingPackages } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_packages")
        .select("*")
        .order("session_count", { ascending: true });

      if (error) throw error;
      return data as SessionPackage[];
    },
  });

  // Fetch products
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

  // Create session type mutation
  const createSessionTypeMutation = useMutation({
    mutationFn: async (data: Omit<SessionType, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from("session_types")
        .insert({
          name: data.name,
          duration_minutes: data.duration_minutes,
          session_type: data.session_type,
          is_group: data.is_group,
          price_cad: data.price_cad,
          price_usd: data.price_usd,
          is_active: data.is_active,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-session-types"] });
      toast.success("Session type created successfully");
      setCreatingSessionType(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  // Update session type mutation
  const updateSessionTypeMutation = useMutation({
    mutationFn: async (data: Partial<SessionType> & { id: string }) => {
      // Get old data for change log
      const { data: oldData } = await supabase
        .from("session_types")
        .select("*")
        .eq("id", data.id)
        .single();

      // Update session type
      const { error } = await supabase
        .from("session_types")
        .update({
          name: data.name,
          duration_minutes: data.duration_minutes,
          session_type: data.session_type,
          is_group: data.is_group,
          price_cad: data.price_cad,
          price_usd: data.price_usd,
          is_active: data.is_active,
        })
        .eq("id", data.id);

      if (error) throw error;

      // Get current user for change log
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create change log
      const changeSummary = [];
      if (oldData?.name !== data.name) changeSummary.push(`Name: "${oldData?.name}" → "${data.name}"`);
      if (oldData?.duration_minutes !== data.duration_minutes) changeSummary.push(`Duration: ${oldData?.duration_minutes}min → ${data.duration_minutes}min`);
      if (oldData?.session_type !== data.session_type) changeSummary.push(`Type: ${oldData?.session_type} → ${data.session_type}`);
      if (oldData?.is_group !== data.is_group) changeSummary.push(`Format: ${oldData?.is_group ? 'Group' : '1:1'} → ${data.is_group ? 'Group' : '1:1'}`);
      if (oldData?.price_cad !== data.price_cad) changeSummary.push(`Price CAD: $${oldData?.price_cad} → $${data.price_cad}`);
      if (oldData?.price_usd !== data.price_usd) changeSummary.push(`Price USD: $${oldData?.price_usd} → $${data.price_usd}`);
      if (oldData?.is_active !== data.is_active) changeSummary.push(`Status: ${oldData?.is_active ? 'Active' : 'Inactive'} → ${data.is_active ? 'Active' : 'Inactive'}`);

      await (supabase.from("session_type_changes" as any) as any).insert({
        session_type_id: data.id,
        change_type: "updated",
        changed_by: user.id,
        old_data: oldData,
        new_data: data,
        change_summary: changeSummary.join(", "),
        notify_users: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-session-types"] });
      toast.success("Session type updated successfully. Users will be notified.");
      setEditingSessionType(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  // Delete session type mutation
  const deleteSessionTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get old data for change log
      const { data: oldData } = await supabase
        .from("session_types")
        .select("*")
        .eq("id", id)
        .single();

      if (!oldData) throw new Error("Session type not found");

      // Get current user for change log
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create change log before deletion
      await supabase.from("session_type_changes" as any).insert({
        session_type_id: id,
        change_type: "deleted",
        changed_by: user.id,
        old_data: oldData,
        new_data: null,
        change_summary: `Session type "${oldData.name}" (${oldData.duration_minutes}min ${oldData.session_type} ${oldData.is_group ? 'Group' : '1:1'}) was removed`,
        notify_users: true,
      });

      // Delete session type
      const { error } = await supabase
        .from("session_types")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-session-types"] });
      toast.success("Session type deleted successfully. Users will be notified.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: async (data: Partial<SessionPackage> & { id: string }) => {
      const { error } = await supabase
        .from("session_packages")
        .update({
          price_cad: data.price_cad,
          price_usd: data.price_usd,
          is_active: data.is_active,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      toast.success("Package updated successfully");
      setEditingPackage(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: Partial<Product> & { id: string }) => {
      const { error } = await supabase
        .from("products")
        .update({
          name: data.name,
          description: data.description || null,
          price_cad: data.price_cad,
          price_usd: data.price_usd,
          is_active: data.is_active,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product updated successfully");
      setEditingProduct(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const formatPrice = (price: number, currency: 'cad' | 'usd') => {
    return new Intl.NumberFormat(currency === 'cad' ? 'en-CA' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-heading font-light mb-2">Product Management</h2>
        <p className="text-muted-foreground">
          Configure session types, packages, and physical products with pricing and Stripe integration.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
          <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="session-types">Session Types</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>
          <Button
          variant="outline"
          size="sm"
          onClick={() => setConfigDialogOpen(true)}
          className="ml-4"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configuration
        </Button>
          </div>

          {/* Session Types Tab */}
          <TabsContent value="session-types" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Session Types</CardTitle>
                  <CardDescription>
                    Manage pricing for individual session types (Standing/Laying, 1:1/Group, 20/45/60 min)
                  </CardDescription>
                </div>
                <Button onClick={() => setCreatingSessionType(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Session Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTypes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group by session_type and is_group */}
                  {['standing', 'laying'].map((sessionType) => (
                    [false, true].map((isGroup) => {
                      const filtered = sessionTypes?.filter(
                        st => st.session_type === sessionType && st.is_group === isGroup
                      ) || [];

                      if (filtered.length === 0) return null;

                      return (
                        <div key={`${sessionType}-${isGroup}`} className="space-y-3">
                          <h3 className="font-semibold text-lg capitalize">
                            {sessionType} {isGroup ? 'Group' : '1:1'} Sessions
                          </h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Price (CAD)</TableHead>
                                <TableHead>Price (USD)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtered.map((st) => (
                                <TableRow key={st.id}>
                                  <TableCell className="font-medium">{st.name}</TableCell>
                                  <TableCell>{st.duration_minutes} min</TableCell>
                                  <TableCell>{formatPrice(st.price_cad, 'cad')}</TableCell>
                                  <TableCell>{formatPrice(st.price_usd, 'usd')}</TableCell>
                                  <TableCell>
                                    <Badge variant={st.is_active ? "default" : "secondary"}>
                                      {st.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingSessionType(st)}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSessionTypeToDelete(st);
                                          setDeleteConfirmOpen(true);
                                        }}
                                        disabled={deleteSessionTypeMutation.isPending}
                                      >
                                        {deleteSessionTypeMutation.isPending ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-4 h-4 text-destructive" />
                                        )}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Packages</CardTitle>
              <CardDescription>
                Manage 5 and 10 session packages with bulk pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPackages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Price (CAD)</TableHead>
                      <TableHead>Price (USD)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages?.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell>{pkg.session_count}</TableCell>
                        <TableCell>{formatPrice(pkg.price_cad, 'cad')}</TableCell>
                        <TableCell>{formatPrice(pkg.price_usd, 'usd')}</TableCell>
                        <TableCell>
                          <Badge variant={pkg.is_active ? "default" : "secondary"}>
                            {pkg.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPackage(pkg)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Physical Products</CardTitle>
              <CardDescription>
                Manage physical products like the Sadhu Board
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Price (CAD)</TableHead>
                      <TableHead>Price (USD)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground">{product.slug}</TableCell>
                        <TableCell>{formatPrice(product.price_cad, 'cad')}</TableCell>
                        <TableCell>{formatPrice(product.price_usd, 'usd')}</TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Configuration</DialogTitle>
            <CardDescription>
              Configure available options for duration, practice type, and format
            </CardDescription>
          </DialogHeader>
          <div className="mt-4">
            {sessionConfig ? (
              <SessionConfigForm config={sessionConfig} onConfigUpdated={() => {
                queryClient.invalidateQueries({ queryKey: ["admin-session-config"] });
                queryClient.refetchQueries({ queryKey: ["admin-session-config"] });
                setConfigDialogOpen(false);
              }} />
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Session Type Dialog */}
      <Dialog open={creatingSessionType} onOpenChange={(open) => {
        if (!open) {
          setCreatingSessionType(false);
          refetchSessionConfig();
        } else if (open) {
          // Refetch when dialog opens
          refetchSessionConfig();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Session Type</DialogTitle>
          </DialogHeader>
          <EditSessionTypeForm
            sessionType={null}
            sessionConfig={sessionConfig}
            key={`create-${sessionConfig?.durations?.join('-') || 'default'}`}
            onSave={(data) => {
              createSessionTypeMutation.mutate(data as Omit<SessionType, 'id' | 'created_at' | 'updated_at'>);
            }}
            onCancel={() => {
              setCreatingSessionType(false);
              refetchSessionConfig();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Session Type Dialog */}
      <Dialog open={!!editingSessionType} onOpenChange={(open) => {
        if (!open) {
          setEditingSessionType(null);
          refetchSessionConfig();
        } else if (open) {
          // Refetch when dialog opens
          refetchSessionConfig();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Session Type</DialogTitle>
          </DialogHeader>
          {editingSessionType && (
            <EditSessionTypeForm
              sessionType={editingSessionType}
              sessionConfig={sessionConfig}
              key={`edit-${editingSessionType.id}-${sessionConfig?.durations?.join('-') || 'default'}`}
              onSave={(data) => {
                updateSessionTypeMutation.mutate({ id: editingSessionType.id, ...data });
              }}
              onCancel={() => {
                setEditingSessionType(null);
                refetchSessionConfig();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={!!editingPackage} onOpenChange={(open) => !open && setEditingPackage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
          </DialogHeader>
          {editingPackage && (
            <EditPackageForm
              pkg={editingPackage}
              onSave={(data) => {
                updatePackageMutation.mutate({ id: editingPackage.id, ...data });
              }}
              onCancel={() => setEditingPackage(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <EditProductForm
              product={editingProduct}
              onSave={(data) => {
                updateProductMutation.mutate({ id: editingProduct.id, ...data });
              }}
              onCancel={() => setEditingProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={() => {
          if (sessionTypeToDelete) {
            deleteSessionTypeMutation.mutate(sessionTypeToDelete.id);
            setDeleteConfirmOpen(false);
            setSessionTypeToDelete(null);
          }
        }}
        title="Delete Session Type"
        description={`Are you sure you want to delete "${sessionTypeToDelete?.name}"? This action cannot be undone and all users will be notified of this change.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

// Edit Session Type Form Component
function EditSessionTypeForm({
  sessionType,
  sessionConfig,
  onSave,
  onCancel,
}: {
  sessionType: SessionType | null;
  sessionConfig: SessionConfig | null;
  onSave: (data: Partial<SessionType>) => void;
  onCancel: () => void;
}) {
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<Partial<SessionType> | null>(null);
  const [lastChangedField, setLastChangedField] = useState<'cad' | 'usd' | null>(null);

  // USD to CAD conversion rate (approximate, can be updated)
  const USD_TO_CAD_RATE = 1.37;
  const CAD_TO_USD_RATE = 1 / USD_TO_CAD_RATE;

  const [formData, setFormData] = useState({
    name: sessionType?.name || '',
    duration_minutes: sessionType?.duration_minutes || (sessionConfig?.durations?.[0] || 45),
    session_type: sessionType?.session_type || (sessionConfig?.practiceTypes?.[0]?.value || 'standing') as 'standing' | 'laying',
    is_group: sessionType?.is_group ?? (sessionConfig?.formats?.[0]?.value || false),
    price_cad: sessionType?.price_cad.toString() || '',
    price_usd: sessionType?.price_usd.toString() || '',
    is_active: sessionType?.is_active ?? true,
  });


  // Handle price changes with automatic conversion
  const handlePriceChange = (field: 'price_cad' | 'price_usd', value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setLastChangedField(field === 'price_cad' ? 'cad' : 'usd');
    
    if (numValue > 0) {
      if (field === 'price_cad') {
        // User entered CAD, convert to USD
        const convertedUSD = (numValue * CAD_TO_USD_RATE).toFixed(2);
        setFormData({
          ...formData,
          price_cad: value,
          price_usd: convertedUSD,
        });
      } else {
        // User entered USD, convert to CAD
        const convertedCAD = (numValue * USD_TO_CAD_RATE).toFixed(2);
        setFormData({
          ...formData,
          price_cad: convertedCAD,
          price_usd: value,
        });
      }
    } else {
      // If cleared, clear both
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  // Update form data when sessionConfig changes
  useEffect(() => {
    if (sessionConfig) {
      setFormData(prev => {
        // Only update if it's a new session type or if current value is not in the new config
        const newDuration = sessionType?.duration_minutes || prev.duration_minutes;
        const durationExists = sessionConfig.durations?.includes(newDuration);
        
        return {
          ...prev,
          duration_minutes: sessionType?.duration_minutes || (durationExists ? prev.duration_minutes : (sessionConfig.durations?.[0] || 45)),
          session_type: sessionType?.session_type || (sessionConfig.practiceTypes?.[0]?.value || 'standing') as 'standing' | 'laying',
          is_group: sessionType?.is_group ?? (sessionConfig.formats?.[0]?.value || false),
        };
      });
    }
  }, [sessionConfig, sessionType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      name: formData.name,
      duration_minutes: formData.duration_minutes,
      session_type: formData.session_type,
      is_group: formData.is_group,
      price_cad: parseFloat(formData.price_cad),
      price_usd: parseFloat(formData.price_usd),
      is_active: formData.is_active,
    };
    
    // Only show confirmation for updates, not creates
    if (sessionType) {
      setPendingData(dataToSave);
      setSaveConfirmOpen(true);
    } else {
      // Create directly without confirmation
      onSave(dataToSave);
    }
  };

  const handleConfirmSave = () => {
    if (pendingData) {
      onSave(pendingData);
      setSaveConfirmOpen(false);
      setPendingData(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">Session Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., 20min Intro, 45min Standard, 60min Expert"
          required
        />
      </div>

      {/* Duration, Type, and Format */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (min) *</Label>
          <select
            id="duration_minutes"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            {sessionConfig?.durations?.map((dur) => (
              <option key={dur} value={dur}>{dur} min</option>
            )) || (
              <>
                <option value={20}>20 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </>
            )}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="session_type">Practice Type *</Label>
          <select
            id="session_type"
            value={formData.session_type}
            onChange={(e) => setFormData({ ...formData, session_type: e.target.value as 'standing' | 'laying' })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            {sessionConfig?.practiceTypes.map((pt) => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            )) || (
              <>
                <option value="standing">Standing</option>
                <option value="laying">Laying</option>
              </>
            )}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="is_group">Format *</Label>
          <select
            id="is_group"
            value={formData.is_group ? 'true' : 'false'}
            onChange={(e) => setFormData({ ...formData, is_group: e.target.value === 'true' })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            {sessionConfig?.formats.map((fmt) => (
              <option key={String(fmt.value)} value={String(fmt.value)}>{fmt.label}</option>
            )) || (
              <>
                <option value="false">1:1 Session</option>
                <option value="true">Group Session</option>
              </>
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_cad">Price (CAD) *</Label>
          <Input
            id="price_cad"
            type="number"
            step="0.01"
            value={formData.price_cad}
            onChange={(e) => handlePriceChange('price_cad', e.target.value)}
            onFocus={() => setLastChangedField('cad')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_usd">Price (USD) *</Label>
          <Input
            id="price_usd"
            type="number"
            step="0.01"
            value={formData.price_usd}
            onChange={(e) => handlePriceChange('price_usd', e.target.value)}
            onFocus={() => setLastChangedField('usd')}
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{sessionType ? "Save Changes" : "Create Session Type"}</Button>
      </DialogFooter>

      {/* Save Confirmation Dialog - Only for updates */}
      {sessionType && (
        <ConfirmDialog
          open={saveConfirmOpen}
          onOpenChange={setSaveConfirmOpen}
          onConfirm={handleConfirmSave}
          title="Save Changes?"
          description="Are you sure you want to save these changes? All users will be notified of any updates to this session type."
          confirmText="Save Changes"
          cancelText="Cancel"
          variant="default"
        />
      )}
    </form>
  );
}

// Edit Package Form Component
function EditPackageForm({
  pkg,
  onSave,
  onCancel,
}: {
  pkg: SessionPackage;
  onSave: (data: Partial<SessionPackage>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    price_cad: pkg.price_cad.toString(),
    price_usd: pkg.price_usd.toString(),
    is_active: pkg.is_active,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      price_cad: parseFloat(formData.price_cad),
      price_usd: parseFloat(formData.price_usd),
      is_active: formData.is_active,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium mb-2">Package Details</p>
        <div className="text-sm">
          <span className="text-muted-foreground">Name:</span>
          <span className="ml-2 font-medium">{pkg.name}</span>
        </div>
        <div className="text-sm mt-1">
          <span className="text-muted-foreground">Sessions:</span>
          <span className="ml-2 font-medium">{pkg.session_count}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_cad">Price (CAD) *</Label>
          <Input
            id="price_cad"
            type="number"
            step="0.01"
            value={formData.price_cad}
            onChange={(e) => setFormData({ ...formData, price_cad: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_usd">Price (USD) *</Label>
          <Input
            id="price_usd"
            type="number"
            step="0.01"
            value={formData.price_usd}
            onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  );
}

// Edit Product Form Component
function EditProductForm({
  product,
  onSave,
  onCancel,
}: {
  product: Product;
  onSave: (data: Partial<Product>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    price_cad: product.price_cad.toString(),
    price_usd: product.price_usd.toString(),
    is_active: product.is_active,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      description: formData.description || null,
      price_cad: parseFloat(formData.price_cad),
      price_usd: parseFloat(formData.price_usd),
      is_active: formData.is_active,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">Slug: {product.slug}</p>
        <p className="text-sm text-muted-foreground">Type: {product.type}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_cad">Price (CAD) *</Label>
          <Input
            id="price_cad"
            type="number"
            step="0.01"
            value={formData.price_cad}
            onChange={(e) => setFormData({ ...formData, price_cad: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_usd">Price (USD) *</Label>
          <Input
            id="price_usd"
            type="number"
            step="0.01"
            value={formData.price_usd}
            onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  );
}

