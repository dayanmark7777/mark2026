import { useState } from "react";
import {
  useAttendanceSessions,
  useCreateAttendanceSession,
  useUpdateAttendanceSession,
} from "@/hooks/useAttendance";
import { useClasses } from "@/hooks/useClasses";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Copy } from "lucide-react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import type { AttendanceSession } from "@/hooks/useAttendance";

export function Attendance() {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { data: sessions = [], isLoading } = useAttendanceSessions();
  const { data: classes = [] } = useClasses();
  const createSession = useCreateAttendanceSession();
  const updateSession = useUpdateAttendanceSession();
  const [sessionDate, setSessionDate] = useState<Date | undefined>(new Date());

  const { register, handleSubmit, reset, watch } = useForm<
    Partial<AttendanceSession>
  >({});

  const onSubmit = async (data: Partial<AttendanceSession>) => {
    if (!data.class_id) {
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 4); // 4 hours expiry

    // Initial creation with placeholder
    const newSession = await createSession.mutateAsync({
      ...data,
      session_date: sessionDate ? format(sessionDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      unique_link: "placeholder",
      link_expires_at: expiresAt.toISOString(),
      is_active: true,
    } as Omit<AttendanceSession, "id" | "created_at" | "updated_at">);

    if (newSession) {
      // Update with actual link containing the ID
      const uniqueLink = `${window.location.origin}/attendance/student/${newSession.id}`;
      await updateSession.mutateAsync({
        id: newSession.id,
        unique_link: uniqueLink
      });
    }

    reset();
    setOpen(false);
  };

  const copyLink = (link: string, sessionId: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Attendance Management
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Attendance Session</DialogTitle>
              <DialogDescription>
                Create a new attendance session for a class
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="class_id">Class</Label>
                  <Select
                    defaultValue={watch("class_id") || ""}
                    onValueChange={(value) =>
                      register("class_id").onChange({
                        target: { value },
                      })
                    }
                  >
                    <SelectTrigger id="class_id">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="session_date" className="block mb-2">Session Date</Label>
                  <DatePicker
                    date={sessionDate}
                    setDate={setSessionDate}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    {...register("subject")}
                    placeholder="e.g., Theology 101"
                  />
                </div>
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    {...register("start_time", { required: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    {...register("end_time", { required: true })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createSession.isPending}>
                  Create Session
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter((s) => s.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter((s) => !s.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Sessions</CardTitle>
          <CardDescription>Manage attendance tracking sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sessions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {format(new Date(session.session_date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>{session.subject || "-"}</TableCell>
                      <TableCell className="text-sm">
                        {session.start_time} - {session.end_time}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${session.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {session.is_active ? "Active" : "Expired"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {session.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyLink(session.unique_link, session.id)
                            }
                            className="gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            {copiedId === session.id ? "Copied!" : "Copy"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
