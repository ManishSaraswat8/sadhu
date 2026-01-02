import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Refund Policy | Sadhu</title>
        <meta name="description" content="Sadhu Refund Policy - Learn about our refund and cancellation policies for subscriptions, products, and services." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${window.location.origin}/refund-policy`} />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
      
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-heading">Refund Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="text-muted-foreground">
                Our refund policy is currently being updated. For questions about refunds, 
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

export default RefundPolicy;

