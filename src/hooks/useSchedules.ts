import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Schedule {
  id: string;
  lecturer_id: string;
  class_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  notes?: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  lecturers?: {
    name: string;
    email: string;
  };
  classes?: {
    name: string;
  };
}

export function useSchedules() {
  return useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedules")
        .select(
          `
          id,
          lecturer_id,
          class_id,
          scheduled_date,
          start_time,
          end_time,
          location,
          notes,
          status,
          lecturers!schedules_lecturer_id_fkey (
            name,
            email
          ),
          classes!schedules_class_id_fkey (
            name
          )
        `,
        )
        .eq("status", "Scheduled")
        .order("scheduled_date")
        .order("start_time");

      if (error) {
        console.error("Error fetching schedules:", error);
        throw error;
      }

      return (data as any[]) || [];
    },
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      schedule: Omit<
        Schedule,
        "id" | "created_at" | "updated_at" | "lecturers" | "classes"
      >,
    ) => {
      const { data, error } = await supabase
        .from("schedules")
        .insert([schedule])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Schedule created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create schedule: " + (error as Error).message);
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Schedule> & { id: string }) => {
      const { data, error } = await supabase
        .from("schedules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Schedule updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update schedule: " + (error as Error).message);
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Schedule deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete schedule: " + (error as Error).message);
    },
  });
}
