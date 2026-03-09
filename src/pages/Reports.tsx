import { useMemo } from "react";
import { format } from "date-fns";
import {
  Users,
  BookOpen,
  GraduationCap,
  Mic2,
  Download,
  TrendingUp,
  ClipboardList,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useCourses } from "@/hooks/useCourses";
import { useLecturers } from "@/hooks/useLecturers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Fetch all attendance records across the whole system
function useAllAttendance() {
  return useQuery({
    queryKey: ["all-attendance-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("id, student_id, class_id, attendance_date, status");
      if (error) throw error;
      return (data || []) as {
        id: string;
        student_id: string;
        class_id: string;
        attendance_date: string;
        status: string;
      }[];
    },
  });
}

// Fetch all enrollments
function useAllEnrollments() {
  return useQuery({
    queryKey: ["all-enrollments-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_course_enrollments")
        .select("id, student_id, course_id, class_id, status");
      if (error) throw error;
      return (data || []) as {
        id: string;
        student_id: string;
        course_id: string;
        class_id: string;
        status: string;
      }[];
    },
  });
}

// CSV download helper
function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} downloaded`);
}

export function Reports() {
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: lecturers = [], isLoading: lecturersLoading } = useLecturers();
  const { data: allAttendance = [], isLoading: attendanceLoading } = useAllAttendance();
  const { data: allEnrollments = [] } = useAllEnrollments();

  const isLoading = studentsLoading || classesLoading || coursesLoading || lecturersLoading;

  // --- Derived Stats ---
  const activeStudents = students.filter((s) => s.status === "Active").length;
  const activeClasses = classes.filter((c) => c.status === "Active").length;
  const completedClasses = classes.filter((c) => c.status === "Completed").length;

  const totalPresent = allAttendance.filter((r) => r.status === "Present").length;
  const totalAttendance = allAttendance.length;
  const overallAttendanceRate =
    totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : 0;

  // --- Attendance per class ---
  const attendanceByClass = useMemo(() => {
    const map: Record<string, { present: number; absent: number; late: number; excused: number }> = {};
    allAttendance.forEach((r) => {
      if (!map[r.class_id]) map[r.class_id] = { present: 0, absent: 0, late: 0, excused: 0 };
      if (r.status === "Present") map[r.class_id].present++;
      else if (r.status === "Absent") map[r.class_id].absent++;
      else if (r.status === "Late") map[r.class_id].late++;
      else if (r.status === "Excused") map[r.class_id].excused++;
    });
    return map;
  }, [allAttendance]);

  // --- Enrollment per course ---
  const enrollmentByCourse = useMemo(() => {
    const map: Record<string, number> = {};
    allEnrollments.forEach((e) => {
      map[e.course_id] = (map[e.course_id] || 0) + 1;
    });
    return map;
  }, [allEnrollments]);

  // --- District distribution ---
  const districtMap = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => {
      map[s.district] = (map[s.district] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [students]);

  // --- Exports ---
  const exportAttendanceReport = () => {
    const headers = ["Class Name", "Present", "Absent", "Late", "Excused", "Total", "Attendance %"];
    const rows = classes.map((cls) => {
      const stats = attendanceByClass[cls.id] || { present: 0, absent: 0, late: 0, excused: 0 };
      const total = stats.present + stats.absent + stats.late + stats.excused;
      const pct = total > 0 ? Math.round((stats.present / total) * 100) : 0;
      return [cls.name, String(stats.present), String(stats.absent), String(stats.late), String(stats.excused), String(total), `${pct}%`];
    });
    downloadCSV(`attendance-report-${format(new Date(), "yyyy-MM-dd")}.csv`, headers, rows);
  };

  const exportStudentReport = () => {
    const headers = ["Index No.", "Full Name", "Email", "District", "Status", "Participation", "Program"];
    const rows = students.map((s) => [
      s.index_number, s.full_name, s.email, s.district, s.status,
      s.participation_type || "", s.academic_program || "",
    ]);
    downloadCSV(`student-report-${format(new Date(), "yyyy-MM-dd")}.csv`, headers, rows);
  };

  const exportEnrollmentReport = () => {
    const headers = ["Program Name", "Program Code", "Type", "Enrolled Students"];
    const rows = courses.map((c) => [
      c.name, c.code, c.type, String(enrollmentByCourse[c.id] || 0),
    ]);
    downloadCSV(`enrollment-report-${format(new Date(), "yyyy-MM-dd")}.csv`, headers, rows);
  };

  const exportClassReport = () => {
    const headers = ["Class Name", "District", "Status", "Batch", "Started Date", "Enrollment Count"];
    const rows = classes.map((cls) => {
      const enrolled = allEnrollments.filter((e) => e.class_id === cls.id).length;
      return [
        cls.name, cls.district, cls.status,
        cls.batch_number || "", cls.started_date || "", String(enrolled),
      ];
    });
    downloadCSV(`class-report-${format(new Date(), "yyyy-MM-dd")}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Live analytics and exportable reports for your academic data
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Last updated: {format(new Date(), "MMM d, yyyy h:mm a")}
        </Badge>
      </div>

      {/* Top Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {studentsLoading ? "—" : students.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeStudents} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Academic Programs</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {coursesLoading ? "—" : courses.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Programs registered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {classesLoading ? "—" : classes.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeClasses} active · {completedClasses} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {attendanceLoading ? "—" : `${overallAttendanceRate}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalAttendance} total records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Report per Class */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Attendance Report by Class</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Attendance summary for each class based on all recorded sessions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportAttendanceReport} className="gap-2 shrink-0">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {attendanceLoading || classesLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : classes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No classes found.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Class</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead className="text-center text-green-600">Present</TableHead>
                    <TableHead className="text-center text-red-500">Absent</TableHead>
                    <TableHead className="text-center text-yellow-500">Late</TableHead>
                    <TableHead>Attendance %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => {
                    const stats = attendanceByClass[cls.id] || { present: 0, absent: 0, late: 0, excused: 0 };
                    const total = stats.present + stats.absent + stats.late + stats.excused;
                    const pct = total > 0 ? Math.round((stats.present / total) * 100) : 0;
                    return (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{cls.district}</TableCell>
                        <TableCell className="text-center font-mono text-green-600">{stats.present}</TableCell>
                        <TableCell className="text-center font-mono text-red-500">{stats.absent}</TableCell>
                        <TableCell className="text-center font-mono text-yellow-500">{stats.late}</TableCell>
                        <TableCell>
                          {total > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span
                                className={`text-xs font-semibold w-10 text-right ${
                                  pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"
                                }`}
                              >
                                {pct}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No records</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              cls.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : cls.status === "Completed"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {cls.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment by Program */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Enrollment by Program</CardTitle>
              </div>
              <CardDescription className="mt-1 text-xs">Students enrolled per academic program</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportEnrollmentReport} className="gap-1.5 shrink-0 text-xs">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No programs found.</p>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => {
                  const count = enrollmentByCourse[course.id] || 0;
                  const maxCount = Math.max(...courses.map((c) => enrollmentByCourse[c.id] || 0), 1);
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={course.id} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium truncate max-w-[200px]" title={course.name}>
                          {course.name}
                        </span>
                        <span className="text-muted-foreground font-mono text-xs ml-2 shrink-0">
                          {count} student{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student District Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Students by District</CardTitle>
              </div>
              <CardDescription className="mt-1 text-xs">Top 8 districts by student count</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportStudentReport} className="gap-1.5 shrink-0 text-xs">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
            ) : districtMap.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No students found.</p>
            ) : (
              <div className="space-y-3">
                {districtMap.map(([district, count]) => {
                  const maxCount = districtMap[0][1];
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={district} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{district}</span>
                        <span className="text-muted-foreground font-mono text-xs">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Class Status Overview */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Class Overview Report</CardTitle>
            </div>
            <CardDescription className="mt-1">
              All class batches with enrollment counts
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportClassReport} className="gap-2 shrink-0">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Class</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="text-center">Enrolled</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => {
                    const enrolled = allEnrollments.filter((e) => e.class_id === cls.id).length;
                    return (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{cls.district}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{cls.batch_number || "—"}</TableCell>
                        <TableCell className="text-center font-mono">{enrolled}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {cls.started_date ? format(new Date(cls.started_date), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {cls.status === "Active" ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            ) : cls.status === "Completed" ? (
                              <Clock className="h-3.5 w-3.5 text-blue-500" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            )}
                            <span className="text-sm">{cls.status}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lecturers summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Lecturer Summary</CardTitle>
          </div>
          <CardDescription>Registered lecturers and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {lecturersLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/40 rounded-lg">
                <div className="text-3xl font-bold">{lecturers.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Lecturers</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {lecturers.filter((l) => l.status === "Active").length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Active</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <div className="text-3xl font-bold text-red-500">
                  {lecturers.filter((l) => l.status !== "Active").length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Inactive</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {courses.length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Programs Offered</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
