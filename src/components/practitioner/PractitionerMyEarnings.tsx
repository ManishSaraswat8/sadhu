import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, TrendingUp, Wallet, Loader2, Download, Calendar, FileText } from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from "date-fns";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PractitionerBanking } from "@/components/practitioner/PractitionerBanking";

interface SessionPayment {
  id: string;
  session_id: string;
  total_amount: number;
  practitioner_share: number;
  platform_share: number;
  currency: string;
  status: string;
  paid_out_at: string | null;
  created_at: string;
  session?: {
    scheduled_at: string;
    duration_minutes: number;
  };
}

interface PractitionerMyEarningsProps {
  practitionerId: string;
}

export const PractitionerMyEarnings = ({ practitionerId }: PractitionerMyEarningsProps) => {
  const [payments, setPayments] = useState<SessionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'2weeks' | 'month' | 'year' | 'all'>('2weeks');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  useEffect(() => {
    fetchPayments();
  }, [practitionerId, dateRange, customStartDate, customEndDate]);

  const fetchPayments = async () => {
    setLoading(true);
    let query = supabase
      .from("session_payments")
      .select(`
        *,
        session:session_schedules (
          scheduled_at,
          duration_minutes
        )
      `)
      .eq("practitioner_id", practitionerId);

    // Apply date filter
    if (dateRange === '2weeks') {
      const twoWeeksAgo = subWeeks(new Date(), 2).toISOString();
      query = query.gte("created_at", twoWeeksAgo);
    } else if (dateRange === 'month') {
      const oneMonthAgo = subMonths(new Date(), 1).toISOString();
      query = query.gte("created_at", oneMonthAgo);
    } else if (dateRange === 'year') {
      const oneYearAgo = subMonths(new Date(), 12).toISOString();
      query = query.gte("created_at", oneYearAgo);
    } else if (dateRange === 'all' && customStartDate && customEndDate) {
      query = query
        .gte("created_at", startOfDay(new Date(customStartDate)).toISOString())
        .lte("created_at", endOfDay(new Date(customEndDate)).toISOString());
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (!error && data) {
      setPayments(data as SessionPayment[]);
    }
    setLoading(false);
  };

  const totalEarnings = payments.reduce((sum, p) => sum + Number(p.practitioner_share), 0);
  const pendingPayout = payments
    .filter(p => p.status === 'completed' && !p.paid_out_at)
    .reduce((sum, p) => sum + Number(p.practitioner_share), 0);
  const paidOut = payments
    .filter(p => p.paid_out_at)
    .reduce((sum, p) => sum + Number(p.practitioner_share), 0);

  // Calculate current period earnings (last 2 weeks)
  const twoWeeksAgo = subWeeks(new Date(), 2);
  const currentPeriodEarnings = payments
    .filter(p => new Date(p.created_at) >= twoWeeksAgo)
    .reduce((sum, p) => sum + Number(p.practitioner_share), 0);

  // Calculate last year earnings
  const oneYearAgo = subMonths(new Date(), 12);
  const lastYearEarnings = payments
    .filter(p => new Date(p.created_at) >= oneYearAgo)
    .reduce((sum, p) => sum + Number(p.practitioner_share), 0);

  // Prepare chart data (group by date, sorted chronologically)
  const chartData = payments
    .reduce((acc, payment) => {
      const date = format(new Date(payment.created_at), "MMM d");
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.earnings += Number(payment.practitioner_share);
      } else {
        acc.push({ date, earnings: Number(payment.practitioner_share) });
      }
      return acc;
    }, [] as { date: string; earnings: number }[])
    .sort((a, b) => {
      // Sort by date chronologically
      const dateA = new Date(a.date + ", " + new Date().getFullYear());
      const dateB = new Date(b.date + ", " + new Date().getFullYear());
      return dateA.getTime() - dateB.getTime();
    })
    .slice(-30); // Last 30 days

  const chartConfig = {
    earnings: {
      label: "Earnings",
      color: "hsl(var(--chart-1))",
    },
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Session Date', 'Total Amount', 'Your Earnings (75%)', 'Status', 'Paid Out Date'];
    const rows = payments.map(p => [
      format(new Date(p.created_at), 'yyyy-MM-dd'),
      p.session?.scheduled_at ? format(new Date(p.session.scheduled_at), 'yyyy-MM-dd') : 'N/A',
      `$${Number(p.total_amount).toFixed(2)}`,
      `$${Number(p.practitioner_share).toFixed(2)}`,
      p.paid_out_at ? 'Paid Out' : 'Pending',
      p.paid_out_at ? format(new Date(p.paid_out_at), 'yyyy-MM-dd') : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="history">Session History</TabsTrigger>
        <TabsTrigger value="payouts">Payout History</TabsTrigger>
        <TabsTrigger value="banking">Banking</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Period (2 weeks)
              </CardTitle>
              <Calendar className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${currentPeriodEarnings.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 2 weeks earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payout
              </CardTitle>
              <Wallet className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">
                ${pendingPayout.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting transfer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Year
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${lastYearEarnings.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Past 12 months
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Paid Out
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                ${paidOut.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Already received
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Earnings Trend</CardTitle>
                  <CardDescription>Your earnings over the selected period</CardDescription>
                </div>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2weeks">Last 2 Weeks</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                    <SelectItem value="all">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--muted-foreground))" 
                      opacity={0.15}
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                      tickLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                      tickFormatter={(value) => `$${value}`}
                      axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                      tickLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                      tickMargin={10}
                    />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg backdrop-blur-sm">
                              <p className="text-xs font-medium text-muted-foreground mb-1">{payload[0].payload.date}</p>
                              <p className="text-base text-primary font-bold">
                                ${Number(payload[0].value).toFixed(2)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "5 5", opacity: 0.3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="earnings"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ 
                        fill: "hsl(var(--primary))", 
                        r: 6, 
                        strokeWidth: 3, 
                        stroke: "hsl(var(--background))",
                        className: "drop-shadow-sm"
                      }}
                      activeDot={{ 
                        r: 8, 
                        strokeWidth: 3, 
                        stroke: "hsl(var(--background))",
                        fill: "hsl(var(--primary))",
                        className: "drop-shadow-md"
                      }}
                      animationDuration={750}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>View and export your session earnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2weeks">Last 2 Weeks</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                    <SelectItem value="all">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {dateRange === 'all' && (
                <>
                  <div className="flex-1">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="flex items-end">
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardContent className="pt-6">
            {payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No payments recorded yet</p>
                <p className="text-sm mt-1">Complete sessions to earn money</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Session Date</TableHead>
                    <TableHead>Session Total</TableHead>
                    <TableHead>Your Earnings (75%)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {format(new Date(payment.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {payment.session?.scheduled_at
                          ? format(new Date(payment.session.scheduled_at), "MMM d, yyyy")
                          : 'N/A'}
                      </TableCell>
                      <TableCell>${Number(payment.total_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-primary font-medium">
                        ${Number(payment.practitioner_share).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {payment.paid_out_at ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Paid Out
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payouts" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>
              Payouts are processed every 2 weeks. You'll receive payments for completed sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.filter(p => p.paid_out_at).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No payouts yet</p>
                <p className="text-sm mt-1">Payouts will appear here once processed</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments
                    .filter(p => p.paid_out_at)
                    .map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.paid_out_at!), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${Number(payment.practitioner_share).toFixed(2)}
                        </TableCell>
                        <TableCell>1 session</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Paid
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="banking">
        <PractitionerBanking practitionerId={practitionerId} />
      </TabsContent>
    </Tabs>
  );
};
