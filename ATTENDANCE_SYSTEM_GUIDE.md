# Attendance Management System - Implementation Guide

## Overview

This attendance management system is built on a **schedule-driven architecture** where every attendance record must be linked to a scheduled lecture. The `schedules` table serves as the single source of truth for all attendance sessions.

## Core Architecture

### Database Schema

#### Key Tables

1. **schedules** - Source of truth for attendance sessions
   - Contains lecture schedule information
   - Includes self-attendance columns:
     - `attendance_token`: Unique token for student self-attendance
     - `attendance_expires_at`: Expiry time for self-attendance session
     - `attendance_active`: Whether self-attendance is currently active

2. **attendance** - Attendance records
   - Each record MUST reference a `schedule_id`
   - Unique constraint: `(student_id, schedule_id)` - prevents duplicates
   - Status options: Present, Absent, Late, Excused

3. **students** - Student information
4. **classes** - Class information
5. **student_course_enrollments** - Links students to classes
6. **lecturers** - Lecturer information

### Database Migrations

Run the following SQL migrations in your Supabase dashboard:

#### Migration 1: Add subject_timeline column
```sql
-- File: migrations/add_subject_timeline_column.sql
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS subject_timeline JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.classes.subject_timeline IS 'Stores details for each subject in the class (lecturer, status, start_date, end_date) as a JSON object keyed by subject name';
```

#### Migration 2: Add attendance columns
```sql
-- File: migrations/001_add_attendance_columns.sql
ALTER TABLE public.schedules
ADD COLUMN IF NOT EXISTS attendance_token TEXT,
ADD COLUMN IF NOT EXISTS attendance_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS attendance_active BOOLEAN DEFAULT false;

ALTER TABLE public.attendance
ADD CONSTRAINT IF NOT EXISTS unique_student_schedule
UNIQUE (student_id, schedule_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_schedule ON public.attendance(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_schedule ON public.attendance(student_id, schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedules_today ON public.schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_token ON public.schedules(attendance_token) WHERE attendance_token IS NOT NULL;
```

## Features

### 1. Lecturer Attendance Management

**Route:** `/attendance-management`

**Features:**
- View today's scheduled lectures
- Select any date to view schedules
- Mark attendance for each scheduled lecture
- Start/stop self-attendance sessions
- Generate and share attendance links
- Bulk operations (Mark all present)
- Search students
- Real-time statistics

**Workflow:**
1. Lecturer navigates to Attendance Management page
2. Selects a date (defaults to today)
3. Sees all scheduled lectures for that date
4. Clicks "Mark Attendance" on a lecture
5. Attendance sheet opens with all enrolled students
6. Can start self-attendance session (generates link)
7. Marks attendance for each student
8. Saves attendance records

### 2. Student Self-Attendance

**Route:** `/attendance/self/:scheduleId/:token`

**Features:**
- Students mark their own attendance
- Validates using index number
- Token-based security
- Time-limited sessions (2 hours default)
- Prevents duplicate marking
- Verifies student enrollment

**Workflow:**
1. Lecturer starts attendance session
2. System generates unique link with token
3. Link is shared with students (WhatsApp, email, etc.)
4. Student opens link
5. Enters their index number
6. System validates:
   - Token is valid and not expired
   - Student exists and is active
   - Student is enrolled in the class
   - Attendance not already marked
7. Attendance is recorded as "Present" with marked_by="Self"

## API Hooks

### Schedule Hooks

```typescript
// Get today's schedules
const { data: schedules } = useTodaySchedules();

// Get schedules by date
const { data: schedules } = useSchedulesByDate('2026-02-18');

// Get students in a class
const { data: students } = useClassStudents(classId);

// Get attendance for a schedule
const { data: attendance } = useScheduleAttendance(scheduleId);
```

### Attendance Operations

```typescript
// Start self-attendance session
const startAttendance = useStartAttendance();
startAttendance.mutate(scheduleId);

// Stop self-attendance session
const stopAttendance = useStopAttendance();
stopAttendance.mutate(scheduleId);

// Save attendance (bulk)
const saveAttendance = useSaveAttendance();
saveAttendance.mutate({
  scheduleId,
  classId,
  attendanceDate,
  records: [
    { student_id: '...', status: 'Present', notes: '...' }
  ],
  markedBy: 'Lecturer'
});

// Student self-mark attendance
const selfMark = useSelfMarkAttendance();
selfMark.mutate({
  scheduleId,
  token,
  indexNumber
});
```

## Business Rules

### 1. Schedule-Driven
- Attendance can ONLY be created for existing schedules
- No manual or standalone attendance sessions allowed
- Each `schedules.id` = one attendance session

