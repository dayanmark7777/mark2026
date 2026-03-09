import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StudentCourseEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  class_id?: string;
  enrollment_date: string;
  completion_date?: string;
  status: string;
}

export function useStudentEnrollments(studentId?: string) {
  return useQuery({
    queryKey: ["student-enrollments", studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from("student_course_enrollments")
        .select(
          `
          *,
          courses!student_course_enrollments_course_id_fkey(id, name, code),
          classes!student_course_enrollments_class_id_fkey(id, name)
        `,
        )
        .eq("student_id", studentId)
        .order("enrollment_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });
}

export function useEnrollments(classId?: string) {
  return useQuery({
    queryKey: ["enrollments", classId],
    queryFn: async () => {
      if (!classId) return [];

      const { data, error } = await supabase
        .from("student_course_enrollments")
        .select(
          `
          *,
          students (
            id,
            index_number,
            full_name
          )
        `,
        )
        .eq("class_id", classId)
        .order("enrollment_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!classId,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      enrollment: Omit<StudentCourseEnrollment, "id" | "enrollment_date">,
    ) => {
      const { data, error } = await supabase
        .from("student_course_enrollments")
        .insert([enrollment])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      toast.success("Enrollment created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create enrollment: " + (error as Error).message);
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<StudentCourseEnrollment> & { id: string }) => {
      const { data, error } = await supabase
        .from("student_course_enrollments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      toast.success("Enrollment updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update enrollment: " + (error as Error).message);
    },
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("student_course_enrollments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-enrollments"] });
      toast.success("Enrollment deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete enrollment: " + (error as Error).message);
    },
  });
}
