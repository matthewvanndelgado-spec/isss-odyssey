"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format, isPast, isToday } from "date-fns";
import {
  Plus,
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { trpc } from "@/lib/trpc/client";

const statusConfig: Record<
  string,
  { label: string; variant: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: { label: "Pending", variant: "bg-yellow-100 text-yellow-800", icon: Clock },
  CONFIRMED: { label: "Confirmed", variant: "bg-green-100 text-green-800", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", variant: "bg-red-100 text-red-800", icon: XCircle },
  COMPLETED: { label: "Completed", variant: "bg-gray-100 text-gray-800", icon: CheckCircle2 },
};

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState("upcoming");

  const isStaff = session?.user?.role === "STAFF";

  const { data, isLoading } = trpc.appointment.getAll.useQuery(undefined, {
    enabled: !!session,
  });

  const cancelMutation = trpc.appointment.cancel.useMutation({
    onSuccess: () => {
      utils.appointment.getAll.invalidate();
    },
  });

  const utils = trpc.useUtils();

  // Redirect staff to their view
  if (isStaff) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="text-muted-foreground mt-1">
              Manage appointment scheduling and consultations
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Staff Appointment Management</p>
            <p className="text-muted-foreground mb-4">
              View and manage all student appointments
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/staff/appointments">Manage Appointments</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/staff/availability">Set Availability</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const appointments = data?.appointments ?? [];
  const upcomingAppointments = appointments.filter(
    (a) => !isPast(new Date(a.date)) || isToday(new Date(a.date))
  ).filter((a) => a.status !== "CANCELLED" && a.status !== "COMPLETED");
  const pastAppointments = appointments.filter(
    (a) => (isPast(new Date(a.date)) && !isToday(new Date(a.date))) || a.status === "COMPLETED" || a.status === "CANCELLED"
  );

  const displayedAppointments = tab === "upcoming" ? upcomingAppointments : pastAppointments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Book and manage your consultations with ISSO staff
          </p>
        </div>
        <Button asChild>
          <Link href="/appointments/book">
            <Plus className="mr-2 h-4 w-4" />
            Book Appointment
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
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
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayedAppointments.length > 0 ? (
        <div className="space-y-4">
          {displayedAppointments.map((appointment) => {
            const status = statusConfig[appointment.status] ?? statusConfig.PENDING;
            const StatusIcon = status.icon;
            const isOnline = appointment.type === "ONLINE";
            const appointmentDate = new Date(appointment.date);

            return (
              <Card
                key={appointment.id}
                className="hover:shadow-md transition-shadow"
              >
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
                      <CardDescription>
                        with {appointment.staff.firstName} {appointment.staff.lastName}
                      </CardDescription>
                    </div>
                    <Badge className={`${status.variant} shrink-0 hover:${status.variant}`}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(appointmentDate, "EEEE, MMMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {appointment.timeSlot}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {appointment.staff.firstName} {appointment.staff.lastName}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Purpose:</span> {appointment.purpose}
                    </p>
                    {appointment.meetingLink && (
                      <p className="text-sm">
                        <span className="font-medium">Meeting Link:</span>{" "}
                        <a
                          href={appointment.meetingLink}
                          className="text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Join Meeting
                        </a>
                      </p>
                    )}
                    {appointment.status === "PENDING" && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => cancelMutation.mutate({ id: appointment.id })}
                          disabled={cancelMutation.isLoading}
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Cancel
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
            <p className="text-lg font-medium mb-2">
              {tab === "upcoming"
                ? "No upcoming appointments"
                : "No past appointments"}
            </p>
            <p className="text-muted-foreground mb-4">
              {tab === "upcoming"
                ? "Book a consultation to get started"
                : "Your completed appointments will appear here"}
            </p>
            {tab === "upcoming" && (
              <Button asChild>
                <Link href="/appointments/book">
                  <Plus className="mr-2 h-4 w-4" />
                  Book Appointment
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
