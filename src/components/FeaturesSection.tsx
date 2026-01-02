import { Users, User, CheckCircle } from "lucide-react";

const FeaturesSection = () => {
  return (
    <section id="guidance" className="py-24 bg-gradient-soft">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-medium tracking-widest uppercase text-sm">
            Guidance
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-light mt-4 text-foreground">
            Why Guidance Matters
          </h2>
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* Introduction */}
          <div className="text-center">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-4">
              Sadhu is a simple practice, but it is not a casual one.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              The intensity of the stimulus requires precision, pacing, and structure - especially for those navigating stress, anxiety, or nervous system overload.
            </p>
            <p className="text-lg md:text-xl text-foreground font-medium mt-6 leading-relaxed">
              Guided practice ensures the experience builds regulation rather than reactivity.
            </p>
          </div>

          {/* Session Types */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* 1:1 Sessions */}
            <div className="group bg-card border border-primary/10 rounded-2xl p-8 hover:border-primary/30 transition-all duration-500 hover:shadow-glow">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <User className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
                1:1 Guided Sessions - Precision & Personalization
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Private sessions are tailored to the individual. This format is ideal for those who want focused attention, gradual progression, and the extra attention to their inner-personal journey.
              </p>
            </div>

            {/* Group Sessions */}
            <div className="group bg-card border border-primary/10 rounded-2xl p-8 hover:border-primary/30 transition-all duration-500 hover:shadow-glow">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
                Small Group Sessions - Structure & Shared Momentum
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Group sessions introduce an added layer of accountability and connection. Practicing alongside others creates a stabilizing environment where individuals are supported by shared intention and presence - without comparison or performance. The collective rhythm of the group often helps participants stay grounded and committed to the practice.
              </p>
            </div>
          </div>

          {/* What Practitioners Help With */}
          <div className="bg-card border border-primary/20 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl font-heading font-semibold text-foreground mb-6">
              In both formats, practitioners help you:
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Establish correct posture and weight distribution",
                "Regulate breathing as sensation increases",
                "Pace exposure to avoid overwhelm or shutdown",
                "Recognize when to stay, soften, or step off",
                "Integrate the experience after the session"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Without vs With Guidance */}
          <div className="space-y-6">
            <div className="bg-muted/30 border border-border rounded-2xl p-6 md:p-8">
              <p className="text-muted-foreground leading-relaxed">
                Without guidance, Sadhu is often approached as an endurance challenge - leading to unnecessary tension, breath holding, or pushing past capacity. This can reinforce stress responses rather than resolve them.
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8">
              <p className="text-foreground leading-relaxed font-medium mb-2">
                With guidance - whether personal or shared - the practice becomes a method for training presence, stability, and self-trust.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Guidance is not about dependency.<br />
                It is about learning the skill correctly, within a structure that supports consistency and growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
