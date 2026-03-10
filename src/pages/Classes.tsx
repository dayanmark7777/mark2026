import { useState, useEffect } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddClassForm } from '@/components/forms/AddClassForm';
import {
  Search,
  Plus,
  Calendar,
  MapPin,
  Users,
  GraduationCap,
  Edit,
  Trash2,
  Eye,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Class {
  id: string;
  name: string;
  course_id: string;
  program_level: string;
  batch_number: string;
  district: string;
  district_leader_name: string;
  class_center_name: string;
  class_center_address: string;
  class_organizer_name: string;
  contact_number: string;
  status: string;
  is_online: boolean;
  days_of_the_week: string[];
  started_date: string;
  created_at: string;
  courses?: {
    name: string;
    code: string;
  };
}

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  const [viewingClass, setViewingClass] = useState<Class | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          courses!classes_course_id_fkey (
            name,
            code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClass = async () => {
    await fetchClasses();
    setIsDialogOpen(false);
  };

  const handleEditClass = async (formData: any) => {
    if (!editingClass) return;

    try {
      const { data, error } = await supabase
        .from('classes')
        .update(formData)
        .eq('id', editingClass.id)
        .select(`
          *,
          courses!classes_course_id_fkey (
            name,
            code
          )
        `)
        .single();

      if (error) throw error;

      // Update local state
      setClasses(prev => prev.map(c => c.id === editingClass.id ? data : c));
      toast.success('Course updated successfully');
      setIsEditDialogOpen(false);
      setEditingClass(null);
    } catch (error: any) {
      console.error('Error updating class:', error);
      toast.error(error.message || 'Failed to update course');
    }
  };

  const handleDeleteClass = async () => {
    if (!deletingClass) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', deletingClass.id);

      if (error) throw error;

      // Remove from local state
      setClasses(prev => prev.filter(c => c.id !== deletingClass.id));
      toast.success('Course deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingClass(null);
    } catch (error: any) {
      console.error('Error deleting class:', error);
      toast.error(error.message || 'Failed to delete course');
    }
  };

  const openEditDialog = (classItem: Class) => {
    setEditingClass(classItem);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (classItem: Class) => {
    setDeletingClass(classItem);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (classItem: Class) => {
    setViewingClass(classItem);
    setIsViewDialogOpen(true);
  };

  // Filter classes based on search term
  const filteredClasses = classes.filter(classItem => {
    const searchLower = searchTerm.toLowerCase();
    return (
      classItem.name.toLowerCase().includes(searchLower) ||
      classItem.district?.toLowerCase().includes(searchLower) ||
      classItem.class_organizer_name?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.status === 'Active').length;
  const uniqueDistricts = new Set(classes.map(c => c.district)).size;
  const completedClasses = classes.filter(c => c.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage course schedules and locations</p>
        </div>
        <Button size={isMobile ? "sm" : "default"} className="w-full sm:w-auto gap-2 shadow-md hover:shadow-lg transition-all" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Course
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Courses</CardTitle>
            <Calendar className="h-4 w-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalClasses}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">All time</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Active</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600/60" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{activeClasses}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Running</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Districts</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600/60" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{uniqueDistricts}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Locations</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Completed</CardTitle>
            <Users className="h-4 w-4 text-purple-600/60" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{completedClasses}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Course List</CardTitle>
          <CardDescription>
            {filteredClasses.length} {filteredClasses.length === 1 ? 'course' : 'courses'} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary/60" />
              Loading courses...
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg mx-4 sm:mx-0">
              {searchTerm ? 'No courses found matching your search.' : 'No courses yet. Add your first course!'}
            </div>
          ) : !isMobile ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Academic Program</TableHead>
                    <TableHead>Program Level</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.map((classItem) => (
                    <TableRow key={classItem.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold">{classItem.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {classItem.courses
                            ? `${classItem.courses.code} - ${classItem.courses.name}`
                            : 'N/A'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        {classItem.program_level ? (
                          <Badge variant="outline" className="font-medium">{classItem.program_level}</Badge>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>{classItem.district || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={classItem.status === 'Active' ? 'default' : 'secondary'} className={classItem.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                          {classItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => openViewDialog(classItem)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => openEditDialog(classItem)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => openDeleteDialog(classItem)}
                          >
                            <Trash2 className="w-4 h-4" />
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
              {filteredClasses.map((classItem) => (
                <Card key={classItem.id} className="group overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                  <div className={`h-1.5 w-full ${classItem.status === 'Active' ? 'bg-green-500' : 'bg-muted'}`} />
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-bold text-lg leading-tight truncate">
                          {classItem.name}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] font-mono py-0">
                            {classItem.courses?.code || 'NO-CODE'}
                          </Badge>
                          {classItem.program_level && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              {classItem.program_level}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge className={`shrink-0 text-[10px] font-bold uppercase ${classItem.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}`} variant={classItem.status === 'Active' ? 'default' : 'secondary'}>
                        {classItem.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border border-border/30">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">District</p>
                        <p className="text-sm font-semibold truncate">{classItem.district || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Batch</p>
                        <p className="text-sm font-semibold italic">{classItem.batch_number || '-'}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <Button
                        className="flex-1 gap-2 font-bold shadow-sm"
                        size="sm"
                        onClick={() => openViewDialog(classItem)}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => openEditDialog(classItem)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openDeleteDialog(classItem)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
          </DialogHeader>
          <AddClassForm
            onSubmit={handleAddClass}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          {editingClass && (
            <AddClassForm
              initialData={{
                className: editingClass.name,
                courseId: editingClass.course_id,
                programLevel: editingClass.program_level || '',
                districtLeaderName: editingClass.district_leader_name,
                district: editingClass.district,
                classCenterName: editingClass.class_center_name,
                classCenterAddress: editingClass.class_center_address,
                classOrganizerName: editingClass.class_organizer_name,
                contactNumber: editingClass.contact_number,
                classStatus: editingClass.status,
                daysOfTheWeek: editingClass.days_of_the_week || [],
                startedDate: editingClass.started_date,
                batchNumber: editingClass.batch_number,
                isOnline: editingClass.is_online,
              }}
              onSubmit={handleEditClass}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingClass(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
          </DialogHeader>
          {viewingClass && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Course Name</p>
                  <p className="text-sm font-semibold">{viewingClass.name}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Academic Program</p>
                  <p className="text-sm">
                    {viewingClass.courses
                      ? `${viewingClass.courses.code} - ${viewingClass.courses.name}`
                      : 'N/A'
                    }
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Program Level</p>
                  {viewingClass.program_level ? (
                    <Badge variant="outline">{viewingClass.program_level}</Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not set</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={viewingClass.status === 'Active' ? 'default' : 'secondary'}>
                    {viewingClass.status}
                  </Badge>
                </div>

                {viewingClass.batch_number && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Batch Number</p>
                    <p className="text-sm">{viewingClass.batch_number}</p>
                  </div>
                )}

                {!viewingClass.is_online && (
                  <>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">District</p>
                      <p className="text-sm">{viewingClass.district}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">District Leader</p>
                      <p className="text-sm">{viewingClass.district_leader_name}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Course Center</p>
                      <p className="text-sm">{viewingClass.class_center_name}</p>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {viewingClass.is_online ? 'Coordinator' : 'Organizer'}
                  </p>
                  <p className="text-sm">{viewingClass.class_organizer_name}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                  <p className="text-sm">{viewingClass.contact_number}</p>
                </div>
              </div>

              {/* Class Schedule */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Course Schedule</p>
                <div className="bg-muted/50 rounded-md p-3">
                  {viewingClass.days_of_the_week && viewingClass.days_of_the_week.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewingClass.days_of_the_week.map((day) => (
                        <span
                          key={day}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md font-medium"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No schedule specified</p>
                  )}
                </div>
              </div>

              {/* Started Date */}
              {viewingClass.started_date && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Started Date</p>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    {format(new Date(viewingClass.started_date), 'PPP')}
                  </div>
                </div>
              )}

              {/* Class Center Address */}
              {!viewingClass.is_online && viewingClass.class_center_address && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Course Center Address</p>
                  <p className="text-sm">{viewingClass.class_center_address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingClass?.name}</strong>?
              This action cannot be undone and will affect all enrolled students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingClass(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
