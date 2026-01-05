import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type Currency = 'cad' | 'usd';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  formatPrice: (amount: number) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

/**
 * Detects user's currency based on:
 * 1. Saved user preference
 * 2. Browser locale
 * 3. Timezone (fallback)
 * 4. Defaults to USD
 */
const detectCurrency = (): Currency => {
  // Try browser locale first
  const locale = navigator.language || 'en-US';
  if (locale.includes('CA') || locale.includes('en-CA') || locale.includes('fr-CA')) {
    return 'cad';
  }

  // Try timezone as fallback - check for Canadian timezones
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const canadianTimezones = [
    'America/Toronto',
    'America/Vancouver',
    'America/Montreal',
    'America/Edmonton',
    'America/Winnipeg',
    'America/Halifax',
    'America/St_Johns',
    'America/Regina',
    'America/Yellowknife',
    'America/Whitehorse',
    'America/Dawson',
    'America/Inuvik',
    'America/Resolute',
    'America/Cambridge_Bay',
    'America/Glace_Bay',
    'America/Goose_Bay',
    'America/Moncton',
    'America/Thunder_Bay',
  ];
  
  if (canadianTimezones.some(tz => timezone.includes(tz) || timezone.toLowerCase().includes('canada'))) {
    return 'cad';
  }

  // Default to USD
  return 'usd';
};

/**
 * Saves currency preference to database
 */
const saveCurrencyPreference = async (userId: string, currency: Currency, country?: string) => {
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      currency,
      country: country || (currency === 'cad' ? 'CA' : 'US'),
      detected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error saving currency preference:', error);
    throw error;
  }
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<Currency>('usd');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        if (user) {
          // Try to load saved preference
          const { data: preferences } = await supabase
            .from('user_preferences')
            .select('currency, country')
            .eq('user_id', user.id)
            .single();

          if (preferences?.currency) {
            setCurrencyState(preferences.currency as Currency);
            setLoading(false);
            return;
          }

          // No preference found, detect and save
          const detected = detectCurrency();
          setCurrencyState(detected);
          
          // Save preference for future use
          try {
            await saveCurrencyPreference(user.id, detected);
          } catch (error) {
            // Non-critical error, continue with detected currency
            console.warn('Could not save currency preference:', error);
          }
        } else {
          // Not logged in, just detect for display
          const detected = detectCurrency();
          setCurrencyState(detected);
        }
      } catch (error) {
        console.error('Error loading currency:', error);
        // Fallback to detected currency
        setCurrencyState(detectCurrency());
      } finally {
        setLoading(false);
      }
    };

    loadCurrency();
  }, [user]);

  const setCurrency = async (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    
    if (user) {
      try {
        await saveCurrencyPreference(user.id, newCurrency);
      } catch (error) {
        console.error('Error saving currency preference:', error);
        // Still update local state even if save fails
      }
    }
  };

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat(currency === 'cad' ? 'en-CA' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

