-- Seed session types with pricing from Sitemap.txt
-- Pricing in CAD, USD calculated at 0.73 exchange rate (1 CAD = 0.73 USD)

-- Single Classes (1:1 sessions)
INSERT INTO public.session_types (name, duration_minutes, session_type, is_group, price_cad, price_usd) VALUES
  ('20min Intro', 20, 'standing', false, 55.00, 40.15), -- $55 CAD = ~$40.15 USD
  ('45min Standard', 45, 'standing', false, 100.00, 73.00), -- $100 CAD = $73 USD
  ('60min Expert', 60, 'standing', false, 130.00, 94.90), -- $130 CAD = ~$94.90 USD
  ('45min Standard', 45, 'laying', false, 100.00, 73.00), -- $100 CAD = $73 USD
  -- Group Classes
  ('20min Intro', 20, 'standing', true, 48.00, 35.04), -- $48 CAD = ~$35.04 USD
  ('45min Standard', 45, 'standing', true, 90.00, 65.70), -- $90 CAD = $65.70 USD
  ('60min Expert', 60, 'standing', true, 120.00, 87.60), -- $120 CAD = $87.60 USD
  ('45min Standard', 45, 'laying', true, 90.00, 65.70) -- $90 CAD = $65.70 USD
ON CONFLICT (duration_minutes, session_type, is_group) DO NOTHING;

-- Note: Stripe Price IDs (stripe_price_id_cad, stripe_price_id_usd) should be updated
-- after creating the prices in Stripe Dashboard

