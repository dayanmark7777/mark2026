-- Add first_exam_completed column to students table
ALTER TABLE public.students
ADD COLUMN first_exam_completed BOOLEAN NOT NULL DEFAULT false;
