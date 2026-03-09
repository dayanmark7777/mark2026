# Student Management System - Architecture & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Students Page Component                   │   │
│  │                   (src/pages/Students.tsx)                   │   │
│  │                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │   Search &   │  │   Filters    │  │  Pagination  │      │   │
│  │  │   Controls   │  │   (6 types)  │  │   Controls   │      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  │                                                               │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │            Student Table Display                     │    │   │
│  │  │  - Index | Name | Email | District | Course | ...   │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  │                                                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │   Add    │  │   View   │  │   Edit   │  │  Delete  │    │   │
│  │  │  Dialog  │  │  Dialog  │  │  Dialog  │  │  Dialog  │    │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │   │
│  │       │             │             │             │            │   │
│  │       └─────────────┴─────────────┴─────────────┘            │   │
│  │                          │                                    │   │
│  │                          ▼                                    │   │
│  │       ┌──────────────────────────────────────┐               │   │
│  │       │      AddStudentForm Component        │               │   │
│  │       │  (src/components/forms/...)          │               │   │
│  │       │                                       │               │   │
│  │       │  ┌─────────────────────────────┐    │               │   │
│  │       │  │  Personal Information       │    │               │   │
│  │       │  │  - Index, NIC, Name, etc.   │    │               │   │
│  │       │  └─────────────────────────────┘    │               │   │
│  │       │  ┌─────────────────────────────┐    │               │   │
│  │       │  │  Contact Information        │    │               │   │
│  │       │  │  - Email, Phone, District   │    │               │   │
│  │       │  └─────────────────────────────┘    │               │   │
│  │       │  ┌─────────────────────────────┐    │               │   │
│  │       │  │  Academic Enrollment        │    │               │   │
│  │       │  │  - Course, Levels, Classes  │    │               │   │
│  │       │  └─────────────────────────────┘    │               │   │
│  │       │  ┌─────────────────────────────┐    │               │   │
│  │       │  │  Additional Options         │    │               │   │
│  │       │  │  - Files, Theology, Type    │    │               │   │
│  │       │  └─────────────────────────────┘    │               │   │
│  │       └──────────────────────────────────────┘               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        STATE MANAGEMENT LAYER                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ useStudents  │  │  useCourses  │  │  useClasses  │              │
│  │              │  │              │  │              │              │
│  │ - Fetch All  │  │ - Fetch All  │  │ - Fetch All  │              │
│  │ - Create     │  │ - Create     │  │ - Create     │              │
│  │ - Update     │  │ - Update     │  │ - Update     │              │
│  │ - Delete     │  │ - Delete     │  │ - Delete     │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
│         └─────────────────┴─────────────────┘                        │
│                           │                                           │
│                           ▼                                           │
│              ┌─────────────────────────┐                             │
│              │   React Query Cache     │                             │
│              │  - Automatic caching    │                             │
│              │  - Invalidation         │                             │
│              │  - Background refetch   │                             │
│              └────────────┬────────────┘                             │
│                           │                                           │
└───────────────────────────┼───────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA ACCESS LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Supabase Client                                 │   │
│  │          (src/integrations/supabase/client.ts)              │   │
│  │                                                               │   │
│  │  - REST API calls                                            │   │
│  │  - Real-time subscriptions (optional)                        │   │
│  │  - Authentication (if enabled)                               │   │
│  └───────────────────────────┬─────────────────────────────────┘   │
│                               │                                       │
└───────────────────────────────┼───────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                      Supabase (PostgreSQL)                           │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   students   │  │   courses    │  │   classes    │              │
│  │              │  │              │  │              │              │
│  │ - id (PK)    │  │ - id (PK)    │  │ - id (PK)    │              │
│  │ - index_no   │  │ - code       │  │ - name       │              │
│  │ - national_id│  │ - name       │  │ - course_id  │              │
│  │ - full_name  │  │ - type       │  │ - district   │              │
│  │ - email      │  │ - levels[]   │  │ - level      │              │
│  │ - district   │  │ - subjects[] │  │ - status     │              │
│  │ - status     │  └──────────────┘  └──────────────┘              │
│  │ - ...        │                                                    │
│  └──────┬───────┘                                                    │
│         │                                                             │
│         │       ┌──────────────────────────────┐                    │
│         └───────│  student_course_enrollments  │                    │
│                 │                               │                    │
│                 │ - id (PK)                     │                    │
│                 │ - student_id (FK)             │                    │
│                 │ - course_id (FK)              │                    │
│                 │ - class_id (FK)               │                    │
│                 │ - enrollment_date             │                    │
│                 │ - status                      │                    │
│                 └───────────────────────────────┘                    │
│                                                                       │
│  Constraints:                                                         │
│  - UNIQUE(students.email)                                            │
│  - UNIQUE(students.index_number)                                     │
│  - UNIQUE(students.national_id)                                      │
│  - CASCADE DELETE on enrollments                                     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Add New Student Flow

