import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const Newsletter = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribing(true);

    try {
      const { data, error } = await supabase.functions.invoke('subscribe-newsletter', {
        body: {
          email: email.trim(),
          name: name.trim() || null,
          source: 'newsletter_page',
        },
      });

      if (error) throw error;

      if (data?.success) {
        setSubscribed(true);
        toast({
          title: "Success!",
          description: data.message || "You've been subscribed to our newsletter!",
        });
        setEmail("");
        setName("");
      }
    } catch (error: any) {
      console.error("Error subscribing:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Newsletter - Sadhu</title>
        <meta
          name="description"
          content="Subscribe to the Sadhu newsletter for wellness tips, updates, and exclusive content."
        />
        <meta name="keywords" content="newsletter, wellness, meditation, Sadhu, subscribe" />
        <link rel="canonical" href="https://sadhu.com/newsletter" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Newsletter - Sadhu" />
        <meta
          property="og:description"
          content="Subscribe to the Sadhu newsletter for wellness tips, updates, and exclusive content."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sadhu.com/newsletter" />
      </Helmet>

      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                Stay Connected
              </h1>
              <p className="text-xl text-muted-foreground">
                Subscribe to our newsletter for wellness tips, updates, and exclusive content.
              </p>
            </div>

            {subscribed ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-heading font-bold mb-2">
                      Thank You for Subscribing!
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      You'll receive our latest updates, wellness tips, and exclusive content.
                    </p>
                    <Button
                      onClick={() => setSubscribed(false)}
                      variant="outline"
                    >
                      Subscribe Another Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Newsletter Subscription
                  </CardTitle>
                  <CardDescription>
                    Join our community and stay updated with the latest from Sadhu.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name (Optional)</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={subscribing || !email.trim()}
                    >
                      {subscribing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Subscribe
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      By subscribing, you agree to receive emails from Sadhu. You can unsubscribe at any time.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="mt-12 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>What to Expect</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Wellness tips and meditation guides</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Updates on new classes and practitioners</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Exclusive offers and promotions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Community stories and testimonials</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Newsletter;

