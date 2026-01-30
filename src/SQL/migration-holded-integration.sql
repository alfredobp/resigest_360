-- Migration: Add fields for Holded integration

-- Add Holded API Key to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS holded_api_key TEXT;

-- Add Holded Contact ID to treatment_managers table
ALTER TABLE treatment_managers ADD COLUMN IF NOT EXISTS holded_contact_id TEXT;

-- Add Holded Contact ID to carriers table
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS holded_contact_id TEXT;
