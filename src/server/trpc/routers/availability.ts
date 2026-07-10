import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, staffProcedure } from "../trpc";

export const availabilityRouter = router({
  setAvailability: staffProcedure
    .input(
      z.object({
        date: z.string().min(1, "Please select a date"),
        timeSlots: z
          .array(z.string())
          .min(1, "Please select at least one time slot"),
        isAvailable: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetDate = new Date(input.date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Check if availability already exists for this date
      const existing = await ctx.db.staffAvailability.findFirst({
        where: {
          staffId: ctx.session.user.id,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (existing) {
        // Update existing
        const updated = await ctx.db.staffAvailability.update({
          where: { id: existing.id },
          data: {
            timeSlots: JSON.stringify(input.timeSlots),
            isAvailable: input.isAvailable,
          },
        });
        return updated;
      }

      // Create new
      const availability = await ctx.db.staffAvailability.create({
        data: {
          staffId: ctx.session.user.id,
          date: targetDate,
          timeSlots: JSON.stringify(input.timeSlots),
          isAvailable: input.isAvailable,
        },
      });

      return availability;
    }),

  removeAvailability: staffProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const availability = await ctx.db.staffAvailability.findUnique({
        where: { id: input.id },
      });

      if (!availability) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Availability not found" });
      }

      if (availability.staffId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      await ctx.db.staffAvailability.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  getMyAvailability: staffProcedure
    .input(
      z
        .object({
          month: z.number().min(0).max(11).optional(),
          year: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const month = input?.month ?? now.getMonth();
      const year = input?.year ?? now.getFullYear();

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const availabilities = await ctx.db.staffAvailability.findMany({
        where: {
          staffId: ctx.session.user.id,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        orderBy: { date: "asc" },
      });

      return availabilities.map((a) => ({
        ...a,
        timeSlots: JSON.parse(a.timeSlots) as string[],
      }));
    }),

  getStaffAvailability: protectedProcedure
    .input(
      z.object({
        staffId: z.string(),
        month: z.number().min(0).max(11).optional(),
        year: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const month = input.month ?? now.getMonth();
      const year = input.year ?? now.getFullYear();

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const availabilities = await ctx.db.staffAvailability.findMany({
        where: {
          staffId: input.staffId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          isAvailable: true,
        },
        orderBy: { date: "asc" },
      });

      return availabilities.map((a) => ({
        id: a.id,
        date: a.date,
        timeSlots: JSON.parse(a.timeSlots) as string[],
      }));
    }),

  bulkSetAvailability: staffProcedure
    .input(
      z.object({
        dates: z.array(z.string()).min(1, "Please select at least one date"),
        timeSlots: z
          .array(z.string())
          .min(1, "Please select at least one time slot"),
        isAvailable: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = await ctx.db.$transaction(async (tx) => {
        const txResults = [];

        for (const dateStr of input.dates) {
          const targetDate = new Date(dateStr);
          const startOfDay = new Date(targetDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(targetDate);
          endOfDay.setHours(23, 59, 59, 999);

          const existing = await tx.staffAvailability.findFirst({
            where: {
              staffId: ctx.session.user.id,
              date: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
          });

          if (existing) {
            const updated = await tx.staffAvailability.update({
              where: { id: existing.id },
              data: {
                timeSlots: JSON.stringify(input.timeSlots),
                isAvailable: input.isAvailable,
              },
            });
            txResults.push(updated);
          } else {
            const created = await tx.staffAvailability.create({
              data: {
                staffId: ctx.session.user.id,
                date: targetDate,
                timeSlots: JSON.stringify(input.timeSlots),
                isAvailable: input.isAvailable,
              },
            });
            txResults.push(created);
          }
        }

        return txResults;
      });

      return { count: results.length };
    }),
});
