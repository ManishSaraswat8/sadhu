import { PractitionerLayout } from "@/components/practitioner/PractitionerLayout";
import { PractitionerContract } from "@/components/practitioner/PractitionerContract";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function PractitionerContractPage() {
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
    <PractitionerLayout title="Contract">
      <PractitionerContract practitionerId={practitioner?.id || ""} />
    </PractitionerLayout>
  );
}

