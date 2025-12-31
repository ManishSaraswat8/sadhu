import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PractitionerLayout } from "@/components/practitioner/PractitionerLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, DollarSign, TrendingUp, Clock, Target, FileText } from "lucide-react";
import { PractitionerSessions } from "@/components/practitioner/PractitionerSessions";
import type { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";

type Practitioner = Tables<"practitioners">;

const PractitionerDashboard = () => {
  const navigate = useNavigate();
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);

  // Fetch practitioner profile
  const { data: practitionerData, isLoading: loadingPractitioner } = useQuery({
    queryKey: ["practitioner-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("practitioners")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (practitionerData) {
      setPractitioner(practitionerData);
    }
  }, [practitionerData]);

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["practitioner-stats", practitioner?.id],
    queryFn: async () => {
      if (!practitioner?.id) return null;

      const [sessionsRes, paymentsRes, clientsRes] = await Promise.all([
        supabase
          .from("session_schedules")
          .select("id, status, scheduled_at")
          .eq("practitioner_id", practitioner.id),
        supabase
          .from("session_payments")
          .select("practitioner_share, status, created_at")
          .eq("practitioner_id", practitioner.id),
        supabase
          .from("session_schedules")
          .select("client_id")
          .eq("practitioner_id", practitioner.id),
      ]);

      const sessions = sessionsRes.data || [];
      const payments = paymentsRes.data || [];
      const clients = clientsRes.data || [];

      const upcomingSessions = sessions.filter(
        (s) => s.status === "scheduled" && new Date(s.scheduled_at) > new Date()
      ).length;

      const totalEarnings = payments
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + Number(p.practitioner_share || 0), 0);

      const pendingEarnings = payments
        .filter((p) => p.status === "completed" && !p.paid_out_at)
        .reduce((sum, p) => sum + Number(p.practitioner_share || 0), 0);

      const uniqueClients = new Set(clients.map((c) => c.client_id)).size;

      const thisMonthEarnings = payments
        .filter((p) => {
          const paymentDate = new Date(p.created_at);
          const now = new Date();
          return (
            p.status === "completed" &&
            paymentDate.getMonth() === now.getMonth() &&
            paymentDate.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum, p) => sum + Number(p.practitioner_share || 0), 0);

      return {
        upcomingSessions,
        totalEarnings,
        pendingEarnings,
        uniqueClients,
        thisMonthEarnings,
        totalSessions: sessions.length,
      };
    },
    enabled: !!practitioner?.id,
  });

  if (loadingPractitioner) {
    return (
      <PractitionerLayout title="Dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PractitionerLayout>
    );
  }

  return (
    <PractitionerLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <Separator className="flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming Sessions
              </CardTitle>
              <Calendar className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats?.upcomingSessions || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Scheduled sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${(stats?.totalEarnings || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All time earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${(stats?.thisMonthEarnings || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current month earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clients
              </CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats?.uniqueClients || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Unique clients
              </p>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/practitioner")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage your sessions
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/practitioner/clients")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage your client relationships
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/practitioner/earnings")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track your earnings and payouts
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/practitioner/availability")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Set your working hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Your upcoming and recent sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <PractitionerSessions practitionerId={practitioner?.id || ""} />
          </CardContent>
        </Card>
      </div>
    </PractitionerLayout>
  );
};

export default PractitionerDashboard;
