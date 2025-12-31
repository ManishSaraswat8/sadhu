import { SessionHistory as SessionHistoryComponent } from "@/components/SessionHistory";
import { UserLayout } from "@/components/UserLayout";

const SessionHistory = () => {
  return (
    <UserLayout title="Session History">
      <SessionHistoryComponent />
    </UserLayout>
  );
};

export default SessionHistory;

