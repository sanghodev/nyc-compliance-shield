-- Migration: Add BIN and BBL to Properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bin TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bbl TEXT;
