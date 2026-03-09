import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Clock, MapPin } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { useClasses } from "@/hooks/useClasses";
import {
  useCreateSchedule,
  useUpdateSchedule,
  type Schedule,
} from "@/hooks/useSchedules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";

interface ScheduleClassFormProps {
  lecturerId: string;
  initialData?: Schedule;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ScheduleClassForm({
  lecturerId,
  initialData,
  onSuccess,
  onCancel,
}: ScheduleClassFormProps) {
  const { data: courses = [] } = useCourses();
  const { data: classes = [] } = useClasses();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();

  const [date, setDate] = useState<Date | undefined>(
    initialData ? new Date(initialData.scheduled_date) : undefined,
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialData?.class_id || "",
  );
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initialData || {
      class_id: "",
      scheduled_date: "",
      start_time: "",
      end_time: "",
      location: "",
      notes: "",
      status: "Scheduled",
    },
  });

  // Watch content for validations
  const startTime = watch("start_time");
  const endTime = watch("end_time");

  // Determine available subjects based on selected class -> course -> level
  const getSubjectOptions = () => {
    if (!selectedClassId) return [];
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (!selectedClass) return [];

    const course = courses.find((c) => c.id === selectedClass.course_id);
    if (!course) return [];

    // If level is selected, filter by level
    if (selectedLevel && course.levels) {
      const level = course.levels.find(
        (l: any) => (l.name || l) === selectedLevel,
      );
      if (level) {
        // Handle different subject structures (string[] vs object[])
        const subs = (level as any).subjects || [];
        return subs.map((s: any) => (typeof s === "string" ? s : s.name));
      }
    }

    // Fallback: return all subjects from the course
    return course.subjects || [];
  };

  const subjectOptions = getSubjectOptions();

  // Get levels for the selected class's course
  const getLevelOptions = () => {
    if (!selectedClassId) return [];
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (!selectedClass) return [];
    const course = courses.find((c) => c.id === selectedClass.course_id);
    return course?.levels || [];
  };

  const levelOptions = getLevelOptions();

  const onSubmit = async (data: any) => {
    try {
      if (!date) {
        // Should be caught by validation but double check
        return;
      }

      // Time validation
      if (startTime && endTime && startTime >= endTime) {
        // Adding manual error would be better but simple alert for now or letting backend handle
        // ideally use setError from hook form
        return;
      }

      const formattedDate = format(date, "yyyy-MM-dd");

      const scheduleData = {
        lecturer_id: lecturerId,
        class_id: data.class_id,
        scheduled_date: formattedDate,
        start_time: data.start_time,
        end_time: data.end_time,
        location: data.location,
        notes: data.notes,
        status: data.status,
      };

      if (initialData) {
        await updateSchedule.mutateAsync({
          id: initialData.id,
          ...scheduleData,
        });
      } else {
        await createSchedule.mutateAsync(scheduleData);
      }
      onSuccess?.();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="class_id">Class</Label>
        <Select
          value={selectedClassId}
          onValueChange={(val) => {
            setSelectedClassId(val);
            setValue("class_id", val);
            setSelectedLevel(""); // Reset level on class change
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes.filter((c) => c.status === "Active").length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No active classes found
              </div>
            ) : (
              classes
                .filter((c) => c.status === "Active")
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.district})
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
        <input type="hidden" {...register("class_id", { required: true })} />
        {errors.class_id && (
          <p className="text-sm text-destructive">Class is required</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <Label>Date</Label>
          <CustomDatePicker
            date={date}
            setDate={setDate}
            placeholder="Pick a date"
          />
          {!date && isSubmitting && (
            <p className="text-sm text-destructive">Date is required</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="start_time">Start Time</Label>
            <div className="relative">
              <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                id="start_time"
                className="pl-9"
                {...register("start_time", { required: true })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_time">End Time</Label>
            <div className="relative">
              <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                id="end_time"
                className="pl-9"
                {...register("end_time", {
                  required: true,
                  validate: (val) =>
                    !startTime ||
                    val > startTime ||
                    "End time must be after start time",
                })}
              />
            </div>
          </div>
        </div>
      </div>
      {(errors.start_time || errors.end_time) && (
        <p className="text-sm text-destructive">
          {errors.start_time
            ? "Start time is required"
            : (errors.end_time?.message as string) || "End time is required"}
        </p>
      )}

      {selectedClassId && levelOptions.length > 0 && (
        <div className="space-y-2">
          <Label>Course Level (Optional filter)</Label>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Select Level to filter subjects" />
            </SelectTrigger>
            <SelectContent>
              {levelOptions.map((l: any, idx) => {
                const val = typeof l === "string" ? l : l.name;
                if (!val) return null;
                return (
                  <SelectItem key={idx} value={val}>
                    {val}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedClassId && subjectOptions.length > 0 && (
        <div className="space-y-2">
          <Label>Subject (Optional)</Label>
          <Select
            onValueChange={(val) => {
              const currentNotes = watch("notes") || "";
              // Simple logic: append subject if not present
              if (!currentNotes.includes(`Subject: ${val}`)) {
                setValue("notes", `Subject: ${val}\n${currentNotes}`);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjectOptions.map((s: string, idx: number) => (
                <SelectItem key={idx} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <div className="relative">
          <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="location"
            className="pl-9"
            placeholder="e.g. Room 304 or Zoom Link"
            {...register("location")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Topic, subject, or other details..."
          {...register("notes")}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting || createSchedule.isPending || updateSchedule.isPending
          }
        >
          {initialData ? "Update Schedule" : "Schedule Class"}
        </Button>
      </div>
    </form>
  );
}
