import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
    BookOpen,
    Clock,
    FileText,
    GraduationCap,
    Plus,
    X,
    Trash2,
    Check
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import type { Subject, Course } from "@/hooks/useCourses";

export interface AddCourseFormProps {
    onSubmit: (data: Partial<Course>) => void;
    onCancel: () => void;
    initialData?: Course;
}

export function AddCourseForm({ onSubmit, onCancel, initialData }: AddCourseFormProps) {
    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<Partial<Course>>({
        defaultValues: initialData || {
            levels: []
        }
    });

    const { fields: levels, append: appendLevel, remove: removeLevel } = useFieldArray({
        control,
        name: "levels" as any
    });

    const [addingSubjectToLevel, setAddingSubjectToLevel] = useState<number | null>(null);
    const [newSubjectName, setNewSubjectName] = useState("");

    const handleAddSubject = (levelIndex: number) => {
        if (!newSubjectName.trim()) return;

        const currentLevels = watch("levels") || [];
        const updatedLevels = [...currentLevels];

        if (!updatedLevels[levelIndex].subjects) {
            updatedLevels[levelIndex].subjects = [];
        }

        // Prevent duplicates
        if (updatedLevels[levelIndex].subjects.some((s: Subject) => s.name === newSubjectName)) {
            return;
        }

        updatedLevels[levelIndex].subjects.push({
            name: newSubjectName,
            description: "" // Subject description is effectively empty string as per UI only showing name input for addition
        });

        setValue("levels", updatedLevels);
        setNewSubjectName("");
        setAddingSubjectToLevel(null);
    };

    const removeSubject = (levelIndex: number, subjectIndex: number) => {
        const currentLevels = watch("levels") || [];
        const updatedLevels = [...currentLevels];
        updatedLevels[levelIndex].subjects.splice(subjectIndex, 1);
        setValue("levels", updatedLevels);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">
                        {initialData ? "Edit Program" : "Create New Program"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {initialData ? "Update program details and curriculum" : "Define program details and curriculum"}
                    </p>
                </div>
            </div>

            {/* Program Information */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-medium">
                    <BookOpen className="h-4 w-4" />
                    <h3>Program Information</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="code">Program Code <span className="text-destructive">*</span></Label>
                        <Input
                            id="code"
                            {...register("code", { required: "Program code is required" })}
                            placeholder="e.g. BS101"
                        />
                        {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Program Type <span className="text-destructive">*</span></Label>
                        <select
                            id="type"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...register("type", { required: "Program type is required" })}
                            defaultValue={initialData?.type || "Basic"}
                        >
                            <option value="Basic">Basic</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                        {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">Program Name <span className="text-destructive">*</span></Label>
                    <Input
                        id="name"
                        {...register("name", { required: "Program name is required" })}
                        placeholder="e.g. Bachelor of Science in Theology"
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="duration">Duration <span className="text-destructive">*</span></Label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="duration"
                            className="pl-9"
                            {...register("duration", { required: "Duration is required" })}
                            placeholder="e.g. 4 Years"
                        />
                    </div>
                    {errors.duration && <p className="text-xs text-destructive">{errors.duration.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                            id="description"
                            className="pl-9 min-h-[100px]"
                            {...register("description")}
                            placeholder="Brief description of the program outcomes..."
                        />
                    </div>
                </div>
            </div>

            {/* Program Levels */}
            <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <GraduationCap className="h-4 w-4" />
                        <h3>Program Levels & Curriculum</h3>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendLevel({ name: "", description: "", subjects: [] })}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Level
                    </Button>
                </div>

                {levels.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center text-muted-foreground">
                        <GraduationCap className="h-10 w-10 mb-2 opacity-50" />
                        <p>No academic levels added yet.</p>
                        <Button
                            type="button"
                            variant="link"
                            onClick={() => appendLevel({ name: "", description: "", subjects: [] })}
                        >
                            Add your first level
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {levels.map((field, levelIndex) => (
                            <Card key={field.id} className="border-l-4 border-l-gray-800">
                                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4 space-y-0">
                                    <div className="grid gap-4 md:grid-cols-2 w-full">
                                        <div className="space-y-2">
                                            <Label>Level Name</Label>
                                            <Input
                                                {...register(`levels.${levelIndex}.name` as const, { required: true })}
                                                placeholder="e.g. Year 1, Certificate Level"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Level Description</Label>
                                            <Input
                                                {...register(`levels.${levelIndex}.description` as const)}
                                                placeholder="Optional description"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={() => removeLevel(levelIndex)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Subjects</Label>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-muted/50 rounded-lg p-4">
                                            {/* Subject List */}
                                            {(watch(`levels.${levelIndex}.subjects`) || []).length > 0 ? (
                                                <ol className="list-decimal list-inside space-y-2 mb-4">
                                                    {(watch(`levels.${levelIndex}.subjects`) || []).map((subject: Subject, subjectIndex: number) => (
                                                        <li key={subjectIndex} className="group relative pl-2 hover:bg-background rounded p-1 transition-colors flex items-center justify-between text-sm">
                                                            <span>{subject.name}</span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => removeSubject(levelIndex, subjectIndex)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </li>
                                                    ))}
                                                </ol>
                                            ) : (
                                                <div className="border border-dashed rounded p-4 text-center text-sm text-muted-foreground mb-4">
                                                    No subjects added to this level
                                                </div>
                                            )}

                                            {/* Add Subject Control */}
                                            {addingSubjectToLevel === levelIndex ? (
                                                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                                    <Input
                                                        autoFocus
                                                        placeholder="Type subject name..."
                                                        value={newSubjectName}
                                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddSubject(levelIndex);
                                                            }
                                                            if (e.key === 'Escape') {
                                                                setAddingSubjectToLevel(null);
                                                                setNewSubjectName("");
                                                            }
                                                        }}
                                                        className="h-9"
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleAddSubject(levelIndex)}
                                                        disabled={!newSubjectName.trim()}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setAddingSubjectToLevel(null);
                                                            setNewSubjectName("");
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full border-dashed text-muted-foreground hover:text-foreground"
                                                    onClick={() => setAddingSubjectToLevel(levelIndex)}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" /> Add Subject
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 md:flex-none"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="flex-1 md:flex-none md:ml-auto"
                >
                    {initialData ? "Save Changes" : "Create Program"}
                </Button>
            </div>
        </form>
    );
}
