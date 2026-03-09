# DBC Academic Management System - Database Setup

## Supabase Database Schema

This document contains all the SQL commands needed to set up your Supabase database for the DBC Academic Management System.

### Prerequisites
1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key
3. Add them to `.env` file:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### Step 1: Run this SQL in Supabase SQL Editor

Copy and paste the following SQL into your Supabase SQL Editor and execute it:

```sql
-- =====================================================
-- DBC ACADEMIC MANAGEMENT SYSTEM - DATABASE SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: courses (Academic Programs)
-- =====================================================
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    duration TEXT NOT NULL,
    description TEXT,
    levels JSONB DEFAULT '[]'::jsonb,
    subjects TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABLE: classes
-- =====================================================
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    program_level TEXT,
    batch_number TEXT,
    district TEXT NOT NULL,
    district_leader_name TEXT NOT NULL,
    class_center_name TEXT NOT NULL,
    class_center_address TEXT NOT NULL,
    class_organizer_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    is_online BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'Active',
    days_of_the_week TEXT[] NOT NULL DEFAULT '{}',
    started_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABLE: students
-- =====================================================
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    index_number TEXT NOT NULL UNIQUE,
    national_id TEXT NOT NULL UNIQUE,
    personal_number TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    whatsapp_number TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT,
    participation_type TEXT DEFAULT 'Physical',
    status TEXT NOT NULL DEFAULT 'Active',
    systematic_theology_project BOOLEAN NOT NULL DEFAULT false,
    personal_file_url TEXT,
    academic_program TEXT,
    selected_levels JSONB DEFAULT '[]'::jsonb,
    selected_subjects JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABLE: student_course_enrollments
-- =====================================================
CREATE TABLE public.student_course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    enrollment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    completion_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'Active'
);

-- =====================================================
-- TABLE: lecturers
-- =====================================================
CREATE TABLE public.lecturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subjects TEXT[],
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABLE: lecturer_class_assignments
-- =====================================================
CREATE TABLE public.lecturer_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID NOT NULL REFERENCES public.lecturers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    assigned_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    schedule_info JSONB,
    status TEXT NOT NULL DEFAULT 'Active'
);

-- =====================================================
-- TABLE: schedules
-- =====================================================
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    lecturer_id UUID NOT NULL REFERENCES public.lecturers(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABLE: attendance_sessions
-- =====================================================
CREATE TABLE public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject TEXT,
    unique_link TEXT NOT NULL,
    link_expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TABLE: attendance
-- =====================================================
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    schedule_id UUID,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Present',
    notes TEXT,
    marked_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check lecturer availability (no overlapping schedules)
CREATE OR REPLACE FUNCTION public.check_lecturer_availability(
    p_lecturer_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_schedule_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1
        FROM public.schedules
        WHERE lecturer_id = p_lecturer_id
            AND scheduled_date = p_date
            AND status = 'Scheduled'
            AND (p_exclude_schedule_id IS NULL OR id != p_exclude_schedule_id)
            AND (p_start_time < end_time AND p_end_time > start_time)
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update triggers for updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lecturers_updated_at BEFORE UPDATE ON public.lecturers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_sessions_updated_at BEFORE UPDATE ON public.attendance_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecturer_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no authentication implemented yet)
CREATE POLICY "Allow all operations" ON public.courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.student_course_enrollments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.lecturers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.lecturer_class_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.attendance_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_classes_course_id ON public.classes(course_id);
CREATE INDEX idx_classes_status ON public.classes(status);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_students_email ON public.students(email);
CREATE INDEX idx_enrollments_student_id ON public.student_course_enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON public.student_course_enrollments(course_id);
CREATE INDEX idx_enrollments_class_id ON public.student_course_enrollments(class_id);
CREATE INDEX idx_schedules_class_id ON public.schedules(class_id);
CREATE INDEX idx_schedules_lecturer_id ON public.schedules(lecturer_id);
CREATE INDEX idx_schedules_date ON public.schedules(scheduled_date);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX idx_attendance_sessions_class_id ON public.attendance_sessions(class_id);

```

### Step 2: Verify Setup

After running the SQL, verify that all tables were created:

1. Go to Supabase Dashboard → Table Editor
2. You should see 9 tables:
   - courses
   - classes
   - students
   - student_course_enrollments
   - lecturers
   - lecturer_class_assignments
   - schedules
   - attendance_sessions
   - attendance

### Step 3: Test the Connection

Run your app with `npm run dev` and check the browser console for any Supabase connection errors.

### Optional: Add Sample Data

You can add sample data through the Table Editor or by running INSERT statements in the SQL Editor.

## Database Relationships

```
courses ←── classes (course_id)
classes ←── student_course_enrollments (class_id)
courses ←── student_course_enrollments (course_id)
students ←── student_course_enrollments (student_id)
classes ←── schedules (class_id)
lecturers ←── schedules (lecturer_id)
lecturers ←── lecturer_class_assignments (lecturer_id)
classes ←── lecturer_class_assignments (class_id)
classes ←── attendance_sessions (class_id)
students ←── attendance (student_id)
classes ←── attendance (class_id)
schedules ←── attendance (schedule_id)
```

## Notes

- All tables use UUID primary keys
- RLS is enabled but currently allows all operations (authentication to be added later)
- Timestamps are automatically updated via triggers
- Foreign keys have appropriate CASCADE/SET NULL behaviors
- Indexes are added for common query patterns
