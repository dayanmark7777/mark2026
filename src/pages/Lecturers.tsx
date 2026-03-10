import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO, isToday, isFuture } from "date-fns";
import {
  Users,
  Calendar,
  BookOpen,
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Clock,
  Trash2,
  Edit,
  Eye,
  CalendarDays,
} from "lucide-react";
import {
  useLecturers,
  useDeleteLecturer,
  type Lecturer,
} from "@/hooks/useLecturers";
import {
  useSchedules,
  useDeleteSchedule,
  type Schedule,
} from "@/hooks/useSchedules";
import { AddLecturerForm } from "@/components/forms/AddLecturerForm";
import { ScheduleClassForm } from "@/components/forms/ScheduleClassForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Lecturers() {
  const { data: lecturers = [], isLoading: isLoadingLecturers } =
    useLecturers();
  const { data: schedules = [], isLoading: isLoadingSchedules } =
    useSchedules();
  const deleteLecturer = useDeleteLecturer();
  const deleteSchedule = useDeleteSchedule();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState("lecturers");
  const [searchTerm, setSearchTerm] = useState("");
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState("");

  // Dialog states
  const [isAddLecturerOpen, setIsAddLecturerOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null);
  const [viewingLecturer, setViewingLecturer] = useState<Lecturer | null>(null);

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleLecturerId, setScheduleLecturerId] = useState<string | null>(
    null,
  );
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [viewingSchedule, setViewingSchedule] = useState<Schedule | null>(null);

  const [lecturerToDelete, setLecturerToDelete] = useState<string | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  // Filtered Data
  const filteredLecturers = lecturers.filter(
    (lecturer) =>
      lecturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lecturer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lecturer.subjects &&
        lecturer.subjects.some((s) =>
          s.toLowerCase().includes(searchTerm.toLowerCase()),
        )),
  );

  const activeLecturers = lecturers.filter((l) => l.status === "Active");

  const filteredScheduleLecturers = activeLecturers.filter(
    (lecturer) =>
      lecturer.name.toLowerCase().includes(scheduleSearchTerm.toLowerCase()) ||
      lecturer.email.toLowerCase().includes(scheduleSearchTerm.toLowerCase()),
  );

  const upcomingSchedules = schedules.filter((schedule) => {
    const scheduleDate = parseISO(schedule.scheduled_date);
    return isFuture(scheduleDate) || isToday(scheduleDate);
  });

  // Stats
  const totalSubjects = new Set(lecturers.flatMap((l) => l.subjects || []))
    .size;
  const avgSubjects =
    lecturers.length > 0
      ? Math.round(
        lecturers.reduce((acc, l) => acc + (l.subjects?.length || 0), 0) /
        lecturers.length,
      )
      : 0;

  const todaySchedulesCount = schedules.filter((s) =>
    isToday(parseISO(s.scheduled_date)),
  ).length;

  // Handlers
  const handleEditLecturer = (lecturer: Lecturer) => {
    setEditingLecturer(lecturer);
    setIsAddLecturerOpen(true);
  };

  const handleCreateSchedule = (lecturerId: string) => {
    setScheduleLecturerId(lecturerId);
    setEditingSchedule(null); // Ensure we are creating
    setIsScheduleOpen(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setScheduleLecturerId(schedule.lecturer_id);
    setEditingSchedule(schedule);
    setIsScheduleOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Lecturer Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage lecturers, assignments, and class schedules
          </p>
        </div>
        <Button
          size={isMobile ? "sm" : "default"}
          className="w-full sm:w-auto gap-2 shadow-md hover:shadow-lg transition-all"
          onClick={() => {
            setEditingLecturer(null);
            setIsAddLecturerOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span className={isMobile ? "text-xs" : ""}>Add Lecturer</span>
        </Button>
      </div>

      <Tabs
        defaultValue="lecturers"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="lecturers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Lecturers
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lecturers" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total
                </CardTitle>
                <Users className="h-4 w-4 text-primary/60" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{lecturers.length}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                  {lecturers.filter((l) => l.status === "Active").length} Active
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Active %
                </CardTitle>
                <Users className="h-4 w-4 text-green-600/60" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {lecturers.length > 0
                    ? Math.round(
                      (lecturers.filter((l) => l.status === "Active").length /
                        lecturers.length) *
                      100,
                    )
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Subjects
                </CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600/60" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalSubjects}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Avg Expert
                </CardTitle>
                <BookOpen className="h-4 w-4 text-purple-600/60" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{avgSubjects}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Lecturers Directory</CardTitle>
                  {!isMobile && (
                    <CardDescription>
                      List of all registered lecturers and their expertise
                    </CardDescription>
                  )}
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search lecturers..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {isLoadingLecturers ? (
                <div className="text-center py-12 text-muted-foreground">Loading lecturers...</div>
              ) : filteredLecturers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg mx-4 sm:mx-0">
                  No lecturers found matching your search.
                </div>
              ) : !isMobile ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Lecturer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLecturers.map((lecturer) => (
                        <TableRow key={lecturer.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border">
                                <AvatarFallback className="bg-primary/5 text-primary">
                                  {lecturer.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-semibold">{lecturer.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm text-neutral-600 space-y-0.5">
                              <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                                <Mail className="h-3 w-3" /> {lecturer.email}
                              </span>
                              {lecturer.phone && (
                                <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                                  <Phone className="h-3 w-3" /> {lecturer.phone}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[250px]">
                              {(lecturer.subjects || [])
                                .slice(0, 3)
                                .map((subject, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-[10px] px-2 py-0 h-5"
                                  >
                                    {subject}
                                  </Badge>
                                ))}
                              {(lecturer.subjects || []).length > 3 && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-2 py-0 h-5 border-dashed"
                                >
                                  +{(lecturer.subjects?.length || 0) - 3} more
                                </Badge>
                              )}
                              {(!lecturer.subjects ||
                                lecturer.subjects.length === 0) && (
                                  <span className="text-muted-foreground text-xs italic">
                                    No subjects assigned
                                  </span>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={lecturer.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                              variant={
                                lecturer.status === "Active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {lecturer.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => setViewingLecturer(lecturer)}
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditLecturer(lecturer)}
                                  className="gap-2"
                                >
                                  <Edit className="h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleCreateSchedule(lecturer.id)
                                  }
                                  className="gap-2"
                                >
                                  <CalendarDays className="h-4 w-4" />{" "}
                                  Schedule Class
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive gap-2"
                                  onClick={() =>
                                    setLecturerToDelete(lecturer.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 p-4">
                  {filteredLecturers.map((lecturer) => (
                    <Card key={lecturer.id} className="group overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                      <div className={`h-1.5 w-full ${lecturer.status === 'Active' ? 'bg-green-500' : 'bg-muted'}`} />
                      <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                              <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
                                {lecturer.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5 min-w-0">
                              <h3 className="font-bold text-lg leading-tight truncate">
                                {lecturer.name}
                              </h3>
                              <Badge className={`text-[10px] h-4 font-bold uppercase ${lecturer.status === 'Active' ? 'bg-green-100 text-green-700' : ''}`} variant={lecturer.status === 'Active' ? 'default' : 'secondary'}>
                                {lecturer.status}
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditLecturer(lecturer)}>
                                <Edit className="mr-2 h-4 w-4 text-muted-foreground" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateSchedule(lecturer.id)}>
                                <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> Schedule
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setLecturerToDelete(lecturer.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-1 gap-2 bg-muted/30 p-3 rounded-lg border border-border/30 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{lecturer.email}</span>
                          </div>
                          {lecturer.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{lecturer.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Expertise
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(lecturer.subjects || []).slice(0, 4).map((subject, i) => (
                              <Badge key={i} variant="secondary" className="text-[9px] py-0 px-2 bg-background border">
                                {subject}
                              </Badge>
                            ))}
                            {(lecturer.subjects || []).length > 4 && (
                              <Badge variant="outline" className="text-[9px] py-0 px-2 border-dashed">
                                +{(lecturer.subjects?.length || 0) - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button
                          className="w-full gap-2 font-bold shadow-sm mt-2"
                          size="sm"
                          onClick={() => setViewingLecturer(lecturer)}
                        >
                          <Eye className="w-4 h-4" />
                          View Full Profile
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Available
                </CardTitle>
                <Users className="h-4 w-4 text-primary/60" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {activeLecturers.length}
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Upcoming
                </CardTitle>
                <Calendar className="h-4 w-4 text-green-600/60" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {upcomingSchedules.length}
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Today
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-600/60" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{todaySchedulesCount}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Disciplines
                </CardTitle>
                <BookOpen className="h-4 w-4 text-purple-600/60" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{totalSubjects}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-full">
              <CardHeader>
                <CardTitle>Available Lecturers</CardTitle>
                <div className="pt-2">
                  <Input
                    placeholder="Search lecturers..."
                    value={scheduleSearchTerm}
                    onChange={(e) => setScheduleSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-y-auto">
                  <div className="space-y-4">
                    {filteredScheduleLecturers.map((lecturer) => (
                      <div
                        key={lecturer.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 border"
                      >
                        <div className="space-y-1">
                          <p className="font-medium leading-none">
                            {lecturer.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lecturer.subjects?.length || 0} subjects
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateSchedule(lecturer.id)}
                        >
                          Schedule
                        </Button>
                      </div>
                    ))}
                    {filteredScheduleLecturers.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No active lecturers found
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 overflow-hidden">
              <CardHeader className="pb-4">
                <div>
                  <CardTitle>Upcoming Schedules</CardTitle>
                  {!isMobile && (
                    <CardDescription>
                      Scheduled classes for all lecturers
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoadingSchedules ? (
                  <div className="text-center py-12 text-muted-foreground">Loading schedules...</div>
                ) : upcomingSchedules.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg mx-4 sm:mx-0">
                    No upcoming scheduled classes found.
                  </div>
                ) : !isMobile ? (
                  <div className="overflow-x-auto border rounded-md">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Lecturer</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingSchedules.map((schedule) => (
                          <TableRow key={schedule.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold">
                                  {format(
                                    new Date(schedule.scheduled_date),
                                    "MMM d, yyyy",
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {schedule.start_time.slice(0, 5)} -{" "}
                                  {schedule.end_time.slice(0, 5)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{schedule.classes?.name}</TableCell>
                            <TableCell>{schedule.lecturers?.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                                <MapPin className="h-3.5 w-3.5 text-primary/60" />
                                {schedule.location || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  onClick={() => setViewingSchedule(schedule)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  onClick={() => handleEditSchedule(schedule)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setScheduleToDelete(schedule.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 p-4">
                    {upcomingSchedules.map((schedule) => (
                      <Card key={schedule.id} className="overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                        <div className="h-1 w-full bg-primary/20" />
                        <CardContent className="p-4 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1 min-w-0">
                              <h4 className="font-bold text-base truncate">
                                {schedule.classes?.name || 'Untitled Class'}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(schedule.scheduled_date), "MMM d, yyyy")}
                              </div>
                            </div>
                            <Badge variant="outline" className="shrink-0 text-[10px] bg-primary/5 border-primary/20 text-primary">
                              {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border border-border/30">
                            <div className="space-y-1">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Lecturer</p>
                              <p className="text-sm font-semibold truncate">{schedule.lecturers?.name}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Location</p>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-primary/60" />
                                <span className="text-sm font-semibold truncate">{schedule.location || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 font-bold text-xs"
                              onClick={() => setViewingSchedule(schedule)}
                            >
                              Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => handleEditSchedule(schedule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setScheduleToDelete(schedule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Lecturer Dialog */}
      <Dialog
        open={isAddLecturerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddLecturerOpen(false);
            setEditingLecturer(null);
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[95vh] overflow-y-auto p-0 border-none sm:border-solid">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold">
                {editingLecturer ? "Edit Lecturer" : "Add New Lecturer"}
              </DialogTitle>
              <DialogDescription>
                {editingLecturer
                  ? "Update lecturer details and expertise."
                  : "Enter the details for the new lecturer."}
              </DialogDescription>
            </DialogHeader>
            <AddLecturerForm
              initialData={editingLecturer || undefined}
              onSuccess={() => setIsAddLecturerOpen(false)}
              onCancel={() => setIsAddLecturerOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Class Dialog */}
      <Dialog
        open={isScheduleOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsScheduleOpen(false);
            setScheduleLecturerId(null);
            setEditingSchedule(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? "Edit Schedule" : "Schedule Class"}
            </DialogTitle>
            <DialogDescription>
              Set up a class session for this lecturer.
            </DialogDescription>
          </DialogHeader>
          {scheduleLecturerId && (
            <ScheduleClassForm
              lecturerId={scheduleLecturerId}
              initialData={editingSchedule || undefined}
              onSuccess={() => setIsScheduleOpen(false)}
              onCancel={() => setIsScheduleOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {viewingLecturer && (
        <Dialog
          open={!!viewingLecturer}
          onOpenChange={(open) => !open && setViewingLecturer(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Lecturer Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </p>
                  <p className="text-base">{viewingLecturer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <Badge
                    variant={
                      viewingLecturer.status === "Active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {viewingLecturer.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-base flex items-center gap-2">
                    <Mail className="h-3 w-3" /> {viewingLecturer.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="text-base flex items-center gap-2">
                    <Phone className="h-3 w-3" />{" "}
                    {viewingLecturer.phone || "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Subjects
                </p>
                <div className="flex flex-wrap gap-1">
                  {viewingLecturer.subjects &&
                    viewingLecturer.subjects.length > 0 ? (
                    viewingLecturer.subjects.map((sub, i) => (
                      <Badge key={i} variant="outline">
                        {sub}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No subjects assigned
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setViewingLecturer(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!lecturerToDelete}
        onOpenChange={(open) => !open && setLecturerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              lecturer and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (lecturerToDelete) {
                  deleteLecturer.mutate(lecturerToDelete);
                  setLecturerToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Schedule Confirmation */}
      <AlertDialog
        open={!!scheduleToDelete}
        onOpenChange={(open) => !open && setScheduleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will delete the scheduled
              class.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (scheduleToDelete) {
                  deleteSchedule.mutate(scheduleToDelete);
                  setScheduleToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {viewingSchedule && (
        <Dialog
          open={!!viewingSchedule}
          onOpenChange={(open) => !open && setViewingSchedule(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Class
                  </p>
                  <p className="text-base font-semibold">
                    {viewingSchedule.classes?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Lecturer
                  </p>
                  <p className="text-base font-semibold">
                    {viewingSchedule.lecturers?.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </p>
                  <p className="text-base mt-1">
                    {format(new Date(viewingSchedule.scheduled_date), "PPPP")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time
                  </p>
                  <p className="text-base mt-1">
                    {viewingSchedule.start_time.slice(0, 5)} -{" "}
                    {viewingSchedule.end_time.slice(0, 5)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </p>
                <p className="text-base mt-1">
                  {viewingSchedule.location || "Not specified"}
                </p>
              </div>

              {viewingSchedule.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Notes
                  </p>
                  <p className="text-base mt-1 bg-muted p-3 rounded">
                    {viewingSchedule.notes}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Status
                </p>
                <Badge
                  variant={
                    viewingSchedule.status === "Scheduled"
                      ? "default"
                      : "secondary"
                  }
                >
                  {viewingSchedule.status}
                </Badge>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setViewingSchedule(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (viewingSchedule) {
                      handleEditSchedule(viewingSchedule);
                      setViewingSchedule(null);
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
