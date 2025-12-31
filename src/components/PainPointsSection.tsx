import { Zap, Heart, RotateCcw, Compass } from "lucide-react";

const PainPointsSection = () => {
  const painPoints = [
    {
      icon: Zap,
      title: "Stress & Mental Overload",
      description:
        "Most people carry constant pressure with no way to release it. Sadhu practice instantly interrupts stress loops by grounding the mind in the body, teaching the nervous system how to reset with intention.",
    },
    {
      icon: Heart,
      title: "Emotional Confusion & Inner Disconnection",
      description:
        "Many struggle to understand what they're feeling or why. Sadhu principles reconnect you to raw, honest sensation, helping you access clarity without overthinking.",
    },
    {
      icon: RotateCcw,
      title: "Feeling Stuck or Repeating Patterns",
      description:
        "People often know something needs to change—but don't know where to start. Sadhu practice teaches micro-courage, the ability to step into discomfort with presence instead of avoidance.",
    },
    {
      icon: Compass,
      title: "Lack of Clarity or Direction",
      description:
        "Without stillness, intuition becomes hard to access. Sadhu methods focus the mind through sensation, creating a sharp internal environment where direction becomes clear.",
    },
  ];

  return (
    <section id="challenges" className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-medium tracking-widest uppercase text-sm">
            What We Solve
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-light mt-4 text-foreground">
            Common Challenges
            <span className="block text-gradient-teal font-semibold">We Address</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="group flex gap-6 p-8 bg-background border border-primary/10 rounded-2xl hover:border-primary/30 transition-all duration-500 hover:shadow-glow animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <point.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  {point.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
