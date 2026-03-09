export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type CourseLevel = {
    name: string
    description: string
    subjects: string[]
}

export interface Database {
    public: {
        Tables: {
            courses: {
                Row: {
                    id: string
                    code: string
                    name: string
                    type: string
                    duration: string
                    description: string | null
                    levels: Json | null // CourseLevel[]
                    subjects: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    code: string
                    name: string
                    type: string
                    duration: string
                    description?: string | null
                    levels?: Json | null
                    subjects?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    code?: string
                    name?: string
                    type?: string
                    duration?: string
                    description?: string | null
                    levels?: Json | null
                    subjects?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
            }
            classes: {
                Row: {
                    id: string
                    name: string
                    course_id: string
                    program_level: string | null
                    batch_number: string | null
                    district: string
                    district_leader_name: string
                    class_center_name: string
                    class_center_address: string
                    class_organizer_name: string
                    contact_number: string
                    is_online: boolean
                    status: string
                    days_of_the_week: string[]
                    started_date: string | null
                    subject_timeline: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    course_id: string
                    program_level?: string | null
                    batch_number?: string | null
                    district: string
                    district_leader_name: string
                    class_center_name: string
                    class_center_address: string
                    class_organizer_name: string
                    contact_number: string
                    is_online?: boolean
                    status: string
                    days_of_the_week?: string[]
                    started_date?: string | null
                    subject_timeline?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    course_id?: string
                    program_level?: string | null
                    batch_number?: string | null
                    district?: string
                    district_leader_name?: string
                    class_center_name?: string
                    class_center_address?: string
                    class_organizer_name?: string
                    contact_number?: string
                    is_online?: boolean
                    status?: string
                    days_of_the_week?: string[]
                    started_date?: string | null
                    subject_timeline?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            students: {
                Row: {
                    id: string
                    index_number: string
                    national_id: string
                    personal_number: string | null
                    full_name: string
                    email: string
                    whatsapp_number: string
                    district: string
                    address: string | null
                    participation_type: string | null
                    status: string
                    systematic_theology_project: boolean
                    personal_file_url: string | null
                    academic_program: string | null
                    selected_levels: Json | null
                    selected_subjects: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    index_number: string
                    national_id: string
                    personal_number?: string | null
                    full_name: string
                    email: string
                    whatsapp_number: string
                    district: string
                    address?: string | null
                    participation_type?: string | null
                    status?: string
                    systematic_theology_project?: boolean
                    personal_file_url?: string | null
                    academic_program?: string | null
                    selected_levels?: Json | null
                    selected_subjects?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    index_number?: string
                    national_id?: string
                    personal_number?: string | null
                    full_name?: string
                    email?: string
                    whatsapp_number?: string
                    district?: string
                    address?: string | null
                    participation_type?: string | null
                    status?: string
                    systematic_theology_project?: boolean
                    personal_file_url?: string | null
                    academic_program?: string | null
                    selected_levels?: Json | null
                    selected_subjects?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            student_course_enrollments: {
                Row: {
                    id: string
                    student_id: string
                    course_id: string
                    class_id: string | null
                    enrollment_date: string
                    completion_date: string | null
                    status: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    course_id: string
                    class_id?: string | null
                    enrollment_date?: string
                    completion_date?: string | null
                    status?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    course_id?: string
                    class_id?: string | null
                    enrollment_date?: string
                    completion_date?: string | null
                    status?: string
                }
            }
            lecturers: {
                Row: {
                    id: string
                    name: string
                    email: string
                    phone: string | null
                    subjects: string[] | null
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email: string
                    phone?: string | null
                    subjects?: string[] | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string
                    phone?: string | null
                    subjects?: string[] | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            lecturer_class_assignments: {
                Row: {
                    id: string
                    lecturer_id: string
                    class_id: string
                    assigned_date: string
                    schedule_info: Json | null
                    status: string
                }
                Insert: {
                    id?: string
                    lecturer_id: string
                    class_id: string
                    assigned_date?: string
                    schedule_info?: Json | null
                    status?: string
                }
                Update: {
                    id?: string
                    lecturer_id?: string
                    class_id?: string
                    assigned_date?: string
                    schedule_info?: Json | null
                    status?: string
                }
            }
            schedules: {
                Row: {
                    id: string
                    class_id: string
                    lecturer_id: string
                    scheduled_date: string
                    start_time: string
                    end_time: string
                    location: string | null
                    notes: string | null
                    status: string
                    attendance_token: string | null
                    attendance_expires_at: string | null
                    attendance_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    class_id: string
                    lecturer_id: string
                    scheduled_date: string
                    start_time: string
                    end_time: string
                    location?: string | null
                    notes?: string | null
                    status?: string
                    attendance_token?: string | null
                    attendance_expires_at?: string | null
                    attendance_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    class_id?: string
                    lecturer_id?: string
                    scheduled_date?: string
                    start_time?: string
                    end_time?: string
                    location?: string | null
                    notes?: string | null
                    status?: string
                    attendance_token?: string | null
                    attendance_expires_at?: string | null
                    attendance_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            attendance_sessions: {
                Row: {
                    id: string
                    class_id: string
                    session_date: string
                    start_time: string
                    end_time: string
                    subject: string | null
                    unique_link: string
                    link_expires_at: string
                    is_active: boolean
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    class_id: string
                    session_date: string
                    start_time: string
                    end_time: string
                    subject?: string | null
                    unique_link: string
                    link_expires_at: string
                    is_active?: boolean
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    class_id?: string
                    session_date?: string
                    start_time?: string
                    end_time?: string
                    subject?: string | null
                    unique_link?: string
                    link_expires_at?: string
                    is_active?: boolean
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            attendance: {
                Row: {
                    id: string
                    student_id: string
                    class_id: string
                    schedule_id: string | null
                    attendance_date: string
                    status: string
                    notes: string | null
                    marked_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    class_id: string
                    schedule_id?: string | null
                    attendance_date: string
                    status?: string
                    notes?: string | null
                    marked_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    class_id?: string
                    schedule_id?: string | null
                    attendance_date?: string
                    status?: string
                    notes?: string | null
                    marked_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
