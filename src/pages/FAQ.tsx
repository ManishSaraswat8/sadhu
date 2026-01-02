import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HelpCircle } from "lucide-react";

interface FAQSection {
  title: string;
  questions: {
    question: string;
    answer: string;
  }[];
}

const FAQ = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqSections: FAQSection[] = [
    {
      title: "Practice & Safety",
      questions: [
        {
          question: "Is Sadhu safe if I've never practiced before?",
          answer: "Yes, when practiced with guidance and proper pacing. Beginners are encouraged to start with Intro standing sessions or guided back sessions to learn correct technique and regulation.",
        },
        {
          question: "What is the difference between standing and back (laying) Sadhu sessions?",
          answer: "Standing sessions focus on building presence, resilience, and emotional regulation under load. Back (laying) sessions emphasize deep nervous system regulation, body awareness, and release through sustained pressure while fully supported.",
        },
        {
          question: "Does standing or laying on nails puncture the skin?",
          answer: "No. Authentic Sadhu boards are designed with evenly spaced nails that distribute body weight across many points, preventing skin puncture when used correctly.",
        },
        {
          question: "How uncomfortable should the practice feel?",
          answer: "Sensation can be intense, but it should remain manageable. The goal is conscious exposure, not endurance. Discomfort should decrease as regulation improves.",
        },
        {
          question: "What if I feel overwhelmed or need to step off during a session?",
          answer: "You can step off at any time. Practitioners encourage self-awareness and choice, not forcing or pushing through distress.",
        },
        {
          question: "Is Sadhu appropriate if I experience anxiety or high stress?",
          answer: "Many people with anxiety or chronic stress practice Sadhu. Guidance is especially important to ensure pacing supports regulation rather than escalation.",
        },
        {
          question: "Are there any contraindications?",
          answer: "Sadhu may not be appropriate for individuals with certain medical conditions (e.g., severe neuropathy, open wounds, recent surgery). If unsure, consult a healthcare professional before participating.",
        },
      ],
    },
    {
      title: "Session Types & Structure",
      questions: [
        {
          question: "What happens in an Intro (20-minute) standing session?",
          answer: "The Intro session focuses on posture, breath, and short exposure to sensation. It is designed to familiarize beginners with the practice safely.",
        },
        {
          question: "How does the 45-minute standing session differ?",
          answer: "The 45-minute session allows for deeper regulation, longer standing intervals, and integration practices before and after the stand.",
        },
        {
          question: "Who is the 60-minute expert standing session for?",
          answer: "This session is intended for experienced individuals who already have consistent Sadhu practice and understand pacing and self-regulation.",
        },
        {
          question: "What happens during a back (laying) Sadhu session?",
          answer: "Participants lie on a Sadhu board while guided through breath, awareness, and nervous system regulation. The session emphasizes stillness and integration. We recommend these sessions for individuals struggling with substance abuse.",
        },
        {
          question: "Why are back sessions recommended once per week?",
          answer: "Back sessions create a strong nervous system response. Weekly spacing allows adequate integration and recovery.",
        },
        {
          question: "Can I combine standing and back sessions in the same week?",
          answer: "Yes. A balanced approach often includes standing sessions multiple times per week and one back session weekly.",
        },
      ],
    },
    {
      title: "Frequency & Progression",
      questions: [
        {
          question: "How often should I practice standing?",
          answer: "Daily standing is recommended for consistency. If daily practice isn't feasible, every 2-3 days is effective.",
        },
        {
          question: "Is it okay if I can't practice daily?",
          answer: "Yes. Consistency matters more than frequency. Regular practice every few days still provides benefits.",
        },
        {
          question: "How long does it take to notice changes?",
          answer: "Some people notice changes within couple of sessions, while others experience gradual shifts over weeks. Results vary.",
        },
        {
          question: "Should beginners start with standing or back sessions?",
          answer: "Most beginners start with standing Intro sessions. Back sessions can also be appropriate with guidance. If you're unsure which session is right for you, send us an email or give us a call for recommendations.",
        },
        {
          question: "How do I know when to progress to longer sessions?",
          answer: "Progression is based on your ability to remain regulated, breathe steadily, and recover well after sessions.",
        },
      ],
    },
    {
      title: "Online vs In-Person",
      questions: [
        {
          question: "What's the difference between online and in-person sessions?",
          answer: "In-person sessions allow hands-on adjustments. Online sessions emphasize verbal guidance and self-awareness. Both follow the same principles.",
        },
        {
          question: "Is online guidance effective?",
          answer: "Yes. With clear instruction and practitioner oversight, online sessions can be highly effective.",
        },
        {
          question: "What equipment do I need for online sessions?",
          answer: "A Sadhu board, stable internet connection, and a quiet space are required.",
        },
        {
          question: "Can I practice safely at home?",
          answer: "Yes, provided you follow guidance and listen to your body.",
        },
        {
          question: "Where is the studio located?",
          answer: "Currently we have one studio in Downtown Toronto but we're working on others to bring this transforming method to a city near you.",
        },
      ],
    },
    {
      title: "Recordings & Privacy",
      questions: [
        {
          question: "Are online sessions recorded?",
          answer: "Yes, all online sessions are recorded.",
        },
        {
          question: "Why are sessions recorded?",
          answer: "Recordings support practitioner accountability, quality assurance, and participant safety.",
        },
        {
          question: "Who has access to the recordings?",
          answer: "Access is strictly limited to authorized platform administrators.",
        },
        {
          question: "How is my privacy protected?",
          answer: "Recordings are securely stored, encrypted, and never shared with third parties. All handling follows HIPAA-aligned data protection standards.",
        },
      ],
    },
    {
      title: "Logistics & Commitment",
      questions: [
        {
          question: "Do I need to own my own Sadhu board?",
          answer: "Owning your own Sadhu board is strongly recommended, especially for regular practice and online sessions. A personal board supports consistency, hygiene, and familiarity with spacing, sensation, and surface feel. From a traditional perspective, the board becomes associated with the individual's practice over time. From a practical standpoint, regular use of the same board allows the nervous system to adapt more effectively.",
        },
        {
          question: "Can I use studio boards for in-person sessions?",
          answer: "Yes. Studio boards are available for in-person sessions and are maintained to high hygiene and safety standards. However, participants who plan to practice consistently are encouraged to invest in their own board.",
        },
        {
          question: "Why is owning your own board recommended?",
          answer: "A personal board: Supports consistency and progression, Eliminates variability between sessions, Aligns with traditional Sadhu practice, where tools are not shared casually, Encourages commitment and responsibility to the practice. While studio boards are suitable for introduction and occasional use, personal ownership supports long-term development.",
        },
        {
          question: "Is it unsafe to share Sadhu boards?",
          answer: "No. In-person studio boards are safe and professionally maintained. The recommendation to own a personal board is not based on safety concerns, but on tradition, consistency, and depth of practice.",
        },
        {
          question: "Do I need my own board for online sessions?",
          answer: "Yes. Online sessions require participants to have their own Sadhu board available and set up before the session begins.",
        },
        {
          question: "Does each board \"absorb energy\"?",
          answer: "Traditionally, Sadhu boards are treated as personal practice tools and are not shared casually. Many practitioners describe a growing sense of familiarity and personal connection with their board over time. From a modern perspective, this can be understood as the nervous system adapting to a consistent physical stimulus. Both views support the same recommendation: regular practice is best done on your own board.",
        },
      ],
    },
  ];

  return (
    <>
      <Helmet>
        <title>FAQ - Frequently Asked Questions | Sadhu</title>
        <meta name="description" content="Find answers to common questions about Sadhu nail board practice, meditation sessions, guidance, safety, and more. Get help with your meditation journey." />
        <meta name="keywords" content="Sadhu FAQ, meditation questions, nail board safety, meditation practice, guided sessions, mindfulness help" />
        <meta property="og:title" content="FAQ - Frequently Asked Questions | Sadhu" />
        <meta property="og:description" content="Find answers to common questions about Sadhu nail board practice, meditation sessions, and guidance." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/faq`} />
        <link rel="canonical" href={`${window.location.origin}/faq`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqSections.flatMap(section => 
              section.questions.map(q => ({
                "@type": "Question",
                "name": q.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": q.answer
                }
              }))
            )
          })}
        </script>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
      
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-light text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about Sadhu practice, sessions, and guidance.
            </p>
          </div>

          <div className="space-y-8">
            {faqSections.map((section, sectionIndex) => (
              <Card key={sectionIndex} className="border-primary/10">
                <CardContent className="p-0">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-2xl font-heading font-semibold text-foreground">
                      {section.title}
                    </h2>
                  </div>
                  <Accordion type="multiple" className="w-full">
                    {section.questions.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={`section-${sectionIndex}-item-${index}`}
                        className="border-b border-border last:border-b-0"
                      >
                        <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                          <span className="font-medium text-foreground">
                            {faq.question}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4">
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8">
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                  Still have questions?
                </h3>
                <p className="text-muted-foreground mb-4">
                  We're here to help. Reach out to us for personalized guidance.
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Contact Us →
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      </div>
    </>
  );
};

export default FAQ;

