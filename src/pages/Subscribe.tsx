import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Check, Loader2, Crown, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import sadhuLogo from "@/assets/sadhu-logo.png";
import Footer from "@/components/Footer";

const Subscribe = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading, createCheckout, checkSubscription } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState<'monthly' | 'annual' | null>(null);

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Checkout Canceled",
        description: "You can try again whenever you're ready.",
      });
    }
  }, [searchParams, toast]);

  // Redirect if already subscribed
  useEffect(() => {
    if (user && !subLoading && subscribed) {
      navigate("/dashboard/meditation");
    }
  }, [user, subscribed, subLoading, navigate]);

  const handleSubscribe = async (priceType: 'monthly' | 'annual') => {
    setCheckoutLoading(priceType);
    try {
      // Allow checkout for both logged in and guest users
      await createCheckout(priceType);
      // If user is logged in, refresh subscription status after checkout
      if (user) {
        setTimeout(() => {
          checkSubscription();
        }, 2000);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const isLoading = authLoading || (user && subLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    "Unlimited AI-guided meditation sessions",
    "Personalized stress assessment",
    "Voice-activated meditation timer",
    "Session memory & personalization",
    "Coping wheel emotional tracking",
    "Holmes-Rahe stress inventory",
  ];

  return (
    <>
      <Helmet>
        <title>Subscribe - AI Meditation Guide | Sadhu</title>
        <meta name="description" content="Subscribe to Sadhu's AI Meditation Guide - personalized voice-guided meditation sessions with speech-to-text interaction. Start your 7-day free trial today." />
        <meta name="keywords" content="Sadhu subscription, AI meditation guide, meditation subscription, guided meditation, mindfulness subscription, meditation app" />
        <meta property="og:title" content="Subscribe - AI Meditation Guide | Sadhu" />
        <meta property="og:description" content="Subscribe to Sadhu's AI Meditation Guide - personalized voice-guided meditation sessions. Start your 7-day free trial." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/subscribe`} />
        <link rel="canonical" href={`${window.location.origin}/subscribe`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <img src={sadhuLogo} alt="Sadhu" className="h-8 w-auto" />
          <h1 className="text-xl font-heading">Start Your Free Trial</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium">7-Day Free Trial</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-light text-foreground mb-4">
              Start Your Free Trial Today
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Try our AI-guided meditation for 7 days free. No charge until your trial ends.
              Cancel anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Monthly Plan */}
            <Card className="relative group hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-heading">Monthly</CardTitle>
                <CardDescription>Flexible month-to-month billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$14.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  size="lg"
                  variant="outline"
                  onClick={() => handleSubscribe('monthly')}
                  disabled={!!checkoutLoading}
                >
                  {checkoutLoading === 'monthly' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Start 7-Day Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Annual Plan */}
            <Card className="relative group hover:shadow-lg transition-all duration-300 border-primary/50 bg-gradient-to-br from-card to-primary/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  Save 20%
                </span>
              </div>
              <CardHeader className="pb-4 pt-8">
                <CardTitle className="text-2xl font-heading">Annual</CardTitle>
                <CardDescription>Best value - billed yearly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$11.99</span>
                  <span className="text-muted-foreground">/month</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    $143.88 billed annually
                  </p>
                </div>
                <ul className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleSubscribe('annual')}
                  disabled={!!checkoutLoading}
                >
                  {checkoutLoading === 'annual' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Start 7-Day Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="text-center text-sm text-muted-foreground space-y-4">
            <p>Secure payment powered by Stripe. Cancel anytime.</p>
            <p>
              Already have an account?{" "}
              <Link to="/auth" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
      </div>
    </>
  );
};

export default Subscribe;
