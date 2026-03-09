import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Schedule {
  id: string;
  class_id: string;
  lecturer_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  status: string;
  attendance_token: string | null;
  attendance_expires_at: string | null;
  attendance_active: boolean;
  created_at: string;
  updated_at: string;
  class_name?: string;
  lecturer_name?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  schedule_id: string | null;
  attendance_date: string;
  status: string;
  notes: string | null;
  marked_by: string | null;
  created_at: string;
  updated_at: string;
  student_name?: string;
  student_index?: string;
}

export interface Student {
  id: string;
  index_number: string;
  full_name: string;
  status: string;
}

// Get today's scheduled lectures
export function useTodaySchedules() {
  return useQuery({
    queryKey: ["schedules", "today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("schedules")
        .select(
          `
          *,
          classes:class_id (name),
          lecturers:lecturer_id (name)
        `,
        )
        .eq("scheduled_date", today)
        .eq("status", "Scheduled")
        .order("start_time");

      if (error) throw error;

      return (data || []).map((schedule: any) => ({
        ...schedule,
        class_name: schedule.classes?.name,
        lecturer_name: schedule.lecturers?.name,
      })) as Schedule[];
    },
  });
}

// Get schedules by date
export function useSchedulesByDate(date: string | null) {
  return useQuery({
    queryKey: ["schedules", date],
    queryFn: async () => {
      if (!date) return [];

      const { data, error } = await supabase
        .from("schedules")
        .select(
          `
          *,
          classes:class_id (name),
          lecturers:lecturer_id (name)
        `,
        )
        .eq("scheduled_date", date)
        .order("start_time");

      if (error) throw error;

      return (data || []).map((schedule: any) => ({
        ...schedule,
        class_name: schedule.classes?.name,
        lecturer_name: schedule.lecturers?.name,
      })) as Schedule[];
    },
    enabled: !!date,
  });
}

// Get students enrolled in a class
export function useClassStudents(classId: string | null) {
  return useQuery({
    queryKey: ["students", "class", classId],
    queryFn: async () => {
      if (!classId) return [];

      // First get enrolled student IDs
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("student_course_enrollments")
        .select("student_id")
        .eq("class_id", classId)
        .eq("status", "Active");

      if (enrollmentError) throw enrollmentError;

      const studentIds = enrollments.map((e) => e.student_id);

      if (studentIds.length === 0) return [];

      // Then get student details
      const { data, error } = await supabase
        .from("students")
        .select("id, index_number, full_name, status")
        .in("id", studentIds)
        .eq("status", "Active")
        .order("full_name");

      if (error) throw error;
      return (data || []) as Student[];
    },
    enabled: !!classId,
  });
}

// Get attendance for a schedule
export function useScheduleAttendance(scheduleId: string | null) {
  return useQuery({
    queryKey: ["attendance", "schedule", scheduleId],
    queryFn: async () => {
      if (!scheduleId) return [];

      const { data, error } = await supabase
        .from("attendance")
        .select(
          `
          *,
          students:student_id (
            full_name,
            index_number
          )
        `,
        )
        .eq("schedule_id", scheduleId);

      if (error) throw error;

      return (data || []).map((record: any) => ({
        ...record,
        student_name: record.students?.full_name,
        student_index: record.students?.index_number,
      })) as AttendanceRecord[];
    },
    enabled: !!scheduleId,
  });
}

// Start attendance session
export function useStartAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      // Generate unique token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2); // 2 hours from now

      const { data, error } = await supabase
        .from("schedules")
        .update({
          attendance_token: token,
          attendance_expires_at: expiresAt.toISOString(),
          attendance_active: true,
        })
        .eq("id", scheduleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Attendance session started");
    },
    onError: (error) => {
      toast.error("Failed to start attendance: " + (error as Error).message);
    },
  });
}

// Stop attendance session
export function useStopAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const { data, error } = await supabase
        .from("schedules")
        .update({
          attendance_active: false,
        })
        .eq("id", scheduleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Attendance session stopped");
    },
    onError: (error) => {
      toast.error("Failed to stop attendance: " + (error as Error).message);
    },
  });
}

