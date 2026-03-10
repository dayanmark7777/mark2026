import { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  type Course
} from "@/hooks/useCourses";
import { AddCourseForm } from "@/components/AddCourseForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  SortAsc,
  BookOpen,
  Clock,
  Users,
  Edit2,
  Trash2,
  Eye,
  GraduationCap,
  Star,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Tag
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function AcademicPrograms() {
  // --- State ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy] = useState<"name" | "code" | "type" | "created_at">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [editingCourse, setEditingCourse] = useState<Course | undefined>(undefined);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  // --- Data & Hooks ---
  const { data: courses = [], isLoading } = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const isMobile = useIsMobile();

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const basic = courses.filter(c => c.type === "Basic").length;
    const intermediate = courses.filter(c => c.type === "Intermediate").length;
    const advanced = courses.filter(c => c.type === "Advanced").length;
    return {
      total: courses.length,
      basic,
      intermediate,
      advanced,
      subtitle: `${basic} Basic, ${intermediate} Intermediate, ${advanced} Advanced`
    };
  }, [courses]);

  // --- Filtering & Sorting ---
  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    // Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.code.toLowerCase().includes(lowerSearch) ||
        c.type.toLowerCase().includes(lowerSearch)
      );
    }

    if (typeFilter && typeFilter !== "all") {
      result = result.filter(c => c.type === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "code":
          comparison = a.code.localeCompare(b.code);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [courses, searchTerm, typeFilter, sortBy, sortOrder]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredAndSortedCourses.length / itemsPerPage);
  const paginatedCourses = filteredAndSortedCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- Handlers ---
  const handleSortToggle = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  };

  const handleAddEditSubmit = async (data: Partial<Course>) => {
    try {
      if (editingCourse) {
        await updateCourse.mutateAsync({ ...data, id: editingCourse.id });
        toast.success("Program updated successfully");
      } else {
        await createCourse.mutateAsync(data as any);
        toast.success("Program created successfully");
      }
      setIsDialogOpen(false);
      setEditingCourse(undefined);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (deletingCourse) {
      await deleteCourse.mutateAsync(deletingCourse.id);
      setIsDeleteDialogOpen(false);
      setDeletingCourse(null);
    }
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setIsDialogOpen(true);
  };

  const openViewDialog = (course: Course) => {
    setViewingCourse(course);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (course: Course) => {
    setDeletingCourse(course);
    setIsDeleteDialogOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Basic": return <Star className="h-4 w-4 text-gray-800 dark:text-gray-300" />;
      case "Intermediate": return <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case "Advanced": return <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 pb-10">
      {/* 3. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Academic Programs</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage DBC academic programs and curriculum</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingCourse(undefined);
        }}>
          <DialogTrigger asChild>
            <Button size={isMobile ? "sm" : "default"} className="w-full sm:w-auto gap-2 shadow-md hover:shadow-lg transition-all">
              <Plus className="h-4 w-4" />
              <span className={isMobile ? "text-xs" : ""}>Add Program</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-y-auto p-0">
            <div className="p-6">
              <AddCourseForm
                onSubmit={handleAddEditSubmit}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingCourse(undefined);
                }}
                initialData={editingCourse}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 5. Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground mt-1">{stats.subtitle}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Basic</CardTitle>
            <Clock className="h-4 w-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.basic}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Foundation level</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Intermediate</CardTitle>
            <Users className="h-4 w-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.intermediate}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Mid-level</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Advanced</CardTitle>
            <BookOpen className="h-4 w-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.advanced}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Advanced level</p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10" onClick={handleSortToggle}>
                  <SortAsc className={`h-4 w-4 transition-transform duration-200 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sort {sortOrder === 'asc' ? 'Ascending' : 'Descending'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Select
            value={typeFilter}
            onValueChange={(val) => {
              setTypeFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 7. Content - Mobile Cards & Desktop Table */}
      {isLoading ? (
        <div className="text-center py-12">Loading programs...</div>
      ) : filteredAndSortedCourses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          No programs match your search criteria
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
            {paginatedCourses.map((course) => (
              <Card key={course.id} className="group overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                <div className={`h-1.5 w-full ${course.type === 'Advanced' ? 'bg-purple-500' : course.type === 'Intermediate' ? 'bg-amber-500' : 'bg-primary'}`} />
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-lg font-bold truncate pr-2">
                        {course.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] py-0">{course.code}</Badge>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                          <Clock className="h-3 w-3" /> {course.duration}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg group-hover:scale-110 transition-transform">
                      {getTypeIcon(course.type)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-3">
                    {course.levels && course.levels.length > 0 && (
                      <div className="bg-muted/30 p-2 rounded-lg border border-border/30">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Sample Subjects
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {course.levels[0].subjects.slice(0, 3).map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-[9px] py-0 px-1.5 bg-background border">{s.name}</Badge>
                          ))}
                          {course.levels[0].subjects.length > 3 && (
                            <span className="text-[9px] text-muted-foreground font-semibold px-1">+{course.levels[0].subjects.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button variant="default" size="sm" className="flex-1 font-bold shadow-sm" onClick={() => openViewDialog(course)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openEditDialog(course)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteDialog(course)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block border rounded-md overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px]">Program Code</TableHead>
                  <TableHead className="w-[300px]">Program Name</TableHead>
                  <TableHead className="w-[150px]">Duration</TableHead>
                  <TableHead>Levels & Subjects</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCourses.map((course) => (
                  <TableRow key={course.id} className="group hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openViewDialog(course)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(course.type)}
                        <span className="font-mono text-xs">{course.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold">{course.name}</div>
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(course.created_at), "MMM d, yyyy")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {course.duration}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {course.levels?.slice(0, 2).map((level, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-xs w-16 truncate">{level.name}:</span>
                            <div className="flex gap-1 flex-wrap">
                              {level.subjects.slice(0, 3).map((sub, j) => (
                                <Badge key={j} variant="outline" className="text-[10px] px-1 py-0 h-5 border-gray-300">
                                  {sub.name}
                                </Badge>
                              ))}
                              {level.subjects.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">+{level.subjects.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openViewDialog(course)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-green-600" onClick={() => openEditDialog(course)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Program</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => openDeleteDialog(course)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Program</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* 8. Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6 font-semibold">
          <div className="text-xs text-muted-foreground w-full sm:w-auto text-center sm:text-left">
            Page {currentPage} of {totalPages}
            <span className="hidden sm:inline"> ({filteredAndSortedCourses.length} programs)</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 mx-1">
              {(() => {
                const maxPagesToShow = isMobile ? 3 : 5;
                const pages = [];
                if (totalPages <= maxPagesToShow) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
                    for (let i = 1; i <= maxPagesToShow; i++) pages.push(i);
                  } else if (currentPage >= totalPages - Math.floor(maxPagesToShow / 2)) {
                    for (let i = totalPages - (maxPagesToShow - 1); i <= totalPages; i++) pages.push(i);
                  } else {
                    for (let i = currentPage - Math.floor(maxPagesToShow / 2); i <= currentPage + Math.floor(maxPagesToShow / 2); i++) pages.push(i);
                  }
                }

                return pages.map(p => (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </Button>
                ));
              })()}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 10. View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[700px] max-h-[80vh] overflow-y-auto w-full">
          {viewingCourse && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-full border shadow-sm">
                      {getTypeIcon(viewingCourse.type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{viewingCourse.name}</h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono bg-background border rounded px-1">{viewingCourse.code}</span>
                        <span>• Created {format(new Date(viewingCourse.created_at), "PPP")}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={viewingCourse.levels?.some(l => l.subjects.length > 0) && viewingCourse.description ? "default" : "outline"} className={viewingCourse.levels?.some(l => l.subjects.length > 0) ? "bg-green-100 text-green-800 border-green-200" : ""}>
                    {viewingCourse.levels?.some(l => l.subjects.length > 0) && viewingCourse.description ? "Complete" : "Draft"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-md">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Program Type</h4>
                  <div className="font-medium">{viewingCourse.type}</div>
                </div>
                <div className="p-3 border rounded-md">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Duration</h4>
                  <div className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {viewingCourse.duration}
                  </div>
                </div>
              </div>

              {viewingCourse.description && (
                <div className="bg-muted/20 p-4 rounded-md border text-sm">
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Description
                  </h4>
                  <p className="text-muted-foreground">{viewingCourse.description}</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold border-b pb-2 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" /> Curriculum Structure
                </h3>
                <div className="grid gap-4">
                  {viewingCourse.levels && viewingCourse.levels.length > 0 ? viewingCourse.levels.map((level, i) => (
                    <Card key={i} className="border-l-4 border-l-primary/20">
                      <CardHeader className="py-3 px-4 pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{level.name}</Badge>
                        </div>
                        {level.description && (
                          <CardDescription className="italic text-xs mt-1">{level.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="py-3 px-4">
                        <h5 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
                          <Tag className="h-3 w-3" /> SUBJECTS
                        </h5>
                        {level.subjects.length > 0 ? (
                          <ol className="list-decimal list-inside text-sm space-y-1">
                            {level.subjects.map((sub, j) => (
                              <li key={j} className="text-foreground/90 hover:text-primary transition-colors">
                                {sub.name}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No subjects listed</p>
                        )}
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      No curriculum details available
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t text-xs text-muted-foreground">
                <div>Last updated: {format(new Date(viewingCourse.updated_at), "PP")}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsViewDialogOpen(false);
                    openEditDialog(viewingCourse);
                  }}>
                    Edit Program
                  </Button>
                  <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 11. Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Academic Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{deletingCourse?.name}</span>?
              This action cannot be undone and will affect all related classes and student records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCourse(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
