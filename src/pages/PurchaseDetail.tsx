import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserLayout } from "@/components/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Receipt, Calendar, Package, ArrowLeft, CheckCircle, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
  stripe_payment_intent_id?: string | null;
}

const PurchaseDetail = () => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (purchaseId && user) {
      fetchPurchase();
    }
  }, [purchaseId, user]);

  const fetchPurchase = async () => {
    if (!purchaseId || !user) return;

    try {
      setLoading(true);
      
      // Try to fetch from session_payments first
      const { data: sessionPayment, error: sessionError } = await supabase
        .from("session_payments")
        .select(`
          id,
          total_amount,
          currency,
          status,
          created_at,
          stripe_payment_intent_id,
          session:session_schedules (
            id,
            scheduled_at,
            duration_minutes
          )
        `)
        .eq("id", purchaseId)
        .eq("client_id", user.id)
        .maybeSingle();

      if (sessionPayment) {
        setPurchase({
          ...sessionPayment,
          package_id: null,
          type: 'session' as const,
        } as Purchase);
        setLoading(false);
        return;
      }

      // If not found, try user_session_credits (package purchase)
      const { data: credit, error: creditError } = await supabase
        .from("user_session_credits")
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
        .eq("id", purchaseId)
        .eq("user_id", user.id)
        .not("package_id", "is", null)
        .maybeSingle();

      if (credit) {
        const metadata = credit.metadata || {};
        const currency = metadata.currency || 'usd';
        const packageData = credit.package;
        
        setPurchase({
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
          stripe_payment_intent_id: null,
        });
      } else {
        throw new Error("Purchase not found");
      }
    } catch (error) {
      console.error("Error fetching purchase:", error);
      toast({
        title: "Error",
        description: "Could not load purchase details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <UserLayout title="Purchase Details">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </UserLayout>
    );
  }

  if (!purchase) {
    return (
      <UserLayout title="Purchase Not Found">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Purchase not found or you don't have access to it.</p>
            <Button asChild>
              <Link to="/purchases">Back to Purchases</Link>
            </Button>
          </CardContent>
        </Card>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="Purchase Details">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/purchases">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Purchases
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2">
                {purchase.type === 'package' ? (
                  <Package className="w-6 h-6" />
                ) : (
                  <Receipt className="w-6 h-6" />
                )}
                Purchase Details
              </CardTitle>
              <Badge
                variant={purchase.status === 'completed' ? 'default' : 'outline'}
                className="text-sm"
              >
                {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Purchase Type */}
            <div className="pb-4 border-b">
              <div className="text-sm text-muted-foreground mb-1">Purchase Type</div>
              <div className="text-lg font-semibold">
                {purchase.type === 'package'
                  ? purchase.package_name || `Session Package (${purchase.session_count || 'N/A'} sessions)`
                  : purchase.session
                  ? `Single Session - ${format(new Date(purchase.session.scheduled_at), "MMM d, yyyy")}`
                  : "Single Session"}
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <DollarSign className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Amount Paid</div>
                <div className="text-2xl font-bold">
                  {purchase.currency.toUpperCase()} ${Number(purchase.total_amount).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Purchase Date</div>
                <div className="font-medium">
                  {format(new Date(purchase.created_at), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            </div>

            {/* Session Details (if single session) */}
            {purchase.type === 'session' && purchase.session && (
              <div className="pb-4 border-b">
                <div className="text-sm text-muted-foreground mb-2">Session Details</div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Date:</span>{" "}
                    {format(new Date(purchase.session.scheduled_at), "MMM d, yyyy")}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {purchase.session.duration_minutes} minutes
                  </div>
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <Link to={`/sessions/${purchase.session.id}`}>View Session Details</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Package Details (if package) */}
            {purchase.type === 'package' && (
              <div className="pb-4 border-b">
                <div className="text-sm text-muted-foreground mb-2">Package Details</div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Sessions Included:</span> {purchase.session_count || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Package Name:</span> {purchase.package_name || 'Session Package'}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Info */}
            {purchase.stripe_payment_intent_id && (
              <div className="pb-4 border-b">
                <div className="text-sm text-muted-foreground mb-1">Payment ID</div>
                <div className="text-xs font-mono">{purchase.stripe_payment_intent_id}</div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-3">
              {purchase.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <div className="text-sm text-muted-foreground">Payment Status</div>
                <div className="font-medium">{purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default PurchaseDetail;

