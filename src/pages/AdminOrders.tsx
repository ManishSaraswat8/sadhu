import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2, Search, Download, Filter } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  session_id: string | null;
  practitioner_id: string;
  client_id: string;
  total_amount: number;
  practitioner_share: number;
  platform_share: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  status: string;
  paid_out_at: string | null;
  created_at: string;
  session?: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
  };
  practitioner?: {
    name: string;
  };
  client?: {
    email: string;
  };
}

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");

  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin-payments", statusFilter, currencyFilter],
    queryFn: async () => {
      // Get fresh session token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("list-payments", {
        body: {
          status: statusFilter,
          currency: currencyFilter,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data?.payments) throw new Error("No payments data returned");

      return data.payments as Payment[];
    },
  });

  const filteredPayments = payments?.filter((payment) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      payment.stripe_payment_intent_id?.toLowerCase().includes(search) ||
      payment.practitioner?.name.toLowerCase().includes(search) ||
      payment.client?.email.toLowerCase().includes(search) ||
      payment.id.toLowerCase().includes(search)
    );
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(currency === "cad" ? "en-CA" : "en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
  const totalPlatformShare = payments?.reduce((sum, p) => sum + Number(p.platform_share), 0) || 0;
  const completedPayments = payments?.filter((p) => p.status === "completed").length || 0;

  return (
    <AdminLayout title="Orders & Payments">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalRevenue, "usd")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform Share
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalPlatformShare, "usd")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedPayments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Orders & Payments</CardTitle>
            <CardDescription>
              View and manage all payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by payment ID, practitioner, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="cad">CAD</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Practitioner</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Platform Share</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments && filteredPayments.length > 0 ? (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.created_at), "MMM d, yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.stripe_payment_intent_id || payment.id.substring(0, 8)}
                          </TableCell>
                          <TableCell>{payment.client?.email || "N/A"}</TableCell>
                          <TableCell>{payment.practitioner?.name || "N/A"}</TableCell>
                          <TableCell>
                            {payment.session ? (
                              <div className="text-sm">
                                <div>{format(new Date(payment.session.scheduled_at), "MMM d, yyyy")}</div>
                                <div className="text-muted-foreground">
                                  {payment.session.duration_minutes} min
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Package Purchase</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(Number(payment.total_amount), payment.currency)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatCurrency(Number(payment.platform_share), payment.currency)}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No payments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;

