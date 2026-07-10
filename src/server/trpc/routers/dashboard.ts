import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, staffProcedure } from "../trpc";

export const dashboardRouter = router({
  getStudentStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [pendingInquiries, upcomingAppointments, visaRecord, unreadNotifications] =
      await Promise.all([
        ctx.db.inquiry.count({
          where: { studentId: userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
        }),
        ctx.db.appointment.count({
          where: {
            studentId: userId,
            status: { in: ["PENDING", "CONFIRMED"] },
            date: { gte: new Date() },
          },
        }),
        ctx.db.visaRecord.findFirst({
          where: { studentId: userId },
          orderBy: { updatedAt: "desc" },
        }),
        ctx.db.notification.count({
          where: { userId, isRead: false },
        }),
      ]);

    return {
      pendingInquiries,
      upcomingAppointments,
      visaStatus: visaRecord?.status ?? "N/A",
      unreadNotifications,
    };
  }),

  getStaffStats: staffProcedure.query(async ({ ctx }) => {
    const [totalStudents, pendingInquiries, todayAppointments, expiringVisas] =
      await Promise.all([
        ctx.db.user.count({ where: { role: "STUDENT" } }),
        ctx.db.inquiry.count({ where: { status: "PENDING" } }),
        ctx.db.appointment.count({
          where: {
            status: { in: ["PENDING", "CONFIRMED"] },
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
        ctx.db.visaRecord.count({
          where: { status: { in: ["EXPIRING_SOON", "EXPIRED"] } },
        }),
      ]);

    return {
      totalStudents,
      pendingInquiries,
      todayAppointments,
      expiringVisas,
    };
  }),

  getRecentAnnouncements: protectedProcedure.query(async ({ ctx }) => {
    const announcements = await ctx.db.announcement.findMany({
      where: { isActive: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
      include: {
        author: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return announcements;
  }),

  // Staff: get all announcements (including inactive)
  getAnnouncements: staffProcedure.query(async ({ ctx }) => {
    const announcements = await ctx.db.announcement.findMany({
      orderBy: { publishedAt: "desc" },
      include: {
        author: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return announcements;
  }),

  // Staff: create announcement
  createAnnouncement: staffProcedure
    .input(
      z.object({
        title: z.string().min(3, "Title must be at least 3 characters").max(200),
        content: z.string().min(10, "Content must be at least 10 characters").max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const announcement = await ctx.db.announcement.create({
        data: {
          title: input.title,
          content: input.content,
          authorId: ctx.session.user.id,
          isActive: true,
        },
      });

      return announcement;
    }),

  // Staff: update announcement
  updateAnnouncement: staffProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).max(200).optional(),
        content: z.string().min(10).max(5000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.announcement.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Announcement not found" });
      }

      const data: Record<string, unknown> = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.content !== undefined) data.content = input.content;

      const updated = await ctx.db.announcement.update({
        where: { id: input.id },
        data,
      });

      return updated;
    }),

  // Staff: toggle announcement active/inactive
  toggleAnnouncement: staffProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.announcement.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });

      return updated;
    }),

  // Staff: delete announcement
  deleteAnnouncement: staffProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.announcement.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Announcement not found" });
      }

      await ctx.db.announcement.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
