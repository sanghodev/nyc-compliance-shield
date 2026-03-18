-- Migration: Add Market Data Caching to Properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS market_value NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rent_estimate NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS market_data_updated_at TIMESTAMPTZ;