// Save attendance (bulk)
export function useSaveAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scheduleId,
      classId,
      attendanceDate,
      records,
      markedBy,
    }: {
      scheduleId: string;
      classId: string;
      attendanceDate: string;
      records: Array<{
        student_id: string;
        status: string;
        notes?: string;
      }>;
      markedBy: string;
    }) => {
      const attendanceRecords = records.map((record) => ({
        student_id: record.student_id,
        class_id: classId,
        schedule_id: scheduleId,
        attendance_date: attendanceDate,
        status: record.status,
        notes: record.notes || null,
        marked_by: markedBy,
      }));

      const { data, error } = await supabase
        .from("attendance")
        .upsert(attendanceRecords, {
          onConflict: "student_id,schedule_id",
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["schedule-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      toast.success("Attendance saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save attendance: " + (error as Error).message);
    },
  });
}

// Self-mark attendance (student)
export function useSelfMarkAttendance() {
  return useMutation({
    mutationFn: async ({
      scheduleId,
      token,
      indexNumber,
    }: {
      scheduleId: string;
      token: string;
      indexNumber: string;
    }) => {
      // Verify attendance session and token
      const { data: session, error: sessionError } = await supabase
        .from("attendance_sessions")
        .select("*, classes:class_id(id)")
        .eq("id", scheduleId)
        .eq("unique_link", token)
        .eq("is_active", true)
        .single();

      if (sessionError) throw new Error("Invalid or expired attendance link");

      // Check if expired
      if (
        session.link_expires_at &&
        new Date(session.link_expires_at) < new Date()
      ) {
        throw new Error("Attendance session has expired");
      }

      // Find student by index number
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("index_number", indexNumber)
        .eq("status", "Active")
        .single();

      if (studentError) throw new Error("Student not found or inactive");

      // Verify student is enrolled in this class
      const { error: enrollmentError } = await supabase
        .from("student_course_enrollments")
        .select("id")
        .eq("student_id", student.id)
        .eq("class_id", session.class_id)
        .eq("status", "Active")
        .single();

      if (enrollmentError)
        throw new Error("Student not enrolled in this class");

      // ✅ Check if attendance already recorded for this student today
      const { data: existingRecords } = await supabase
        .from("attendance")
        .select("id")
        .eq("student_id", student.id)
        .eq("class_id", session.class_id)
        .eq("attendance_date", session.session_date)
        .limit(1);

      if (existingRecords && existingRecords.length > 0) {
        throw new Error("Attendance has already been recorded");
      }

      // Mark attendance
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          student_id: student.id,
          class_id: session.class_id,
          attendance_date: session.session_date,
          status: "Present",
          marked_by: "Self",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation (DB-level safety net)
          throw new Error("Attendance has already been recorded");
        }
        throw error;
      }

      return { ...data, student_name: student.full_name };
    },
    onError: (error) => {
      toast.error((error as Error).message);
    },
  });
}

// Get student attendance statistics
export function useStudentAttendanceStats(studentId: string | null) {
  return useQuery({
    queryKey: ["attendance", "stats", studentId],
    queryFn: async () => {
      if (!studentId) return null;

      const { data, error } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", studentId);

      if (error) throw error;

      const total = data.length;
      const present = data.filter((r) => r.status === "Present").length;
      const absent = data.filter((r) => r.status === "Absent").length;
      const late = data.filter((r) => r.status === "Late").length;
      const excused = data.filter((r) => r.status === "Excused").length;
      const percentage = total > 0 ? (present / total) * 100 : 0;

      return {
        total,
        present,
        absent,
        late,
        excused,
        percentage: Math.round(percentage * 100) / 100,
      };
    },
    enabled: !!studentId,
  });
}

// Get attendance summary counts for a specific schedule (for card display)
export function useScheduleAttendanceSummary(scheduleId: string | null) {
  return useQuery({
    queryKey: ["attendance", "summary", scheduleId],
    queryFn: async () => {
      if (!scheduleId) return null;

      const { data, error } = await supabase
        .from("attendance")
        .select("status")
        .eq("schedule_id", scheduleId);

      if (error) throw error;

      const total = data.length;
      const present = data.filter((r) => r.status === "Present").length;
      const absent = data.filter((r) => r.status === "Absent").length;
      const late = data.filter((r) => r.status === "Late").length;
      const excused = data.filter((r) => r.status === "Excused").length;

      return { total, present, absent, late, excused };
    },
    enabled: !!scheduleId,
  });
}
