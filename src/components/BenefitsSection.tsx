import { Flame, Brain, Heart, Zap, Shield, Sparkles } from "lucide-react";

const BenefitsSection = () => {
  const benefits = [
    {
      icon: Brain,
      title: "Mental Clarity",
      description: "Sharpen focus and achieve deep states of meditation through controlled discomfort.",
    },
    {
      icon: Heart,
      title: "Emotional Release",
      description: "Process and release stored emotions by embracing sensation with awareness.",
    },
    {
      icon: Flame,
      title: "Pain Mastery",
      description: "Transform your relationship with pain and discover its profound teachings.",
    },
    {
      icon: Zap,
      title: "Energy Activation",
      description: "Stimulate thousands of pressure points to awaken dormant vital energy.",
    },
    {
      icon: Shield,
      title: "Stress Resilience",
      description: "Build mental fortitude and calm that extends into everyday challenges.",
    },
    {
      icon: Sparkles,
      title: "Spiritual Growth",
      description: "Connect with an ancient practice used by masters for enlightenment.",
    },
  ];

  return (
    <section id="benefits" className="py-24 bg-gradient-soft">
      <div className="container mx-auto px-6">
        {/* Who Can Benefit Section */}
        <div className="max-w-5xl mx-auto mb-24">
          <div className="text-center mb-12">
            <span className="text-primary font-medium tracking-widest uppercase text-sm">
              Who We Serve
            </span>
            <h2 className="text-4xl md:text-5xl font-heading font-light mt-4 text-foreground">
              Who Can Benefit
            </h2>
          </div>
          
          <div className="space-y-8">
            {/* Who Can Benefit - Just Bullet Points */}
            <div className="bg-card border border-primary/20 rounded-2xl p-8 md:p-10 shadow-glow">
              <ul className="space-y-4">
                {[
                  "Those experiencing anxiety or chronic stress",
                  "Individuals who feel mentally overactive yet physically disconnected",
                  "People whose performance remains high while their internal state feels strained or tense",
                  "Those who notice recurring stress signals such as headaches, migraines, or persistent bodily tension",
                  "Individuals seeking a structured way to build emotional regulation and resilience under pressure",
                  "People who value guided practice and consistency over passive relaxation or quick relief"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-muted-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Not For You - Smaller Window */}
            <div className="bg-muted/30 border border-border rounded-xl p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
                This Practice Is Not For You If:
              </h3>
              <ul className="space-y-3">
                {[
                  "You prefer purely passive relaxation experiences",
                  "You're unwilling to feel physical sensation as part of growth"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                    <span className="text-muted-foreground leading-relaxed text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Why Practice Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-medium tracking-widest uppercase text-sm">
            The Transformation
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-light mt-4 text-foreground">
            Why Practice
            <span className="block text-gradient-teal font-semibold">Sadhu Meditation</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-6 leading-relaxed">
            Exposure to daily chaos and outside pressures set our autopilot. Sadhu is a raw, physical, honest encounter with the forgotten self.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-card border border-border hover:border-primary/30 rounded-2xl p-8 transition-all duration-300 hover:shadow-glow"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <benefit.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
