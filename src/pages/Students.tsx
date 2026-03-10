import { useState, useMemo, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useStudents,
  useDeleteStudent,
  type Student,
} from "@/hooks/useStudents";
import { useCourses } from "@/hooks/useCourses";
import { useClasses } from "@/hooks/useClasses";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  Upload,
  Search,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { AddStudentForm } from "@/components/forms/AddStudentForm";
import { toast } from "sonner";
import { SRI_LANKAN_DISTRICTS } from "@/lib/constants";

export function Students() {
  const isMobile = useIsMobile();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Import states
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    succeeded: 0,
    failed: 0,
  });
  const [importDone, setImportDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [participationFilter, setParticipationFilter] = useState("all");
  const [theologyFilter, setTheologyFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: students = [], isLoading } = useStudents();
  const { data: courses = [] } = useCourses();
  const { data: classes = [] } = useClasses();
  const deleteStudent = useDeleteStudent();
  const queryClient = useQueryClient();

  // Derive unique batches from students
  const uniqueBatches = useMemo(() => {
    const batches = students
      .map((s) => s.batch_number)
      .filter((b): b is string => !!b);
    return [...new Set(batches)].sort();
  }, [students]);

  // Filter and search students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        switch (searchType) {
          case "index":
            if (!student.index_number?.toLowerCase().includes(term))
              return false;
            break;
          case "name":
            if (!student.full_name?.toLowerCase().includes(term)) return false;
            break;
          case "email":
            if (!student.email?.toLowerCase().includes(term)) return false;
            break;
          case "district":
            if (!student.district?.toLowerCase().includes(term)) return false;
            break;
          case "all":
          default:
            const searchableFields = [
              student.index_number,
              student.full_name,
              student.email,
              student.district,
              student.whatsapp_number,
            ].filter(Boolean);
            if (
              !searchableFields.some((field) =>
                field?.toLowerCase().includes(term),
              )
            ) {
              return false;
            }
        }
      }

      // Status filter
      if (statusFilter !== "all" && student.status !== statusFilter)
        return false;

      // District filter
      if (districtFilter !== "all" && student.district !== districtFilter)
        return false;

      // Course filter
      if (courseFilter !== "all" && student.academic_program !== courseFilter)
        return false;

      // Participation type filter
      if (
        participationFilter !== "all" &&
        student.participation_type !== participationFilter
      ) {
        return false;
      }

      // Theology project filter
      if (theologyFilter !== "all") {
        const hasProject = student.systematic_theology_project;
        if (theologyFilter === "yes" && !hasProject) return false;
        if (theologyFilter === "no" && hasProject) return false;
      }

      // Batch filter
      if (batchFilter !== "all" && student.batch_number !== batchFilter)
        return false;

      return true;
    });
  }, [
    students,
    searchTerm,
    searchType,
    statusFilter,
    districtFilter,
    courseFilter,
    participationFilter,
    theologyFilter,
    batchFilter,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (studentToDelete) {
      await deleteStudent.mutateAsync(studentToDelete.id);
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsViewDialogOpen(false);
    setSelectedStudent(null);
    queryClient.invalidateQueries({ queryKey: ["students"] });
  };

  const handleExport = async () => {
    // Fetch all enrollments to include classes in the export
    const { data: enrollmentsRaw } = await supabase
      .from("student_course_enrollments")
      .select("student_id, class_id");
    
    const enrollments = enrollmentsRaw || [];

    // Create CSV content
    const headers = [
      "Index Number",
      "National ID",
      "Personal Number",
      "Full Name",
      "Email",
      "WhatsApp",
      "District",
      "Address",
      "Participation Type",
      "Status",
      "Systematic Theology",
      "First Exam Completed",
      "Academic Program",
      "Batch Number",
      "Personal File URL",
      "Levels",
      "Subjects",
      "Registered Date",
      "Last Updated",
      "Classes",
      "Student ID",
    ];

    const rows = filteredStudents.map((student) => {
      const course = courses.find((c) => c.id === student.academic_program);

      // Find all enrolled classes for this student
      const studentClassNames = enrollments
        .filter((e) => e.student_id === student.id)
        .map((e) => {
          const cls = classes.find((c) => c.id === e.class_id);
          return cls ? cls.name : "";
        })
        .filter(Boolean)
        .join("; ");

      // Format levels and subjects (JSONB)
      const levelsStr = Array.isArray(student.selected_levels)
        ? student.selected_levels.join("; ")
        : "";
      const subjectsStr = Array.isArray(student.selected_subjects)
        ? student.selected_subjects.join("; ")
        : "";

      return [
        student.index_number,
        student.national_id,
        student.personal_number || "",
        student.full_name,
        student.email,
        student.whatsapp_number,
        student.district,
        student.address || "",
        student.participation_type,
        student.status,
        student.systematic_theology_project ? "Yes" : "No",
        student.first_exam_completed ? "Yes" : "No",
        course?.name || "",
        student.batch_number || "",
        student.personal_file_url || "",
        levelsStr,
        subjectsStr,
        student.created_at ? new Date(student.created_at).toLocaleString() : "",
        student.updated_at ? new Date(student.updated_at).toLocaleString() : "",
        studentClassNames,
        student.id,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `students_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Students exported successfully");
  };

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let current = "";
    let inQuotes = false;
    let row: string[] = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"' && text[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          row.push(current.trim());
          current = "";
        } else if (ch === "\n" || ch === "\r") {
          if (ch === "\r" && text[i + 1] === "\n") i++;
          row.push(current.trim());
          current = "";
          if (row.some((c) => c !== "")) rows.push(row);
          row = [];
        } else {
          current += ch;
        }
      }
    }
    row.push(current.trim());
    if (row.some((c) => c !== "")) rows.push(row);
    return rows;
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length < 2) {
          toast.error("CSV file is empty or has no data rows");
          return;
        }

        // Normalise a header: lowercase, collapse spaces, remove underscores/hyphens
        const norm = (s: string) =>
          s
            .replace(/^\uFEFF/, "")
            .toLowerCase()
            .replace(/[\s_\-]+/g, " ")
            .trim();

        const headers = rows[0].map(norm);

        // Accepted aliases for each required column
        const columnAliases: Record<string, string[]> = {
          "index number": ["index number", "index no", "index", "student id", "student no"],
          "national id": ["national id", "national id number", "nic", "nic number", "id number", "id no"],
          "full name": ["full name", "name", "student name", "full name of student"],
          "email": ["email", "email address", "e mail", "e-mail"],
          "whatsapp number": [
            "whatsapp number", "whatsapp", "whatsapp no", "phone", "phone number",
            "mobile", "mobile number", "contact", "contact number", "telephone",
            "tel", "phone no", "mobile no",
          ],
          "district": ["district", "area", "region", "location"],
          "personal number": ["personal number", "personal id", "personal no", "student number", "personal"],
        };

        // Map each alias → canonical column key
        const headerMap: Record<string, string> = {};
        headers.forEach((h) => {
          for (const [canonical, aliases] of Object.entries(columnAliases)) {
            if (aliases.includes(h)) {
              headerMap[canonical] = h;
              break;
            }
          }
        });

        const requiredHeaders = Object.keys(columnAliases);
        const missingHeaders = requiredHeaders.filter((h) => !(h in headerMap));
        if (missingHeaders.length > 0) {
          toast.error(`Missing required columns: ${missingHeaders.join(", ")}`);
          return;
        }

        // Helper that resolves via alias map
        const get = (canonical: string, row: string[]) => {
          const matched = headerMap[canonical];
          if (!matched) return "";
          const i = headers.indexOf(matched);
          return i >= 0 && i < row.length ? row[i] : "";
        };

        // Optional columns resolved directly by normalised header
        const getOpt = (name: string, row: string[]) => {
          const i = headers.indexOf(norm(name));
          return i >= 0 && i < row.length ? row[i] : "";
        };

        const dataRows = rows.slice(1);
        const errors: string[] = [];
        const parsed = dataRows.map((row, idx) => {
          const rowNum = idx + 2;
          const indexNum = get("index number", row);
          const nationalId = get("national id", row);
          const fullName = get("full name", row);
          const email = get("email", row);
          const whatsapp = get("whatsapp number", row);
          const district = get("district", row);
          const personalNumber = get("personal number", row);
          const batchNumber = getOpt("batch number", row);
          const partType = getOpt("participation type", row) || "Physical";

          // Generate Index Number based on conditions
          const batchPart = batchNumber || "";
          const nicPart = nationalId?.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4) || "";
          const personalNumDigits = personalNumber?.replace(/\D/g, "") || "";
          const sumOfDigits = [...personalNumDigits].reduce(
            (sum, d) => sum + (parseInt(d, 10) || 0),
            0,
          );
          const districtNum = district?.match(/\d+/)?.[0] || "";
          const participationSuffix = partType === "Physical" ? "P" : "Z";
          
          const generatedIndex = `${batchPart}${nicPart}${sumOfDigits}${districtNum}${participationSuffix}`;

          // If indexNum is missing or is a UUID, use generatedIndex
          const finalIndex = (indexNum && !indexNum.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
            ? indexNum
            : generatedIndex;

          if (!finalIndex) errors.push(`Row ${rowNum}: Missing Index Number (Details insufficient for auto-generation)`);
          if (!nationalId) errors.push(`Row ${rowNum}: Missing National ID`);
          if (!fullName) errors.push(`Row ${rowNum}: Missing Full Name`);
          if (!email) errors.push(`Row ${rowNum}: Missing Email`);
          if (!whatsapp) errors.push(`Row ${rowNum}: Missing WhatsApp / Phone Number`);
          if (!district) errors.push(`Row ${rowNum}: Missing District`);

          return {
            index_number: finalIndex,
            national_id: nationalId,
            personal_number: personalNumber || null,
            full_name: fullName,
            email: email,
            whatsapp_number: whatsapp,
            district: district,
            address: getOpt("address", row) || null,
            participation_type: partType,
            status: getOpt("status", row) || "Active",
            systematic_theology_project:
              getOpt("systematic theology project", row)?.toLowerCase() === "yes",
            first_exam_completed:
              getOpt("first exam completed", row)?.toLowerCase() === "yes",
            personal_file_url: getOpt("personal file url", row) || null,
            batch_number: batchNumber || null,
            _classNames: getOpt("classes", row),
            _rowNum: rowNum,
          };
        });

        setImportData(parsed);
        setImportErrors(errors);
        setImportDone(false);
        setImportProgress({
          current: 0,
          total: parsed.length,
          succeeded: 0,
          failed: 0,
        });
        setIsImportDialogOpen(true);
      } catch {
        toast.error("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/students_import_template.csv";
    link.download = "students_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = async () => {
    if (importErrors.length > 0) {
      toast.error("Please fix errors before importing");
      return;
    }
    setIsImporting(true);
    setImportDone(false);
    let succeeded = 0;
    let failed = 0;
    const failedMessages: string[] = [];

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      const { _classNames, _rowNum, ...studentData } = row;
      try {
        const { data: newStudent, error } = await supabase
          .from("students")
          .insert([studentData])
          .select()
          .single();
        if (error) throw error;

        // Handle class enrollments
        if (_classNames && newStudent) {
          const classNameList = _classNames
            .split(";")
            .map((n: string) => n.trim())
            .filter(Boolean);
          for (const className of classNameList) {
            const matchedClass = classes.find(
              (c) => c.name.toLowerCase() === className.toLowerCase(),
            );
            if (matchedClass) {
              await supabase.from("student_course_enrollments").insert([
                {
                  student_id: newStudent.id,
                  course_id: matchedClass.course_id,
                  class_id: matchedClass.id,
                },
              ]);
            }
          }
        }
        succeeded++;
      } catch (err: any) {
        failed++;
        failedMessages.push(
          `Row ${_rowNum}: ${err.message || "Unknown error"}`,
        );
      }
      setImportProgress({
        current: i + 1,
        total: importData.length,
        succeeded,
        failed,
      });
    }

    setIsImporting(false);
    setImportDone(true);
    if (failed > 0) {
      setImportErrors(failedMessages);
    }
    queryClient.invalidateQueries({ queryKey: ["students"] });
    if (succeeded > 0)
      toast.success(`Successfully imported ${succeeded} student(s)`);
    if (failed > 0) toast.error(`Failed to import ${failed} student(s)`);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSearchType("all");
    setStatusFilter("all");
    setDistrictFilter("all");
    setCourseFilter("all");
    setParticipationFilter("all");
    setTheologyFilter("all");
    setBatchFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleImport}>
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>
            Manage all students in the system ({filteredStudents.length}{" "}
            students)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    <SelectItem value="index">Index Number</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="district">District</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {SRI_LANKAN_DISTRICTS.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={batchFilter} onValueChange={setBatchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {uniqueBatches.map((batch) => (
                    <SelectItem key={batch} value={batch}>
                      {batch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={participationFilter}
                onValueChange={setParticipationFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Participation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Physical">Physical</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={theologyFilter} onValueChange={setTheologyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Theology Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Completed</SelectItem>
                  <SelectItem value="no">Not Completed</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading students...</div>
          ) : paginatedStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filteredStudents.length === 0 && students.length > 0
                ? "No students match the current filters"
                : "No students found"}
            </div>
          ) : (
            <>
              {!isMobile ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Index Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStudents.map((student) => {
                        const course = courses.find(
                          (c) => c.id === student.academic_program,
                        );
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {student.index_number}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {student.full_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {student.whatsapp_number}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {student.email}
                            </TableCell>
                            <TableCell>{student.district}</TableCell>
                            <TableCell>
                              {course ? (
                                <span className="text-sm">{course.name}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  -
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {student.batch_number ? (
                                <span className="text-sm">
                                  {student.batch_number}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  -
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {student.participation_type}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  student.status === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : student.status === "Completed"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {student.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewStudent(student)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditStudent(student)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(student)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedStudents.map((student) => {
                    const course = courses.find(
                      (c) => c.id === student.academic_program,
                    );
                    return (
                      <Card key={student.id} className="border border-muted">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h3 className="font-bold text-base leading-tight">
                                {student.full_name}
                              </h3>
                              <p className="text-xs text-muted-foreground font-mono">
                                {student.index_number}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : student.status === "Completed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {student.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                District
                              </p>
                              <p className="font-medium line-clamp-1">
                                {student.district}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                Course
                              </p>
                              <p className="font-medium line-clamp-1">
                                {course?.name || "-"}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                Batch
                              </p>
                              <p className="font-medium">
                                {student.batch_number || "-"}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                Participation
                              </p>
                              <p className="font-medium">
                                {student.participation_type}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 flex flex-col gap-2">
                            <Button
                              className="w-full gap-2 font-semibold"
                              variant="outline"
                              onClick={() => handleViewStudent(student)}
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                className="flex-1 gap-2"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStudent(student)}
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </Button>
                              <Button
                                className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(student)}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <Label>Rows per page:</Label>
                  <Select
                    value={rowsPerPage.toString()}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * rowsPerPage,
                      filteredStudents.length,
                    )}{" "}
                    of {filteredStudents.length} students
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Enter student details and select at least one class
            </DialogDescription>
          </DialogHeader>
          <AddStudentForm
            onSuccess={handleFormSuccess}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student details and select at least one class
            </DialogDescription>
          </DialogHeader>
          <AddStudentForm
            editingStudent={selectedStudent}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setSelectedStudent(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Student Details</DialogTitle>
            <DialogDescription>
              Student information (read-only)
            </DialogDescription>
          </DialogHeader>
          <AddStudentForm
            editingStudent={selectedStudent}
            isViewMode={true}
            onCancel={() => {
              setIsViewDialogOpen(false);
              setSelectedStudent(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student{" "}
              <strong>{studentToDelete?.full_name}</strong> and all associated
              records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStudentToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden file input for CSV import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Import Dialog */}
      <Dialog
        open={isImportDialogOpen}
        onOpenChange={(open) => {
          if (!isImporting) {
            setIsImportDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Students from CSV
            </DialogTitle>
            <DialogDescription>
              Review the parsed data below before importing.
            </DialogDescription>
          </DialogHeader>

          {/* Template download */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Need the template?</p>
              <p className="text-xs text-muted-foreground">
                Download the CSV template with the correct column format
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-4 h-4 mr-1" /> Template
            </Button>
          </div>

          {/* Errors */}
          {importErrors.length > 0 && (
            <div className="border border-destructive/50 bg-destructive/5 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                <AlertTriangle className="w-4 h-4" />
                {importDone ? "Import Errors" : "Validation Errors"} (
                {importErrors.length})
              </div>
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {importErrors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">
                    {err}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {(isImporting || importDone) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isImporting ? "Importing..." : "Import Complete"}</span>
                <span>
                  {importProgress.current}/{importProgress.total}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                  {importProgress.succeeded} succeeded
                </span>
                {importProgress.failed > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="w-3.5 h-3.5" /> {importProgress.failed}{" "}
                    failed
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Preview table */}
          {importData.length > 0 && !importDone && (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Row</TableHead>
                    <TableHead className="text-xs">Index #</TableHead>
                    <TableHead className="text-xs">National ID</TableHead>
                    <TableHead className="text-xs">Full Name</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">District</TableHead>
                    <TableHead className="text-xs">Classes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importData.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{row._rowNum}</TableCell>
                      <TableCell className="text-xs font-medium">
                        {row.index_number}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.national_id}
                      </TableCell>
                      <TableCell className="text-xs">{row.full_name}</TableCell>
                      <TableCell className="text-xs">{row.email}</TableCell>
                      <TableCell className="text-xs">{row.district}</TableCell>
                      <TableCell className="text-xs">
                        {row._classNames || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {importData.length > 50 && (
                <p className="p-2 text-xs text-muted-foreground text-center">
                  Showing first 50 of {importData.length} rows
                </p>
              )}
            </div>
          )}

          {/* Summary */}
          {importData.length > 0 && !importDone && (
            <p className="text-sm text-muted-foreground">
              Ready to import <strong>{importData.length}</strong> student(s)
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                setImportData([]);
                setImportErrors([]);
                setImportDone(false);
              }}
              disabled={isImporting}
            >
              {importDone ? "Close" : "Cancel"}
            </Button>
            {!importDone && (
              <Button
                onClick={handleConfirmImport}
                disabled={
                  isImporting ||
                  importErrors.length > 0 ||
                  importData.length === 0
                }
              >
                {isImporting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isImporting
                  ? "Importing..."
                  : `Import ${importData.length} Student(s)`}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
