-- Add batch_number column to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS batch_number TEXT;
