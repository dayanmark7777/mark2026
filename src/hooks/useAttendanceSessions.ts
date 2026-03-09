import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

// Generate a simple unique link
const generateUniqueLink = () => {
  return `${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
};

export interface AttendanceSession {
  id: string;
  class_id: string;
  session_date: string;
  start_time: string;
  end_time?: string;
  subject?: string;
  unique_link: string;
  link_expires_at: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  classes?: {
    name: string;
  };
}

export function useAttendanceSessions(classId?: string, sessionDate?: string) {
  return useQuery({
    queryKey: ["attendance-sessions", classId, sessionDate],
    queryFn: async () => {
      let query = supabase.from("attendance_sessions").select(
        `
          id,
          class_id,
          session_date,
          start_time,
          end_time,
          subject,
          unique_link,
          link_expires_at,
          is_active,
          created_by,
          created_at,
          updated_at,
          classes!attendance_sessions_class_id_fkey (
            name
          )
        `,
      );

      if (classId) {
        query = query.eq("class_id", classId);
      }

      if (sessionDate) {
        query = query.eq("session_date", sessionDate);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching attendance sessions:", error);
        throw error;
      }

      return (data as unknown as AttendanceSession[]) || [];
    },
    enabled: !!classId,
  });
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionData: {
      class_id: string;
      session_date: string;
      start_time: string;
      subject?: string;
    }) => {
      const uniqueLink = generateUniqueLink();
      const linkExpiresAt = new Date();
      linkExpiresAt.setHours(linkExpiresAt.getHours() + 24);

      const { data, error } = await supabase
        .from("attendance_sessions")
        .insert([
          {
            class_id: sessionData.class_id,
            session_date: sessionData.session_date,
            start_time: sessionData.start_time,
            subject: sessionData.subject,
            unique_link: uniqueLink,
            link_expires_at: linkExpiresAt.toISOString(),
            is_active: true,
            created_by: "lecturer",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
      toast.success("Session started successfully");
    },
    onError: (error) => {
      toast.error("Failed to start session: " + (error as Error).message);
    },
  });
}

export function useEndAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .update({ is_active: false, end_time: format(new Date(), "HH:mm:ss") })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
      toast.success("Session ended successfully");
    },
    onError: (error) => {
      toast.error("Failed to end session: " + (error as Error).message);
    },
  });
}
