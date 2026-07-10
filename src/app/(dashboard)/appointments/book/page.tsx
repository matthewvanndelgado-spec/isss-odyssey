"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, startOfDay } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Video,
  MapPin,
  User,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

type BookingStep = 1 | 2 | 3 | 4 | 5;

const steps = [
  { number: 1, title: "Type", icon: Video },
  { number: 2, title: "Staff", icon: User },
  { number: 3, title: "Date", icon: Calendar },
  { number: 4, title: "Time", icon: Clock },
  { number: 5, title: "Purpose", icon: FileText },
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [type, setType] = useState<"ONLINE" | "FACE_TO_FACE" | "">("");
  const [staffId, setStaffId] = useState("");
  const [selectedStaffName, setSelectedStaffName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");

  // Get staff list
  const { data: staffList, isLoading: staffLoading } =
    trpc.appointment.getStaffList.useQuery(undefined, {
      enabled: currentStep >= 2,
    });

  // Get staff availability for the selected month
  const { data: staffAvailability, isLoading: availabilityLoading } =
    trpc.availability.getStaffAvailability.useQuery(
      {
        staffId,
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
      },
      { enabled: !!staffId && currentStep >= 3 }
    );

  // Get available time slots for the selected date
  const { data: slotsData, isLoading: slotsLoading } =
    trpc.appointment.getAvailableSlots.useQuery(
      { staffId, date: selectedDate },
      { enabled: !!staffId && !!selectedDate && currentStep >= 4 }
    );

  const createAppointment = trpc.appointment.create.useMutation({
    onSuccess: () => {
      router.push("/appointments");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Generate next 30 days for date selection
  const today = startOfDay(new Date());
  const availableDates = staffAvailability
    ? staffAvailability
        .filter((a) => {
          const availDate = startOfDay(new Date(a.date));
          return availDate >= today && a.timeSlots.length > 0;
        })
        .map((a) => ({
          date: format(new Date(a.date), "yyyy-MM-dd"),
          displayDate: format(new Date(a.date), "EEEE, MMMM d, yyyy"),
          slotsCount: a.timeSlots.length,
        }))
    : [];

  const handleNext = () => {
    setError("");
    if (currentStep === 1 && !type) {
      setError("Please select a consultation type");
      return;
    }
    if (currentStep === 2 && !staffId) {
      setError("Please select a staff member");
      return;
    }
    if (currentStep === 3 && !selectedDate) {
      setError("Please select a date");
      return;
    }
    if (currentStep === 4 && !selectedTimeSlot) {
      setError("Please select a time slot");
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as BookingStep);
    }
  };

  const handleBack = () => {
    setError("");
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as BookingStep);
    }
  };

  const handleSubmit = () => {
    if (purpose.length < 10) {
      setError("Purpose must be at least 10 characters");
      return;
    }
    if (!type) return;
    createAppointment.mutate({
      staffId,
      type,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      purpose,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/appointments" aria-label="Back to appointments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Book Appointment</h1>
          <p className="text-muted-foreground mt-1">
            Schedule a consultation with ISSO staff
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between px-2">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;

          return (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCompleted
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden sm:block w-12 h-0.5 mx-2 ${
                    step.number < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Consultation Type */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Select Consultation Type</h2>
                <p className="text-muted-foreground mt-1">
                  How would you like to meet with ISSO staff?
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setType("ONLINE")}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    type === "ONLINE"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  aria-label="Online consultation"
                >
                  <Video className={`h-8 w-8 mb-3 ${type === "ONLINE" ? "text-primary" : "text-blue-600"}`} />
                  <h3 className="font-semibold">Online</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Virtual meeting via video call. A meeting link will be provided.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setType("FACE_TO_FACE")}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    type === "FACE_TO_FACE"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  aria-label="Face-to-face consultation"
                >
                  <MapPin className={`h-8 w-8 mb-3 ${type === "FACE_TO_FACE" ? "text-primary" : "text-green-600"}`} />
                  <h3 className="font-semibold">Face-to-Face</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    In-person meeting at the ISSO office.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Staff */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Select Staff Member</h2>
                <p className="text-muted-foreground mt-1">
                  Choose the ISSO staff member you want to meet with
                </p>
              </div>
              {staffLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : staffList && staffList.length > 0 ? (
                <div className="space-y-3">
                  {staffList.map((staff) => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        setStaffId(staff.id);
                        setSelectedStaffName(
                          `${staff.firstName} ${staff.lastName}`
                        );
                        setSelectedDate("");
                        setSelectedTimeSlot("");
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-4 ${
                        staffId === staff.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {staff.firstName} {staff.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {staff.email}
                        </p>
                      </div>
                      {staffId === staff.id && (
                        <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No staff members available at this time.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Date */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Select Date</h2>
                <p className="text-muted-foreground mt-1">
                  Choose an available date for your appointment with{" "}
                  {selectedStaffName}
                </p>
              </div>
              {availabilityLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : availableDates.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {availableDates.map((dateOption) => (
                    <button
                      key={dateOption.date}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateOption.date);
                        setSelectedTimeSlot("");
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                        selectedDate === dateOption.date
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{dateOption.displayDate}</span>
                      </div>
                      <Badge variant="secondary">
                        {dateOption.slotsCount} slots
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No available dates found for this staff member.</p>
                  <p className="text-sm mt-1">
                    Try selecting a different staff member.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Select Time Slot */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Select Time Slot</h2>
                <p className="text-muted-foreground mt-1">
                  Available time slots for{" "}
                  {selectedDate && format(new Date(selectedDate), "MMMM d, yyyy")}
                </p>
              </div>
              {slotsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : slotsData?.availableSlots && slotsData.availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {slotsData.availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        selectedTimeSlot === slot
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Clock className="h-4 w-4 mx-auto mb-1" />
                      <span className="text-sm">{slot}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No available time slots for this date.</p>
                  <p className="text-sm mt-1">
                    Go back and select a different date.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Purpose & Confirmation */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Purpose & Confirmation</h2>
                <p className="text-muted-foreground mt-1">
                  Describe the purpose of your appointment
                </p>
              </div>

              {/* Purpose Input */}
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Visit</Label>
                <Textarea
                  id="purpose"
                  placeholder="Describe why you need this consultation..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="resize-none"
                  aria-describedby="purpose-help"
                />
                <div className="flex justify-between">
                  <p id="purpose-help" className="text-sm text-muted-foreground">
                    Min 10 characters
                  </p>
                  <span className="text-sm text-muted-foreground">
                    {purpose.length}/500
                  </span>
                </div>
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold">Appointment Summary</h3>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {type === "ONLINE" ? (
                      <Video className="h-4 w-4 text-blue-600" />
                    ) : (
                      <MapPin className="h-4 w-4 text-green-600" />
                    )}
                    <span className="font-medium">Type:</span>
                    {type === "ONLINE" ? "Online (Video Call)" : "Face-to-Face"}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Staff:</span>
                    {selectedStaffName}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Date:</span>
                    {selectedDate && format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Time:</span>
                    {selectedTimeSlot}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {currentStep < 5 ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createAppointment.isLoading || purpose.length < 10}
          >
            {createAppointment.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm Booking
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
