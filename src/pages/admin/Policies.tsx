import { useSearchParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CancellationPolicyManager } from "@/components/admin/CancellationPolicyManager";
import { WaiverPolicyManager } from "@/components/admin/WaiverPolicyManager";
import { FAQManager } from "@/components/admin/FAQManager";
import { ReadinessTestManager } from "@/components/admin/ReadinessTestManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect } from "react";

export default function PoliciesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get("tab") || "cancellation";

  useEffect(() => {
    // Update URL when tab changes
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "cancellation" }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-light mb-2">Content Management</h1>
          <p className="text-muted-foreground">
            Manage policies, FAQ, and readiness test content
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="cancellation">Cancellation Policy</TabsTrigger>
            <TabsTrigger value="waiver">Liability Waiver</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="readiness">Readiness Test</TabsTrigger>
          </TabsList>
          <TabsContent value="cancellation" className="mt-6">
            <CancellationPolicyManager />
          </TabsContent>
          <TabsContent value="waiver" className="mt-6">
            <WaiverPolicyManager />
          </TabsContent>
          <TabsContent value="faq" className="mt-6">
            <FAQManager />
          </TabsContent>
          <TabsContent value="readiness" className="mt-6">
            <ReadinessTestManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

