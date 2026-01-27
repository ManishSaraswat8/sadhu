import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-meditation.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <span className="inline-block text-primary font-medium tracking-widest uppercase text-sm">
            Ancient Wisdom • Modern Guidance
          </span>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-light leading-normal text-foreground pb-2">
            Your Nervous System's Guru
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A transformative performance practice for those who push limits yet seek a deeper, calmer, more resilient inner world-guided by experienced practitioners.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/sadhu-board">
              <Button variant="teal" size="xl">
                Begin Your Journey
              </Button>
            </Link>
            <Link to="/readiness-test">
              <Button variant="hero" size="xl">
                Readiness Test
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full" />
              Premium Craftsmanship
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full" />
              Sacred Practice
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full" />
              Professional Guidance
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
