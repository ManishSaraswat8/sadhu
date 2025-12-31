import { PractitionerLayout } from "@/components/practitioner/PractitionerLayout";
import { ActionRecommendationsManager } from "@/components/practitioner/ActionRecommendationsManager";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function PractitionerActionsPage() {
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
    <PractitionerLayout title="Action Plans">
      <ActionRecommendationsManager practitionerId={practitioner?.id || ""} />
    </PractitionerLayout>
  );
}

