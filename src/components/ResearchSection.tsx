import { Activity, TrendingDown, HeartPulse } from "lucide-react";

const ResearchSection = () => {
  const researchData = [
    {
      icon: HeartPulse,
      title: "Autonomic Nervous System Response",
      description:
        "A study in healthy young volunteers using a mechanical needle stimulation pad (a larger version of a Sadhu board for the back) found substantial effects on cardiac autonomic responses, including changes in blood pressure, heart rate, heart rate variability, and self-rated relaxation.",
    },
    {
      icon: Activity,
      title: "The Intervention",
      description:
        "A pain management specialist with 25 years of experience prescribed Copper Nail Sadhu Boards—a form of intense mechanical punctate stimulation—as an adjunctive home therapy for a cohort of chronic pain patients. This stimulus is designed to leverage neuroplasticity by providing intense, non-damaging input to the nervous system, modulating the Autonomic Nervous System (ANS) and disrupting chronic pain loops.",
    },
  ];

  const results = [
    {
      stat: "78%",
      label: "Opioid Use Reduction",
      description: "Decrease in patient opioid dosage/frequency",
    },
    {
      stat: "65%",
      label: "Pain Relief",
      description: "Average improvement in patient-reported pain scores",
    },
  ];

  return (
    <section id="research" className="py-24 bg-gradient-soft">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-medium tracking-widest uppercase text-sm">
            Case Studies
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-light mt-4 text-foreground">
            Science-Backed
            <span className="block text-gradient-teal font-semibold">Results</span>
          </h2>
        </div>

        {/* Research Cards - Two Study Cases Side by Side */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {researchData.map((item, index) => (
            <div
              key={index}
              className="group bg-card border border-primary/10 rounded-2xl p-8 hover:border-primary/30 transition-all duration-500 hover:shadow-glow animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-heading font-semibold text-foreground">
            Results That Matter <span className="text-muted-foreground font-normal">(Over 6 Months)</span>
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
          {results.map((result, index) => (
            <div
              key={index}
              className="text-center bg-card border border-primary/20 rounded-2xl p-8 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-5xl md:text-6xl font-heading font-bold text-gradient-teal mb-2">
                {result.stat}
              </div>
              <div className="text-xl font-semibold text-foreground mb-2">
                {result.label}
              </div>
              <p className="text-muted-foreground">
                {result.description}
              </p>
            </div>
          ))}
        </div>

        {/* Conclusion */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 max-w-5xl mx-auto">
          <h3 className="text-2xl font-heading font-semibold text-foreground mb-6 flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-primary" />
            Conclusion
          </h3>
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed text-lg">
              Mechanical punctate stimulation, delivered via Sadhu Boards, offers a powerful, evidence-backed strategy for neuromodulation. The therapy achieved a near 4-in-5 reduction in opioid usage and substantial pain relief, proving it is a critical, scalable alternative for modern pain management.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Research has shown substantial effects on cardiac autonomic responses, including reactions of both the sympathetic and parasympathetic nervous system, influencing self-rated relaxation, blood pressure, heart rate, heart rate variability (HRV), and temperature.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResearchSection;
