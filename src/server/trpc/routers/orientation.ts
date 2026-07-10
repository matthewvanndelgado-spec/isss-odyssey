import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, staffProcedure } from "../trpc";

const CATEGORIES = [
  "ACADEMIC",
  "CULTURAL",
  "SAFETY_EMERGENCY",
  "STUDENT_LIFE",
  "ABOUT_UB_ISSO",
] as const;

const createOrientationSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  category: z.enum(CATEGORIES, {
    message: "Please select a valid category",
  }),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content must be less than 10000 characters"),
  order: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});

const updateOrientationSchema = z.object({
  id: z.string(),
  title: z.string().min(3).max(200).optional(),
  category: z.enum(CATEGORIES).optional(),
  content: z.string().min(10).max(10000).optional(),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const orientationRouter = router({
  // Get all published orientation content (optionally filtered by category)
  getAll: protectedProcedure
    .input(
      z
        .object({
          category: z.enum(CATEGORIES).optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { isPublished: true };

      if (input?.category) {
        where.category = input.category;
      }

      if (input?.search) {
        where.OR = [
          { title: { contains: input.search } },
          { content: { contains: input.search } },
        ];
        // When searching, still only show published
        where.isPublished = true;
      }

      const content = await ctx.db.orientationContent.findMany({
        where,
        orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "asc" }],
      });

      return content;
    }),

  // Get content for a specific category
  getByCategory: protectedProcedure
    .input(z.object({ category: z.enum(CATEGORIES) }))
    .query(async ({ ctx, input }) => {
      const content = await ctx.db.orientationContent.findMany({
        where: {
          category: input.category,
          isPublished: true,
        },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });

      return content;
    }),

  // Get a single orientation content by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const content = await ctx.db.orientationContent.findUnique({
        where: { id: input.id },
      });

      if (!content) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orientation content not found" });
      }

      // Only show published content to students
      if (ctx.session.user.role !== "STAFF" && !content.isPublished) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orientation content not found" });
      }

      return content;
    }),

  // Staff: get all content including unpublished for management
  getAllForStaff: staffProcedure
    .input(
      z
        .object({
          category: z.enum(CATEGORIES).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input?.category) {
        where.category = input.category;
      }

      const content = await ctx.db.orientationContent.findMany({
        where,
        orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "asc" }],
      });

      return content;
    }),

  // Staff: create orientation content
  create: staffProcedure
    .input(createOrientationSchema)
    .mutation(async ({ ctx, input }) => {
      const content = await ctx.db.orientationContent.create({
        data: {
          title: input.title,
          category: input.category,
          content: input.content,
          order: input.order,
          isPublished: input.isPublished,
        },
      });

      return content;
    }),

  // Staff: update orientation content
  update: staffProcedure
    .input(updateOrientationSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.orientationContent.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orientation content not found" });
      }

      const data: Record<string, unknown> = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.category !== undefined) data.category = input.category;
      if (input.content !== undefined) data.content = input.content;
      if (input.order !== undefined) data.order = input.order;
      if (input.isPublished !== undefined) data.isPublished = input.isPublished;

      const updated = await ctx.db.orientationContent.update({
        where: { id: input.id },
        data,
      });

      return updated;
    }),

  // Staff: delete orientation content
  delete: staffProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.orientationContent.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Orientation content not found" });
      }

      await ctx.db.orientationContent.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Staff: reorder content within a category
  reorder: staffProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            order: z.number().int().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update all items with their new order values
      await Promise.all(
        input.items.map((item) =>
          ctx.db.orientationContent.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );

      return { success: true };
    }),
});
