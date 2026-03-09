# Student Management System - Quick Reference Guide

## 🚀 Quick Start

### Running the Application

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173`

## 📋 Component Usage

### AddStudentForm Component

```tsx
import { AddStudentForm } from "@/components/forms/AddStudentForm";

// Add new student
<AddStudentForm
  onSuccess={() => console.log("Student added")}
  onCancel={() => console.log("Cancelled")}
/>

// Edit existing student
<AddStudentForm
  editingStudent={studentData}
  onSuccess={() => console.log("Student updated")}
  onCancel={() => console.log("Cancelled")}
/>

// View student (read-only)
<AddStudentForm
  editingStudent={studentData}
  isViewMode={true}
  onCancel={() => console.log("Closed")}
/>
```

### Students Page

The Students page is a complete, self-contained component:

```tsx
import { Students } from "@/pages/Students";

// In your router
<Route path="/students" element={<Students />} />
```

## 🔧 Hooks Reference

### useStudents

```tsx
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from "@/hooks/useStudents";

// Fetch all students
const { data: students, isLoading } = useStudents();

// Create student
const createStudent = useCreateStudent();
await createStudent.mutateAsync(studentData);

// Update student
const updateStudent = useUpdateStudent();
await updateStudent.mutateAsync({ id: "student-id", ...updates });

// Delete student
const deleteStudent = useDeleteStudent();
await deleteStudent.mutateAsync("student-id");
```

### useCourses

```tsx
import { useCourses } from "@/hooks/useCourses";

const { data: courses, isLoading } = useCourses();
```

### useClasses

```tsx
import { useClasses } from "@/hooks/useClasses";

const { data: classes, isLoading } = useClasses();
```

### useEnrollments

```tsx
import { useStudentEnrollments, useCreateEnrollment } from "@/hooks/useEnrollments";

// Get student enrollments
const { data: enrollments } = useStudentEnrollments(studentId);

// Create enrollment
const createEnrollment = useCreateEnrollment();
await createEnrollment.mutateAsync({
  student_id: "student-id",
  course_id: "course-id",
  class_id: "class-id",
  status: "Active"
});
```

## 📊 Data Models

### Student

```typescript
interface Student {
  id: string;
  index_number: string;              // Unique
  national_id: string;               // Unique
  personal_number?: string;
  full_name: string;
  email: string;                     // Unique
  whatsapp_number: string;
  district: string;
  address?: string;
  personal_file_url?: string;
  participation_type: string;        // "Physical" | "Online" | "Hybrid"
  status: string;                    // "Active" | "Completed" | "Inactive"
  systematic_theology_project: boolean;
  academic_program?: string;         // Course ID
  selected_levels?: string[];
  selected_subjects?: unknown[];
  created_at: string;
  updated_at: string;
}
```

### Course

```typescript
interface Course {
  id: string;
  code: string;
  name: string;
  type: string;
  duration: string;
  description?: string;
  levels: Level[];
  subjects?: string[];
  created_at: string;
  updated_at: string;
}

interface Level {
  name: string;
  description?: string;
  subjects: Subject[];
}

interface Subject {
  name: string;
  description: string;
}
```

### Class

```typescript
interface Class {
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
  status: string;                    // "Active" | "Completed" | "Cancelled"
  days_of_the_week?: string[];
  started_date?: string;
  created_at: string;
  updated_at: string;
}
```

### StudentCourseEnrollment

```typescript
interface StudentCourseEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  class_id?: string;
  enrollment_date: string;
  completion_date?: string;
  status: string;                    // "Active" | "Completed" | "Dropped"
}
```

## 🎨 Styling

### Tailwind Classes

Common patterns used in the Student Management System:

```tsx
// Card container
<Card className="w-full">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Form layout
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Form fields */}
</div>

// Status badge
<span className={`px-2 py-1 rounded-full text-xs font-medium ${
  status === "Active" 
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800"
}`}>
  {status}
</span>

// Dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    {/* Content */}
  </DialogContent>
</Dialog>
```

## 🔍 Filtering Logic

### Course Filtering by District

```typescript
const availableCourses = formData.district
  ? courses.filter((course) =>
      classes.some(
        (cls) =>
          cls.course_id === course.id &&
          (cls.district === formData.district || cls.district === "All Island")
      )
    )
  : [];
