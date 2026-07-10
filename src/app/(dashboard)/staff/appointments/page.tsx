"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { format, isToday, isPast } from "date-fns";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";

const statusConfig: Record<
  string,
  { label: string; variant: string }
> = {
  PENDING: { label: "Pending", variant: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmed", variant: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", variant: "bg-red-100 text-red-800" },
  COMPLETED: { label: "Completed", variant: "bg-gray-100 text-gray-800" },
};

export default function StaffAppointmentsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState("today");
  const [meetingLink, setMeetingLink] = useState("");
  const [confirmDialogId, setConfirmDialogId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.appointment.getAll.useQuery(undefined, {
    enabled: !!session,
  });

  const updateStatusMutation = trpc.appointment.updateStatus.useMutation({
    onSuccess: () => {
      utils.appointment.getAll.invalidate();
      setConfirmDialogId(null);
      setMeetingLink("");
    },
  });

  if (session?.user?.role !== "STAFF") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Access Denied</p>
          <p className="text-muted-foreground">
            This page is only accessible to ISSO staff.
          </p>
        </CardContent>
      </Card>
    );
  }

  const appointments = data?.appointments ?? [];
  const todayAppointments = appointments.filter((a) =>
    isToday(new Date(a.date)) && a.status !== "CANCELLED"
  );
  const upcomingAppointments = appointments.filter(
    (a) => !isPast(new Date(a.date)) && !isToday(new Date(a.date)) && a.status !== "CANCELLED"
  );
  const pastAppointments = appointments.filter(
    (a) => (isPast(new Date(a.date)) && !isToday(new Date(a.date))) || a.status === "CANCELLED"
  );

  const displayedAppointments =
    tab === "today"
      ? todayAppointments
      : tab === "upcoming"
      ? upcomingAppointments
      : pastAppointments;

  const handleConfirm = (id: string) => {
    updateStatusMutation.mutate({
      id,
      status: "CONFIRMED",
      meetingLink: meetingLink || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Appointment Management
        </h1>
        <p className="text-muted-foreground mt-1">
          View and manage all student appointments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">
              {todayAppointments.length}
            </div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-yellow-600">
              {appointments.filter((a) => a.status === "PENDING").length}
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter((a) => a.status === "CONFIRMED").length}
            </div>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-gray-600">
              {appointments.filter((a) => a.status === "COMPLETED").length}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="today">
            Today ({todayAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Appointment List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : displayedAppointments.length > 0 ? (
        <div className="space-y-4">
          {displayedAppointments.map((appointment) => {
            const status = statusConfig[appointment.status] ?? statusConfig.PENDING;
            const isOnline = appointment.type === "ONLINE";

            return (
              <Card key={appointment.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {isOnline ? (
                          <Video className="h-4 w-4 text-blue-600" />
                        ) : (
                          <MapPin className="h-4 w-4 text-green-600" />
                        )}
                        {isOnline ? "Online" : "Face-to-Face"} Consultation
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {appointment.student.firstName} {appointment.student.lastName} ({appointment.student.email})
                      </CardDescription>
                    </div>
                    <Badge className={`${status.variant} shrink-0`}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {appointment.timeSlot}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Purpose:</span>{" "}
                      {appointment.purpose}
                    </p>

                    {/* Action Buttons */}
                    {appointment.status === "PENDING" && (
                      <div className="flex items-center gap-2 pt-2">
                        <Dialog
                          open={confirmDialogId === appointment.id}
                          onOpenChange={(open) => {
                            if (!open) setConfirmDialogId(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => setConfirmDialogId(appointment.id)}
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Confirm
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Appointment</DialogTitle>
                              <DialogDescription>
                                Confirm this appointment with{" "}
                                {appointment.student.firstName}{" "}
                                {appointment.student.lastName}.
                                {isOnline &&
                                  " You can optionally provide a meeting link."}
                              </DialogDescription>
                            </DialogHeader>
                            {isOnline && (
                              <div className="space-y-2">
                                <Label htmlFor="meetingLink">
                                  Meeting Link (optional)
                                </Label>
                                <Input
                                  id="meetingLink"
                                  placeholder="https://meet.google.com/..."
                                  value={meetingLink}
                                  onChange={(e) => setMeetingLink(e.target.value)}
                                />
                              </div>
                            )}
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setConfirmDialogId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleConfirm(appointment.id)}
                                disabled={updateStatusMutation.isLoading}
                              >
                                {updateStatusMutation.isLoading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                )}
                                Confirm
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: appointment.id,
                              status: "CANCELLED",
                            })
                          }
                          disabled={updateStatusMutation.isLoading}
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Cancel
                        </Button>
                      </div>
                    )}
                    {appointment.status === "CONFIRMED" && (
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: appointment.id,
                              status: "COMPLETED",
                            })
                          }
                          disabled={updateStatusMutation.isLoading}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Mark Completed
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No appointments</p>
            <p className="text-muted-foreground">
              {tab === "today"
                ? "No appointments scheduled for today"
                : tab === "upcoming"
                ? "No upcoming appointments"
                : "No past appointments"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
