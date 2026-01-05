import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserLayout } from "@/components/UserLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Receipt, Package, ShoppingCart, Wallet as WalletIcon, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface SessionType {
  id: string;
  name: string;
  duration_minutes: number;
  session_type: string;
  is_group: boolean;
  price_cad: number;
  price_usd: number;
}

interface SessionPackage {
  id: string;
  name: string;
  session_count: number;
  price_cad: number;
  price_usd: number;
  stripe_price_id_cad: string | null;
  stripe_price_id_usd: string | null;
}

interface UserCredit {
  id: string;
  credits_remaining: number;
  session_type_id: string | null;
  session_type: SessionType | null;
  package_id: string | null;
  package: SessionPackage | null;
  purchased_at: string;
}

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
  type: 'session' | 'package' | 'board';
}

const Wallet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currency, formatPrice } = useCurrency();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'20' | '45' | '60' | 'board' | 'history'>('20');
  const [loading, setLoading] = useState(true);
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [userCredits, setUserCredits] = useState<UserCredit[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, currency]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch session types
      const { data: types, error: typesError } = await supabase
        .from("session_types")
        .select("*")
        .eq("is_active", true)
        .order("duration_minutes", { ascending: true });

      if (typesError) throw typesError;
      setSessionTypes(types || []);

      // Fetch packages
      const { data: pkgData, error: pkgError } = await supabase
        .from("session_packages")
        .select("*")
        .eq("is_active", true)
        .order("session_count", { ascending: true });

      if (pkgError) throw pkgError;
      setPackages(pkgData || []);

      // Fetch user credits with session type info
      const { data: credits, error: creditsError } = await supabase
        .from("user_session_credits" as any)
        .select(`
          id,
          credits_remaining,
          session_type_id,
          package_id,
          purchased_at,
          session_type:session_types (
            id,
            name,
            duration_minutes,
            session_type,
            is_group,
            price_cad,
            price_usd
          ),
          package:session_packages (
            id,
            name,
            session_count,
            price_cad,
            price_usd
          )
        `)
        .eq("user_id", user.id)
        .gt("credits_remaining", 0)
        .order("purchased_at", { ascending: false });

      if (creditsError) throw creditsError;
      setUserCredits(credits || []);

      // Fetch purchase history
      await fetchPurchases();
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast({
        title: "Error",
        description: "Failed to load wallet data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    if (!user) return;

    try {
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

      // Fetch package purchases
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

      // Transform to purchases
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

      const allPurchases = [...sessionPurchases, ...packagePurchases].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPurchases(allPurchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  };

  const getCreditsForDuration = (duration: number) => {
    return userCredits.filter(credit => {
      if (credit.session_type_id && credit.session_type) {
        return credit.session_type.duration_minutes === duration;
      }
      // Package credits can be used for any duration
      if (credit.package_id && !credit.session_type_id) {
        return true;
      }
      return false;
    });
  };

  const getTotalCreditsForDuration = (duration: number) => {
    const credits = getCreditsForDuration(duration);
    return credits.reduce((sum, credit) => sum + credit.credits_remaining, 0);
  };

  const handlePurchasePackage = async (pkg: SessionPackage, duration: number) => {
    if (!user) return;

    setPurchasing(pkg.id);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      // Find session type for this duration (use first available)
      const sessionType = sessionTypes.find(
        st => st.duration_minutes === duration && !st.is_group
      );

      const { data, error } = await supabase.functions.invoke('create-session-payment', {
        body: {
          payment_type: `package_${pkg.session_count}`,
          session_type_id: sessionType?.id || null,
          duration_minutes: duration,
          currency: currency,
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchaseBoard = () => {
    navigate('/sadhu-board');
  };

  if (loading) {
    return (
      <UserLayout title="Wallet">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </UserLayout>
    );
  }

  const renderDurationTab = (duration: 20 | 45 | 60) => {
    const availableCredits = getTotalCreditsForDuration(duration);
    const credits = getCreditsForDuration(duration);
    const durationPackages = packages; // All packages can be used for any duration

    return (
      <div className="space-y-6">
        {/* Available Credits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5" />
              Available Credits
            </CardTitle>
            <CardDescription>
              You have {availableCredits} credit{availableCredits !== 1 ? 's' : ''} available for {duration}-minute sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {credits.length === 0 ? (
              <p className="text-muted-foreground text-sm">No credits available for this duration.</p>
            ) : (
              <div className="space-y-2">
                {credits.map((credit) => (
                  <div key={credit.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">
                          {credit.package ? `${credit.package.name}` : credit.session_type ? `${credit.session_type.name}` : 'Single Session'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Purchased {format(new Date(credit.purchased_at), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {credit.credits_remaining} remaining
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Package Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Purchase Packages
            </CardTitle>
            <CardDescription>
              Choose a package for {duration}-minute sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {durationPackages.length === 0 ? (
              <p className="text-muted-foreground text-sm">No packages available.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {durationPackages.map((pkg) => {
                  const price = currency === 'cad' ? pkg.price_cad : pkg.price_usd;
                  const perSessionPrice = price / pkg.session_count;
                  const singleSessionPrice = sessionTypes.find(st => st.duration_minutes === duration && !st.is_group);
                  const singlePrice = singleSessionPrice ? (currency === 'cad' ? singleSessionPrice.price_cad : singleSessionPrice.price_usd) : 0;
                  const savings = (singlePrice * pkg.session_count) - price;
                  const savingsPercent = singlePrice > 0 ? Math.round((savings / (singlePrice * pkg.session_count)) * 100) : 0;

                  return (
                    <Card key={pkg.id} className="border-2">
                      <CardHeader>
                        <CardTitle>{pkg.name}</CardTitle>
                        <CardDescription>
                          {pkg.session_count} {duration}-minute sessions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="text-3xl font-bold">
                            {formatPrice(price)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(perSessionPrice)} per session
                          </div>
                          {savings > 0 && (
                            <Badge variant="secondary" className="mt-2">
                              Save {formatPrice(savings)} ({savingsPercent}%)
                            </Badge>
                          )}
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => handlePurchasePackage(pkg, duration)}
                          disabled={purchasing === pkg.id}
                        >
                          {purchasing === pkg.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Purchase
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <UserLayout title="Wallet">
      <div className="max-w-6xl mx-auto space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="20">20 MIN</TabsTrigger>
            <TabsTrigger value="45">45 MIN</TabsTrigger>
            <TabsTrigger value="60">60 MIN</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="20" className="mt-6">
            {renderDurationTab(20)}
          </TabsContent>

          <TabsContent value="45" className="mt-6">
            {renderDurationTab(45)}
          </TabsContent>

          <TabsContent value="60" className="mt-6">
            {renderDurationTab(60)}
          </TabsContent>

          <TabsContent value="board" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Sadhu Board
                </CardTitle>
                <CardDescription>
                  Premium handcrafted Mango Wood meditation board
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">
                    {formatPrice(169)}
                  </div>
                  <Button
                    className="w-full"
                    onClick={handlePurchaseBoard}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Purchase Sadhu Board
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Transform your practice with our handcrafted meditation board.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Purchase History
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {purchase.package_id ? (
                              <Package className="w-5 h-5 text-primary" />
                            ) : (
                              <Receipt className="w-5 h-5 text-primary" />
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
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
};

export default Wallet;

