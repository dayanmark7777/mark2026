import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AttendanceSession {
  id: string;
  class_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  subject?: string;
  unique_link: string;
  link_expires_at: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  schedule_id?: string;
  attendance_date: string;
  status: string;
  notes?: string;
  marked_by?: string;
  created_at: string;
  updated_at: string;
}

export function useAttendanceSessions(classId?: string) {
  return useQuery({
    queryKey: ["attendance_sessions", classId],
    queryFn: async () => {
      let query = supabase
        .from("attendance_sessions")
        .select("*")
        .order("session_date", { ascending: false });

      if (classId) {
        query = query.eq("class_id", classId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as AttendanceSession[]) || [];
    },
    enabled: true,
  });
}

export function useAttendanceSession(sessionId?: string) {
  return useQuery({
    queryKey: ["attendance_session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const { data, error } = await supabase
        .from("attendance_sessions")
        .select(
          `
          *,
          classes (
            name
          )
        `,
        )
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      return data as AttendanceSession & { classes: { name: string } };
    },
    enabled: !!sessionId,
  });
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      session: Omit<AttendanceSession, "id" | "created_at" | "updated_at">,
    ) => {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .insert([session])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance_sessions"] });
      toast.success("Attendance session created successfully");
    },
    onError: (error) => {
      toast.error(
        "Failed to create attendance session: " + (error as Error).message,
      );
    },
  });
}

export function useAttendance(classId?: string, sessionId?: string) {
  return useQuery({
    queryKey: ["attendance", classId, sessionId],
    queryFn: async () => {
      let query = supabase
        .from("attendance")
        .select("*")
        .order("created_at", { ascending: false });

      if (classId) {
        query = query.eq("class_id", classId);
      }

      if (sessionId) {
        query = query.eq("schedule_id", sessionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as Attendance[]) || [];
    },
    enabled: true,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      attendance: Omit<Attendance, "id" | "created_at" | "updated_at">,
    ) => {
      const { data, error } = await supabase
        .from("attendance")
        .insert([attendance])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance marked successfully");
    },
    onError: (error: any) => {
      // Log error for debugging
      console.error("Attendance marking error:", error);
      // Check for unique constraint violation (duplicate attendance)
      if (
        error?.code === "23505" ||
        error?.message?.includes("duplicate key value") ||
        error?.message?.toLowerCase().includes("unique") ||
        error?.message?.toLowerCase().includes("already marked")
      ) {
        toast.error(
          "Attendance has already been recorded"
        );
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
    }: Partial<Attendance> & { id: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update attendance: " + (error as Error).message);
    },
  });
}

export function useUpdateAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<AttendanceSession> & { id: string }) => {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance_sessions"] });
    },
    onError: (error) => {
      toast.error(
        "Failed to update attendance session: " + (error as Error).message,
      );
    },
  });
}
