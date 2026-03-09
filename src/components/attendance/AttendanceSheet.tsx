import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Play, Square, Search, CheckCircle2, Copy, Send, Link as LinkIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
    useClassStudents,
    useScheduleAttendance,
    useStartAttendance,
    useStopAttendance,
    useSaveAttendance,
} from '@/hooks/useScheduleAttendance';
import type { Schedule } from '@/hooks/useScheduleAttendance';

interface AttendanceSheetProps {
    schedule: Schedule;
    open: boolean;
    onClose: () => void;
}

interface AttendanceStatus {
    student_id: string;
    status: string;
    notes: string;
}

export function AttendanceSheet({ schedule: initialSchedule, open, onClose }: AttendanceSheetProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
    // Live schedule state — updated after start/stop
    const [schedule, setSchedule] = useState<Schedule>(initialSchedule);

    const { data: students = [], isLoading: loadingStudents } = useClassStudents(schedule.class_id);
    const { data: existingAttendance = [] } = useScheduleAttendance(schedule.id);
    const startAttendance = useStartAttendance();
    const stopAttendance = useStopAttendance();
    const saveAttendance = useSaveAttendance();

    const isActive = schedule.attendance_active;
    const hasToken = !!schedule.attendance_token;

    const selfAttendanceLink = hasToken
        ? `${window.location.origin}/attendance/self/${schedule.id}/${schedule.attendance_token}`
        : null;

    // Sync when parent schedule changes (e.g. re-opened)
    useEffect(() => {
        setSchedule(initialSchedule);
    }, [initialSchedule]);

    // Initialize attendance map from existing records or default to Present
    useEffect(() => {
        const initialMap: Record<string, AttendanceStatus> = {};
        students.forEach((student) => {
            const existing = existingAttendance.find((a) => a.student_id === student.id);
            initialMap[student.id] = {
                student_id: student.id,
                status: existing?.status || 'Present',
                notes: existing?.notes || '',
            };
        });
        setAttendanceMap(initialMap);
    }, [students, existingAttendance]);

    const handleStartSession = () => {
        startAttendance.mutate(schedule.id, {
            onSuccess: async () => {
                // Refresh schedule from DB to get the new token
                const { data: fresh } = await supabase
                    .from('schedules')
                    .select('*, classes:class_id(name), lecturers:lecturer_id(name)')
                    .eq('id', schedule.id)
                    .single();
                if (fresh) {
                    setSchedule({
                        ...fresh,
                        class_name: (fresh as any).classes?.name,
                        lecturer_name: (fresh as any).lecturers?.name,
                    } as Schedule);
                }
            },
        });
    };

    const handleStopSession = () => {
        stopAttendance.mutate(schedule.id, {
            onSuccess: async () => {
                setSchedule((prev) => ({ ...prev, attendance_active: false }));
            },
        });
    };

    const handleCopyLink = () => {
        if (!selfAttendanceLink) return;
        navigator.clipboard.writeText(selfAttendanceLink);
        toast.success('Attendance link copied!');
    };

    const handleSendWhatsApp = () => {
        if (!selfAttendanceLink) return;
        const message = `Please mark your attendance for ${schedule.class_name}:\n${selfAttendanceLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleStatusChange = (studentId: string, status: string) => {
        setAttendanceMap((prev) => ({
            ...prev,
            [studentId]: { ...prev[studentId], status },
        }));
    };

    const handleNotesChange = (studentId: string, notes: string) => {
        setAttendanceMap((prev) => ({
            ...prev,
            [studentId]: { ...prev[studentId], notes },
        }));
    };

    const handleMarkAllPresent = () => {
        const newMap: Record<string, AttendanceStatus> = {};
        students.forEach((student) => {
            newMap[student.id] = {
                student_id: student.id,
                status: 'Present',
                notes: attendanceMap[student.id]?.notes || '',
            };
        });
        setAttendanceMap(newMap);
        toast.success('All students marked as present');
    };

    const handleSave = () => {
        const records = Object.values(attendanceMap);
        if (records.length === 0) {
            toast.error('No students to save attendance for');
            return;
        }
        saveAttendance.mutate(
            {
                scheduleId: schedule.id,
                classId: schedule.class_id,
                attendanceDate: schedule.scheduled_date,
                records,
                markedBy: 'Lecturer',
            },
            { onSuccess: () => onClose() }
        );
    };

    const filteredStudents = students.filter(
        (student) =>
            student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.index_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const statusColors: Record<string, string> = {
        Present: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
        Absent: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
        Late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        Excused: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    };

    const stats = {
        total: students.length,
        present: Object.values(attendanceMap).filter((a) => a.status === 'Present').length,
        absent: Object.values(attendanceMap).filter((a) => a.status === 'Absent').length,
        late: Object.values(attendanceMap).filter((a) => a.status === 'Late').length,
        excused: Object.values(attendanceMap).filter((a) => a.status === 'Excused').length,
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col gap-0 p-0">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <DialogTitle className="text-xl font-bold">{schedule.class_name}</DialogTitle>
                            <DialogDescription className="mt-1">
                                {schedule.lecturer_name} &nbsp;•&nbsp;{' '}
                                {format(new Date(schedule.scheduled_date + 'T00:00:00'), 'MMMM d, yyyy')} &nbsp;•&nbsp;{' '}
                                {schedule.start_time} – {schedule.end_time}
                                {schedule.location && <> &nbsp;•&nbsp; {schedule.location}</>}
                            </DialogDescription>
                        </div>
                        {isActive && (
                            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                Live
                            </span>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-4">
                    {/* Session Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                            {!isActive ? (
                                <Button
                                    onClick={handleStartSession}
                                    disabled={startAttendance.isPending}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Play className="h-4 w-4 mr-1.5" />
                                    {startAttendance.isPending ? 'Starting…' : 'Start Self-Attendance'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleStopSession}
                                    disabled={stopAttendance.isPending}
                                    size="sm"
                                    variant="destructive"
                                >
                                    <Square className="h-4 w-4 mr-1.5" />
                                    {stopAttendance.isPending ? 'Stopping…' : 'Stop Session'}
                                </Button>
                            )}

                            <Button
                                onClick={handleMarkAllPresent}
                                size="sm"
                                variant="outline"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                Mark All Present
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-60">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or index…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    {/* Self-Attendance Link Banner */}
                    {selfAttendanceLink && (
                        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <LinkIcon className="h-4 w-4 text-green-600 shrink-0" />
                                <span className="text-xs font-mono text-green-800 dark:text-green-300 truncate">
                                    {selfAttendanceLink}
                                </span>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button size="sm" variant="outline" onClick={handleCopyLink} className="h-7 text-xs">
                                    <Copy className="h-3 w-3 mr-1" /> Copy
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleSendWhatsApp} className="h-7 text-xs">
                                    <Send className="h-3 w-3 mr-1" /> WhatsApp
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-5 gap-2">
                        {[
                            { label: 'Total', value: stats.total, cls: 'bg-muted text-foreground' },
                            { label: 'Present', value: stats.present, cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
                            { label: 'Absent', value: stats.absent, cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
                            { label: 'Late', value: stats.late, cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
                            { label: 'Excused', value: stats.excused, cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
                        ].map(({ label, value, cls }) => (
                            <div key={label} className={`rounded-lg p-2.5 text-center ${cls}`}>
                                <div className="text-xl font-bold">{value}</div>
                                <div className="text-[10px] font-medium opacity-80">{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Attendance Table */}
                    <div className="border rounded-lg flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10 border-b">
                                <TableRow>
                                    <TableHead className="w-10">#</TableHead>
                                    <TableHead className="w-32">Index No.</TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead className="w-36">Status</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingStudents ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            Loading students…
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            {students.length === 0
                                                ? 'No students enrolled in this class'
                                                : 'No students match your search'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student, index) => {
                                        const current = attendanceMap[student.id];
                                        const rowColor =
                                            current?.status === 'Present'
                                                ? 'bg-green-50/40 dark:bg-green-950/10'
                                                : current?.status === 'Absent'
                                                    ? 'bg-red-50/40 dark:bg-red-950/10'
                                                    : current?.status === 'Late'
                                                        ? 'bg-yellow-50/40 dark:bg-yellow-950/10'
                                                        : '';

                                        return (
                                            <TableRow key={student.id} className={rowColor}>
                                                <TableCell className="text-muted-foreground text-sm">{index + 1}</TableCell>
                                                <TableCell className="font-mono text-sm">{student.index_number}</TableCell>
                                                <TableCell className="font-medium">{student.full_name}</TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={current?.status || 'Present'}
                                                        onValueChange={(value) => handleStatusChange(student.id, value)}
                                                    >
                                                        <SelectTrigger className="h-8 w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {['Present', 'Absent', 'Late', 'Excused'].map((s) => (
                                                                <SelectItem key={s} value={s}>
                                                                    <Badge className={`${statusColors[s]} border-0`}>{s}</Badge>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        placeholder="Add notes…"
                                                        value={current?.notes || ''}
                                                        onChange={(e) => handleNotesChange(student.id, e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-end px-6 py-4 border-t bg-muted/30">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saveAttendance.isPending || students.length === 0}
                    >
                        {saveAttendance.isPending ? 'Saving…' : `Save Attendance (${stats.total} students)`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
