import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Video, Loader2 } from "lucide-react";
import { UserLayout } from "@/components/UserLayout";
import { Button } from "@/components/ui/button";
import AIChatBot from "@/components/AIChatBot";
import * as LucideIcons from "lucide-react";

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, any> = {
  Play,
  Video,
  ...LucideIcons,
};

const StepByStep = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Fetch videos from database
  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ["videos", "step-by-step"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("is_active", true)
        .or("display_location.eq.step-by-step,display_location.eq.both")
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

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return null;
  }

  const handleWatchVideo = (videoUrl: string) => {
    if (videoUrl.startsWith("http")) {
      window.open(videoUrl, "_blank", "noopener,noreferrer");
    } else if (videoUrl.startsWith("/")) {
      navigate(videoUrl);
    }
  };

  return (
    <UserLayout title="Step-by-Step Guides">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-heading font-light text-foreground mb-2">
            Product Videos
          </h2>
          <p className="text-muted-foreground">
            Follow along with our guided tutorials to master your Sadhu practice
          </p>
        </div>

        {videosLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid gap-4">
            {videos.map((video, index) => {
              const IconComponent = video.icon || Play;
              return (
                <Card
                  key={video.id}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6 flex items-center gap-6">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-32 h-20 object-cover rounded-lg group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-32 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-heading font-medium text-foreground mb-1">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {video.description}
                        </p>
                      )}
                      {video.duration && (
                        <span className="text-xs text-muted-foreground/70">
                          {video.duration}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleWatchVideo(video.video_url)}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Watch
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No videos available at the moment</p>
          </div>
        )}
      </div>

      <AIChatBot />
    </UserLayout>
  );
};

export default StepByStep;
