import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Lecturer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subjects?: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export function useLecturers() {
  return useQuery({
    queryKey: ["lecturers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lecturers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as Lecturer[]) || [];
    },
  });
}

export function useCreateLecturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      lecturer: Omit<Lecturer, "id" | "created_at" | "updated_at">,
    ) => {
      const { data, error } = await supabase
        .from("lecturers")
        .insert([lecturer])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lecturers"] });
      toast.success("Lecturer added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add lecturer: " + (error as Error).message);
    },
  });
}

export function useUpdateLecturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Lecturer> & { id: string }) => {
      const { data, error } = await supabase
        .from("lecturers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lecturers"] });
      toast.success("Lecturer updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update lecturer: " + (error as Error).message);
    },
  });
}

export function useDeleteLecturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lecturers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lecturers"] });
      toast.success("Lecturer deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete lecturer: " + (error as Error).message);
    },
  });
}
