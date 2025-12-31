import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionState {
  subscribed: boolean;
  plan: 'monthly' | 'annual' | null;
  subscriptionEnd: string | null;
  loading: boolean;
  error: string | null;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    plan: null,
    subscriptionEnd: null,
    loading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    // Don't check if no user or session
    if (!user || !session?.access_token) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get fresh session to avoid stale token issues after refresh
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // If session is invalid or missing, skip the API call
      if (sessionError || !sessionData.session?.access_token) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
      
      const freshToken = sessionData.session.access_token;

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${freshToken}`,
        },
      });

      if (error) throw error;

      setState({
        subscribed: data.subscribed || false,
        plan: data.plan || null,
        subscriptionEnd: data.subscription_end || null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      }));
    }
  }, [user, session]);

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setState({
        subscribed: false,
        plan: null,
        subscriptionEnd: null,
        loading: false,
        error: null,
      });
    }
  }, [user, checkSubscription]);

  // Auto-refresh subscription status every minute
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const createCheckout = async (priceType: 'monthly' | 'annual') => {
    // Allow guest checkout - don't require authentication
    const headers: Record<string, string> = {};
    
    // If user is logged in, include auth token
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceType },
      headers,
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
