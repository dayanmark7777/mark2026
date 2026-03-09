import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DistrictSelect } from "@/components/DistrictSelect";
import { useCourses } from "@/hooks/useCourses";
import { useClasses } from "@/hooks/useClasses";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddStudentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingStudent?: any;
  isViewMode?: boolean;
}

interface StudentFormData {
  studentIndexNumber: string;
  nationalIdNumber: string;
  personalNumber: string;
  fullName: string;
  email: string;
  whatsappNumber: string;
  district: string;
  address: string;
  personalFileUrl: string;
  firstExamCompleted: boolean;
  systematicTheologyProject: boolean;
  selectedCourse: string;
  selectedLevels: string[];
  selectedClasses: string[];
  participationType: string;
  batchNumber: string;
}

export function AddStudentForm({
  onSuccess,
  onCancel,
  editingStudent,
  isViewMode = false,
}: AddStudentFormProps) {
  const { data: courses = [] } = useCourses();
  const { data: classes = [] } = useClasses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classesError, setClassesError] = useState<string>("");

  const [formData, setFormData] = useState<StudentFormData>({
    studentIndexNumber: "",
    nationalIdNumber: "",
    personalNumber: "",
    fullName: "",
    email: "",
    whatsappNumber: "",
    district: "",
    address: "",
    personalFileUrl: "",
    firstExamCompleted: false,
    systematicTheologyProject: false,
    selectedCourse: "",
    selectedLevels: [],
    selectedClasses: [],
    participationType: "Physical",
    batchNumber: "",
  });

  // Populate form if editing
  useEffect(() => {
    if (editingStudent) {
      setFormData({
        studentIndexNumber: editingStudent.index_number || "",
        nationalIdNumber: editingStudent.national_id || "",
        personalNumber: editingStudent.personal_number || "",
        fullName: editingStudent.full_name || "",
        email: editingStudent.email || "",
        whatsappNumber: editingStudent.whatsapp_number || "",
        district: editingStudent.district || "",
        address: editingStudent.address || "",
        personalFileUrl: editingStudent.personal_file_url || "",
        firstExamCompleted: editingStudent.first_exam_completed || false,
        systematicTheologyProject:
          editingStudent.systematic_theology_project || false,
        selectedCourse: editingStudent.academic_program || "",
        selectedLevels: Array.isArray(editingStudent.selected_levels)
          ? editingStudent.selected_levels
          : [],
        selectedClasses: [],
        participationType: editingStudent.participation_type || "Physical",
        batchNumber: editingStudent.batch_number || "",
      });
    }
  }, [editingStudent]);

  // Handle Automatic Index Number Generation
  useEffect(() => {
    if (isViewMode || editingStudent) return; // Keep existing index for editing

    const batch = formData.batchNumber || "";
    const nicPart =
      formData.nationalIdNumber?.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4) ||
      "";
    const personalNumDigits = formData.personalNumber?.replace(/\D/g, "") || "";
    const sumOfDigits = [...personalNumDigits].reduce(
      (sum, d) => sum + parseInt(d, 10),
      0,
    );
    const districtNum = formData.district?.match(/\d+/)?.[0] || "";
    const participationSuffix =
      formData.participationType === "Physical" ? "P" : "Z";

    // Only generate if we have at least partial data
    if (batch || nicPart || sumOfDigits > 0 || districtNum) {
      const generatedIndex = `${batch}${nicPart}${sumOfDigits}${districtNum}${participationSuffix}`;
      if (generatedIndex !== formData.studentIndexNumber) {
        setFormData((prev) => ({
          ...prev,
          studentIndexNumber: generatedIndex,
        }));
      }
    }
  }, [
    formData.batchNumber,
    formData.nationalIdNumber,
    formData.personalNumber,
    formData.district,
    formData.participationType,
    isViewMode,
    editingStudent,
  ]);

  // Filter courses by district
  const availableCourses = formData.district
    ? courses.filter((course) =>
        classes.some(
          (cls) =>
            cls.course_id === course.id &&
            (cls.district === formData.district ||
              cls.district === "All Island"),
        ),
      )
    : [];

  // Get selected course details
  const selectedCourse = courses.find((c) => c.id === formData.selectedCourse);

  // Get available levels from selected course
  const availableLevels = selectedCourse?.levels || [];

  // Filter classes by course, district, and selected levels
  const availableClasses = classes.filter(
    (cls) =>
      cls.course_id === formData.selectedCourse &&
      (cls.district === formData.district || cls.district === "All Island") &&
      formData.selectedLevels.includes(cls.program_level || "") &&
      cls.status === "Active",
  );

  const handleInputChange = (field: keyof StudentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLevelToggle = (levelName: string) => {
    setFormData((prev) => {
      const newLevels = prev.selectedLevels.includes(levelName)
        ? prev.selectedLevels.filter((l) => l !== levelName)
        : [...prev.selectedLevels, levelName];

      // Clear selected classes when levels change
      return { ...prev, selectedLevels: newLevels, selectedClasses: [] };
    });
    setClassesError("");
  };

  const handleClassToggle = (classId: string) => {
    setFormData((prev) => {
      const newClasses = prev.selectedClasses.includes(classId)
        ? prev.selectedClasses.filter((c) => c !== classId)
        : [...prev.selectedClasses, classId];
      return { ...prev, selectedClasses: newClasses };
    });
  };

  const validateUniqueFields = async () => {
    // Check email uniqueness
    const { data: emailExists } = await supabase
      .from("students")
      .select("id")
      .eq("email", formData.email)
      .neq("id", editingStudent?.id || "");

    if (emailExists && emailExists.length > 0) {
      toast.error(
        "A student with this email address already exists. Please use a different email.",
      );
      return false;
    }

    // Check index number uniqueness
    const { data: indexExists } = await supabase
      .from("students")
      .select("id")
      .eq("index_number", formData.studentIndexNumber)
      .neq("id", editingStudent?.id || "");

    if (indexExists && indexExists.length > 0) {
      toast.error(
        "A student with this index number already exists. Please use a different index number.",
      );
      return false;
    }

    // Check national ID uniqueness
    const { data: nationalIdExists } = await supabase
      .from("students")
      .select("id")
      .eq("national_id", formData.nationalIdNumber)
      .neq("id", editingStudent?.id || "");

    if (nationalIdExists && nationalIdExists.length > 0) {
      toast.error(
        "A student with this national ID already exists. Please use a different national ID.",
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isViewMode) {
      onCancel?.();
      return;
    }

    // Validate required fields
    if (
      !formData.studentIndexNumber ||
      !formData.nationalIdNumber ||
      !formData.fullName ||
      !formData.email ||
      !formData.whatsappNumber ||
      !formData.district
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.selectedCourse) {
      toast.error("Please select a course");
      return;
    }

    if (formData.selectedClasses.length === 0) {
      setClassesError("Please select at least one class");
      toast.error("Please select at least one class");
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate unique fields
      const isValid = await validateUniqueFields();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      if (editingStudent) {
        // Update existing student
        const { error: updateError } = await supabase
          .from("students")
          .update({
            index_number: formData.studentIndexNumber,
            national_id: formData.nationalIdNumber,
            personal_number: formData.personalNumber || null,
            full_name: formData.fullName,
            email: formData.email,
            whatsapp_number: formData.whatsappNumber,
            district: formData.district,
            address: formData.address || null,
            personal_file_url: formData.personalFileUrl || null,
            first_exam_completed: formData.firstExamCompleted,
            systematic_theology_project: formData.systematicTheologyProject,
            academic_program: formData.selectedCourse,
            selected_levels: formData.selectedLevels,
            participation_type: formData.participationType,
            batch_number: formData.batchNumber || null,
          })
          .eq("id", editingStudent.id);

        if (updateError) throw updateError;

        // Update enrollments
        if (formData.selectedClasses.length > 0) {
          // Delete existing enrollments for this student and course
          await supabase
            .from("student_course_enrollments")
            .delete()
            .eq("student_id", editingStudent.id)
            .eq("course_id", formData.selectedCourse);

          // Insert new enrollments
          const enrollments = formData.selectedClasses.map((classId) => ({
            student_id: editingStudent.id,
            course_id: formData.selectedCourse,
            class_id: classId,
          }));

          const { error: enrollError } = await supabase
            .from("student_course_enrollments")
            .insert(enrollments);

          if (enrollError) throw enrollError;
        }

        toast.success("Student updated successfully");
      } else {
        // Create new student
        const { data: newStudent, error: insertError } = await supabase
          .from("students")
          .insert([
            {
              index_number: formData.studentIndexNumber,
              national_id: formData.nationalIdNumber,
              personal_number: formData.personalNumber || null,
              full_name: formData.fullName,
              email: formData.email,
              whatsapp_number: formData.whatsappNumber,
              district: formData.district,
              address: formData.address || null,
              personal_file_url: formData.personalFileUrl || null,
              first_exam_completed: formData.firstExamCompleted,
              systematic_theology_project: formData.systematicTheologyProject,
              academic_program: formData.selectedCourse,
              selected_levels: formData.selectedLevels,
              participation_type: formData.participationType,
              batch_number: formData.batchNumber || null,
            },
          ])
          .select()
          .single();

        if (insertError) {
          // Handle duplicate key errors
          if (insertError.code === "23505") {
            if (insertError.message.includes("email")) {
              toast.error("A student with this email address already exists.");
            } else if (insertError.message.includes("index_number")) {
              toast.error("A student with this index number already exists.");
            } else if (insertError.message.includes("national_id")) {
              toast.error("A student with this national ID already exists.");
            } else {
              toast.error(
                "A duplicate entry was found. Please check your input.",
              );
            }
          } else {
            throw insertError;
          }
          setIsSubmitting(false);
          return;
        }

        // Create course enrollments
        if (formData.selectedClasses.length > 0 && newStudent) {
          const enrollments = formData.selectedClasses.map((classId) => ({
            student_id: newStudent.id,
            course_id: formData.selectedCourse,
            class_id: classId,
          }));

          const { error: enrollError } = await supabase
            .from("student_course_enrollments")
            .insert(enrollments);

          if (enrollError) throw enrollError;
        }

        toast.success("Student added successfully");
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving student:", error);
      toast.error("Failed to save student: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="studentIndexNumber">
              Student Index Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="studentIndexNumber"
              value={formData.studentIndexNumber}
              onChange={(e) =>
                handleInputChange("studentIndexNumber", e.target.value)
              }
              placeholder="Auto-generated based on details"
              required
              readOnly={isViewMode || !editingStudent}
            />
            {!editingStudent && !isViewMode && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Auto-generated from Batch, NIC, Personal No & District
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="nationalIdNumber">
              National ID Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nationalIdNumber"
              value={formData.nationalIdNumber}
              onChange={(e) =>
                handleInputChange("nationalIdNumber", e.target.value)
              }
              placeholder="e.g., 123456789V"
              required
              readOnly={isViewMode}
            />
          </div>

          <div>
            <Label htmlFor="personalNumber">Personal Number</Label>
            <Input
              id="personalNumber"
              value={formData.personalNumber}
              onChange={(e) =>
                handleInputChange("personalNumber", e.target.value)
              }
              placeholder="Personal ID/Number"
              readOnly={isViewMode}
            />
          </div>
          <div>
            <Label htmlFor="fullName">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              placeholder="Student's full name"
              required
              readOnly={isViewMode}
            />
          </div>

          <div>
            <Label htmlFor="batchNumber">Batch Number</Label>
            <Input
              id="batchNumber"
              value={formData.batchNumber}
              onChange={(e) => handleInputChange("batchNumber", e.target.value)}
              placeholder="e.g., 2026-B1"
              readOnly={isViewMode}
            />
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="student@example.com"
              required
              readOnly={isViewMode}
            />
          </div>

          <div>
            <Label htmlFor="whatsappNumber">
              WhatsApp Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={(e) =>
                handleInputChange("whatsappNumber", e.target.value)
              }
              placeholder="+94712345678"
              required
              readOnly={isViewMode}
            />
          </div>

          <DistrictSelect
            value={formData.district}
            onValueChange={(value) => {
              handleInputChange("district", value);
              // Reset course and class selections when district changes
              setFormData((prev) => ({
                ...prev,
                district: value,
                selectedCourse: "",
                selectedLevels: [],
                selectedClasses: [],
              }));
              setClassesError("");
            }}
            disabled={isViewMode}
          />

          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Student's address"
              className="min-h-[80px]"
              readOnly={isViewMode}
            />
          </div>
        </div>
      </div>

      {/* Academic Enrollment Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          Academic Enrollment
        </h3>

        <div>
          <Label htmlFor="selectedCourse">
            Select Academic Programs <span className="text-red-500">*</span>
          </Label>
          {!formData.district ? (
            <p className="text-sm text-muted-foreground mt-2">
              Please select a district first to view available courses
            </p>
          ) : availableCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">
              No courses available for the selected district
            </p>
          ) : (
            <Select
              value={formData.selectedCourse}
              onValueChange={(value) => {
                handleInputChange("selectedCourse", value);
                // Reset levels and classes when course changes
                setFormData((prev) => ({
                  ...prev,
                  selectedCourse: value,
                  selectedLevels: [],
                  selectedClasses: [],
                }));
                setClassesError("");
              }}
              disabled={isViewMode}
            >
              <SelectTrigger id="selectedCourse">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Course Levels Selection */}
        {formData.selectedCourse && availableLevels.length > 0 && (
          <div>
            <Label>
              Select Course Levels <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2 space-y-2 border rounded-md p-4">
              {availableLevels.map((level) => (
                <div key={level.name} className="flex items-start space-x-2">
                  <Checkbox
                    id={`level-${level.name}`}
                    checked={formData.selectedLevels.includes(level.name)}
                    onCheckedChange={() => handleLevelToggle(level.name)}
                    disabled={isViewMode}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`level-${level.name}`}
                      className="font-medium cursor-pointer"
                    >
                      {level.name}
                    </Label>
                    {level.description && (
                      <p className="text-sm text-muted-foreground">
                        {level.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Class Selection */}
        {formData.selectedLevels.length > 0 && (
          <div>
            <Label>
              Select Courses <span className="text-destructive">*</span>
            </Label>
            {availableClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                No active classes available for the selected course, district,
                and levels
              </p>
            ) : (
              <>
                <div
                  className={`mt-2 space-y-2 border rounded-md p-4 max-h-60 overflow-y-auto ${
                    classesError ? "border-destructive" : ""
                  }`}
                >
                  {availableClasses.map((cls) => (
                    <div key={cls.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`class-${cls.id}`}
                        checked={formData.selectedClasses.includes(cls.id)}
                        onCheckedChange={() => {
                          handleClassToggle(cls.id);
                          setClassesError("");
                        }}
                        disabled={isViewMode}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`class-${cls.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {cls.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {cls.program_level} - {cls.class_center_name} (
                          {cls.district})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {classesError && (
                  <p className="text-sm text-destructive mt-1">
                    {classesError}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Additional Options Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          Additional Options
        </h3>

        <div>
          <Label htmlFor="personalFileUrl">Personal File URL</Label>
          {isViewMode && formData.personalFileUrl ? (
            <div className="mt-1">
              <a
                href={formData.personalFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-2"
              >
                Open Personal File
              </a>
            </div>
          ) : (
            <Input
              id="personalFileUrl"
              value={formData.personalFileUrl}
              onChange={(e) =>
                handleInputChange("personalFileUrl", e.target.value)
              }
              placeholder="Link to personal file (e.g., Google Drive)"
              readOnly={isViewMode}
            />
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="systematicTheologyProject"
            checked={formData.systematicTheologyProject}
            onCheckedChange={(checked) =>
              handleInputChange("systematicTheologyProject", checked)
            }
            disabled={isViewMode}
          />
          <Label htmlFor="systematicTheologyProject" className="cursor-pointer">
            Systematic Theology Project Completed
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="firstExamCompleted"
            checked={formData.firstExamCompleted}
            onCheckedChange={(checked) =>
              handleInputChange("firstExamCompleted", checked)
            }
            disabled={isViewMode}
          />
          <Label htmlFor="firstExamCompleted" className="cursor-pointer">
            First Exam Completed
          </Label>
        </div>

        <div>
          <Label htmlFor="participationType">Participation Type</Label>
          <Select
            value={formData.participationType}
            onValueChange={(value) =>
              handleInputChange("participationType", value)
            }
            disabled={isViewMode}
          >
            <SelectTrigger id="participationType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Physical">Physical</SelectItem>
              <SelectItem value="Online">Online</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          {isViewMode ? "Close" : "Cancel"}
        </Button>
        {!isViewMode && (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingStudent ? "Update" : "Add"} Student
          </Button>
        )}
      </div>
    </form>
  );
}
