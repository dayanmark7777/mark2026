import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Calendar as CalendarIcon,
    GraduationCap,
    Users,
    Building,
    MapPin,
    Phone,
    Wifi,
    CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { DISTRICTS_FOR_CLASSES, DAYS_OF_WEEK } from '@/lib/constants';
import { DistrictSelect } from '@/components/DistrictSelect';
import { useLecturers } from '@/hooks/useLecturers';
import { DatePicker } from '@/components/ui/date-picker';
import { BookOpen } from 'lucide-react';

interface Course {
    id: string;
    name: string;
    code: string;
    levels: Level[];
    subjects: string[];
}

interface Level {
    name: string;
    subjects: string[];
}

interface AddClassFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    initialData?: {
        className?: string;
        courseId?: string;
        programLevel?: string;
        districtLeaderName?: string;
        district?: string;
        classCenterName?: string;
        classCenterAddress?: string;
        classOrganizerName?: string;
        contactNumber?: string;
        classStatus?: string;
        daysOfTheWeek?: string[];
        startedDate?: string;
        batchNumber?: string;
        isOnline?: boolean;
        subjectTimeline?: Record<string, any>;
    };
}

export function AddClassForm({ onSubmit, onCancel, initialData }: AddClassFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        batch_number: '',
        course_id: '',
        program_level: '',
        district_leader_name: '',
        district: '',
        class_center_name: '',
        class_center_address: '',
        class_organizer_name: '',
        contact_number: '',
        status: 'Active',
        is_online: false,
        is_hybrid: false,
        days_of_the_week: [] as string[],
        started_date: null as Date | null,
    });

    const { data: lecturers = [] } = useLecturers();
    const [subjectTimeline, setSubjectTimeline] = useState<Record<string, any>>({});

    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [availableLevels, setAvailableLevels] = useState<Level[]>([]);
    const [selectedLevelSubjects, setSelectedLevelSubjects] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);

    // Fetch courses on mount
    useEffect(() => {
        const fetchCourses = async () => {
            setIsLoadingCourses(true);
            try {
                const { data, error } = await supabase
                    .from('courses')
                    .select('id, name, code, levels, subjects')
                    .order('name');

                if (error) throw error;
                setCourses(data || []);
            } catch (error) {
                console.error('Error fetching courses:', error);
                toast.error('Failed to load courses');
            } finally {
                setIsLoadingCourses(false);
            }
        };

        fetchCourses();
    }, []);

    // Handle course selection changes
    useEffect(() => {
        if (formData.course_id && courses.length > 0) {
            const course = courses.find(c => c.id === formData.course_id);
            setSelectedCourse(course || null);
            setAvailableLevels(course?.levels || []);

            // If editing and we have a program level, load its subjects
            if (initialData && formData.program_level && course?.levels) {
                const level = course.levels.find((l: Level) => l.name === formData.program_level);
                setSelectedLevelSubjects(level?.subjects || []);
            }
        } else {
            setSelectedCourse(null);
            setAvailableLevels([]);
            setSelectedLevelSubjects([]);
        }
    }, [formData.course_id, courses.length]);

    // Handle program level changes
    useEffect(() => {
        if (formData.program_level && selectedCourse?.levels) {
            const level = selectedCourse.levels.find((l: Level) => l.name === formData.program_level);
            setSelectedLevelSubjects(level?.subjects || []);
        } else {
            setSelectedLevelSubjects([]);
        }
    }, [formData.program_level, selectedCourse]);

    // Populate form with initial data
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.className || '',
                batch_number: initialData.batchNumber || '',
                course_id: initialData.courseId || '',
                program_level: initialData.programLevel || '',
                district_leader_name: initialData.districtLeaderName || '',
                district: initialData.district || '',
                class_center_name: initialData.classCenterName || '',
                class_center_address: initialData.classCenterAddress || '',
                class_organizer_name: initialData.classOrganizerName || '',
                contact_number: initialData.contactNumber || '',
                status: initialData.classStatus || 'Active',
                is_online: initialData.isOnline || false,
                is_hybrid: false,
                days_of_the_week: initialData.daysOfTheWeek || [],
                started_date: initialData.startedDate ? new Date(initialData.startedDate) : null,
            });
            if (initialData.subjectTimeline) {
                setSubjectTimeline(initialData.subjectTimeline);
            }
        }
    }, [initialData]);

    const handleInputChange = (field: string, value: any) => {
        // Reset program level when course changes
        if (field === 'course_id') {
            setFormData(prev => ({ ...prev, [field]: value, program_level: '' }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleDayToggle = (day: string) => {
        setFormData(prev => ({
            ...prev,
            days_of_the_week: prev.days_of_the_week.includes(day)
                ? prev.days_of_the_week.filter(d => d !== day)
                : [...prev.days_of_the_week, day]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error('Course name is required');
            return;
        }
        if (!formData.course_id) {
            toast.error('Academic program is required');
            return;
        }
        if (!formData.program_level) {
            toast.error('Program level is required');
            return;
        }
        if (formData.days_of_the_week.length === 0) {
            toast.error('Please select at least one day for the course schedule');
            return;
        }
        if (!formData.district_leader_name.trim()) {
            toast.error(formData.is_online ? 'Course Coordinator name is required' : 'District Leader name is required');
            return;
        }

        if (!formData.is_online && !formData.is_hybrid) {
            if (!formData.district) {
                toast.error('District is required');
                return;
            }
            if (!formData.class_center_name.trim()) {
                toast.error('Course center name is required');
                return;
            }
            if (!formData.class_center_address.trim()) {
                toast.error('Course center address is required');
                return;
            }
        }
        if (!formData.class_organizer_name.trim()) {
            toast.error('Organizer name is required');
            return;
        }
        if (!formData.contact_number.trim()) {
            toast.error('Contact number is required');
            return;
        }
        if (!formData.status) {
            toast.error('Course status is required');
            return;
        }

        setIsLoading(true);

        try {
            if (!initialData) {
                // Create mode - insert directly
                const { data, error } = await supabase
                    .from('classes')
                    .insert([{
                        ...formData,
                        subject_timeline: subjectTimeline
                    }])
                    .select()
                    .single();

                if (error) throw error;
                toast.success('Course created successfully');
                onSubmit(data);
            } else {
                // Edit mode - parent handles update
                onSubmit({ ...formData, subject_timeline: subjectTimeline });
            }
        } catch (error: any) {
            console.error('Error saving class:', error);
            toast.error(error.message || 'Failed to save course');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hero Section */}
            <div className="flex flex-col items-center text-center space-y-2 pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">
                        {initialData ? 'Update Course Information' : 'Create New Course'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {initialData ? 'Modify the course details below' : 'Fill in the details to create a new course'}
                    </p>
                </div>
            </div>

            {/* Course Information Section */}
            <div className="space-y-4 border rounded-lg p-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold">Course Information</h4>
                </div>

                {/* Course Name */}
                <div className="space-y-2">
                    <Label htmlFor="className">Course Name *</Label>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="className"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter course name"
                            className="pl-9"
                            required
                        />
                    </div>
                </div>

                {/* Batch Number */}
                <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch Number</Label>
                    <Input
                        id="batchNumber"
                        value={formData.batch_number}
                        onChange={(e) => handleInputChange('batch_number', e.target.value)}
                        placeholder="Enter batch number (optional)"
                    />
                </div>

                {/* Academic Program */}
                <div className="space-y-2">
                    <Label htmlFor="courseId">Academic Program *</Label>
                    <Select
                        value={formData.course_id}
                        onValueChange={(value) => handleInputChange('course_id', value)}
                        disabled={isLoadingCourses}
                    >
                        <SelectTrigger id="courseId">
                            <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select academic program"} />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.code} - {course.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Program Level */}
                {selectedCourse && availableLevels.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="programLevel">Program Level *</Label>
                        <Select
                            value={formData.program_level}
                            onValueChange={(value) => handleInputChange('program_level', value)}
                        >
                            <SelectTrigger id="programLevel">
                                <SelectValue placeholder="Select program level" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableLevels.map((level: Level) => (
                                    <SelectItem key={level.name} value={level.name}>
                                        {level.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}


                {/* Level Subjects */}
                {selectedLevelSubjects.length > 0 && (
                    <div className="space-y-2">
                        <Label>Level Subjects</Label>
                        <div className="bg-muted/50 rounded-md p-3 space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {selectedLevelSubjects.map((subject: any, index: number) => (
                                    <span
                                        key={index}
                                        className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md font-medium"
                                    >
                                        {typeof subject === 'string' ? subject : subject.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Detailed Subject Information */}
                {selectedLevelSubjects.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold text-sm">Subject Details & Timeline</h4>
                        </div>

                        <div className="space-y-4">
                            {selectedLevelSubjects.map((subject: any, index: number) => {
                                const subjectName = typeof subject === 'string' ? subject : subject.name;
                                const details = subjectTimeline[subjectName] || { status: 'Vacant' };

                                return (
                                    <div key={index} className="p-4 border rounded-md bg-muted/10 space-y-3">
                                        <div className="font-medium text-sm flex items-center justify-between">
                                            <span>{subjectName}</span>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-muted-foreground mr-1">Status:</Label>
                                                <Select
                                                    value={details.status}
                                                    onValueChange={(val) => setSubjectTimeline(prev => ({
                                                        ...prev,
                                                        [subjectName]: { ...prev[subjectName], status: val }
                                                    }))}
                                                >
                                                    <SelectTrigger className="h-7 w-[110px] text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Vacant">Vacant</SelectItem>
                                                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                                                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                                                        <SelectItem value="Completed">Completed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Lecturer</Label>
                                                <Select
                                                    value={details.lecturerId || "unassigned"}
                                                    onValueChange={(val) => setSubjectTimeline(prev => ({
                                                        ...prev,
                                                        [subjectName]: { ...prev[subjectName], lecturerId: val === "unassigned" ? null : val }
                                                    }))}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Select Lecturer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                                        {lecturers.map((l: any) => (
                                                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                                                    <DatePicker
                                                        date={details.startDate ? new Date(details.startDate) : undefined}
                                                        setDate={(date) => setSubjectTimeline(prev => ({
                                                            ...prev,
                                                            [subjectName]: { ...prev[subjectName], startDate: date }
                                                        }))}
                                                        className="h-8 text-xs font-normal"
                                                        placeholder="Start date"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Finish Date</Label>
                                                    <DatePicker
                                                        date={details.endDate ? new Date(details.endDate) : undefined}
                                                        setDate={(date) => setSubjectTimeline(prev => ({
                                                            ...prev,
                                                            [subjectName]: { ...prev[subjectName], endDate: date }
                                                        }))}
                                                        className="h-8 text-xs font-normal"
                                                        placeholder="End date"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}


                <div className="space-y-2">
                    <Label>Course Started Date</Label>
                    <DatePicker
                        date={formData.started_date || undefined}
                        setDate={(date) => handleInputChange('started_date', date)}
                        placeholder="Select start date"
                    />
                </div>

                {/* Course Schedule */}
                <div className="space-y-2">
                    <Label>Course Schedule *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {DAYS_OF_WEEK.map((day) => (
                            <div key={day} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`day-${day}`}
                                    checked={formData.days_of_the_week.includes(day)}
                                    onCheckedChange={() => handleDayToggle(day)}
                                />
                                <Label
                                    htmlFor={`day-${day}`}
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    {day}
                                </Label>
                            </div>
                        ))}
                    </div>
                    {formData.days_of_the_week.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                            Selected: {formData.days_of_the_week.join(', ')}
                        </p>
                    )}
                </div>

                {/* Online Class Toggle */}
                <div className="flex items-center justify-between space-x-2 p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-primary" />
                        <Label htmlFor="isOnline" className="cursor-pointer">Online Course only</Label>
                    </div>
                    <Switch
                        id="isOnline"
                        checked={formData.is_online}
                        onCheckedChange={(checked) => {
                            handleInputChange('is_online', checked);
                            if (checked) {
                                handleInputChange('is_hybrid', false);
                            }
                        }}
                    />
                </div>

                {/* Hybrid Mode Toggle */}
                <div className="flex items-center justify-between space-x-2 p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-primary" />
                        <Label htmlFor="isHybrid" className="cursor-pointer">Physical class and Online class</Label>
                    </div>
                    <Switch
                        id="isHybrid"
                        checked={formData.is_hybrid}
                        onCheckedChange={(checked) => {
                            handleInputChange('is_hybrid', checked);
                            if (checked) {
                                handleInputChange('is_online', false);
                            }
                        }}
                    />
                </div>

                {/* District Leader / Course Coordinator Name */}
                <div className="space-y-2">
                    <Label htmlFor="districtLeaderName">
                        {formData.is_online ? 'Course Coordinator Name *' : 'District Leader Name *'}
                    </Label>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="districtLeaderName"
                            value={formData.district_leader_name}
                            onChange={(e) => handleInputChange('district_leader_name', e.target.value)}
                            placeholder={formData.is_online ? "Enter course coordinator name" : "Enter district leader name"}
                            className="pl-9"
                            required
                        />
                    </div>
                </div>

                {/* District (only for offline or hybrid) */}
                {(!formData.is_online || formData.is_hybrid) && (
                    <DistrictSelect
                        value={formData.district}
                        onValueChange={(value) => handleInputChange('district', value)}
                        districts={DISTRICTS_FOR_CLASSES}
                        label="District"
                        required
                    />
                )}

                {/* Course Center Name (only for offline or hybrid) */}
                {(!formData.is_online || formData.is_hybrid) && (
                    <div className="space-y-2">
                        <Label htmlFor="classCenterName">Course Center Name *</Label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="classCenterName"
                                value={formData.class_center_name}
                                onChange={(e) => handleInputChange('class_center_name', e.target.value)}
                                placeholder="Enter course center name"
                                className="pl-9"
                                required={!formData.is_online}
                            />
                        </div>
                    </div>
                )}

                {/* Course Center Address (only for offline or hybrid) */}
                {(!formData.is_online || formData.is_hybrid) && (
                    <div className="space-y-2">
                        <Label htmlFor="classCenterAddress">Course Center Address *</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="classCenterAddress"
                                value={formData.class_center_address}
                                onChange={(e) => handleInputChange('class_center_address', e.target.value)}
                                placeholder="Enter course center address"
                                className="pl-9"
                                required={!formData.is_online}
                            />
                        </div>
                    </div>
                )}

                {/* Organizer Name */}
                <div className="space-y-2">
                    <Label htmlFor="classOrganizerName">Organizer Name *</Label>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="classOrganizerName"
                            value={formData.class_organizer_name}
                            onChange={(e) => handleInputChange('class_organizer_name', e.target.value)}
                            placeholder="Enter organizer name"
                            className="pl-9"
                            required
                        />
                    </div>
                </div>

                {/* Contact Number */}
                <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number *</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="contactNumber"
                            value={formData.contact_number}
                            onChange={(e) => handleInputChange('contact_number', e.target.value)}
                            placeholder="Enter contact number"
                            className="pl-9"
                            required
                        />
                    </div>
                </div>

                {/* Course Status */}
                <div className="space-y-2">
                    <Label htmlFor="classStatus">Course Status *</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange('status', value)}
                    >
                        <SelectTrigger id="classStatus">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading || isLoadingCourses}
                >
                    {isLoading ? (
                        initialData ? 'Updating...' : 'Creating...'
                    ) : (
                        initialData ? 'Update Course' : 'Create Course'
                    )}
                </Button>
            </div>
        </form>
    );
}
