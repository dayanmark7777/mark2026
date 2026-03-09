import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Settings() {
  const [settings, setSettings] = useState({
    organizationName: "DBC",
    organizationEmail: "admin@dbc.lk",
    supportEmail: "support@dbc.lk",
    attendanceSessionDuration: "4",
    maxStudentsPerClass: "50",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>
              Configure your organization basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={settings.organizationName}
                onChange={(e) =>
                  setSettings({ ...settings, organizationName: e.target.value })
                }
                placeholder="Organization name"
              />
            </div>
            <div>
              <Label htmlFor="org-email">Organization Email</Label>
              <Input
                id="org-email"
                type="email"
                value={settings.organizationEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    organizationEmail: e.target.value,
                  })
                }
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                value={settings.supportEmail}
                onChange={(e) =>
                  setSettings({ ...settings, supportEmail: e.target.value })
                }
                placeholder="support@example.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Settings</CardTitle>
            <CardDescription>
              Configure attendance tracking parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="session-duration">
                Attendance Session Duration (hours)
              </Label>
              <Input
                id="session-duration"
                type="number"
                value={settings.attendanceSessionDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    attendanceSessionDuration: e.target.value,
                  })
                }
                placeholder="4"
              />
            </div>
            <div>
              <Label htmlFor="max-students">Max Students Per Class</Label>
              <Input
                id="max-students"
                type="number"
                value={settings.maxStudentsPerClass}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxStudentsPerClass: e.target.value,
                  })
                }
                placeholder="50"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              View system and database information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">System Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Database Status</span>
              <span className="font-medium text-green-600">Connected</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium">Today at 2:30 PM</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <SettingsIcon className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
