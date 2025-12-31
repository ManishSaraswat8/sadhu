import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import sadhuBoard from "@/assets/sadhu-board.jpg";
import Footer from "@/components/Footer";

const SadhuBoard = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<{ price_cad: number; price_usd: number } | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const { toast } = useToast();
  const { currency, formatPrice } = useCurrency();

  const features = [
    "Handcrafted from premium Mango Wood",
    "Precision-placed copper nails",
    "10mm Diamond shape spacing",
    "Ergonomic design for standing, laying, or holding practice",
    "Lifetime durability guarantee",
  ];

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "Order Confirmed!",
        description: "Thank you for your purchase. You'll receive a confirmation email shortly.",
      });
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: "Order Canceled",
        description: "Your order was canceled. Feel free to try again.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("price_cad, price_usd")
          .eq("slug", "sadhu-board")
          .eq("is_active", true)
          .single();

        if (error) throw error;
        if (data) {
          setProduct(data);
        }
      } catch (error) {
        console.error("Error loading product:", error);
        // Fallback to default prices if database fails
        setProduct({ price_cad: 229, price_usd: 167 });
      } finally {
        setLoadingProduct(false);
      }
    };

    loadProduct();
  }, []);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-board-payment", {
        body: { currency },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const displayPrice = product 
    ? (currency === 'cad' ? product.price_cad : product.price_usd)
    : (currency === 'cad' ? 229 : 167);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <CurrencySwitcher />
        </div>
      </header>

      {/* Product Section */}
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Product Image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
                <img
                  src={sadhuBoard}
                  alt="Sadhu Board - Premium Nail Board for Meditation"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                Limited Edition
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  The Sadhu Board
                </h1>
                <p className="text-xl text-muted-foreground">
                  Transform your meditation practice with our premium handcrafted nail board. 
                  An ancient tool for modern mindfulness, designed to help you transcend physical 
                  sensation and achieve deeper states of awareness.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  {loadingProduct ? (
                    <span className="text-4xl font-bold text-foreground">...</span>
                  ) : (
                    <span className="text-4xl font-bold text-foreground">
                      {formatPrice(displayPrice)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Free shipping worldwide</p>
              </div>

              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-muted-foreground">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="space-y-4">
                <Button 
                  variant="teal" 
                  size="xl" 
                  className="w-full"
                  onClick={handlePurchase}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Buy Now"
                  )}
                </Button>
                <Link to="/sadhu-board-info" className="block text-center text-primary hover:underline">
                  Learn more about the Sadhu Board →
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground">or</span>
                </div>
              </div>

              <Link to="/auth" className="block">
                <Button variant="outline" size="lg" className="w-full">
                  Skip to Login / Sign Up
                </Button>
              </Link>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-24 grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-muted/50">
              <h3 className="text-xl font-semibold text-foreground mb-3">Ancient Wisdom</h3>
              <p className="text-muted-foreground">
                Used by Sadhu monks for centuries to transcend physical limitations and achieve spiritual enlightenment.
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-muted/50">
              <h3 className="text-xl font-semibold text-foreground mb-3">Modern Design</h3>
              <p className="text-muted-foreground">
                Engineered with precision for optimal nail spacing and ergonomic comfort during practice.
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-muted/50">
              <h3 className="text-xl font-semibold text-foreground mb-3">AI-Enhanced</h3>
              <p className="text-muted-foreground">
                Pair with our AI meditation guide for personalized sessions that adapt to your practice level.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SadhuBoard;
