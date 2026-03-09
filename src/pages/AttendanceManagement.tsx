import { useState, useRef } from "react";
import { format } from "date-fns";
import {
  Play,
  Square,
  Copy,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  History,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClasses } from "@/hooks/useClasses";
import { useCourses } from "@/hooks/useCourses";
import { useStudents } from "@/hooks/useStudents";
import {
  useAttendanceSessions,
  useCreateAttendanceSession,
  useEndAttendanceSession,
} from "@/hooks/useAttendanceSessions";
import {
  useAttendanceRecords,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
  useClassAttendanceHistory,
} from "@/hooks/useAttendanceRecords";
import { useEnrollments } from "@/hooks/useEnrollments";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";

export function AttendanceManagement() {
  const queryClient = useQueryClient();
  const { data: classes = [] } = useClasses();
  const { data: courses = [] } = useCourses();
  const { data: students = [] } = useStudents();

  // State
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [subjectError, setSubjectError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [studentIndexInput, setStudentIndexInput] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedHistoryDate, setExpandedHistoryDate] = useState<string | null>(null);

  // Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Hooks
  const { data: sessions = [] } = useAttendanceSessions(
    selectedClassId,
    format(selectedDate, "yyyy-MM-dd"),
  );
  const { data: enrollments = [] } = useEnrollments(selectedClassId);
  const { data: historyRecords = [], isLoading: isHistoryLoading } = useClassAttendanceHistory(
    selectedClassId || undefined,
  );
  const { data: attendanceRecords = [] } = useAttendanceRecords(
    selectedClassId,
    format(selectedDate, "yyyy-MM-dd"),
  );

  const createSession = useCreateAttendanceSession();
  const endSession = useEndAttendanceSession();
  const createAttendance = useCreateAttendance();
  const updateAttendance = useUpdateAttendance();
  const deleteAttendance = useDeleteAttendance();

  // Compute subject from selected class and courses
  const computedSubject = (() => {
    if (!selectedClassId) return "";
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (!selectedClass || !selectedClass.course_id) return "";
    const course = courses.find((c) => c.id === selectedClass.course_id);
    if (!course) return "";

    // Extract first subject from course levels or use course name as fallback
    if (course.levels && course.levels.length > 0) {
      const firstLevel = course.levels[0];
      if (firstLevel.subjects && firstLevel.subjects.length > 0) {
        return firstLevel.subjects[0].name;
      }
    }
    return course.name;
  })();

  // Get students enrolled in selected class
  const enrolledStudentIds = new Set(enrollments.map((e) => e.student_id));
  const classStudents = students.filter((s) => enrolledStudentIds.has(s.id));

  // Filter by search
  const filteredStudents = classStudents.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.index_number.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get current session
  const activeSession = sessions.find((s) => s.is_active);

  // Compute attendance map from records (avoid state updates)
  const attendanceMap: Record<
    string,
    "Present" | "Absent" | "Late" | "Excused"
  > = {};
  attendanceRecords.forEach((record) => {
    attendanceMap[record.student_id] = record.status;
  });

  // Handle start session
  const handleStartSession = () => {
    if (!selectedClassId) {
      toast.error("Please select a class");
      return;
    }

    if (!computedSubject.trim()) {
      setSubjectError("Subject is required");
      toast.error("Please ensure subject is filled");
      return;
    }

    setSubjectError("");
    createSession.mutate({
      class_id: selectedClassId,
      session_date: format(selectedDate, "yyyy-MM-dd"),
      start_time: format(new Date(), "HH:mm:ss"),
      subject: computedSubject || undefined,
    });
  };

  // Handle end session
  const handleEndSession = () => {
    if (!activeSession?.id) {
      toast.error("No active session");
      return;
    }

    endSession.mutate(activeSession.id);
  };

  // Handle mark attendance
  const handleMark = (studentId: string, status: string) => {
    const existingRecord = attendanceRecords.find(
      (r) => r.student_id === studentId,
    );

    const statusValue = status as "Present" | "Absent" | "Late" | "Excused";

    if (existingRecord) {
      updateAttendance.mutate({
        id: existingRecord.id,
        status: statusValue,
      });
    } else {
      createAttendance.mutate({
        student_id: studentId,
        class_id: selectedClassId,
        attendance_date: format(selectedDate, "yyyy-MM-dd"),
        status: statusValue,
        marked_by: "lecturer",
      });
    }
  };

  // Handle mark all
  const handleMarkAll = (status: string) => {
    filteredStudents.forEach((student) => {
      handleMark(student.id, status);
    });
  };

  // Handle student self check-in
  const handleStudentCheckIn = () => {
    if (!studentIndexInput.trim()) {
      toast.error("Please enter your index number");
      return;
    }

    if (!activeSession) {
      toast.error("No active session. Please try again later.");
      return;
    }

    const student = students.find((s) =>
      s.index_number.toLowerCase().includes(studentIndexInput.toLowerCase()),
    );

    if (!student) {
      toast.error("Student not found");
      return;
    }

    // Check if enrolled
    if (!enrolledStudentIds.has(student.id)) {
      toast.error("Not enrolled in this class");
      return;
    }

    // Check if already marked
    if (attendanceMap[student.id]) {
      toast.error("Attendance has already been recorded");
      setStudentIndexInput("");
      return;
    }

    createAttendance.mutate({
      student_id: student.id,
      class_id: selectedClassId,
      attendance_date: format(selectedDate, "yyyy-MM-dd"),
      status: "Present",
      marked_by: "Self",
    });

    setStudentIndexInput("");
  };

  // Handle copy link
  const handleCopyLink = () => {
    if (!activeSession) {
      toast.error("No active session");
      return;
    }

    const link = `${window.location.origin}/attendance/self/${activeSession.id}/${activeSession.unique_link}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  // Calculate stats
  const presentCount = Object.values(attendanceMap).filter(
    (s) => s === "Present",
  ).length;
  const absentCount = Object.values(attendanceMap).filter(
    (s) => s === "Absent",
  ).length;
  const attendancePercentage = classStudents.length
    ? Math.round((presentCount / classStudents.length) * 100)
    : 0;

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Index Number", "Name", "Status", "Time", "Notes"];
    const rows = filteredStudents.map((student) => {
      const record = attendanceRecords.find((r) => r.student_id === student.id);
      return [
        student.index_number,
        student.full_name,
        record?.status || "Absent",
        record?.created_at
          ? format(new Date(record.created_at), "HH:mm:ss")
          : "-",
        record?.notes || "",
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${format(selectedDate, "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  // Import CSV
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

  const handleImportCSVClick = () => {
    if (!selectedClassId) {
      toast.error("Please select a class first");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a valid CSV file");
      e.target.value = "";
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length < 2) {
          toast.error("CSV file is empty or missing data rows");
          setIsImporting(false);
          return;
        }

        const headers = rows[0].map(h => h.toLowerCase().replace(/[\s_\-]+/g, " ").trim());
        
        // Find relevant column indices
        const indexCol = headers.findIndex((h) => ["index number", "index no", "index", "student id"].includes(h));
        const statusCol = headers.findIndex((h) => ["status", "attendance", "state"].includes(h));
        const notesCol = headers.findIndex((h) => ["notes", "note", "remark", "remarks"].includes(h));

        if (indexCol === -1 || statusCol === -1) {
          toast.error("CSV must contain 'Index Number' and 'Status' columns");
          setIsImporting(false);
          return;
        }

        const dataRows = rows.slice(1);
        let successCount = 0;
        let failCount = 0;

        for (const row of dataRows) {
          const indexNumber = row[indexCol];
          const rawStatus = row[statusCol] || "";
          const notesText = notesCol !== -1 ? row[notesCol] : "";

          if (!indexNumber || !rawStatus) {
            continue; // Skip effectively empty/invalid rows
          }

          const student = classStudents.find((s) => s.index_number.toLowerCase() === indexNumber.toLowerCase());
          if (!student) {
            failCount++;
            continue;
          }

          // Normalize status
          const lStatus = rawStatus.toLowerCase();
          let parsedStatus: "Present" | "Absent" | "Late" | "Excused" = "Absent";
          if (lStatus.includes("present") || lStatus === "true" || lStatus === "1" || lStatus === "p") parsedStatus = "Present";
          else if (lStatus.includes("late") || lStatus === "l") parsedStatus = "Late";
          else if (lStatus.includes("excuse") || lStatus === "e") parsedStatus = "Excused";
          
          const existingRecord = attendanceRecords.find((r) => r.student_id === student.id);
          
          try {
            if (existingRecord) {
              await supabase.from("attendance").update({ status: parsedStatus, notes: notesText || existingRecord.notes }).eq("id", existingRecord.id);
            } else {
              await supabase.from("attendance").insert([{
                  student_id: student.id,
                  class_id: selectedClassId,
                  attendance_date: format(selectedDate, "yyyy-MM-dd"),
                  status: parsedStatus,
                  notes: notesText,
                  marked_by: "CSV Import",
              }]);
            }
            successCount++;
          } catch (err) {
            console.error(err);
            failCount++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
        
        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} attendance records`);
        }
        if (failCount > 0) {
          toast.error(`Failed to import ${failCount} records. Ensure student index numbers match enrolled students.`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse CSV file content");
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };
    
    reader.onerror = () => {
      toast.error("Failed to read file");
      setIsImporting(false);
      e.target.value = "";
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance Log Book</h1>
          <p className="text-muted-foreground">
            View daily analytics and manage class log book records
          </p>
        </div>
      </div>

      {/* Top Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Class Select */}
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes
                    .filter((c) => c.status === "Active")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Date</Label>
              <CustomDatePicker
                date={selectedDate}
                setDate={(date) => setSelectedDate(date || new Date())}
                placeholder="Pick date"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Subject (auto-filled)"
                value={computedSubject}
                readOnly
                className="bg-muted"
              />
              {subjectError && (
                <p className="text-sm text-destructive">{subjectError}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button
                  onClick={handleStartSession}
                  disabled={
                    !selectedClassId ||
                    !computedSubject.trim() ||
                    !!activeSession ||
                    createSession.isPending
                  }
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
                <Button
                  onClick={handleEndSession}
                  disabled={!activeSession || endSession.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  End
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Info & Analytics */}
      {selectedClassId && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {classes.find((c) => c.id === selectedClassId)?.name ||
                    "Class Analytics"}
                </CardTitle>
                <CardDescription>
                  Analytics for {format(selectedDate, "MMMM d, yyyy")}
                  {computedSubject && ` • ${computedSubject}`}
                </CardDescription>
              </div>
              {activeSession ? (
                <Badge className="bg-green-500">Active Session</Badge>
              ) : sessions.length > 0 ? (
                <Badge variant="secondary">Session Completed</Badge>
              ) : (
                <Badge variant="outline">No Session Logged</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600">
                  {presentCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Enrolled</p>
                <p className="text-2xl font-bold">{classStudents.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance %</p>
                <p className="text-2xl font-bold">{attendancePercentage}%</p>
              </div>
              {activeSession && (
                <div className="col-span-2 md:col-span-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Unique Link
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={
                        `${window.location.origin}/attendance/self/${activeSession.id}/${activeSession.unique_link}`.slice(
                          0,
                          30
                        ) + "..."
                      }
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      onClick={handleCopyLink}
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Attendance Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Attendance Records</CardTitle>
              <div className="flex gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search student..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <Button
                onClick={() => handleMarkAll("Present")}
                size="sm"
                variant="outline"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark All Present
              </Button>
              <Button
                onClick={() => handleMarkAll("Absent")}
                size="sm"
                variant="outline"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mark All Absent
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Index</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No students enrolled or found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student, idx) => {
                      const record = attendanceRecords.find(
                        (r) => r.student_id === student.id,
                      );
                      const status =
                        (attendanceMap[student.id] as string) || "Not Marked";

                      return (
                        <TableRow key={student.id}>
                          <TableCell className="text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {student.index_number}
                          </TableCell>
                          <TableCell>{student.full_name}</TableCell>
                          <TableCell>
                            <Select
                              value={status}
                              onValueChange={(value) =>
                                handleMark(student.id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Present">
                                  <span className="text-green-600">
                                    Present
                                  </span>
                                </SelectItem>
                                <SelectItem value="Absent">
                                  <span className="text-red-600">Absent</span>
                                </SelectItem>
                                <SelectItem value="Late">
                                  <span className="text-yellow-600">Late</span>
                                </SelectItem>
                                <SelectItem value="Excused">
                                  <span className="text-blue-600">Excused</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            {record && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setDeleteConfirmId(record.id)
                                    }
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Coordinator Check-In */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Attendance Marking by Coordinator</CardTitle>
            <CardDescription>Check in a student by Index Number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSession ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="index-number">Your Index Number</Label>
                  <Input
                    id="index-number"
                    placeholder="Enter index number"
                    value={studentIndexInput}
                    onChange={(e) => setStudentIndexInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleStudentCheckIn();
                    }}
                  />
                </div>
                <Button
                  onClick={handleStudentCheckIn}
                  className="w-full"
                  disabled={createAttendance.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit Attendance
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No active session. Please wait for the lecturer to start a
                session.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export & Import Section */}
      <Card>
        <CardHeader>
          <CardTitle>Import & Export</CardTitle>
          <CardDescription>Upload attendance from a CSV file or export current records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileSelected}
              className="hidden"
            />
            <Button onClick={handleImportCSVClick} variant="outline" disabled={isImporting}>
              {isImporting ? (
                <div className="flex items-center">
                  <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2" />
                  Importing...
                </div>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import from CSV
                </>
              )}
            </Button>
            <Button onClick={handleExportCSV} variant="outline" disabled={filteredStudents.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </Button>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            <p><strong>Note for importing:</strong> The CSV must contain an <em>Index Number</em> and <em>Status</em> column. A <em>Notes</em> column is optional.</p>
            <p>Valid statuses: Present, Absent, Late, Excused.</p>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      {selectedClassId && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Attendance History</CardTitle>
            </div>
            <CardDescription>
              All recorded sessions for{" "}
              {classes.find((c) => c.id === selectedClassId)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Loading history...
              </p>
            ) : historyRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No attendance history found for this class.
              </p>
            ) : (() => {
              // Group records by date
              const byDate = historyRecords.reduce<Record<string, typeof historyRecords>>(
                (acc, r) => {
                  const d = r.attendance_date;
                  if (!acc[d]) acc[d] = [];
                  acc[d].push(r);
                  return acc;
                },
                {},
              );
              const sortedDates = Object.keys(byDate).sort((a, b) =>
                b.localeCompare(a),
              );
              return (
                <div className="space-y-2">
                  {sortedDates.map((date) => {
                    const records = byDate[date];
                    const present = records.filter((r) => r.status === "Present").length;
                    const absent = records.filter((r) => r.status === "Absent").length;
                    const late = records.filter((r) => r.status === "Late").length;
                    const excused = records.filter((r) => r.status === "Excused").length;
                    const total = records.length;
                    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                    const isExpanded = expandedHistoryDate === date;
                    return (
                      <div
                        key={date}
                        className="border rounded-lg overflow-hidden"
                      >
                        {/* Row header */}
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                          onClick={() =>
                            setExpandedHistoryDate(isExpanded ? null : date)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-sm">
                              {format(new Date(date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-3 text-xs">
                              <span className="text-green-600 font-medium">{present} Present</span>
                              <span className="text-red-500 font-medium">{absent} Absent</span>
                              {late > 0 && <span className="text-yellow-500 font-medium">{late} Late</span>}
                              {excused > 0 && <span className="text-blue-500 font-medium">{excused} Excused</span>}
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  pct >= 80
                                    ? "bg-green-100 text-green-700"
                                    : pct >= 50
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {pct}%
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="border-t bg-muted/20">
                            {/* Mobile stats */}
                            <div className="flex sm:hidden gap-3 px-4 py-2 text-xs border-b">
                              <span className="text-green-600 font-medium">{present} Present</span>
                              <span className="text-red-500 font-medium">{absent} Absent</span>
                              {late > 0 && <span className="text-yellow-500 font-medium">{late} Late</span>}
                              {excused > 0 && <span className="text-blue-500 font-medium">{excused} Excused</span>}
                              <span className="font-bold">{pct}%</span>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30">
                                  <TableHead className="text-xs">Student ID</TableHead>
                                  <TableHead className="text-xs">Status</TableHead>
                                  <TableHead className="text-xs">Marked By</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {records.map((r) => (
                                  <TableRow key={r.id} className="text-sm">
                                    <TableCell className="font-mono text-xs py-2">
                                      {r.student_id.slice(0, 8)}...
                                    </TableCell>
                                    <TableCell className="py-2">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                          r.status === "Present"
                                            ? "bg-green-100 text-green-700"
                                            : r.status === "Absent"
                                            ? "bg-red-100 text-red-700"
                                            : r.status === "Late"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-blue-100 text-blue-700"
                                        }`}
                                      >
                                        {r.status}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs py-2">
                                      {r.marked_by || "—"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open && !deleteAttendance.isPending) setDeleteConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAttendance.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  deleteAttendance.mutate(deleteConfirmId, {
                    onSuccess: () => {
                      setDeleteConfirmId(null);
                    },
                  });
                }
              }}
              disabled={deleteAttendance.isPending}
              className="bg-destructive"
            >
              {deleteAttendance.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
