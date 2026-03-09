import { useState } from "react";
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
          <h1 className="text-3xl font-bold tracking-tight">
            Lecturer Management
          </h1>
          <p className="text-muted-foreground">
            Manage lecturers, assignments, and class schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingLecturer(null);
              setIsAddLecturerOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Lecturer
          </Button>
        </div>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Lecturers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lecturers.length}</div>
                <p className="text-xs text-muted-foreground">
                  {lecturers.filter((l) => l.status === "Active").length} Active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Rate
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Unique Subjects
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSubjects}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Subjects/Lecturer
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgSubjects}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lecturers Directory</CardTitle>
                  <CardDescription>
                    List of all registered lecturers and their expertise
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search lecturers..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lecturer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingLecturers ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          Loading lecturers...
                        </TableCell>
                      </TableRow>
                    ) : filteredLecturers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center h-24 text-muted-foreground"
                        >
                          No lecturers found matching your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLecturers.map((lecturer) => (
                        <TableRow key={lecturer.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback>
                                  {lecturer.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{lecturer.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm text-neutral-600">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {lecturer.email}
                              </span>
                              {lecturer.phone && (
                                <span className="flex items-center gap-1">
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
                                    className="text-[10px] px-1 py-0 h-5"
                                  >
                                    {subject}
                                  </Badge>
                                ))}
                              {(lecturer.subjects || []).length > 3 && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 h-5"
                                >
                                  +{(lecturer.subjects?.length || 0) - 3} more
                                </Badge>
                              )}
                              {(!lecturer.subjects ||
                                lecturer.subjects.length === 0) && (
                                <span className="text-muted-foreground text-sm">
                                  -
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
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
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => setViewingLecturer(lecturer)}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditLecturer(lecturer)}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleCreateSchedule(lecturer.id)
                                  }
                                >
                                  <CalendarDays className="mr-2 h-4 w-4" />{" "}
                                  Schedule Class
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    setLecturerToDelete(lecturer.id)
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Lecturers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activeLecturers.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming Classes
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {upcomingSchedules.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today's Classes
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todaySchedulesCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Subjects
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSubjects}</div>
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

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Upcoming Schedules</CardTitle>
                <CardDescription>
                  Scheduled classes for all lecturers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Lecturer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSchedules ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          Loading schedules...
                        </TableCell>
                      </TableRow>
                    ) : upcomingSchedules.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center h-24 text-muted-foreground"
                        >
                          No upcoming scheduled classes found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      upcomingSchedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
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
                          <TableCell>{schedule.classes?.name}</TableCell>
                          <TableCell>{schedule.lecturers?.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {schedule.location || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setViewingSchedule(schedule)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditSchedule(schedule)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => setScheduleToDelete(schedule.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
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

      {/* View Details Dialog */}
      <Dialog
        open={!!viewingLecturer}
        onOpenChange={(open) => !open && setViewingLecturer(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lecturer Details</DialogTitle>
          </DialogHeader>
          {viewingLecturer && (
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
          )}
        </DialogContent>
      </Dialog>

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

      {/* Schedule Details Dialog */}
      <Dialog
        open={!!viewingSchedule}
        onOpenChange={(open) => {
          if (!open) {
            setViewingSchedule(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Details</DialogTitle>
          </DialogHeader>
          {viewingSchedule && (
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
                    handleEditSchedule(viewingSchedule);
                    setViewingSchedule(null);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
