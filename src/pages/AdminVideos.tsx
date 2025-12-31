import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Video, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Video = Tables<"videos">;

const AdminVideos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [filter, setFilter] = useState<"all" | "sidebar" | "step-by-step">("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState<"essential" | "tutorials" | "guide" | "general" | "step-by-step">("general");
  const [displayLocation, setDisplayLocation] = useState<"sidebar" | "step-by-step" | "both">("sidebar");
  const [iconName, setIconName] = useState("");
  const [iconColor, setIconColor] = useState("bg-primary/10 text-primary");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Fetch videos
  const { data: videos, isLoading } = useQuery({
    queryKey: ["admin-videos", filter],
    queryFn: async () => {
      let query = supabase
        .from("videos")
        .select("*")
        .order("display_order", { ascending: true });

      if (filter !== "all") {
        query = query.or(`display_location.eq.${filter},display_location.eq.both`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Video[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const videoData = {
        title,
        description: description || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || null,
        duration: duration || null,
        category,
        display_location: displayLocation,
        icon_name: iconName || null,
        icon_color: iconColor,
        display_order: displayOrder,
        is_active: isActive,
      };

      if (editingVideo) {
        const { error } = await supabase
          .from("videos")
          .update(videoData)
          .eq("id", editingVideo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("videos").insert(videoData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] }); // Invalidate user-facing queries
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: editingVideo ? "Video updated successfully" : "Video created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save video",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("videos")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  // Update display order
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("videos")
        .update({ display_order: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
    },
  });

  const resetForm = () => {
    setEditingVideo(null);
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setThumbnailUrl("");
    setDuration("");
    setCategory("general");
    setDisplayLocation("sidebar");
    setIconName("");
    setIconColor("bg-primary/10 text-primary");
    setDisplayOrder(0);
    setIsActive(true);
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setTitle(video.title);
    setDescription(video.description || "");
    setVideoUrl(video.video_url);
    setThumbnailUrl(video.thumbnail_url || "");
    setDuration(video.duration || "");
    setCategory(video.category as any);
    setDisplayLocation(video.display_location as any);
    setIconName(video.icon_name || "");
    setIconColor(video.icon_color || "bg-primary/10 text-primary");
    setDisplayOrder(video.display_order);
    setIsActive(video.is_active);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleMoveOrder = async (video: Video, direction: "up" | "down") => {
    const currentIndex = videos?.findIndex((v) => v.id === video.id) ?? -1;
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= (videos?.length || 0)) return;

    const targetVideo = videos?.[targetIndex];
    if (!targetVideo) return;

    // Swap orders
    await Promise.all([
      updateOrderMutation.mutateAsync({ id: video.id, newOrder: targetVideo.display_order }),
      updateOrderMutation.mutateAsync({ id: targetVideo.id, newOrder: video.display_order }),
    ]);
  };

  const filteredVideos = videos?.filter((video) => {
    if (filter === "all") return true;
    return video.display_location === filter || video.display_location === "both";
  });

  return (
    <AdminLayout title="Video Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading font-bold">Video Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage videos displayed in the sidebar and step-by-step guides
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVideo ? "Edit Video" : "Add New Video"}</DialogTitle>
                <DialogDescription>
                  Configure video details and display settings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Video title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Video description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="videoUrl">Video URL *</Label>
                  <Input
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="YouTube, Vimeo, or direct video URL"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                    <Input
                      id="thumbnailUrl"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="Optional thumbnail image URL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g., 5:30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="essential">Essential</SelectItem>
                        <SelectItem value="tutorials">Tutorials</SelectItem>
                        <SelectItem value="guide">Guide</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="step-by-step">Step-by-Step</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="displayLocation">Display Location *</Label>
                    <Select
                      value={displayLocation}
                      onValueChange={(v) => setDisplayLocation(v as any)}
                    >
                      <SelectTrigger id="displayLocation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sidebar">Sidebar Only</SelectItem>
                        <SelectItem value="step-by-step">Step-by-Step Only</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="iconName">Icon Name</Label>
                    <Input
                      id="iconName"
                      value={iconName}
                      onChange={(e) => setIconName(e.target.value)}
                      placeholder="e.g., Play, Video, BookOpen"
                    />
                  </div>
                  <div>
                    <Label htmlFor="iconColor">Icon Color Classes</Label>
                    <Input
                      id="iconColor"
                      value={iconColor}
                      onChange={(e) => setIconColor(e.target.value)}
                      placeholder="bg-primary/10 text-primary"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Active (visible to users)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title || !videoUrl}>
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos</SelectItem>
              <SelectItem value="sidebar">Sidebar Only</SelectItem>
              <SelectItem value="step-by-step">Step-by-Step Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Videos Table */}
        <Card>
          <CardHeader>
            <CardTitle>Videos</CardTitle>
            <CardDescription>Manage all website videos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredVideos && filteredVideos.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVideos.map((video, index) => (
                    <TableRow key={video.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveOrder(video, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-mono">{video.display_order}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveOrder(video, "down")}
                            disabled={index === (filteredVideos.length - 1)}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{video.title}</div>
                          {video.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs">
                              {video.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{video.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{video.display_location}</Badge>
                      </TableCell>
                      <TableCell>
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline truncate max-w-xs block"
                        >
                          {video.video_url}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              id: video.id,
                              isActive: !video.is_active,
                            })
                          }
                        >
                          {video.is_active ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(video)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this video?")) {
                                deleteMutation.mutate(video.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No videos found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminVideos;

