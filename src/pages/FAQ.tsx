import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HelpCircle, Loader2 } from "lucide-react";

interface FAQSection {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
}

interface FAQQuestion {
  id: string;
  section_id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

const FAQ = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch FAQ sections
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ["faq-sections-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_sections")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as FAQSection[];
    },
  });

  // Fetch all questions
  const { data: allQuestions, isLoading: questionsLoading } = useQuery({
    queryKey: ["faq-questions-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_questions")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as FAQQuestion[];
    },
  });

  // Group questions by section
  const faqSections = sections?.map((section) => ({
    id: section.id,
    title: section.title,
    questions: (allQuestions || [])
      .filter((q) => q.section_id === section.id)
      .map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
      })),
  })) || [];

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
        {faqSections.length > 0 && (
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
        )}
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

          {(sectionsLoading || questionsLoading) ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
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
          )}

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
