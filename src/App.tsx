import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Students } from "@/pages/Students";
import { AcademicPrograms } from "@/pages/AcademicPrograms";
import Classes from "@/pages/Classes";
import { Lecturers } from "@/pages/Lecturers";
import { AttendanceManagement } from "@/pages/AttendanceManagement";
import { StudentAttendance } from "@/pages/StudentAttendance";
import StudentSelfAttendance from "@/pages/StudentSelfAttendance";
import { Reports } from "@/pages/Reports";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/Login";
import { NotFound } from "@/pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Student self-attendance — no layout (no sidebar/header) */}
            <Route
              path="/attendance/self/:scheduleId/:token"
              element={<StudentSelfAttendance />}
            />

            <Route
              path="/login"
              element={!session ? <Login /> : <Navigate to="/" replace />}
            />

            {/* All other pages use the main Layout */}
            <Route
              path="/*"
              element={
                session ? (
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/students" element={<Students />} />
                      <Route path="/courses" element={<AcademicPrograms />} />
                      <Route path="/classes" element={<Classes />} />
                      <Route path="/lecturers" element={<Lecturers />} />
                      <Route
                        path="/attendance"
                        element={<AttendanceManagement />}
                      />
                      <Route
                        path="/attendance/student/:sessionId"
                        element={<StudentAttendance />}
                      />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
