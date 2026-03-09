-- Make end_time nullable in attendance_sessions table
-- Sessions start without an end_time and it's set only when the session ends

ALTER TABLE public.attendance_sessions
ALTER COLUMN end_time DROP NOT NULL;
