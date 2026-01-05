import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import FeaturesSection from "@/components/FeaturesSection";
import PainPointsSection from "@/components/PainPointsSection";
import ResearchSection from "@/components/ResearchSection";
import BenefitsSection from "@/components/BenefitsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    const scrollToHash = () => {
      if (location.hash) {
        const sectionId = location.hash.replace("#", "");
        
        // Function to attempt scroll
        const attemptScroll = (attempts = 0) => {
          const element = document.getElementById(sectionId);
          if (element) {
            const offset = 80; // Account for fixed navbar
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          } else if (attempts < 10) {
            // Retry if element not found yet (page still loading)
            setTimeout(() => attemptScroll(attempts + 1), 100);
          }
        };

        // Start attempting after a short delay
        setTimeout(() => attemptScroll(), 100);
      } else if (location.pathname === "/") {
        // Only scroll to top if we're on the home page and no hash
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    // Scroll on mount and when hash changes
    scrollToHash();
  }, [location.hash, location.pathname]);
  return (
    <>
      <Helmet>
        <title>Sadhu - Transform Your Practice with Nail Board Meditation</title>
        <meta name="description" content="Discover Sadhu, a premium meditation platform offering nail board practice, guided sessions, and personalized 1:1 coaching. Transform your mindfulness journey with our handcrafted Mango Wood board and expert guidance." />
        <meta name="keywords" content="meditation, nail board, mindfulness, yoga, stress relief, guided meditation, meditation practice, Sadhu board, Mango Wood meditation" />
        <meta property="og:title" content="Sadhu - Transform Your Practice with Nail Board Meditation" />
        <meta property="og:description" content="Discover Sadhu, a premium meditation platform offering nail board practice, guided sessions, and personalized 1:1 coaching." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.origin} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sadhu - Transform Your Practice with Nail Board Meditation" />
        <meta name="twitter:description" content="Discover Sadhu, a premium meditation platform offering nail board practice, guided sessions, and personalized 1:1 coaching." />
        <link rel="canonical" href={window.location.origin} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Sadhu",
            "url": window.location.origin,
            "logo": `${window.location.origin}/favicon.png`,
            "description": "Transform your relationship with stress through the Sadhu nail board and AI-guided meditation.",
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "support@sadhu.com",
              "contactType": "Customer Service"
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Sadhu",
            "url": window.location.origin,
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${window.location.origin}/search?q={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
      <HeroSection />
      <PainPointsSection />
      <AboutSection />
      <BenefitsSection />
      <FeaturesSection />
      <ResearchSection />
      <CTASection />
      <Footer />
      </div>
    </>
  );
};

export default Index;
