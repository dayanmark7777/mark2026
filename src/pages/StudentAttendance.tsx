import { useParams, useNavigate } from "react-router-dom";
import { useAttendanceSession, useMarkAttendance } from "@/hooks/useAttendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { AlertCircle, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function StudentAttendance() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [indexNumber, setIndexNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [hasMarked, setHasMarked] = useState(false);
  const [duplicateMark, setDuplicateMark] = useState(false);

  const { data: session, isLoading: isLoadingSession } =
    useAttendanceSession(sessionId);
  const markAttendance = useMarkAttendance();

  const handleVerifyStudent = async () => {
    if (!indexNumber.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("index_number", indexNumber.trim())
        .single();

      if (error || !data) {
        toast.error("Student not found with this Index Number");
        setStudentName(null);
        return;
      }

      setStudentName(data.full_name);
      return data;
    } catch (error) {
      console.error(error);
      toast.error("Error verifying student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!session || !sessionId) return;

    // Verify student first if not already verified
    let studentData = null;
    if (!studentName) {
      studentData = await handleVerifyStudent();
      if (!studentData) return;
    } else {
      // Fetch ID again if we only have name (though normally we'd store the whole object, keeping it simple)
      const { data } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("index_number", indexNumber.trim())
        .single();
      studentData = data;
    }

    if (!studentData) return;

    setIsSubmitting(true);
    setDuplicateMark(false);
    try {
      await markAttendance.mutateAsync(
        {
          student_id: studentData.id,
          class_id: session.class_id,
          attendance_date: new Date().toISOString().split("T")[0],
          status: "Present",
          marked_by: "Student",
          schedule_id: sessionId,
        },
        {
          onSuccess: () => {
            setHasMarked(true);
          },
          onError: (error) => {
            // Check for duplicate attendance error
            if (
              error?.code === "23505" ||
              error?.message?.includes("duplicate key value") ||
              error?.message?.toLowerCase().includes("unique") ||
              error?.message?.toLowerCase().includes("already marked")
            ) {
              setDuplicateMark(true);
            }
          },
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Session Not Found</CardTitle>
            <CardDescription>
              This attendance session does not exist or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired =
    !session.is_active || new Date(session.link_expires_at) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
            <CardTitle>Session Expired</CardTitle>
            <CardDescription>
              The attendance marking period for this session has ended.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-primary">
              {session.subject || "Class Attendance"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {(session.classes as any)?.name}
            </CardDescription>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
              <span>{new Date(session.session_date).toLocaleDateString()}</span>
              <span>•</span>
              <span>
                {session.start_time} - {session.end_time}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {duplicateMark && (
              <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg p-4 text-center mb-4">
                <strong>Attendance has already been recorded.</strong>
              </div>
            )}
            {hasMarked && !duplicateMark ? (
              <div className="bg-green-100 border border-green-300 text-green-800 rounded-lg p-4 text-center mb-4">
                <strong>Attendance marked successfully!</strong>
                <br />
                Thank you, {studentName} ({indexNumber})
              </div>
            ) : !studentName ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Enter Your Index Number
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. ST/2024/001"
                      value={indexNumber}
                      onChange={(e) => setIndexNumber(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleVerifyStudent()
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={handleVerifyStudent}
                  disabled={!indexNumber.trim() || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Verifying..." : "Verify Identity"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm text-green-800 font-medium">
                    Identity Verified
                  </p>
                  <p className="text-lg font-bold text-green-900 mt-1">
                    {studentName}
                  </p>
                  <p className="text-xs text-green-700 mt-1">{indexNumber}</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStudentName(null);
                      setIndexNumber("");
                    }}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Not you?
                  </Button>
                  <Button
                    onClick={handleMarkAttendance}
                    disabled={isSubmitting}
                    className="flex-[2] bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? "Marking..." : "Confirm Attendance"}
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-xs text-muted-foreground"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