```
User Action: Click "Add Student"
    │
    ▼
Open Add Dialog
    │
    ▼
User fills form:
  1. Personal Info
  2. Contact Info
  3. Select District ──────────────┐
    │                               │
    ▼                               ▼
  Filter Courses by District    Fetch Classes
    │                               │
    ▼                               │
  4. Select Course ────────────────┤
    │                               │
    ▼                               ▼
  Show Course Levels            Filter Classes by:
    │                             - Course
    ▼                             - District
  5. Select Levels ───────────────┤ - Levels
    │                               │
    ▼                               ▼
  6. Select Classes (optional)  Show Available Classes
    │
    ▼
  7. Fill Additional Options
    │
    ▼
User clicks "Add Student"
    │
    ▼
Validate Required Fields
    │
    ▼
Async Validate Unique Fields:
  - Email
  - Index Number
  - National ID
    │
    ├─ Duplicate Found ──> Show Error Toast ──> Return to Form
    │
    ▼
Insert Student Record
    │
    ├─ Error ──> Show Error Toast ──> Return to Form
    │
    ▼
Insert Enrollments (if classes selected)
    │
    ├─ Error ──> Show Error Toast ──> Rollback
    │
    ▼
Show Success Toast
    │
    ▼
Close Dialog
    │
    ▼
Invalidate React Query Cache
    │
    ▼
Refresh Student List
```

### 2. Edit Student Flow

```
User Action: Click Edit Icon
    │
    ▼
Load Student Data
    │
    ▼
Open Edit Dialog
    │
    ▼
Pre-populate Form with Student Data
    │
    ▼
User modifies fields
    │
    ▼
User clicks "Update Student"
    │
    ▼
Validate Required Fields
    │
    ▼
Async Validate Unique Fields
(excluding current student)
    │
    ▼
Update Student Record
    │
    ▼
Delete Existing Enrollments
    │
    ▼
Insert New Enrollments
    │
    ▼
Show Success Toast
    │
    ▼
Close Dialog
    │
    ▼
Refresh Student List
```

### 3. Search & Filter Flow

```
User enters search term
    │
    ▼
Select search type:
  - All Fields
  - Index Number
  - Name
  - Email
  - District
    │
    ▼
Apply search filter
    │
    ▼
User selects filters:
  - Status
  - District
  - Course
  - Participation Type
  - Theology Project
    │
    ▼
Combine all filters
    │
    ▼
Filter student array (useMemo)
    │
    ▼
Apply pagination
    │
    ▼
Display filtered results
    │
    ▼
Update pagination controls
```

### 4. Delete Student Flow

```
User Action: Click Delete Icon
    │
    ▼
Open Confirmation Dialog
    │
    ▼
Show student name and warning
    │
    ├─ User clicks "Cancel" ──> Close Dialog
    │
    ▼
User clicks "Delete"
    │
    ▼
Delete Student Record
    │
    ├─ Cascade Delete Enrollments (automatic)
    │
    ├─ Error ──> Show Error Toast
    │
    ▼
Show Success Toast
    │
    ▼
Close Dialog
    │
    ▼
Refresh Student List
```

### 5. Export Flow

```
User Action: Click "Export"
    │
    ▼
Get filtered students
    │
    ▼
Create CSV headers
    │
    ▼
Map students to CSV rows
    │
    ▼
Join course data
    │
    ▼
Format CSV content
    │
    ▼
Create Blob
    │
    ▼
Create download link
    │
    ▼
Trigger download
    │
    ▼
Show Success Toast
```

## Component Hierarchy

