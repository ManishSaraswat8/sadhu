import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Pricing = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Transparent Pricing
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the path that resonates with your journey. No hidden fees, no surprises.
          </p>
        </div>

        {/* Section 1: Physical Product */}
        <section className="mb-20">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl md:text-3xl text-foreground mb-2">The Foundation</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Begin your transformation with our handcrafted Sadhu Board — the physical anchor for your practice.
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <Card className="border-border bg-card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-heading text-2xl text-foreground">Sadhu Board</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Premium Physical Product
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">$169</span>
                  <span className="text-muted-foreground ml-2">one-time</span>
                </div>
                <ul className="space-y-3 text-left">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">Handcrafted from premium Mango Wood</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">Precision-placed copper nails</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">10mm Diamond shape spacing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">Ergonomic design for all practices</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">Lifetime durability guarantee</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button asChild className="w-full" variant="default">
                  <Link to="/sadhu-board">Get the Board</Link>
                </Button>
                <Link to="/sadhu-board-info" className="text-sm text-primary hover:underline">
                  Learn more about the Sadhu Board →
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Section 2: AI Meditation Subscription */}
        <section className="mb-20">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl md:text-3xl text-foreground mb-2">The Guide</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Your personal AI meditation companion that learns, adapts, and grows with you through every session.
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <Card className="border-primary bg-card relative overflow-hidden shadow-lg">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                Most Popular
              </div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-heading text-2xl text-foreground">AI Meditation Guide</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Subscription Service
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-2">
                  <span className="text-4xl font-bold text-foreground">$14.99</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
                <p className="text-sm text-primary mb-6">
                  or $11.99/month billed annually ($143.88/year)
                </p>
                <ul className="space-y-3 text-left">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">Personalized AI meditation guide</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">Voice-activated sessions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">Session memory & continuity</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">Progress tracking & journal</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">7-day free trial included</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="default">
                  <Link to="/subscribe">Start Free Trial</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Section 3: 1:1 Sessions */}
        <section className="mb-8">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl md:text-3xl text-foreground mb-2">The Mentor</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Connect with experienced practitioners for personalized guidance, accountability, and deeper transformation.
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <Card className="border-border bg-card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-heading text-2xl text-foreground">1:1 Sessions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Personal Practitioner Guidance
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-2">
                  <span className="text-4xl font-bold text-foreground">$90</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  per 30-minute session
                </p>
                <ul className="space-y-3 text-left">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">Live video sessions with experts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">Personalized action checklists</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">30 or 60 minute sessions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">Flexible scheduling</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">Session notes & follow-ups</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <Link to="/auth">Book a Session</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        <div className="text-center mt-16">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;