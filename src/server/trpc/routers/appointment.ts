import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, staffProcedure } from "../trpc";

const APPOINTMENT_TYPES = ["ONLINE", "FACE_TO_FACE"] as const;
const APPOINTMENT_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;

const createAppointmentSchema = z.object({
  staffId: z.string().min(1, "Please select a staff member"),
  type: z.enum(APPOINTMENT_TYPES, {
    message: "Please select a consultation type",
  }),
  date: z.string().min(1, "Please select a date"),
  timeSlot: z.string().min(1, "Please select a time slot"),
  purpose: z
    .string()
    .min(10, "Purpose must be at least 10 characters")
    .max(500, "Purpose must be less than 500 characters"),
});

export const appointmentRouter = router({
  create: protectedProcedure
    .input(createAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      const appointmentDate = new Date(input.date);
      const studentId = ctx.session.user.id;

      // Wrap conflict check and insert in a transaction to prevent double-booking
      const appointment = await ctx.db.$transaction(async (tx) => {
        // Check for conflicts - same staff, same date and time slot, not cancelled
        const existingAppointment = await tx.appointment.findFirst({
          where: {
            staffId: input.staffId,
            date: appointmentDate,
            timeSlot: input.timeSlot,
            status: { in: ["PENDING", "CONFIRMED"] },
          },
        });

        if (existingAppointment) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This time slot is already booked. Please choose a different time.",
          });
        }

        // Also check if the student already has an appointment at the same time
        const studentConflict = await tx.appointment.findFirst({
          where: {
            studentId,
            date: appointmentDate,
            timeSlot: input.timeSlot,
            status: { in: ["PENDING", "CONFIRMED"] },
          },
        });

        if (studentConflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You already have an appointment at this time.",
          });
        }

        return tx.appointment.create({
          data: {
            studentId,
            staffId: input.staffId,
            type: input.type,
            date: appointmentDate,
            timeSlot: input.timeSlot,
            purpose: input.purpose,
            status: "PENDING",
          },
        });
      });

      return appointment;
    }),

  getAll: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(APPOINTMENT_STATUSES).optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;
      const isStaff = ctx.session.user.role === "STAFF";

      const where: Record<string, unknown> = {};

      if (isStaff) {
        where.staffId = ctx.session.user.id;
      } else {
        where.studentId = ctx.session.user.id;
      }

      if (input?.status) {
        where.status = input.status;
      }

      if (input?.dateFrom || input?.dateTo) {
        where.date = {
          ...(input?.dateFrom ? { gte: new Date(input.dateFrom) } : {}),
          ...(input?.dateTo ? { lte: new Date(input.dateTo) } : {}),
        };
      }

      const appointments = await ctx.db.appointment.findMany({
        where,
        orderBy: { date: "asc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          student: {
            select: { firstName: true, lastName: true, email: true },
          },
          staff: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (appointments.length > limit) {
        const nextItem = appointments.pop();
        nextCursor = nextItem?.id;
      }

      return { appointments, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const appointment = await ctx.db.appointment.findUnique({
        where: { id: input.id },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          staff: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" });
      }

      const isStaff = ctx.session.user.role === "STAFF";
      if (!isStaff && appointment.studentId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      return appointment;
    }),

  updateStatus: staffProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(APPOINTMENT_STATUSES),
        meetingLink: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const appointment = await ctx.db.appointment.findUnique({
        where: { id: input.id },
      });

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" });
      }

      const updated = await ctx.db.appointment.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(input.meetingLink ? { meetingLink: input.meetingLink } : {}),
        },
      });

      return updated;
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const appointment = await ctx.db.appointment.findUnique({
        where: { id: input.id },
      });

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" });
      }

      // Students can only cancel their own pending appointments
      if (ctx.session.user.role !== "STAFF") {
        if (appointment.studentId !== ctx.session.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        if (appointment.status !== "PENDING") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only pending appointments can be cancelled",
          });
        }
      }

      const updated = await ctx.db.appointment.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });

      return updated;
    }),

  getAvailableSlots: protectedProcedure
    .input(
      z.object({
        staffId: z.string(),
        date: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const targetDate = new Date(input.date);
      // Set to start of day for comparison
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get staff availability for that date
      const availability = await ctx.db.staffAvailability.findFirst({
        where: {
          staffId: input.staffId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          isAvailable: true,
        },
      });

      if (!availability) {
        return { availableSlots: [] };
      }

      // Parse the time slots JSON
      const allSlots: string[] = JSON.parse(availability.timeSlots);

      // Get booked slots for that date
      const bookedAppointments = await ctx.db.appointment.findMany({
        where: {
          staffId: input.staffId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: { timeSlot: true },
      });

      const bookedSlots = new Set(bookedAppointments.map((a) => a.timeSlot));
      const availableSlots = allSlots.filter((slot) => !bookedSlots.has(slot));

      return { availableSlots };
    }),

  getStaffList: protectedProcedure.query(async ({ ctx }) => {
    const staff = await ctx.db.user.findMany({
      where: { role: "STAFF" },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    return staff;
  }),
});
