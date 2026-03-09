# DBC Academic Management System - Setup Guide

## Quick Start

This is a complete React + TypeScript + Supabase academic management system for the DBC (Disciples' Bible Center).

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free at https://supabase.com)

### Setup Steps

1. **Clone and Install Dependencies**

   ```bash
   npm install
   ```

2. **Create Supabase Project**
   - Go to https://supabase.com and create a new project
   - Note your project URL and anon key

3. **Setup Database Schema**
   - In Supabase Dashboard, go to SQL Editor
   - Copy the SQL content from `DATABASE_SETUP.md`
   - Run it in the SQL editor to create all tables

4. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your-project-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This generates optimized files in the `dist` folder.

## Features

### Pages Implemented

- **Dashboard** - Overview of system statistics and metrics
- **Students** - Manage student records with CRUD operations
- **Academic Programs** - Create and manage courses/programs
- **Classes** - Organize classes and assign courses
- **Lecturers** - Manage lecturer/teacher records
- **Attendance** - Create attendance sessions and manage tracking
- **Student Attendance** - Students mark attendance via unique links
- **Reports** - Generate system reports (expandable)
- **Settings** - Configure system settings

### Key Features

✅ Full CRUD operations for all entities
✅ Real-time data sync with Supabase
✅ Responsive UI with Tailwind CSS
✅ Attendance tracking with unique session links
✅ Modal dialogs for data entry
✅ Toast notifications for user feedback
✅ Mobile-friendly layout
✅ Data tables with sorting and filtering ready

## Project Structure

```
src/
├── pages/                 # Page components
│   ├── Dashboard.tsx
│   ├── Students.tsx
│   ├── AcademicPrograms.tsx
│   ├── Classes.tsx
│   ├── Lecturers.tsx
│   ├── Attendance.tsx
│   ├── StudentAttendance.tsx
│   ├── Reports.tsx
│   ├── Settings.tsx
│   └── NotFound.tsx
├── components/
│   ├── layout/           # Layout components
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
│   ├── useStudents.ts
│   ├── useCourses.ts
│   ├── useClasses.ts
│   ├── useLecturers.ts
│   └── useAttendance.ts
├── integrations/
│   └── supabase/       # Supabase client setup
├── lib/                # Utilities and constants
└── App.tsx             # Main app component
```

## Database Schema

The system includes the following tables:

- **courses** - Academic programs/courses
- **classes** - Class groups for courses
- **students** - Student records
- **lecturers** - Teacher/lecturer records
- **attendance_sessions** - Attendance tracking sessions
- **attendance** - Individual attendance records
- **lecturer_class_assignments** - Teacher-class relationships
- **student_course_enrollments** - Student-course relationships
- **schedules** - Class schedules

See `DATABASE_SETUP.md` for full schema details.

## Common Tasks

### Adding a New Field

1. Add column to database in Supabase
2. Update the TypeScript interface in the hook
3. Add input field to the form component

### Creating a New Page

1. Create page component in `src/pages/`
2. Create hook in `src/hooks/` if needed
3. Add route to `App.tsx`
4. Add navigation item to `Sidebar.tsx`

### Testing Attendance

1. Create an attendance session on the Attendance page
2. Copy the generated link
3. Open in new window/browser
4. Select your name and mark attendance
5. Check attendance records in the Attendance page

## Troubleshooting

### Supabase Connection Issues

- Verify `.env.local` has correct credentials
- Check Supabase dashboard - Database is running
- Check browser console for connection errors

### Data Not Showing

- Verify rows exist in Supabase table
- Check RLS policies allow access (currently set to allow all)
- Verify hooks are correctly fetching data

### Build Errors

- Run `npm install` to ensure dependencies
- Check for TypeScript errors: `npm run lint`

## Next Steps

1. Set up authentication (currently allows all access)
2. Implement data validation and error handling
3. Add photo upload for students/lecturers
4. Create CSV import functionality for bulk student import
5. Add email notifications for attendance
6. Create certificate generation system
7. Add role-based access control (Admin, Lecturer, Student)

## Support

For issues or questions, check:

- Browser console for errors
- Supabase dashboard for database issues
- TypeScript compiler output for type errors

## License

This project is part of the DBC Academic Management System.
