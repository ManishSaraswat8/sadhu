import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Zap, Brain, Heart, Shield, Leaf, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const SadhuBoardInfo = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            The Sadhu Board
          </h1>
          <p className="text-xl md:text-2xl text-primary font-medium mb-4">
            A Precision Tool for Mind–Body Mastery
          </p>
        </div>
      </section>

      {/* What It Is */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
            What It Is
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
            A Sadhu Board is a precision-crafted ritual instrument designed to refine the mind, reset the nervous system, and pull you into uncompromising presence. It demands honesty. It rewards courage. And it transforms anyone willing to meet themselves without distraction.
          </p>
          <p className="text-xl text-primary font-medium text-center mt-8 italic">
            This is where discipline becomes elegance.
          </p>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            Who It's For
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "High performers who live under pressure and need a clean, grounding reset",
              "Wellness seekers ready for a deeper, more embodied practice",
              "Entrepreneurs and creators who want clarity without numbing",
              "Anyone craving a ritual that strengthens both the mind and the emotional core"
            ].map((item, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <p className="text-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
          <p className="text-lg text-muted-foreground text-center mt-10 italic">
            This is not a comfort purchase. It's a commitment to personal evolution.
          </p>
        </div>
      </section>

      {/* What It Does */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            What It Does
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-4">
                Recalibrates the Nervous System
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                The board triggers a controlled somatic response that teaches the mind to stay calm under intensity. Over time, your stress thresholds expand — gracefully.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-4">
                Cuts Through Mental Noise
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                You don't drift on this board. You arrive. Instantly. The sensation pulls your awareness into the present moment with absolute precision.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-4">
                Releases Emotional Tension
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                As the body softens, the emotional armor loosens. What no longer serves you falls away.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-4">
                Builds Disciplined Presence
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Consistency turns this practice into a quiet power you carry everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
            Why It Works
          </h2>
          <div className="space-y-4 text-lg md:text-xl text-muted-foreground">
            <p>Copper conducts energy. Mango wood grounds it.</p>
            <p>Your breath shapes it. Your mind transforms it.</p>
          </div>
          <p className="text-foreground leading-relaxed mt-8 max-w-2xl mx-auto">
            The experience becomes a mirror — revealing patterns, dissolving resistance, sharpening intention. Through stillness on the nails, you reclaim authority over your internal world.
          </p>
        </div>
      </section>

      {/* Product Details */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            Product Details
          </h2>
          
          {/* Premium Materials */}
          <div className="mb-16">
            <h3 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
              Premium Materials
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-card border border-border text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-display text-lg font-bold text-foreground mb-3">
                  Mango Wood Base
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Sustainably harvested, beautifully grained, and naturally resilient. Each board is a unique piece — a tactile reminder that real growth is carved, not manufactured.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-display text-lg font-bold text-foreground mb-3">
                  Copper Nails
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Chosen for its conductivity, purity, and quiet luxury. Copper brings a warm, refined sensation and offers natural antimicrobial benefits. It elevates the entire experience from intense to sacred.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-display text-lg font-bold text-foreground mb-3">
                  Non-Slip Foundation
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  A stable grounding layer that allows you to drop fully into the practice without external disruption.
                </p>
              </div>
            </div>
          </div>

          {/* Precision Spacing */}
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-display text-2xl font-bold text-foreground mb-6">
              Precision Spacing
            </h3>
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Circle className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-display text-xl font-bold text-foreground mb-4">
                10 mm Nail Spacing
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                The ideal middle ground: strong enough to challenge the experienced, accessible enough for dedicated beginners. Balanced. Intentional. Effective.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Begin?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Step onto the path of presence and transform your relationship with intensity.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link to="/sadhu-board">Get Your Sadhu Board — $169</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SadhuBoardInfo;
