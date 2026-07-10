"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isPast,
  startOfDay,
} from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

// Time slots from 9AM to 5PM in 30-minute increments
const ALL_TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StaffAvailabilityPage() {
  const { data: session } = useSession();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const utils = trpc.useUtils();

  const { data: availabilities, isLoading } =
    trpc.availability.getMyAvailability.useQuery(
      {
        month: currentMonth.getMonth(),
        year: currentMonth.getFullYear(),
      },
      { enabled: !!session }
    );

  const setAvailabilityMutation = trpc.availability.setAvailability.useMutation(
    {
      onSuccess: () => {
        utils.availability.getMyAvailability.invalidate();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      },
    }
  );

  const removeAvailabilityMutation =
    trpc.availability.removeAvailability.useMutation({
      onSuccess: () => {
        utils.availability.getMyAvailability.invalidate();
        setSelectedSlots([]);
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

  // Calendar generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Check if a date has availability set
  const getAvailabilityForDate = (date: Date) => {
    return availabilities?.find((a) => isSameDay(new Date(a.date), date));
  };

  const handleDateSelect = (date: Date) => {
    if (isPast(startOfDay(date)) && !isToday(date)) return;
    setSelectedDate(date);
    setSaveSuccess(false);

    const existing = getAvailabilityForDate(date);
    if (existing) {
      setSelectedSlots(existing.timeSlots);
    } else {
      setSelectedSlots([]);
    }
  };

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const selectAllSlots = () => {
    setSelectedSlots([...ALL_TIME_SLOTS]);
  };

  const clearAllSlots = () => {
    setSelectedSlots([]);
  };

  const handleSave = () => {
    if (!selectedDate || selectedSlots.length === 0) return;
    setAvailabilityMutation.mutate({
      date: format(selectedDate, "yyyy-MM-dd"),
      timeSlots: selectedSlots,
      isAvailable: true,
    });
  };

  const handleRemoveAvailability = () => {
    if (!selectedDate) return;
    const existing = getAvailabilityForDate(selectedDate);
    if (existing) {
      removeAvailabilityMutation.mutate({ id: existing.id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Availability Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Set your available days and time slots for student appointments
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="space-y-2">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const inCurrentMonth = isSameMonth(day, currentMonth);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isPastDay = isPast(startOfDay(day)) && !isToday(day);
                    const availability = getAvailabilityForDate(day);
                    const hasSlots = availability && availability.timeSlots.length > 0;

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleDateSelect(day)}
                        disabled={!inCurrentMonth || isPastDay}
                        className={`relative p-2 text-center text-sm rounded-lg transition-all ${
                          !inCurrentMonth
                            ? "text-muted-foreground/30 cursor-default"
                            : isPastDay
                            ? "text-muted-foreground/50 cursor-not-allowed"
                            : isSelected
                            ? "bg-primary text-primary-foreground font-medium"
                            : isToday(day)
                            ? "bg-primary/10 text-primary font-medium hover:bg-primary/20"
                            : hasSlots
                            ? "bg-green-50 text-green-800 hover:bg-green-100 font-medium"
                            : "hover:bg-muted"
                        }`}
                        aria-label={format(day, "MMMM d, yyyy")}
                      >
                        {format(day, "d")}
                        {hasSlots && !isSelected && (
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-green-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-green-50 border border-green-200" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-primary" />
                <span>Selected</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Slots Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM d, yyyy")
                : "Select a Date"}
            </CardTitle>
            <CardDescription>
              {selectedDate
                ? "Toggle time slots to set your availability"
                : "Click a date on the calendar to manage time slots"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllSlots}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllSlots}>
                    Clear All
                  </Button>
                  {getAvailabilityForDate(selectedDate) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive ml-auto"
                      onClick={handleRemoveAvailability}
                      disabled={removeAvailabilityMutation.isLoading}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Remove
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Time Slot Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {ALL_TIME_SLOTS.map((slot) => {
                    const isSelected = selectedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleSlot(slot)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground"
                        }`}
                        aria-label={`${slot} ${isSelected ? "selected" : "not selected"}`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                <Separator />

                {/* Save Button */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedSlots.length} slot{selectedSlots.length !== 1 ? "s" : ""}{" "}
                    selected
                  </p>
                  <Button
                    onClick={handleSave}
                    disabled={
                      selectedSlots.length === 0 ||
                      setAvailabilityMutation.isLoading
                    }
                  >
                    {setAvailabilityMutation.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Availability
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">Select a date from the calendar</p>
                <p className="text-sm">to set your available time slots</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
