import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserLayout } from "@/components/UserLayout";
import { SessionScheduler } from "@/components/SessionScheduler";
import { useEffect } from "react";

const BookSession = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return null;
  }

  return (
    <UserLayout title="Book a Session">
      <div className="max-w-4xl mx-auto">
        <SessionScheduler 
          onSessionBooked={() => {
            // Navigate to sessions page after booking
            navigate("/sessions");
          }} 
        />
      </div>
    </UserLayout>
  );
};

export default BookSession;

