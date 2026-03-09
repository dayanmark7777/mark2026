import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Class {
  id: string;
  name: string;
  course_id: string;
  program_level?: string;
  batch_number?: string;
  district: string;
  district_leader_name: string;
  class_center_name: string;
  class_center_address: string;
  class_organizer_name: string;
  contact_number: string;
  is_online: boolean;
  status: string;
  days_of_the_week?: string[];
  started_date?: string;
  subject_timeline?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as Class[]) || [];
    },
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      cls: Omit<Class, "id" | "created_at" | "updated_at">,
    ) => {
      const { data, error } = await supabase
        .from("classes")
        .insert([cls])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add class: " + (error as Error).message);
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Class> & { id: string }) => {
      const { data, error } = await supabase
        .from("classes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update class: " + (error as Error).message);
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete class: " + (error as Error).message);
    },
  });
}
