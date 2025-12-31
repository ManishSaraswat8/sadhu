import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Video, Play, BookOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, any> = {
  Play,
  Video,
  BookOpen,
  ...LucideIcons,
};

export function HelpfulVideos() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  // Fetch videos from database
  const { data: videos, isLoading } = useQuery({
    queryKey: ["videos", "sidebar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("is_active", true)
        .or("display_location.eq.sidebar,display_location.eq.both")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data || []).map((video) => {
        const IconComponent = video.icon_name ? iconMap[video.icon_name] || Play : Play;
        return {
          ...video,
          icon: IconComponent,
        };
      });
    },
  });

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Helpful Videos</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (!videos || videos.length === 0) {
    return null;
  }

  if (collapsed) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex flex-col gap-2">
            {videos.map((video) => {
              const IconComponent = video.icon || Play;
              return (
                <Link
                  key={video.id}
                  to={video.video_url.startsWith("/") ? video.video_url : `/step-by-step?video=${video.id}`}
                  className="flex items-center justify-center p-2 rounded-md hover:bg-muted/50 transition-colors"
                  title={video.title}
                >
                  <IconComponent className="w-4 h-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Helpful Videos</SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="flex flex-col gap-2">
          {videos.map((video) => {
            const IconComponent = video.icon || Play;
            return (
              <Link
                key={video.id}
                to={video.video_url.startsWith("/") ? video.video_url : `/step-by-step?video=${video.id}`}
                className="block"
              >
                <Card className="border-primary/10 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${video.icon_color || "bg-primary/10 text-primary"} transition-transform hover:scale-110`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate transition-colors">
                          {video.title}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0 border-primary/20 text-muted-foreground">
                        {video.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

