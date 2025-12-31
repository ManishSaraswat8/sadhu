import { Brain, BookOpen, Users, CheckSquare, Sparkles } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Guided Meditations, Tailored to Your Inner State",
      description:
        "Your journey begins with precision. Our AI analyzes your current emotions, stress levels, and personal goals to create meditations that shift with your inner world. Every session feels intuitively crafted — because it is.",
    },
    {
      icon: Users,
      title: "1:1 Transformational Sessions",
      description:
        "Leverage the nuanced support, real-time observation, and precise guidance that only human interaction can provide. Someone who stands with you in the hard moments, steadying your mind and igniting breakthroughs you didn't know you were capable of.",
    },
    {
      icon: BookOpen,
      title: "Journaling and Reflection Archive",
      description:
        "Capture your insights. Track your evolution. Your private journal connects each entry to your emotional state and past meditations, so patterns become visible and growth becomes undeniable. A living record of who you've been — and who you're becoming.",
    },
    {
      icon: CheckSquare,
      title: "Action-Based Transformation Checklist",
      description:
        "Talk alone doesn't change your life. Actions do. After each 1:1 session, you receive a personalized checklist of aligned steps to keep your transformation moving. Clear. Simple. Powerful. Because consistent action builds a new reality.",
    },
    {
      icon: Sparkles,
      title: "A Seamless Digital Experience",
      description:
        "Built for those who demand depth, clarity, and elegance. Every feature is designed to elevate your practice, deepen your awareness, and align your daily life with your highest self.",
    },
  ];

  return (
    <section id="features" className="py-24 bg-gradient-soft">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-medium tracking-widest uppercase text-sm">
            Platform Features
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-light mt-4 text-foreground">
            Transform Your
            <span className="block text-gradient-teal font-semibold">Inner World</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.slice(0, 3).map((feature, index) => (
            <div
              key={index}
              className="group bg-card border border-primary/10 rounded-2xl p-8 hover:border-primary/30 transition-all duration-500 hover:shadow-glow animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* Bottom row - centered */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-8">
          {features.slice(3).map((feature, index) => (
            <div
              key={index + 3}
              className="group bg-card border border-primary/10 rounded-2xl p-8 hover:border-primary/30 transition-all duration-500 hover:shadow-glow animate-slide-up"
              style={{ animationDelay: `${(index + 3) * 0.1}s` }}
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
