-- Seed session packages (5 and 10 sessions)
-- Package pricing: Calculate based on average session price with discount
-- Using 45min Standard single session as base: $100 CAD / $73 USD
-- 5 sessions: 5 * $100 = $500 CAD (with 10% discount = $450 CAD)
-- 10 sessions: 10 * $100 = $1000 CAD (with 15% discount = $850 CAD)

INSERT INTO public.session_packages (name, session_count, price_cad, price_usd) VALUES
  ('5 Session Package', 5, 450.00, 328.50), -- $450 CAD = ~$328.50 USD (10% discount)
  ('10 Session Package', 10, 850.00, 620.50) -- $850 CAD = ~$620.50 USD (15% discount)
ON CONFLICT (session_count) DO NOTHING;

-- Note: Stripe Price IDs (stripe_price_id_cad, stripe_price_id_usd) should be updated
-- after creating the prices in Stripe Dashboard

