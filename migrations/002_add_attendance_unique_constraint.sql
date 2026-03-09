-- Add unique constraint to prevent duplicate daily attendance for same student in same class
ALTER TABLE public.attendance
ADD CONSTRAINT unique_daily_attendance
UNIQUE(student_id, class_id, attendance_date);
