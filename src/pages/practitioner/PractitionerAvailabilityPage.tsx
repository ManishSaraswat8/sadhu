import { PractitionerLayout } from "@/components/practitioner/PractitionerLayout";
import { PractitionerMyAvailability } from "@/components/practitioner/PractitionerMyAvailability";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function PractitionerAvailabilityPage() {
  const { data: practitioner } = useQuery({
    queryKey: ["practitioner-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("practitioners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  return (
    <PractitionerLayout title="Availability">
      <PractitionerMyAvailability practitionerId={practitioner?.id || ""} />
    </PractitionerLayout>
  );
}

