-- Migration: Add self-attendance columns to schedules table
-- Date: 2026-02-18
-- Description: Add support for student self-attendance via unique links

-- Add attendance session columns to schedules table
ALTER TABLE public.schedules
ADD COLUMN IF NOT EXISTS attendance_token TEXT,
ADD COLUMN IF NOT EXISTS attendance_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS attendance_active BOOLEAN DEFAULT false;

-- Add unique constraint to prevent duplicate attendance per student per schedule
ALTER TABLE public.attendance
ADD CONSTRAINT IF NOT EXISTS unique_student_schedule
UNIQUE (student_id, schedule_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_schedule ON public.attendance(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_schedule ON public.attendance(student_id, schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedules_today ON public.schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_token ON public.schedules(attendance_token) WHERE attendance_token IS NOT NULL;

-- Add comment to document the columns
COMMENT ON COLUMN public.schedules.attendance_token IS 'Unique token for student self-attendance link';
COMMENT ON COLUMN public.schedules.attendance_expires_at IS 'Expiry time for self-attendance session';
COMMENT ON COLUMN public.schedules.attendance_active IS 'Whether self-attendance is currently active for this schedule';
