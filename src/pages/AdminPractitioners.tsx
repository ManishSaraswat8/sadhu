import { useState } from "react";
import { PractitionerList } from "@/components/admin/PractitionerList";
import { PractitionerApplications } from "@/components/admin/PractitionerApplications";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";
import { ClientAssignmentManager } from "@/components/admin/ClientAssignmentManager";
import { PractitionerEarnings } from "@/components/admin/PractitionerEarnings";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables } from "@/integrations/supabase/types";

type Practitioner = Tables<"practitioners">;

type View = "list" | "applications" | "availability" | "clients" | "earnings";

const AdminPractitioners = () => {
  const [currentView, setCurrentView] = useState<View>("list");
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | null>(null);

  const handleManageAvailability = (practitioner: Practitioner) => {
    setSelectedPractitioner(practitioner);
    setCurrentView("availability");
  };

  const handleManageClients = (practitioner: Practitioner) => {
    setSelectedPractitioner(practitioner);
    setCurrentView("clients");
  };

  const handleManageEarnings = (practitioner: Practitioner) => {
    setSelectedPractitioner(practitioner);
    setCurrentView("earnings");
  };

  const handleBack = () => {
    setCurrentView("list");
    setSelectedPractitioner(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case "applications":
        return <PractitionerApplications />;
      case "availability":
        return selectedPractitioner ? (
          <AvailabilityManager
            practitioner={selectedPractitioner}
            onBack={handleBack}
          />
        ) : null;
      case "clients":
        return selectedPractitioner ? (
          <ClientAssignmentManager
            practitioner={selectedPractitioner}
            onBack={handleBack}
          />
        ) : null;
      case "earnings":
        return selectedPractitioner ? (
          <PractitionerEarnings
            practitioner={selectedPractitioner}
            onBack={handleBack}
          />
        ) : null;
      default:
        return (
          <PractitionerList
            onManageAvailability={handleManageAvailability}
            onManageClients={handleManageClients}
            onManageEarnings={handleManageEarnings}
          />
        );
    }
  };

  return (
    <AdminLayout title="Practitioner Management">
      <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as View)} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="list">Practitioners</TabsTrigger>
        </TabsList>
        <TabsContent value={currentView} className="mt-0">
          {renderContent()}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminPractitioners;
