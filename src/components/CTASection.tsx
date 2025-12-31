import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          {/* Header */}
          <div className="space-y-4">
            <span className="text-primary/80 font-medium tracking-[0.2em] uppercase text-xs">
              Transform Your Inner World
            </span>
            
            <h2 className="text-4xl md:text-6xl font-heading font-light text-foreground leading-tight">
              Ready to Begin Your
              <span className="block text-primary mt-1">Transformation?</span>
            </h2>
          </div>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Join thousands who have discovered the ancient power of Sadhu practice, 
            now enhanced with AI guidance for your personal journey.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/sadhu-board">
              <Button variant="teal" size="xl" className="min-w-[200px]">
                Get the Sadhu Board
              </Button>
            </Link>
            <Link to="/subscribe">
              <Button variant="hero" size="xl" className="min-w-[200px]">
                Try AI Guide Free
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 md:gap-16 pt-6">
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-heading font-semibold text-foreground block">4.9★</span>
              <span className="text-muted-foreground text-sm mt-1 block">Rating</span>
            </div>
            <div className="w-px h-12 bg-border/40" />
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-heading font-semibold text-foreground block">50k+</span>
              <span className="text-muted-foreground text-sm mt-1 block">Sessions</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CTASection;
