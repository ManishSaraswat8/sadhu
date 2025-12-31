import { useState } from "react";
import { PractitionerList } from "@/components/admin/PractitionerList";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";
import { ClientAssignmentManager } from "@/components/admin/ClientAssignmentManager";
import { PractitionerEarnings } from "@/components/admin/PractitionerEarnings";
import { AdminLayout } from "@/components/admin/AdminLayout";
import type { Tables } from "@/integrations/supabase/types";

type Practitioner = Tables<"practitioners">;

type View = "list" | "availability" | "clients" | "earnings";

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
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPractitioners;
