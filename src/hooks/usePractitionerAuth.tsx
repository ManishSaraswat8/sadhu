import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const usePractitionerAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [isPractitioner, setIsPractitioner] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkPractitionerRole = async () => {
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        navigate('/auth/practitioner');
        return;
      }

      try {
        // Check if user has practitioner role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'practitioner')
          .maybeSingle();

        if (roleError) {
          console.error('Error checking practitioner role:', roleError);
          setIsPractitioner(false);
        } else {
          // Also check if practitioner profile exists
          const { data: practitionerData } = await supabase
            .from('practitioners')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          const hasRole = roleData !== null || practitionerData !== null;
          setIsPractitioner(hasRole);
          
          if (!hasRole) {
            navigate('/auth');
          }
        }
      } catch (err) {
        console.error('Failed to verify practitioner status:', err);
        setIsPractitioner(false);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkPractitionerRole();
  }, [user, authLoading, navigate]);

  return { isPractitioner, loading: loading || authLoading, user };
};

