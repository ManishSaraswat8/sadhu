import { Link } from "react-router-dom";
import { Instagram, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import sadhuLogo from "@/assets/sadhu-logo.png";

const Footer = () => {
  const { toast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('subscribe-newsletter', {
        body: {
          email: newsletterEmail.trim(),
          source: 'footer',
        },
      });

      if (error) throw error;

      if (data?.success) {
        setSubscribed(true);
        toast({
          title: "Subscribed!",
          description: data.message || "You've been subscribed to our newsletter!",
        });
        setNewsletterEmail("");
        setTimeout(() => setSubscribed(false), 3000);
      }
    } catch (error: any) {
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
    <footer className="bg-card border-t border-border py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <img src={sadhuLogo} alt="Sadhu" className="h-16 w-auto" />
            <p className="text-muted-foreground text-sm">
              Transform pain into peace through ancient wisdom and modern technology.
            </p>
            <a 
              href="https://www.instagram.com/sadhu.io.official?igsh=eHYwbmltNzRpM3Vz&utm_source=qr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="h-6 w-6" />
            </a>
            
            {/* Newsletter Signup */}
            <div className="space-y-2 pt-4">
              <h5 className="font-medium text-sm text-foreground">Newsletter</h5>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="h-9 text-sm"
                  disabled={subscribing || subscribed}
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={subscribing || subscribed || !newsletterEmail.trim()}
                  className="h-9"
                >
                  {subscribed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : subscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">
                <Link to="/newsletter" className="hover:text-primary transition-colors">
                  Subscribe to our newsletter
                </Link>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg text-foreground">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/sadhu-board-info" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Sadhu Board
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg text-foreground">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/become-practitioner" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Become a Practitioner
                </Link>
              </li>
              <li>
                <Link to="/auth/practitioner" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Practitioner Login
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-heading text-lg text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 Sadhu. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
