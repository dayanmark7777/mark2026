import { useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  GraduationCap,
  Users,
  BookOpen,
  Mic2,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useCourses } from "@/hooks/useCourses";
import { useLecturers } from "@/hooks/useLecturers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fetch recent students (last 5)
function useRecentStudents() {
  return useQuery({
    queryKey: ["recent-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, district, academic_program, created_at, status")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });
}

// All-system attendance summary
function useAttendanceSummary() {
  return useQuery({
    queryKey: ["dashboard-attendance-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("status");
      if (error) throw error;
      const records = data || [];
      const total = records.length;
      const present = records.filter((r) => r.status === "Present").length;
      const absent = records.filter((r) => r.status === "Absent").length;
      const late = records.filter((r) => r.status === "Late").length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      return { total, present, absent, late, rate };
    },
  });
}

// Today's active attendance sessions
function useTodaySessions() {
  return useQuery({
    queryKey: ["dashboard-today-sessions"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select("id, class_id, session_date, is_active")
        .eq("session_date", today);
      if (error) throw error;
      return data || [];
    },
  });
}

export function Dashboard() {
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: lecturers = [], isLoading: lecturersLoading } = useLecturers();
  const { data: recentStudents = [], isLoading: recentLoading } = useRecentStudents();
  const { data: attendance, isLoading: attendanceLoading } = useAttendanceSummary();
  const { data: todaySessions = [] } = useTodaySessions();

  // Derived counts
  const activeStudents = students.filter((s) => s.status === "Active").length;
  const activeClasses = classes.filter((c) => c.status === "Active").length;
  const completedClasses = classes.filter((c) => c.status === "Completed").length;
  const activeLecturers = lecturers.filter((l) => l.status === "Active").length;
  const activeSessions = todaySessions.filter((s) => s.is_active).length;

  // Class status breakdown for donut-style display
  const classStatusData = useMemo(() => [
    { label: "Active", count: classes.filter((c) => c.status === "Active").length, color: "bg-green-500", text: "text-green-600" },
    { label: "Completed", count: classes.filter((c) => c.status === "Completed").length, color: "bg-blue-500", text: "text-blue-600" },
    { label: "Cancelled", count: classes.filter((c) => c.status === "Cancelled").length, color: "bg-red-400", text: "text-red-500" },
  ], [classes]);

  const statCards = [
    {
      title: "Total Students",
      value: studentsLoading ? "—" : students.length.toLocaleString(),
      sub: studentsLoading ? "" : `${activeStudents} active`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Academic Programs",
      value: coursesLoading ? "—" : courses.length.toLocaleString(),
      sub: coursesLoading ? "" : `${courses.length} registered`,
      icon: GraduationCap,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: "Total Classes",
      value: classesLoading ? "—" : classes.length.toLocaleString(),
      sub: classesLoading ? "" : `${activeClasses} active · ${completedClasses} done`,
      icon: BookOpen,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: "Attendance Rate",
      value: attendanceLoading ? "—" : `${attendance?.rate ?? 0}%`,
      sub: attendanceLoading ? "" : `${(attendance?.total ?? 0).toLocaleString()} total records`,
      icon: TrendingUp,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")} · Welcome back
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`h-8 w-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Today's Attendance</CardTitle>
            </div>
            <CardDescription className="text-xs">
              {format(new Date(), "MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Active Sessions</span>
              <span className={`font-bold text-lg ${activeSessions > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                {activeSessions}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Sessions Today</span>
              <span className="font-bold text-lg">{todaySessions.length}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Overall Rate</span>
              <span className={`font-bold text-lg ${
                (attendance?.rate ?? 0) >= 80
                  ? "text-green-600"
                  : (attendance?.rate ?? 0) >= 50
                  ? "text-yellow-600"
                  : "text-red-500"
              }`}>
                {attendanceLoading ? "—" : `${attendance?.rate ?? 0}%`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Attendance Breakdown</CardTitle>
            </div>
            <CardDescription className="text-xs">All-time totals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Present", value: attendance?.present ?? 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-950" },
              { label: "Absent", value: attendance?.absent ?? 0, icon: XCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-950" },
              { label: "Late", value: attendance?.late ?? 0, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-950" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className={`text-sm font-bold ${item.color}`}>
                      {attendanceLoading ? "—" : item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    {!attendanceLoading && (attendance?.total ?? 0) > 0 && (
                      <div
                        className={`h-full rounded-full ${
                          item.label === "Present" ? "bg-green-500"
                            : item.label === "Absent" ? "bg-red-400" : "bg-yellow-400"
                        }`}
                        style={{ width: `${Math.round((item.value / (attendance?.total ?? 1)) * 100)}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Class Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Class Status</CardTitle>
            </div>
            <CardDescription className="text-xs">Current breakdown of all classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {classesLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : (
              <>
                {classStatusData.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{
                            width: classes.length > 0
                              ? `${Math.round((item.count / classes.length) * 100)}%`
                              : "0%",
                          }}
                        />
                      </div>
                      <span className={`text-sm font-bold w-6 text-right ${item.text}`}>
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
                  <span>Total Classes</span>
                  <span className="font-bold text-foreground">{classes.length}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recently Added Students */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recently Added Students</CardTitle>
            <CardDescription>Latest 5 students registered in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
            ) : recentStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No students added yet.</p>
            ) : (
              <div className="space-y-4">
                {recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {student.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {student.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {student.district}
                        {student.academic_program ? ` · ${student.academic_program}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        student.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {student.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(student.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>Key numbers at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {[
              {
                label: "Active Students",
                value: studentsLoading ? "—" : activeStudents,
                icon: Users,
                color: "text-blue-500",
              },
              {
                label: "Active Classes",
                value: classesLoading ? "—" : activeClasses,
                icon: BookOpen,
                color: "text-green-500",
              },
              {
                label: "Active Lecturers",
                value: lecturersLoading ? "—" : activeLecturers,
                icon: Mic2,
                color: "text-purple-500",
              },
              {
                label: "Total Programs",
                value: coursesLoading ? "—" : courses.length,
                icon: GraduationCap,
                color: "text-orange-500",
              },
            ].map((item, idx, arr) => (
              <div
                key={item.label}
                className={`flex items-center justify-between py-3 ${
                  idx < arr.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="font-bold text-lg">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
