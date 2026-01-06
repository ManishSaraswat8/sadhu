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

        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="text-center mb-12">
            <p className="text-lg text-muted-foreground leading-relaxed mb-3">
              Sadhu is a simple practice, but it is not a casual one.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              The intensity of the stimulus requires precision, pacing, and structure - especially for those navigating stress, anxiety, or nervous system overload.
            </p>
            <p className="text-lg text-foreground font-medium leading-relaxed">
              Guided practice ensures the experience builds regulation rather than reactivity.
            </p>
          </div>

          {/* Session Types - Cleaner Layout */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* 1:1 Sessions */}
            <div className="bg-card border border-primary/10 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-3">
                1:1 Guided Sessions
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Private sessions tailored to the individual. Ideal for focused attention, gradual progression, and personalized guidance.
              </p>
            </div>

            {/* Group Classes */}
            <div className="bg-card border border-primary/10 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-3">
                Small Group Classes
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Shared practice with accountability and connection. The collective rhythm helps participants stay grounded and committed.
              </p>
            </div>
          </div>

          {/* What Practitioners Help With - Compact */}
          <div className="bg-card border border-primary/20 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
              Practitioners help you:
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                "Establish correct posture and weight distribution",
                "Regulate breathing as sensation increases",
                "Pace exposure to avoid overwhelm or shutdown",
                "Recognize when to stay, soften, or step off",
                "Integrate the experience after the session"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Without vs With Guidance - Simplified */}
          <div className="space-y-4">
            <div className="bg-muted/30 border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Without guidance, Sadhu is often approached as an endurance challenge - leading to unnecessary tension, breath holding, or pushing past capacity.
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <p className="text-sm text-foreground leading-relaxed font-medium">
                With guidance - whether personal or shared - the practice becomes a method for training presence, stability, and self-trust.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
