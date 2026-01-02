import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Privacy Policy | Sadhu</title>
        <meta name="description" content="Sadhu Privacy Policy - Learn how we protect and handle your personal information, data security, and privacy practices." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${window.location.origin}/privacy-policy`} />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
      
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-heading">Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="text-muted-foreground">
                Our privacy policy is currently being updated. For questions about how we handle your data, 
                please contact us at{" "}
                <a href="mailto:support@sadhu.com" className="text-primary hover:underline">
                  support@sadhu.com
                </a>
                {" "}or visit our{" "}
                <a href="/contact" className="text-primary hover:underline">
                  contact page
                </a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      </div>
    </>
  );
};

export default PrivacyPolicy;

