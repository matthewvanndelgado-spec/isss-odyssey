"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Activity,
  ChevronRight,
  Clock,
  CheckCircle2,
  FileWarning,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export default function StaffDashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Staff";

  const { data: stats } = trpc.dashboard.getStaffStats.useQuery(undefined, {
    enabled: !!session,
  });

  const { data: announcements } = trpc.dashboard.getRecentAnnouncements.useQuery(
    undefined,
    { enabled: !!session }
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            ISSO Staff Dashboard - Manage student services and operations.
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-primary/20">
          ISSO Staff
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered international students
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Inquiries
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingInquiries ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting staff response
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayAppointments ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Expiring Visas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.expiringVisas ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pending Actions</CardTitle>
              <Badge variant="secondary">{(stats?.pendingInquiries ?? 0) + (stats?.todayAppointments ?? 0)}</Badge>
            </div>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/inquiries" className="block">
              <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Unanswered Inquiries</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.pendingInquiries ?? 0} inquiries pending response
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/appointments" className="block">
              <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Appointments to Confirm</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.todayAppointments ?? 0} appointments scheduled today
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/visa" className="block">
              <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                  <FileWarning className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Visa Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.expiringVisas ?? 0} visas expiring or expired
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Latest system activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements && announcements.length > 0 ? (
                announcements.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium leading-tight">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {item.author.firstName} {item.author.lastName}
                      </p>
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </time>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health / Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Overview</CardTitle>
          <CardDescription>
            Quick access to staff management features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-4 justify-start" asChild>
              <Link href="/inquiries">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Manage Inquiries</p>
                    <p className="text-xs text-muted-foreground">Respond to students</p>
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 justify-start" asChild>
              <Link href="/appointments">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Appointments</p>
                    <p className="text-xs text-muted-foreground">Manage schedule</p>
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 justify-start" asChild>
              <Link href="/visa">
                <div className="flex items-center gap-3">
                  <FileWarning className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Visa Records</p>
                    <p className="text-xs text-muted-foreground">Track documents</p>
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 justify-start" asChild>
              <Link href="/exchange">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Programs</p>
                    <p className="text-xs text-muted-foreground">Exchange management</p>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
