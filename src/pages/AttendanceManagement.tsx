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
  BarChart3,
  UserCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
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

  // NEW: Calculate Student Analytics
  const studentAnalytics = classStudents.map(student => {
    const studentRecords = historyRecords.filter(r => r.student_id === student.id);
    const presentCount = studentRecords.filter(r => r.status === "Present").length;
    const totalSessions = new Set(historyRecords.map(r => r.attendance_date)).size;
    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    // Sort all unique dates to find recent ones
    const allDates = Array.from(new Set(historyRecords.map(r => r.attendance_date))).sort((a, b) => b.localeCompare(a));
    const recentDates = allDates.slice(0, 8); // Show last 8 sessions

    // Map status for those dates
    const sparkline = recentDates.map(date => {
      const record = studentRecords.find(r => r.attendance_date === date);
      return {
        date,
        status: record ? record.status : "Absent"
      };
    });

    return {
      id: student.id,
      name: student.full_name,
      index: student.index_number,
      presentCount,
      totalSessions,
      percentage,
      sparkline
    };
  }).sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending

  const analyticsMap = Object.fromEntries(studentAnalytics.map(s => [s.id, s]));

  const handleExportHistoryCSV = (date: string, records: any[]) => {
    const headers = ["Index Number", "Name", "Status", "Time", "Marked By"];
    const rows = records.map((r) => [
      r.students?.index_number || "-",
      r.students?.full_name || "Unknown",
      r.status,
      r.created_at ? format(new Date(r.created_at), "HH:mm:ss") : "-",
      r.marked_by || "—",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const className = classes.find(c => c.id === selectedClassId)?.name || "Class";
    a.download = `attendance-${className}-${date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Attendance for ${date} exported successfully`);
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Attendance Log Book
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
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

      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto sm:mx-0">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Daily Log</span>
            <span className="sm:hidden">Entry</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Student Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Session History</span>
            <span className="sm:hidden">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Attendance Table */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Attendance Records</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search student..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleMarkAll("Present")}
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none border-green-200 hover:bg-green-50 text-green-700 font-medium"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark All Present
                  </Button>
                  <Button
                    onClick={() => handleMarkAll("Absent")}
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none border-red-200 hover:bg-red-50 text-red-700 font-medium"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Mark All Absent
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
                  {!isMobile ? (
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead>Student Details</TableHead>
                          <TableHead className="hidden md:table-cell">Attendance %</TableHead>
                          <TableHead>Attendance Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                              No students enrolled or found matching your search.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredStudents.map((student, idx) => {
                            const record = attendanceRecords.find((r) => r.student_id === student.id);
                            const status = (attendanceMap[student.id] as string) || "Not Marked";

                            return (
                              <TableRow key={student.id} className="hover:bg-muted/20 transition-colors">
                                <TableCell className="text-center text-muted-foreground font-mono text-xs">
                                  {idx + 1}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-semibold">{student.full_name}</span>
                                    <span className="text-xs text-muted-foreground font-mono">{student.index_number}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {analyticsMap[student.id] && (
                                    <div className="flex flex-col gap-1">
                                      <span className={`text-[10px] font-bold ${analyticsMap[student.id].percentage >= 80 ? 'text-green-600' : 'text-red-500'}`}>
                                        {analyticsMap[student.id].percentage}%
                                      </span>
                                      <div className="flex gap-0.5">
                                        {analyticsMap[student.id].sparkline.slice(0, 5).map((item, idx) => (
                                          <div
                                            key={idx}
                                            className={`w-1.5 h-3 rounded-t-[1px] ${item.status === 'Present' ? 'bg-green-500' :
                                                item.status === 'Absent' ? 'bg-red-200' :
                                                  item.status === 'Late' ? 'bg-yellow-400' : 'bg-blue-300'
                                              }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={status}
                                    onValueChange={(value) => handleMark(student.id, value)}
                                  >
                                    <SelectTrigger className={`w-36 h-9 font-medium shadow-none border-${status === 'Present' ? 'green' : status === 'Absent' ? 'red' : 'input'}-200`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Present">
                                        <div className="flex items-center gap-2 text-green-600">
                                          <CheckCircle2 className="h-4 w-4" /> Present
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Absent">
                                        <div className="flex items-center gap-2 text-red-600">
                                          <XCircle className="h-4 w-4" /> Absent
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Late">
                                        <div className="flex items-center gap-2 text-yellow-600">
                                          <Play className="h-4 w-4 rotate-90" /> Late
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="Excused">
                                        <div className="flex items-center gap-2 text-blue-600">
                                          <CheckCircle2 className="h-4 w-4 opacity-50" /> Excused
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-right">
                                  {record && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => setDeleteConfirmId(record.id)}
                                          className="text-destructive font-medium"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Record
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
                  ) : (
                    <div className="grid grid-cols-1 gap-4 p-4">
                      {filteredStudents.map((student, idx) => {
                        const status = (attendanceMap[student.id] as string) || "Not Marked";
                        return (
                          <div key={student.id} className="flex flex-col gap-3 p-3 border rounded-lg bg-card">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{student.full_name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{student.index_number}</p>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">#{idx + 1}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <Select
                                value={status}
                                onValueChange={(value) => handleMark(student.id, value)}
                              >
                                <SelectTrigger className="flex-1 h-9 bg-muted/30">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Present"><span className="text-green-600 font-medium text-xs">Present</span></SelectItem>
                                  <SelectItem value="Absent"><span className="text-red-600 font-medium text-xs">Absent</span></SelectItem>
                                  <SelectItem value="Late"><span className="text-yellow-600 font-medium text-xs">Late</span></SelectItem>
                                  <SelectItem value="Excused"><span className="text-blue-600 font-medium text-xs">Excused</span></SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Coordinator Check-In */}
              <Card className="h-fit shadow-md border-t-4 border-t-primary/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Mark by Coordinator
                  </CardTitle>
                  <CardDescription>Enter Student Index Number to mark present</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeSession ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="index-number" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Index Number</Label>
                        <Input
                          id="index-number"
                          placeholder="e.g. 2024NIC001"
                          value={studentIndexInput}
                          onChange={(e) => setStudentIndexInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") handleStudentCheckIn();
                          }}
                          className="font-mono text-center tracking-widest text-lg"
                        />
                      </div>
                      <Button
                        onClick={handleStudentCheckIn}
                        className="w-full font-bold shadow-sm"
                        disabled={createAttendance.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        SUBMIT ATTENDANCE
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 bg-muted/20 rounded-lg border border-dashed text-center">
                      <Play className="h-8 w-8 text-muted-foreground opacity-20 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Wait for lecturer to start a session to enable manual marking.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Export & Import Section */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    Data Operations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleFileSelected}
                      className="hidden"
                    />
                    <Button onClick={handleImportCSVClick} variant="outline" size="sm" className="w-full justify-start h-10 px-4" disabled={isImporting}>
                      {isImporting ? (
                        <div className="flex items-center">
                          <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2" />
                          Importing...
                        </div>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2 text-primary" />
                          Import via CSV
                        </>
                      )}
                    </Button>
                    <Button onClick={handleExportCSV} variant="outline" size="sm" className="w-full justify-start h-10 px-4" disabled={filteredStudents.length === 0}>
                      <Download className="h-4 w-4 mr-2 text-blue-500" />
                      Export Current Sheet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 animate-in fade-in duration-300">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Individual Student Performance</CardTitle>
                  <CardDescription>Aggregate attendance across all class sessions</CardDescription>
                </div>
                <Badge variant="outline" className="font-mono">
                  {new Set(historyRecords.map(r => r.attendance_date)).size} Total Sessions
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="border rounded-lg overflow-hidden bg-background">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Attended</TableHead>
                      <TableHead>Percent</TableHead>
                      {!isMobile && <TableHead>Recent Pattern</TableHead>}
                      <TableHead className="text-right">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentAnalytics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                          No session data available for analytics yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      studentAnalytics.map((s, i) => (
                        <TableRow key={s.id} className="hover:bg-muted/10">
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">{s.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{s.index}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {s.presentCount} / {s.totalSessions}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 w-24">
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span>{s.percentage}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${s.percentage >= 80 ? 'bg-green-500' : s.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                  style={{ width: `${s.percentage}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          {!isMobile && (
                            <TableCell>
                              <div className="flex gap-0.5">
                                {s.sparkline.length === 0 ? (
                                  <span className="text-[10px] text-muted-foreground">no data</span>
                                ) : (
                                  s.sparkline.map((item, idx) => (
                                    <div
                                      key={idx}
                                      title={`${item.date}: ${item.status}`}
                                      className={`w-3 h-5 rounded-sm ${item.status === 'Present' ? 'bg-green-500' :
                                        item.status === 'Absent' ? 'bg-red-200' :
                                          item.status === 'Late' ? 'bg-yellow-400' : 'bg-blue-300'
                                        }`}
                                    />
                                  ))
                                )}
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <Badge
                              variant={s.percentage >= 80 ? 'default' : s.percentage >= 50 ? 'secondary' : 'outline'}
                              className={s.percentage >= 80 ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                            >
                              {s.percentage >= 80 ? 'Excellent' : s.percentage >= 60 ? 'Good' : s.percentage >= 40 ? 'Fair' : 'Poor'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="animate-in slide-in-from-right-2 duration-300">
          {selectedClassId && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary/60" />
                    <CardTitle>Session Logs</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-muted/30">
                    Grouped by Date
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isHistoryLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground font-medium">Crunching history data...</p>
                  </div>
                ) : historyRecords.length === 0 ? (
                  <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed">
                    <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground font-medium">No archived sessions found for this class.</p>
                  </div>
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
                    <div className="grid grid-cols-1 gap-3">
                      {sortedDates.map((date) => {
                        const records = byDate[date];
                        const present = records.filter((r) => r.status === "Present").length;
                        const absent = records.filter((r) => r.status === "Absent").length;
                        const total = records.length;
                        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                        const isExpanded = expandedHistoryDate === date;

                        return (
                          <div
                            key={date}
                            className={`border rounded-xl transition-all duration-300 overflow-hidden ${isExpanded ? 'ring-2 ring-primary/20 shadow-lg' : 'hover:border-primary/30'}`}
                          >
                            <div
                              className={`flex items-center justify-between px-5 py-4 cursor-pointer select-none ${isExpanded ? 'bg-primary/5' : 'bg-card'}`}
                              onClick={() => setExpandedHistoryDate(isExpanded ? null : date)}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-lg ${isExpanded ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'}`}>
                                  <CalendarDays className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="font-bold text-sm">
                                    {format(new Date(date + "T00:00:00"), "EEEE, MMM d, yyyy")}
                                  </p>
                                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-tight text-muted-foreground/80">
                                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> {present} Present</span>
                                    <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" /> {absent} Absent</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="hidden sm:flex flex-col items-end gap-1 px-4 border-r">
                                  <span className="text-xs font-bold">{pct}% Success</span>
                                  <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 p-0 text-muted-foreground hover:bg-muted"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportHistoryCSV(date, records);
                                  }}
                                >
                                  <Download className="h-5 w-5" />
                                </Button>
                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="bg-background/50 animate-in slide-in-from-top-1">
                                <Table>
                                  <TableHeader className="bg-muted/10">
                                    <TableRow className="border-t">
                                      <TableHead className="text-[10px] uppercase font-bold text-muted-foreground px-5 h-10">Student</TableHead>
                                      <TableHead className="text-[10px] uppercase font-bold text-muted-foreground h-10">Status</TableHead>
                                      <TableHead className="text-[10px] uppercase font-bold text-muted-foreground h-10">Marked By</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {records.map((r) => (
                                      <TableRow key={r.id} className="hover:bg-muted/5">
                                        <TableCell className="px-5 py-3">
                                          <div className="flex flex-col">
                                            <span className="text-sm font-bold">{r.students?.full_name || "Unknown"}</span>
                                            <span className="text-xs font-mono text-muted-foreground">{r.students?.index_number}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                          <Badge
                                            variant="secondary"
                                            className={`text-[10px] font-bold px-2 py-0 h-5 ${r.status === 'Present' ? 'bg-green-100 text-green-700' :
                                              r.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                                r.status === 'Late' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                              }`}
                                          >
                                            {r.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-[10px] font-medium text-muted-foreground italic">
                                          via {r.marked_by || "System"}
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
        </TabsContent>
      </Tabs>

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
