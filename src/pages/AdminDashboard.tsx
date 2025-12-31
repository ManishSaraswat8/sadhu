import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  UserPlus,
  Users,
  Calendar,
  Activity,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay, isAfter, isBefore } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  activeUsers: number;
  usersChange: number;
  activePractitioners: number;
  practitionersChange: number;
  upcomingSessions: number;
  sessionsChange: number;
}

interface RecentPayment {
  id: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  client?: { email: string };
  practitioner?: { name: string };
  session?: {
    scheduled_at: string;
    duration_minutes: number;
  };
}

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");


  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats", dateRange],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      // Get payments data
      const { data: paymentsData, error: paymentsError } = await supabase.functions.invoke("list-payments", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (paymentsError) throw paymentsError;

      const payments = (paymentsData?.payments || []) as RecentPayment[];

      // Calculate date ranges
      const now = new Date();
      const currentPeriodStart = dateRange === "7d" ? subDays(now, 7) : dateRange === "30d" ? subDays(now, 30) : subDays(now, 90);
      const previousPeriodStart = dateRange === "7d" ? subDays(now, 14) : dateRange === "30d" ? subDays(now, 60) : subDays(now, 180);
      const previousPeriodEnd = currentPeriodStart;

      // Calculate revenue
      const currentRevenue = payments
        .filter((p) => isAfter(new Date(p.created_at), currentPeriodStart))
        .reduce((sum, p) => sum + p.total_amount, 0);

      const previousRevenue = payments
        .filter(
          (p) =>
            isAfter(new Date(p.created_at), previousPeriodStart) &&
            isBefore(new Date(p.created_at), previousPeriodEnd)
        )
        .reduce((sum, p) => sum + p.total_amount, 0);

      const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Calculate orders
      const currentOrders = payments.filter((p) => isAfter(new Date(p.created_at), currentPeriodStart)).length;
      const previousOrders = payments.filter(
        (p) =>
          isAfter(new Date(p.created_at), previousPeriodStart) &&
          isBefore(new Date(p.created_at), previousPeriodEnd)
      ).length;

      const ordersChange = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;

      // Get users count
      const { data: usersData, error: usersError } = await supabase.functions.invoke("list-users", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (usersError) throw usersError;

      const users = (usersData?.users || []) as any[];
      const currentUsers = users.filter((u) => isAfter(new Date(u.created_at), currentPeriodStart)).length;
      const previousUsers = users.filter(
        (u) =>
          isAfter(new Date(u.created_at), previousPeriodStart) &&
          isBefore(new Date(u.created_at), previousPeriodEnd)
      ).length;

      const usersChange = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;

      // Get practitioners count
      const { data: practitionersData, error: practitionersError } = await supabase
        .from("practitioners")
        .select("id, created_at, available");

      if (practitionersError) throw practitionersError;

      const practitioners = practitionersData || [];
      const activePractitioners = practitioners.filter((p) => p.available).length;
      const currentPractitioners = practitioners.filter((p) =>
        isAfter(new Date(p.created_at), currentPeriodStart)
      ).length;
      const previousPractitioners = practitioners.filter(
        (p) =>
          isAfter(new Date(p.created_at), previousPeriodStart) &&
          isBefore(new Date(p.created_at), previousPeriodEnd)
      ).length;

      const practitionersChange =
        previousPractitioners > 0 ? ((currentPractitioners - previousPractitioners) / previousPractitioners) * 100 : 0;

      // Get upcoming sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("session_schedules")
        .select("id, scheduled_at, status")
        .in("status", ["scheduled", "in_progress"])
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(100);

      if (sessionsError) throw sessionsError;

      const upcomingSessions = sessionsData?.length || 0;
      const previousSessions = 0; // Can be calculated if needed

      const stats: DashboardStats = {
        totalRevenue: currentRevenue,
        revenueChange,
        totalOrders: currentOrders,
        ordersChange,
        activeUsers: users.length,
        usersChange,
        activePractitioners,
        practitionersChange,
        upcomingSessions,
        sessionsChange: 0,
      };

      return stats;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch recent payments
  const { data: recentPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin-recent-payments"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("list-payments", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data?.payments) return [];

      return (data.payments as RecentPayment[])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    },
  });

  // Fetch revenue chart data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin-revenue-chart", dateRange],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("list-payments", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data?.payments) return [];

      const payments = data.payments as RecentPayment[];
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const chartData: RevenueData[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "MMM d");
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const dayPayments = payments.filter(
          (p) =>
            isAfter(new Date(p.created_at), dayStart) && isBefore(new Date(p.created_at), dayEnd)
        );

        chartData.push({
          date: dateStr,
          revenue: dayPayments.reduce((sum, p) => sum + p.total_amount, 0),
          orders: dayPayments.length,
        });
      }

      return chartData;
    },
  });

  const formatCurrency = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat(currency === "cad" ? "en-CA" : "en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  if (statsLoading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const dashboardStats = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: stats?.revenueChange || 0,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders?.toLocaleString() || "0",
      change: stats?.ordersChange || 0,
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Active Users",
      value: stats?.activeUsers?.toLocaleString() || "0",
      change: stats?.usersChange || 0,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Active Practitioners",
      value: stats?.activePractitioners?.toLocaleString() || "0",
      change: stats?.practitionersChange || 0,
      icon: UserPlus,
      color: "text-orange-600",
    },
    {
      title: "Upcoming Sessions",
      value: stats?.upcomingSessions?.toLocaleString() || "0",
      change: stats?.sessionsChange || 0,
      icon: Calendar,
      color: "text-teal-600",
    },
  ];

  return (
    <AdminLayout title="Dashboard" showSearch={true}>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-light text-foreground">
              Welcome back, <span className="text-gradient-teal font-semibold">Admin</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your platform today.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={dateRange === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange("7d")}
            >
              7 Days
            </Button>
            <Button
              variant={dateRange === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange("30d")}
            >
              30 Days
            </Button>
            <Button
              variant={dateRange === "90d" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange("90d")}
            >
              90 Days
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatChange(stat.change)} vs previous period
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Revenue and orders over time</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === "revenue") {
                          return formatCurrency(value);
                        }
                        return value;
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Orders by Day</CardTitle>
              <CardDescription>Daily order volume</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/orders")}>
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : recentPayments && recentPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Date</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Client</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Practitioner</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Amount</th>
                      <th className="text-left p-4 text-muted-foreground font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4 text-sm">
                          {format(new Date(payment.created_at), "MMM d, yyyy")}
                        </td>
                        <td className="p-4 text-sm">{payment.client?.email || "N/A"}</td>
                        <td className="p-4 text-sm">{payment.practitioner?.name || "N/A"}</td>
                        <td className="p-4 text-sm font-medium">
                          {formatCurrency(payment.total_amount, payment.currency)}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              payment.status === "completed"
                                ? "default"
                                : payment.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No payments found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate("/admin/users")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Manage Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage user accounts, roles, and permissions
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate("/admin/orders")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                View Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review all payment transactions and order history
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate("/admin/products")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Manage Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure session types, packages, and physical products
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
