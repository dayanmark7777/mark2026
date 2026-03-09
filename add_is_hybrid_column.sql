-- Migration: Add is_hybrid column to classes table
-- Date: 2026-02-14
-- Description: Add support for hybrid (Physical + Online) course delivery mode

-- Add the is_hybrid column to the classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS is_hybrid BOOLEAN NOT NULL DEFAULT false;

-- Add a comment to document the column
COMMENT ON COLUMN public.classes.is_hybrid IS 'Indicates if the course is delivered in hybrid mode (both physical and online)';
