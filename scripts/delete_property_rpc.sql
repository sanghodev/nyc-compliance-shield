-- RPC: Delete Property (Hard Delete with cleanup)
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.delete_property(target_id bigint)
RETURNS void AS $$
BEGIN
  -- 1. Clear references in profiles
  UPDATE public.profiles 
  SET property_id = NULL 
  WHERE property_id = target_id;

  -- 2. Related data in properties-dependent tables
  DELETE FROM public.contractor_reviews WHERE property_id = target_id;
  DELETE FROM public.requests WHERE property_id = target_id;
  DELETE FROM public.tenants WHERE property_id = target_id;
  
  -- These tables often have ON DELETE CASCADE, but explicit is safer
  DELETE FROM public.violation_resolutions WHERE property_id = target_id;
  DELETE FROM public.documents WHERE property_id = target_id;

  -- 3. The property itself
  DELETE FROM public.properties WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
