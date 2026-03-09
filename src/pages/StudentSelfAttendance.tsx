import { useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSelfMarkAttendance } from "@/hooks/useScheduleAttendance";

export default function StudentSelfAttendance() {
  const { scheduleId, token } = useParams<{
    scheduleId: string;
    token: string;
  }>();
  const [indexNumber, setIndexNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    studentName?: string;
  } | null>(null);

  const selfMarkAttendance = useSelfMarkAttendance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!indexNumber.trim()) {
      setResult({
        success: false,
        message: "Please enter your index number",
      });
      return;
    }

    if (!scheduleId || !token) {
      setResult({
        success: false,
        message: "Invalid attendance link",
      });
      return;
    }

    selfMarkAttendance.mutate(
      {
        scheduleId,
        token,
        indexNumber: indexNumber.trim(),
      },
      {
        onSuccess: (data) => {
          setSubmitted(true);
          setResult({
            success: true,
            message: "Attendance marked successfully!",
            studentName: data.student_name,
          });
        },
        onError: (error) => {
          setSubmitted(true);
          let msg = (error as Error).message;
          if (
            msg.toLowerCase().includes("already marked") ||
            msg.toLowerCase().includes("duplicate") ||
            msg.toLowerCase().includes("unique")
          ) {
            msg = "Attendance has already been recorded";
          }
          setResult({
            success: false,
            message: msg,
          });
        },
      },
    );
  };

  if (submitted && result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {result.success ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                      Success!
                    </h2>
                    {result.studentName && (
                      <p className="text-lg font-medium">
                        Welcome, {result.studentName}
                      </p>
                    )}
                    <p className="text-muted-foreground">{result.message}</p>
                  </div>
                </>
              ) : result.message === "Attendance has already been recorded" ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      Notice
                    </h2>
                    <p className="text-muted-foreground">{result.message}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setResult(null);
                      setIndexNumber("");
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Go Back
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                      Error
                    </h2>
                    <p className="text-muted-foreground">{result.message}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setResult(null);
                      setIndexNumber("");
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Mark Your Attendance</CardTitle>
          <CardDescription>
            Please enter your index number to mark your attendance for this
            lecture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="indexNumber">Index Number</Label>
              <Input
                id="indexNumber"
                type="text"
                placeholder="Enter your index number"
                value={indexNumber}
                onChange={(e) => setIndexNumber(e.target.value)}
                disabled={selfMarkAttendance.isPending}
                className="text-center text-lg font-mono"
                autoFocus
                required
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>You can only mark attendance once</li>
                    <li>Make sure your index number is correct</li>
                    <li>This link may expire after a certain time</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={selfMarkAttendance.isPending}
            >
              {selfMarkAttendance.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Attendance"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
