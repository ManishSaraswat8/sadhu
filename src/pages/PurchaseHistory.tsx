import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserLayout } from "@/components/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Receipt, Calendar, Package, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface Purchase {
  id: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  session: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
  } | null;
  package_id: string | null;
  package_name?: string | null;
  session_count?: number | null;
  type: 'session' | 'package';
}

const PurchaseHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchPurchases = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch single session purchases
      const { data: sessionPayments, error: sessionError } = await supabase
        .from("session_payments")
        .select(`
          id,
          total_amount,
          currency,
          status,
          created_at,
          session:session_schedules (
            id,
            scheduled_at,
            duration_minutes
          )
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (sessionError) throw sessionError;

      // Fetch package purchases from user_session_credits
      const { data: packageCredits, error: packageError } = await supabase
        .from("user_session_credits" as any)
        .select(`
          id,
          package_id,
          credits_remaining,
          purchased_at,
          metadata,
          package:session_packages (
            id,
            name,
            session_count,
            price_usd,
            price_cad
          )
        `)
        .eq("user_id", user.id)
        .not("package_id", "is", null)
        .order("purchased_at", { ascending: false });

      if (packageError) throw packageError;

      // Transform session payments
      const sessionPurchases: Purchase[] = (sessionPayments || []).map((payment: any) => ({
        id: payment.id,
        total_amount: payment.total_amount,
        currency: payment.currency,
        status: payment.status,
        created_at: payment.created_at,
        session: payment.session,
        package_id: null,
        type: 'session' as const,
      }));

      // Transform package credits to purchases
      const packagePurchases: Purchase[] = (packageCredits || []).map((credit: any) => {
        const metadata = credit.metadata || {};
        const currency = metadata.currency || 'usd';
        const packageData = credit.package;
        
        return {
          id: credit.id,
          total_amount: metadata.total_amount || (currency === 'cad' ? packageData?.price_cad : packageData?.price_usd) || 0,
          currency: currency,
          status: 'completed',
          created_at: credit.purchased_at,
          session: null,
          package_id: credit.package_id,
          package_name: packageData?.name || null,
          session_count: packageData?.session_count || null,
          type: 'package' as const,
        };
      });

      // Combine and sort by date
      const allPurchases = [...sessionPurchases, ...packagePurchases].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPurchases(allPurchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <UserLayout title="Purchase History">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="Purchase History">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              All Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your purchase history will appear here once you make a payment.
                </p>
                <Button asChild>
                  <Link to="/sessions/payment">Buy Sessions</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/purchases/${purchase.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {purchase.package_id ? (
                          <Package className="w-5 h-5 text-primary" />
                        ) : (
                          <Calendar className="w-5 h-5 text-primary" />
                        )}
                        <div>
                          <div className="font-medium">
                            {purchase.type === 'package'
                              ? purchase.package_name || `Session Package (${purchase.session_count || 'N/A'} sessions)`
                              : purchase.session
                              ? `Session - ${format(new Date(purchase.session.scheduled_at), "MMM d, yyyy")}`
                              : "Single Session"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(purchase.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                      </div>
                      {purchase.type === 'session' && purchase.session && (
                        <div className="text-sm text-muted-foreground ml-8">
                          {purchase.session.duration_minutes} min session
                        </div>
                      )}
                      {purchase.type === 'package' && purchase.session_count && (
                        <div className="text-sm text-muted-foreground ml-8">
                          {purchase.session_count} sessions package
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">
                          {purchase.currency.toUpperCase()} ${Number(purchase.total_amount).toFixed(2)}
                        </div>
                        <Badge
                          variant={purchase.status === 'completed' ? 'default' : 'outline'}
                          className="mt-1"
                        >
                          {purchase.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default PurchaseHistory;

