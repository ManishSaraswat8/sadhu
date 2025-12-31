import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
  action_url?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const formatted = (data || []).map((n: any) => ({
        id: n.id,
        title: n.title || "Notification",
        message: n.message || "",
        type: (n.type || "info") as Notification["type"],
        read: n.read || false,
        created_at: n.created_at,
        action_url: n.action_url,
      }));

      setNotifications(formatted);
      setUnreadCount(formatted.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [user]);

  // Check for upcoming sessions and show notifications
  const checkUpcomingSessions = useCallback(async () => {
    if (!user) return;

    try {
      // Check for sessions starting in 15 minutes
      const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);
      const now = new Date();

      const { data: sessions, error } = await supabase
        .from("session_schedules")
        .select("id, scheduled_at, practitioner:practitioners(name), client_id")
        .eq("status", "scheduled")
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", fifteenMinutesFromNow.toISOString());

      if (error) throw error;

      // Check if user is client or practitioner
      const { data: practitioner } = await supabase
        .from("practitioners")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const relevantSessions = sessions?.filter((s) => {
        if (practitioner) {
          // Check if practitioner session
          return s.practitioner?.id === practitioner.id;
        } else {
          // Check if client session
          return s.client_id === user.id;
        }
      }) || [];

      // Show notifications for upcoming sessions
      relevantSessions.forEach((session) => {
        const sessionTime = new Date(session.scheduled_at);
        const minutesUntil = Math.round((sessionTime.getTime() - now.getTime()) / (1000 * 60));

        if (minutesUntil <= 15 && minutesUntil > 0) {
          toast({
            title: "Session Starting Soon",
            description: `Your session ${practitioner ? "with a client" : "with ${session.practitioner?.name || "practitioner"}"} starts in ${minutesUntil} minute${minutesUntil !== 1 ? "s" : ""}.`,
            duration: 10000,
          });
        }
      });
    } catch (error) {
      console.error("Error checking upcoming sessions:", error);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Check for upcoming sessions every minute
      checkUpcomingSessions();
      const interval = setInterval(checkUpcomingSessions, 60000);

      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchNotifications, checkUpcomingSessions]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}

