import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Practitioner = Tables<"practitioners">;

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
}

interface PractitionerEarningsProps {
  practitioner: Practitioner;
  onBack: () => void;
}

export const PractitionerEarnings = ({ practitioner, onBack }: PractitionerEarningsProps) => {
  const [payments, setPayments] = useState<SessionPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [practitioner.id]);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("session_payments")
      .select("*")
      .eq("practitioner_id", practitioner.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPayments(data);
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

  const handleMarkPaid = async (paymentId: string) => {
    const { error } = await supabase
      .from("session_payments")
      .update({ paid_out_at: new Date().toISOString(), status: 'paid_out' })
      .eq("id", paymentId);

    if (!error) {
      fetchPayments();
    }
  };

  const handleMarkAllPaid = async () => {
    const pendingIds = payments
      .filter(p => p.status === 'completed' && !p.paid_out_at)
      .map(p => p.id);

    if (pendingIds.length === 0) return;

    const { error } = await supabase
      .from("session_payments")
      .update({ paid_out_at: new Date().toISOString(), status: 'paid_out' })
      .in("id", pendingIds);

    if (!error) {
      fetchPayments();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Earnings: {practitioner.name}
          </h2>
          <p className="text-muted-foreground">
            Track earnings and manage payouts (75% practitioner / 25% platform)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalEarnings.toFixed(2)}
            </div>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Out
            </CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${paidOut.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Action */}
      {pendingPayout > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-foreground">
                ${pendingPayout.toFixed(2)} ready for payout
              </p>
              <p className="text-sm text-muted-foreground">
                Mark as paid once you've transferred funds to the practitioner
              </p>
            </div>
            <Button onClick={handleMarkAllPaid}>
              Mark All as Paid
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : payments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No payments recorded yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Session Total</TableHead>
                  <TableHead>Practitioner (75%)</TableHead>
                  <TableHead>Platform (25%)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>${Number(payment.total_amount).toFixed(2)}</TableCell>
                    <TableCell className="text-primary font-medium">
                      ${Number(payment.practitioner_share).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      ${Number(payment.platform_share).toFixed(2)}
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
                    <TableCell>
                      {!payment.paid_out_at && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkPaid(payment.id)}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