```

### Class Filtering

```typescript
const availableClasses = classes.filter(
  (cls) =>
    cls.course_id === formData.selectedCourse &&
    (cls.district === formData.district || cls.district === "All Island") &&
    formData.selectedLevels.includes(cls.program_level || "") &&
    cls.status === "Active"
);
```

## 🔐 Validation

### Unique Field Validation

```typescript
const validateUniqueFields = async () => {
  // Check email
  const { data: emailExists } = await supabase
    .from("students")
    .select("id")
    .eq("email", formData.email)
    .neq("id", editingStudent?.id || "");

  if (emailExists && emailExists.length > 0) {
    toast.error("Email already exists");
    return false;
  }

  // Similar checks for index_number and national_id
  return true;
};
```

### Required Field Validation

```typescript
if (!formData.studentIndexNumber || !formData.nationalIdNumber || 
    !formData.fullName || !formData.email || !formData.whatsappNumber || 
    !formData.district) {
  toast.error("Please fill in all required fields");
  return;
}
```

## 📤 Export/Import

### Export Students to CSV

```typescript
const handleExport = () => {
  const headers = ["Index Number", "Name", "Email", /* ... */];
  const rows = students.map(student => [
    student.index_number,
    student.full_name,
    student.email,
    // ...
  ]);
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");
  
  // Download logic
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `students_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
};
```

### Import Template

Template file: `/public/students_import_template.csv`

Format:
```csv
Index Number,National ID,Personal Number,Full Name,Email,WhatsApp,District,Address,Participation Type,Status,Systematic Theology,Personal File URL
ST001,123456789V,02198804309P,John Doe,john@email.com,+94771234567,14. Colombo,123 Main St,Physical,Active,No,
```

## 🎯 Common Tasks

### Add a New Student

1. User clicks "Add Student" button
2. Dialog opens with AddStudentForm
3. User fills required fields
4. User selects district (enables course selection)
5. User selects course (enables level selection)
6. User selects levels (enables class selection)
7. User optionally selects classes
8. Form validates uniqueness asynchronously
9. Student record created
10. Enrollments created for selected classes
11. Success toast shown
12. Dialog closes
13. Student list refreshes

### Update Student Enrollments

```typescript
// Delete existing enrollments
await supabase
  .from("student_course_enrollments")
  .delete()
  .eq("student_id", studentId)
  .eq("course_id", courseId);

// Insert new enrollments
const enrollments = classIds.map(classId => ({
  student_id: studentId,
  course_id: courseId,
  class_id: classId,
}));

await supabase
  .from("student_course_enrollments")
  .insert(enrollments);
```

## 🐛 Error Handling

### Duplicate Key Errors

```typescript
if (error.code === "23505") {
  if (error.message.includes("email")) {
    toast.error("Email already exists");
  } else if (error.message.includes("index_number")) {
    toast.error("Index number already exists");
  } else if (error.message.includes("national_id")) {
    toast.error("National ID already exists");
  }
}
```

### Network Errors

```typescript
try {
  await supabase.from("students").insert(data);
} catch (error) {
  console.error("Error:", error);
  toast.error("Failed to save student: " + error.message);
}
```

## 📱 Responsive Design

### Breakpoints

```typescript
// Tailwind breakpoints used
sm: 640px   // Small devices
md: 768px   // Medium devices (tablets)
lg: 1024px  // Large devices (desktops)
xl: 1280px  // Extra large devices
```

### Responsive Grid

```tsx
// 1 column on mobile, 2 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Content */}
</div>

// Responsive table
<div className="overflow-x-auto">
  <Table>
    {/* Table content */}
  </Table>
</div>
```

## 🔄 State Management

### Form State

```typescript
const [formData, setFormData] = useState<StudentFormData>({
  studentIndexNumber: "",
  nationalIdNumber: "",
  // ... other fields
});

const handleInputChange = (field: keyof StudentFormData, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

### Dialog State

```typescript
const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
```

## 📚 Constants

### Districts

```typescript
import { SRI_LANKAN_DISTRICTS } from "@/lib/constants";

// 25 Sri Lankan districts
// Format: "1. Jaffna", "2. Kilinochchi", etc.
```

### Participation Types

```typescript
const participationTypes = ["Physical", "Online", "Hybrid"];
```

### Student Status

```typescript
const studentStatus = ["Active", "Completed", "Inactive"];
```

## 🎓 Best Practices

1. **Always validate unique fields** before submission
2. **Use React Query** for server state management
3. **Implement loading states** for better UX
4. **Show confirmation dialogs** for destructive actions
5. **Provide clear error messages** to users
6. **Use TypeScript** for type safety
7. **Follow the existing patterns** in the codebase
8. **Test all CRUD operations** thoroughly
9. **Handle edge cases** (empty states, network errors)
10. **Keep components focused** and reusable

## 🔗 Related Files

- **Form Component**: `src/components/forms/AddStudentForm.tsx`
- **Page Component**: `src/pages/Students.tsx`
- **Hooks**: `src/hooks/useStudents.ts`, `src/hooks/useEnrollments.ts`
- **Database Schema**: `SCHEMA.sql`
- **Constants**: `src/lib/constants.ts`
- **Import Template**: `public/students_import_template.csv`

## 📞 Support

For issues or questions:
1. Check the implementation documentation: `STUDENT_MANAGEMENT_IMPLEMENTATION.md`
2. Review the database schema: `SCHEMA.sql`
3. Check the setup guide: `SETUP_GUIDE.md`

---

**Last Updated**: February 14, 2026  
**Version**: 1.0
