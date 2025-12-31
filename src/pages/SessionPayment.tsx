import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, ArrowLeft, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

interface Practitioner {
  id: string;
  name: string;
}

const SessionPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currency, formatPrice } = useCurrency();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  
  // Get session details from URL params
  const practitionerId = searchParams.get('practitioner_id');
  const scheduledAt = searchParams.get('scheduled_at');
  const durationMinutes = parseInt(searchParams.get('duration_minutes') || '60');
  const sessionTypeId = searchParams.get('session_type_id');
  const sessionTypeParam = searchParams.get('session_type') || 'standing';
  const isGroup = searchParams.get('is_group') === 'true';
  const notes = searchParams.get('notes');

  useEffect(() => {
    console.log("SessionPayment useEffect - checking params:", {
      practitionerId,
      scheduledAt,
      authLoading,
      user: !!user,
      allParams: Object.fromEntries(searchParams.entries()),
    });

    if (!authLoading && !user) {
      console.log("No user, redirecting to auth");
      navigate('/auth');
      return;
    }

    if (authLoading || !user) {
      console.log("Waiting for auth...", { authLoading, user: !!user });
      return;
    }

    if (!practitionerId || !scheduledAt) {
      console.error("Missing required params:", { practitionerId, scheduledAt });
      toast({
        title: "Missing Information",
        description: "Please select a practitioner and session time first.",
        variant: "destructive",
      });
      navigate('/sessions/book');
      return;
    }

    console.log("All params present, loading data...");
    loadData();
  }, [user, authLoading, practitionerId, scheduledAt, searchParams]);

  // Fetch cancellation policy
  const { data: cancellationPolicy } = useQuery({
    queryKey: ["cancellation-policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cancellation_policy" as never)
        .select("*")
        .eq("is_active", true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as any;
    },
  });

  const loadData = async () => {
    try {
      setLoading(true);

      // Currency is now handled by useCurrency hook

      // Load practitioner
      const { data: practitionerData, error: practitionerError } = await supabase
        .from("practitioners")
        .select("id, name")
        .eq("id", practitionerId)
        .single();

      if (practitionerError || !practitionerData) {
        throw new Error("Practitioner not found");
      }
      setPractitioner(practitionerData);

      // Load session type
      if (sessionTypeId) {
        const { data: sessionTypeData, error: sessionTypeError } = await supabase
          .from("session_types")
          .select("*")
          .eq("id", sessionTypeId)
          .eq("is_active", true)
          .single();

        if (!sessionTypeError && sessionTypeData) {
          setSessionType(sessionTypeData);
        }
      } else {
        // Find session type by duration, type, and is_group
        const { data: sessionTypeData, error: sessionTypeError } = await supabase
          .from("session_types")
          .select("*")
          .eq("duration_minutes", durationMinutes)
          .eq("session_type", sessionTypeParam)
          .eq("is_group", isGroup)
          .eq("is_active", true)
          .single();

        if (!sessionTypeError && sessionTypeData) {
          setSessionType(sessionTypeData);
        }
      }

      // Load packages
      const { data: packagesData, error: packagesError } = await supabase
        .from("session_packages")
        .select("*")
        .eq("is_active", true)
        .order("session_count", { ascending: true });

      if (!packagesError && packagesData) {
        setPackages(packagesData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load session information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (paymentType: 'single' | 'package_5' | 'package_10') => {
    if (!user || !practitioner || !sessionType) return;

    // Check if policy agreement is required
    if (cancellationPolicy && !policyAgreed) {
      toast({
        title: "Agreement Required",
        description: "Please read and agree to the cancellation policy before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(paymentType);

    try {
      const { data, error } = await supabase.functions.invoke('create-session-payment', {
        body: {
          practitioner_id: practitionerId,
          scheduled_at: scheduledAt,
          duration_minutes: durationMinutes,
          notes: notes || null,
          payment_type: paymentType,
          session_type_id: sessionType.id,
          currency: currency,
          cancellation_policy_agreed: policyAgreed,
          cancellation_policy_version: cancellationPolicy?.id || null,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "Payment Failed",
        description: "Could not initiate payment. Please try again.",
        variant: "destructive",
      });
      setProcessing(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    console.log("No user, showing loading...");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!practitioner || !sessionType) {
    console.log("Missing data, showing loading...", { practitioner: !!practitioner, sessionType: !!sessionType });
    if (!practitionerId || !scheduledAt) {
      console.error("Missing required params, redirecting...", { practitionerId, scheduledAt });
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Missing session information</p>
            <Button onClick={() => navigate('/sessions/book')}>Go to Booking</Button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading session details...</p>
        </div>
      </div>
    );
  }

  const singlePrice = currency === 'cad' ? sessionType.price_cad : sessionType.price_usd;
  const package5 = packages.find(p => p.session_count === 5);
  const package10 = packages.find(p => p.session_count === 10);
  const package5Price = package5 ? (currency === 'cad' ? package5.price_cad : package5.price_usd) : 0;
  const package10Price = package10 ? (currency === 'cad' ? package10.price_cad : package10.price_usd) : 0;

  // Calculate savings
  const package5Savings = package5 ? (singlePrice * 5) - package5Price : 0;
  const package10Savings = package10 ? (singlePrice * 10) - package10Price : 0;
  const package5SavingsPercent = package5 ? Math.round((package5Savings / (singlePrice * 5)) * 100) : 0;
  const package10SavingsPercent = package10 ? Math.round((package10Savings / (singlePrice * 10)) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl md:text-4xl font-heading font-light text-foreground mb-2">
            Complete Your Booking
          </h1>
          <p className="text-muted-foreground">
            Choose a payment option to confirm your session
          </p>
        </div>

        {/* Session Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Practitioner:</span>
              <span className="font-medium">{practitioner.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & Time:</span>
              <span className="font-medium">
                {format(new Date(scheduledAt!), "PPP 'at' p")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{durationMinutes} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">
                {sessionType.session_type.charAt(0).toUpperCase() + sessionType.session_type.slice(1)} 
                {' '}({sessionType.is_group ? 'Group' : '1:1'})
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Single Session */}
          <Card className="relative hover:shadow-teal transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl">Single Session</CardTitle>
              <CardDescription>Pay for just this session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {formatPrice(singlePrice)}
                </div>
                <div className="text-sm text-muted-foreground">
                  One-time payment
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handlePayment('single')}
                disabled={!!processing || (cancellationPolicy && !policyAgreed)}
              >
                {processing === 'single' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Pay Now"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 5 Session Package */}
          {package5 && (
            <Card className="relative hover:shadow-teal transition-all duration-300 border-primary/30">
              {package5Savings > 0 && (
                <Badge className="absolute -top-3 right-4 bg-primary">
                  Save {package5SavingsPercent}%
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  5 Session Package
                  <Sparkles className="w-4 h-4 text-primary" />
                </CardTitle>
                <CardDescription>Best value for regular practice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {formatPrice(package5Price)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(package5Price / 5)} per session
                  </div>
                  {package5Savings > 0 && (
                    <div className="text-xs text-primary mt-1">
                      Save {formatPrice(package5Savings)}
                    </div>
                  )}
                </div>
                <Button
                  variant="teal"
                  className="w-full"
                  onClick={() => handlePayment('package_5')}
                  disabled={!!processing || (cancellationPolicy && !policyAgreed)}
                >
                  {processing === 'package_5' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Buy Package
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 10 Session Package */}
          {package10 && (
            <Card className="relative hover:shadow-teal transition-all duration-300 border-primary/50">
              {package10Savings > 0 && (
                <Badge className="absolute -top-3 right-4 bg-primary">
                  Save {package10SavingsPercent}%
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  10 Session Package
                  <Sparkles className="w-4 h-4 text-primary" />
                </CardTitle>
                <CardDescription>Maximum savings for committed practice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {formatPrice(package10Price)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(package10Price / 10)} per session
                  </div>
                  {package10Savings > 0 && (
                    <div className="text-xs text-primary mt-1">
                      Save {formatPrice(package10Savings)}
                    </div>
                  )}
                </div>
                <Button
                  variant="teal"
                  className="w-full"
                  onClick={() => handlePayment('package_10')}
                  disabled={!!processing || (cancellationPolicy && !policyAgreed)}
                >
                  {processing === 'package_10' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Buy Package
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cancellation Policy Agreement */}
        {cancellationPolicy && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Cancellation Policy</CardTitle>
              <CardDescription>
                Please read and agree to our cancellation policy before checkout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-64 w-full rounded-md border p-4">
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {(cancellationPolicy as any)?.policy_text || ''}
                </div>
              </ScrollArea>
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="policy-agreement"
                  checked={policyAgreed}
                  onCheckedChange={(checked) => setPolicyAgreed(checked === true)}
                  className="mt-1"
                />
                <label
                  htmlFor="policy-agreement"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I have read and agree to the cancellation policy *
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Note */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              💡 <strong>Tip:</strong> Packages can be used for any session type and never expire. 
              Perfect for maintaining a consistent practice schedule.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SessionPayment;

