-- Seed products (Sadhu Board)
-- Pricing from Sitemap.txt: $229 CAD

INSERT INTO public.products (name, slug, type, description, price_cad, price_usd) VALUES
  (
    'Sadhu Board',
    'sadhu-board',
    'physical',
    'Premium handcrafted nail board for meditation practice. Transform your meditation practice with our premium handcrafted nail board. An ancient tool for modern mindfulness, designed to help you transcend physical sensation and achieve deeper states of awareness.',
    229.00,
    167.17 -- $229 CAD = ~$167.17 USD (at 0.73 rate)
  )
ON CONFLICT (slug) DO NOTHING;

-- Note: Stripe Price IDs (stripe_price_id_cad, stripe_price_id_usd) should be updated
-- after creating the prices in Stripe Dashboard