```
Students (Page)
│
├── Card (Container)
│   │
│   ├── CardHeader
│   │   ├── CardTitle
│   │   └── CardDescription
│   │
│   └── CardContent
│       │
│       ├── Search Controls
│       │   ├── Select (Search Type)
│       │   └── Input (Search Term)
│       │
│       ├── Filter Controls
│       │   ├── Select (Status)
│       │   ├── Select (District)
│       │   ├── Select (Course)
│       │   ├── Select (Participation)
│       │   ├── Select (Theology)
│       │   └── Button (Reset)
│       │
│       ├── Table
│       │   ├── TableHeader
│       │   └── TableBody
│       │       └── TableRow (for each student)
│       │           ├── TableCell (Index)
│       │           ├── TableCell (Name)
│       │           ├── TableCell (Email)
│       │           ├── TableCell (District)
│       │           ├── TableCell (Course)
│       │           ├── TableCell (Type)
│       │           ├── TableCell (Status)
│       │           └── TableCell (Actions)
│       │               ├── Button (View)
│       │               ├── Button (Edit)
│       │               └── Button (Delete)
│       │
│       └── Pagination Controls
│           ├── Select (Rows per page)
│           ├── Button (Previous)
│           ├── Button[] (Page numbers)
│           └── Button (Next)
│
├── Dialog (Add Student)
│   └── AddStudentForm
│
├── Dialog (Edit Student)
│   └── AddStudentForm (with editingStudent)
│
├── Dialog (View Student)
│   └── AddStudentForm (with isViewMode)
│
└── AlertDialog (Delete Confirmation)
    ├── AlertDialogHeader
    ├── AlertDialogDescription
    └── AlertDialogFooter
        ├── AlertDialogCancel
        └── AlertDialogAction
```

## State Flow

```
Component State (useState)
    │
    ├── isAddDialogOpen: boolean
    ├── isEditDialogOpen: boolean
    ├── isViewDialogOpen: boolean
    ├── isDeleteDialogOpen: boolean
    ├── selectedStudent: Student | null
    ├── studentToDelete: Student | null
    ├── searchTerm: string
    ├── searchType: string
    ├── statusFilter: string
    ├── districtFilter: string
    ├── courseFilter: string
    ├── participationFilter: string
    ├── theologyFilter: string
    ├── currentPage: number
    └── rowsPerPage: number
    │
    ▼
Computed State (useMemo)
    │
    └── filteredStudents: Student[]
        │
        ▼
    paginatedStudents: Student[]
```

## API Call Flow

```
Component Mount
    │
    ▼
useStudents() hook
    │
    ▼
React Query checks cache
    │
    ├─ Cache Hit ──> Return cached data
    │
    ▼
Cache Miss or Stale
    │
    ▼
Fetch from Supabase
    │
    ▼
supabase
  .from("students")
  .select("*")
  .order("created_at", { ascending: false })
    │
    ▼
Return data
    │
    ▼
Update React Query cache
    │
    ▼
Trigger component re-render
```

## Error Handling Flow

```
API Call
    │
    ▼
Try-Catch Block
    │
    ├─ Success ──> Return data
    │
    ▼
Error Occurred
    │
    ├─ Duplicate Key (23505)
    │   ├─ Email ──> "Email already exists"
    │   ├─ Index ──> "Index number already exists"
    │   └─ NIC ──> "National ID already exists"
    │
    ├─ Network Error ──> "Network error occurred"
    │
    └─ Other Error ──> Generic error message
    │
    ▼
Show Toast Notification
    │
    ▼
Log to Console (for debugging)
    │
    ▼
Return to form/page
```

## Performance Optimizations

```
1. React Query Caching
   - Automatic background refetch
   - Stale-while-revalidate
   - Cache invalidation on mutations

2. useMemo for Filtering
   - Prevents unnecessary recalculations
   - Only recomputes when dependencies change

3. Pagination
   - Limits rendered rows
   - Reduces DOM size
   - Improves scroll performance

4. Database Indexes
   - Fast lookups on email, index_number, national_id
   - Optimized joins for enrollments

5. Lazy Loading
   - Courses and classes loaded on demand
   - Only fetch when needed
```

---

**Document Version**: 1.0  
**Last Updated**: February 14, 2026  
**Purpose**: Architecture reference for Student Management System