### 2. Unique Attendance
- One attendance record per student per schedule
- Enforced by database constraint: `UNIQUE(student_id, schedule_id)`
- Students cannot mark attendance twice for the same lecture

### 3. Enrollment Validation
- Students must be enrolled in the class
- Student status must be "Active"
- Enrollment status must be "Active"

### 4. Self-Attendance Security
- Token-based authentication
- Time-limited (2 hours default)
- Can be stopped manually by lecturer
- Validates student enrollment before marking

### 5. Status Options
- **Present**: Student attended
- **Absent**: Student did not attend
- **Late**: Student arrived late
- **Excused**: Student had valid excuse

## Reports & Analytics

### Student Attendance Percentage
```sql
SELECT
    student_id,
    COUNT(*) FILTER (WHERE status='Present') * 100.0 / COUNT(*) AS percentage
FROM public.attendance
GROUP BY student_id;
```

### Class Attendance Percentage
```sql
SELECT
    class_id,
    COUNT(*) FILTER (WHERE status='Present') * 100.0 / COUNT(*) AS percentage
FROM public.attendance
GROUP BY class_id;
```

### Low Attendance Alert (< 75%)
```sql
SELECT student_id
FROM public.attendance
GROUP BY student_id
HAVING COUNT(*) FILTER (WHERE status='Present') * 100.0 / COUNT(*) < 75;
```

### Consecutive Absences
```sql
-- Flag students with 3+ consecutive absences
-- Implementation depends on your specific requirements
```

## File Structure

```
src/
├── pages/
│   ├── AttendanceManagement.tsx    # Main attendance page
│   └── StudentSelfAttendance.tsx   # Student self-marking page
├── components/
│   └── attendance/
│       └── AttendanceSheet.tsx     # Attendance marking dialog
├── hooks/
│   └── useScheduleAttendance.ts    # All attendance hooks
└── integrations/
    └── supabase/
        └── types.ts                # Updated with new columns

migrations/
├── add_subject_timeline_column.sql
└── 001_add_attendance_columns.sql
```

## Usage Examples

### Example 1: Lecturer Marks Attendance

```typescript
// 1. Navigate to /attendance-management
// 2. Click "Mark Attendance" on a lecture
// 3. Attendance sheet opens
// 4. Mark each student's status
// 5. Click "Save Attendance"
```

### Example 2: Start Self-Attendance Session

```typescript
// 1. In attendance sheet, click "Start Session"
// 2. System generates token and link
// 3. Click "Copy Link" or "Send" to share
// 4. Students receive link: /attendance/self/{scheduleId}/{token}
// 5. Students enter index number and submit
// 6. Attendance recorded automatically
```

### Example 3: Bulk Mark All Present

```typescript
// 1. Open attendance sheet
// 2. Click "Mark All Present"
// 3. All students set to "Present" status
// 4. Adjust individual students if needed
// 5. Save attendance
```

## Security Considerations

1. **Token Expiry**: Self-attendance links expire after 2 hours
2. **Unique Tokens**: Each session gets a unique UUID token
3. **Enrollment Validation**: Students must be enrolled to mark attendance
4. **Duplicate Prevention**: Database constraint prevents duplicate records
5. **Active Status**: Only active students and enrollments are considered

## Performance Optimizations

1. **Indexes**: Created on frequently queried columns
2. **Batch Operations**: Bulk upsert for saving multiple attendance records
3. **Query Optimization**: Joins minimized, selective loading
4. **Caching**: React Query handles caching and invalidation

## Troubleshooting

### Issue: "Could not find the 'subject_timeline' column"
**Solution**: Run the `add_subject_timeline_column.sql` migration

### Issue: "Attendance already marked"
**Solution**: This is expected behavior. Use update instead of insert, or check existing attendance first

### Issue: "Student not enrolled in this class"
**Solution**: Verify student has an active enrollment record in `student_course_enrollments`

### Issue: "Invalid or expired attendance link"
**Solution**: 
- Check if session is still active
- Verify token hasn't expired (2 hours)
- Lecturer may have stopped the session

## Future Enhancements

1. **Geolocation**: Verify student location when marking attendance
2. **Face Recognition**: Optional biometric verification
3. **Notifications**: Auto-send WhatsApp/Email notifications
4. **Analytics Dashboard**: Visual reports and trends
5. **Absence Alerts**: Automatic notifications for low attendance
6. **QR Codes**: Generate QR codes for quick attendance marking
7. **Offline Support**: Mark attendance offline, sync later

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the database migrations
3. Verify all hooks are properly imported
4. Check browser console for errors
5. Verify Supabase connection and permissions
