import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  schedule_id?: string;
  attendance_date: string;
  status: "Present" | "Absent" | "Late" | "Excused";
  notes?: string;
  marked_by: string;
  created_at: string;
  updated_at: string;
  students?: {
    index_number: string;
    full_name: string;
  };
}

export function useAttendanceRecords(
  classId?: string,
  attendanceDate?: string,
) {
  return useQuery({
    queryKey: ["attendance-records", classId, attendanceDate],
    queryFn: async () => {
      let query = supabase.from("attendance").select(
        `
          id,
          student_id,
          class_id,
          schedule_id,
          attendance_date,
          status,
          notes,
          marked_by,
          created_at,
          updated_at,
          students (
            index_number,
            full_name
          )
        `,
      );

      if (classId) {
        query = query.eq("class_id", classId);
      }

      if (attendanceDate) {
        query = query.eq("attendance_date", attendanceDate);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching attendance records:", error);
        throw error;
      }

      return (data as unknown as AttendanceRecord[]) || [];
    },
    enabled: !!classId && !!attendanceDate,
  });
}

// Fetch ALL attendance records for a class across all dates (for history view)
export function useClassAttendanceHistory(classId?: string) {
  return useQuery({
    queryKey: ["attendance-history", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select(
          `
          id,
          student_id,
          class_id,
          attendance_date,
          status,
          marked_by,
          created_at,
          students (
            index_number,
            full_name
          )
        `,
        )
        .eq("class_id", classId!)
        .order("attendance_date", { ascending: false });

      if (error) throw error;
      return (data as any) as Pick<
        AttendanceRecord,
        "id" | "student_id" | "class_id" | "attendance_date" | "status" | "marked_by" | "created_at" | "students"
      >[];
    },
    enabled: !!classId,
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attendanceData: {
      student_id: string;
      class_id: string;
      attendance_date: string;
      status: "Present" | "Absent" | "Late" | "Excused";
      notes?: string;
      marked_by: string;
    }) => {
      const { data, error } = await supabase
        .from("attendance")
        .insert([attendanceData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      toast.success("Attendance marked successfully");
    },
    onError: (error: Error) => {
      if (error.message.includes("unique_daily_attendance")) {
        toast.error("Attendance has already been recorded");
      } else {
        toast.error("Failed to mark attendance: " + (error as Error).message);
      }
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<AttendanceRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from("attendance")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      toast.success("Attendance updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update attendance: " + (error as Error).message);
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("attendance").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      toast.success("Attendance deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete attendance: " + (error as Error).message);
    },
  });
}
