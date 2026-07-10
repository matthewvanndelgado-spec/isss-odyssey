import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, staffProcedure } from "../trpc";

const INQUIRY_CATEGORIES = ["VISA", "ACADEMIC", "FINANCIAL", "HOUSING", "GENERAL"] as const;
const INQUIRY_STATUSES = ["PENDING", "IN_PROGRESS", "RESPONDED", "CLOSED"] as const;

const createInquirySchema = z.object({
  category: z.enum(INQUIRY_CATEGORIES, {
    message: "Please select a category",
  }),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must be less than 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be less than 2000 characters"),
});

export const inquiryRouter = router({
  create: protectedProcedure
    .input(createInquirySchema)
    .mutation(async ({ ctx, input }) => {
      const inquiry = await ctx.db.inquiry.create({
        data: {
          studentId: ctx.session.user.id,
          category: input.category,
          subject: input.subject,
          description: input.description,
          status: "PENDING",
        },
      });
      return inquiry;
    }),

  getAll: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(INQUIRY_STATUSES).optional(),
          search: z.string().optional(),
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

      // Students only see their own inquiries
      if (!isStaff) {
        where.studentId = ctx.session.user.id;
      }

      if (input?.status) {
        where.status = input.status;
      }

      if (input?.search) {
        where.OR = [
          { subject: { contains: input.search } },
          { description: { contains: input.search } },
        ];
      }

      const inquiries = await ctx.db.inquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          student: {
            select: { firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { responses: true },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (inquiries.length > limit) {
        const nextItem = inquiries.pop();
        nextCursor = nextItem?.id;
      }

      return { inquiries, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const inquiry = await ctx.db.inquiry.findUnique({
        where: { id: input.id },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          responses: {
            orderBy: { createdAt: "asc" },
            include: {
              staff: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      });

      if (!inquiry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found" });
      }

      // Students can only view their own inquiries
      const isStaff = ctx.session.user.role === "STAFF";
      if (!isStaff && inquiry.studentId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      return inquiry;
    }),

  respond: staffProcedure
    .input(
      z.object({
        inquiryId: z.string(),
        responseText: z
          .string()
          .min(10, "Response must be at least 10 characters")
          .max(2000, "Response must be less than 2000 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inquiry = await ctx.db.inquiry.findUnique({
        where: { id: input.inquiryId },
      });

      if (!inquiry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found" });
      }

      const response = await ctx.db.inquiryResponse.create({
        data: {
          inquiryId: input.inquiryId,
          staffId: ctx.session.user.id,
          responseText: input.responseText,
        },
      });

      // Update inquiry status to RESPONDED
      await ctx.db.inquiry.update({
        where: { id: input.inquiryId },
        data: { status: "RESPONDED" },
      });

      return response;
    }),

  updateStatus: staffProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(INQUIRY_STATUSES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inquiry = await ctx.db.inquiry.findUnique({
        where: { id: input.id },
      });

      if (!inquiry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found" });
      }

      const updated = await ctx.db.inquiry.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      return updated;
    }),

  delete: staffProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inquiry = await ctx.db.inquiry.findUnique({
        where: { id: input.id },
      });

      if (!inquiry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found" });
      }

      // Delete associated responses first
      await ctx.db.inquiryResponse.deleteMany({
        where: { inquiryId: input.id },
      });

      await ctx.db.inquiry.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
