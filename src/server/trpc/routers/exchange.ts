import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, staffProcedure } from "../trpc";

const PROGRAM_TYPES = ["ACADEMIC", "CULTURAL", "MOBILITY"] as const;

const createProgramSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be less than 5000 characters"),
  type: z.enum(PROGRAM_TYPES, {
    message: "Please select a program type",
  }),
  eligibility: z.string().max(2000).optional(),
  deadline: z.string().optional(),
  applicationUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const exchangeRouter = router({
  // Public: get all active programs with filters
  getAll: protectedProcedure
    .input(
      z
        .object({
          type: z.enum(PROGRAM_TYPES).optional(),
          search: z.string().optional(),
          showArchived: z.boolean().default(false),
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;

      const where: Record<string, unknown> = {};

      // Only show archived if staff requests it
      if (!input?.showArchived) {
        where.isArchived = false;
      }

      if (input?.type) {
        where.type = input.type;
      }

      if (input?.search) {
        where.OR = [
          { title: { contains: input.search } },
          { description: { contains: input.search } },
        ];
      }

      const programs = await ctx.db.exchangeProgram.findMany({
        where,
        orderBy: { deadline: "asc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          _count: {
            select: { applications: true },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (programs.length > limit) {
        const nextItem = programs.pop();
        nextCursor = nextItem?.id;
      }

      return { programs, nextCursor };
    }),

  // Get a single program by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const program = await ctx.db.exchangeProgram.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { applications: true },
          },
          applications: {
            where: { studentId: ctx.session.user.id },
            take: 1,
          },
        },
      });

      if (!program) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
      }

      return {
        ...program,
        hasApplied: program.applications.length > 0,
        applicationStatus: program.applications[0]?.status ?? null,
      };
    }),

  // Staff: create a new program
  create: staffProcedure
    .input(createProgramSchema)
    .mutation(async ({ ctx, input }) => {
      const program = await ctx.db.exchangeProgram.create({
        data: {
          title: input.title,
          description: input.description,
          type: input.type,
          eligibility: input.eligibility || null,
          deadline: input.deadline ? new Date(input.deadline) : null,
          applicationUrl: input.applicationUrl || null,
          isArchived: false,
        },
      });

      return program;
    }),

  // Staff: update a program
  update: staffProcedure
    .input(
      z.object({
        id: z.string(),
        ...createProgramSchema.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const program = await ctx.db.exchangeProgram.findUnique({
        where: { id: input.id },
      });

      if (!program) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
      }

      const updated = await ctx.db.exchangeProgram.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          type: input.type,
          eligibility: input.eligibility || null,
          deadline: input.deadline ? new Date(input.deadline) : null,
          applicationUrl: input.applicationUrl || null,
        },
      });

      return updated;
    }),

  // Staff: archive/unarchive a program
  archive: staffProcedure
    .input(
      z.object({
        id: z.string(),
        isArchived: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const program = await ctx.db.exchangeProgram.findUnique({
        where: { id: input.id },
      });

      if (!program) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
      }

      const updated = await ctx.db.exchangeProgram.update({
        where: { id: input.id },
        data: { isArchived: input.isArchived },
      });

      return updated;
    }),

  // Staff: get applications for a program
  getApplications: staffProcedure
    .input(z.object({ programId: z.string() }))
    .query(async ({ ctx, input }) => {
      const applications = await ctx.db.exchangeProgramApplication.findMany({
        where: { programId: input.programId },
        orderBy: { appliedAt: "desc" },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, email: true, studentId: true },
          },
        },
      });

      return applications;
    }),

  // Student: apply to a program
  apply: protectedProcedure
    .input(z.object({ programId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const program = await ctx.db.exchangeProgram.findUnique({
        where: { id: input.programId },
      });

      if (!program) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
      }

      if (program.isArchived) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This program is no longer accepting applications",
        });
      }

      // Check if already applied
      const existing = await ctx.db.exchangeProgramApplication.findFirst({
        where: {
          programId: input.programId,
          studentId: ctx.session.user.id,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already applied to this program",
        });
      }

      const application = await ctx.db.exchangeProgramApplication.create({
        data: {
          programId: input.programId,
          studentId: ctx.session.user.id,
          status: "PENDING",
        },
      });

      return application;
    }),

  // Student: get my applications
  getMyApplications: protectedProcedure.query(async ({ ctx }) => {
    const applications = await ctx.db.exchangeProgramApplication.findMany({
      where: { studentId: ctx.session.user.id },
      orderBy: { appliedAt: "desc" },
      include: {
        program: {
          select: { id: true, title: true, type: true, deadline: true },
        },
      },
    });

    return applications;
  }),
});
