-- Migration: Add subject_timeline column to classes table
-- Date: 2026-02-15
-- Description: Add support for tracking per-subject details (lecturer, status, dates)

-- Add the subject_timeline column to the classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS subject_timeline JSONB DEFAULT '{}'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN public.classes.subject_timeline IS 'Stores details for each subject in the class (lecturer, status, start_date, end_date) as a JSON object keyed by subject name';
