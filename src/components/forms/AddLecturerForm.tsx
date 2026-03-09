import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { User, Phone, Check, X, Search, Plus } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { useClasses } from "@/hooks/useClasses";
import {
  useCreateLecturer,
  useUpdateLecturer,
  type Lecturer,
} from "@/hooks/useLecturers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

import { supabase } from "@/integrations/supabase/client";

interface AddLecturerFormProps {
  initialData?: Lecturer;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddLecturerForm({
  initialData,
  onSuccess,
  onCancel,
}: AddLecturerFormProps) {
  const { toast } = useToast();
  const { data: courses = [] } = useCourses();
  const { data: classes = [] } = useClasses();
  const createLecturer = useCreateLecturer();
  const updateLecturer = useUpdateLecturer();

  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [levelError, setLevelError] = useState("");
  const [subjectsError, setSubjectsError] = useState("");
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initialData || {
      name: "",
      email: "",
      phone: "",
      status: "Active",
    },
  });

  // Load initial subjects if editing
  useEffect(() => {
    if (initialData?.subjects) {
      setSubjects(initialData.subjects);
      setSubjectsError("");
    }
  }, [initialData]);

  const addSubjectFromProgram = (subject: string) => {
    if (!subjects.includes(subject)) {
      setSubjects([...subjects, subject]);
      setSubjectsError("");
    }
  };

  const removeSubject = (subjectToRemove: string) => {
    setSubjects(subjects.filter((s) => s !== subjectToRemove));
  };

  const toggleClassAssignment = (classId: string) => {
    setAssignedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId],
    );
  };

  const onSubmit = async (data: any) => {
    try {
      // Clear previous errors
      setLevelError("");
      setSubjectsError("");

      // Validate Program
      if (!selectedProgram) {
        toast({
          title: "Error",
          description: "Academic Program is required",
          variant: "destructive",
        });
        return;
      }

      // Validate Course Level
      if (!selectedLevel) {
        setLevelError("Course Level is required");
        return;
      }

      // Validate Subjects
      if (subjects.length === 0) {
        setSubjectsError("At least one subject is required");
        return;
      }

      // Check for unique email if creating or changing email
      if (!initialData || initialData.email !== data.email) {
        const { data: existing } = await supabase
          .from("lecturers")
          .select("id")
          .eq("email", data.email)
          .single();

        if (existing) {
          toast({
            title: "Error",
            description: "A lecturer with this email already exists",
            variant: "destructive",
          });
          return;
        }
      }

      let lecturerId = initialData?.id;

      if (initialData) {
        await updateLecturer.mutateAsync({
          id: initialData.id,
          ...data,
          subjects,
        });
      } else {
        const result = await createLecturer.mutateAsync({
          ...data,
          subjects,
        });
        lecturerId = result.id;
      }

      // Handle class assignments for new lecturers
      if (!initialData && lecturerId && assignedClasses.length > 0) {
        const assignments = assignedClasses.map((classId) => ({
          lecturer_id: lecturerId,
          class_id: classId,
        }));

        const { error: assignmentError } = await supabase
          .from("lecturer_class_assignments")
          .insert(assignments);

        if (assignmentError) {
          console.error("Error assigning classes:", assignmentError);
          toast({
            title: "Warning",
            description: "Lecturer created but class assignments failed",
            variant: "destructive",
          });
        }
      }

      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      // specific error handling if needed, though mutation hook handles toast
    }
  };

  // Logic to filter subjects based on program/level
  const getProgramSubjects = () => {
    if (!selectedProgram) return [];

    const program = courses.find((p) => p.id === selectedProgram);
    if (!program) return [];

    let potentialSubjects: string[] = [];

    if (selectedLevel) {
      const level = program.levels?.find(
        (l: any) => (typeof l === "string" ? l : l?.name) === selectedLevel,
      );
      if (level && typeof level === "object" && level.subjects) {
        // handle if subjects is array of objects {name: string...} or string[]
        // The hook says Subject is {name, description}. But database might have simple string array sometimes?
        // based on useCourses hook, subjects in Level is string[] or Subject[]?
        // In useCourses.ts: export interface Level { subjects: Subject[] }
        // But in database it might be simpler?
        // Assuming Subject[]:
        potentialSubjects = level.subjects
          .map((s: any) => s.name || s)
          .filter(Boolean);
      }
    } else {
      // If no level selected, maybe show all subjects for the program?
      // Based on spec "When program selected: display program-specific subjects"
      // Assuming program.subjects exists or aggregate from levels
      potentialSubjects =
        program.subjects ||
        program.levels?.flatMap((l: any) =>
          (l.subjects || []).map((s: any) => s.name || s),
        ) ||
        [];
    }

    // Deduplicate
    return Array.from(new Set(potentialSubjects));
  };

  const programSubjects = getProgramSubjects();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Lecturer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                className="pl-9"
                placeholder="Dr. John Doe"
                {...register("name", { required: "Name is required" })}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@university.edu"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                className="pl-9"
                placeholder="+1 234 567 890"
                {...register("phone")}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Academic Expertise</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Academic Program <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedProgram}
              onValueChange={(val) => {
                setSelectedProgram(val);
                setSelectedLevel("");
                setLevelError("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProgram && (
            <div className="space-y-2">
              <Label>
                Program Level <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedLevel}
                onValueChange={(val) => {
                  setSelectedLevel(val);
                  setLevelError("");
                }}
              >
                <SelectTrigger
                  className={levelError ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  {courses
                    .find((c) => c.id === selectedProgram)
                    ?.levels?.map((level: any, idx: number) => {
                      const levelName =
                        typeof level === "string" ? level : level.name;
                      return (
                        <SelectItem key={idx} value={levelName}>
                          {levelName}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {levelError && (
                <p className="text-sm text-destructive">{levelError}</p>
              )}
            </div>
          )}
        </div>

        {programSubjects.length > 0 && (
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg border">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">
              Program Subjects (Click to add)
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {programSubjects.map((subject, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className={`cursor-pointer hover:bg-primary/20 transition-colors ${
                    subjects.includes(subject)
                      ? "bg-primary/10 border-primary"
                      : ""
                  }`}
                  onClick={() => addSubjectFromProgram(subject)}
                >
                  {subject}
                  {subjects.includes(subject) && (
                    <Check className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>
            Selected Subjects <span className="text-destructive">*</span>
          </Label>
          <div
            className={`min-h-[80px] p-3 border rounded-md bg-background flex flex-wrap gap-2 ${subjectsError ? "border-destructive" : ""}`}
          >
            {subjects.length === 0 ? (
              <span className="text-muted-foreground text-sm italic py-1">
                No subjects assigned yet
              </span>
            ) : (
              subjects.map((subject, idx) => (
                <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-1">
                  {subject}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-destructive/20 hover:text-destructive rounded-full"
                    onClick={() => removeSubject(subject)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))
            )}
          </div>
          {subjectsError && (
            <p className="text-sm text-destructive">{subjectsError}</p>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-medium">Add Other Subjects</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Available Subjects (All Courses)</Label>
              <Select
                value=""
                onValueChange={(val) => addSubjectFromProgram(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select from all subjects" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    new Set(courses.flatMap((c) => c.subjects || []).sort()),
                  ).map((subject, idx) => (
                    <SelectItem
                      key={idx}
                      value={subject}
                      disabled={subjects.includes(subject)}
                    >
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Subject</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type new subject..."
                  id="custom-subject-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        addSubjectFromProgram(val);
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById(
                      "custom-subject-input",
                    ) as HTMLInputElement;
                    const val = input.value.trim();
                    if (val) {
                      addSubjectFromProgram(val);
                      input.value = "";
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!initialData && (
        <div className="space-y-4 pt-2 border-t">
          <h3 className="text-lg font-medium">Class Assignments (Optional)</h3>
          <p className="text-sm text-muted-foreground">
            Select active classes to assign to this lecturer immediately.
          </p>

          <div className="h-[200px] border rounded-md p-4 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {classes
                .filter((c) => c.status === "Active")
                .map((cls) => (
                  <div
                    key={cls.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                      assignedClasses.includes(cls.id)
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      id={`class-${cls.id}`}
                      checked={assignedClasses.includes(cls.id)}
                      onCheckedChange={() => toggleClassAssignment(cls.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={`class-${cls.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {cls.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {cls.class_center_name} • {cls.district}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
            {classes.filter((c) => c.status === "Active").length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-20" />
                <p>No active classes available</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting || createLecturer.isPending || updateLecturer.isPending
          }
        >
          {initialData ? "Update Lecturer" : "Create Lecturer"}
        </Button>
      </div>
    </form>
  );
}
