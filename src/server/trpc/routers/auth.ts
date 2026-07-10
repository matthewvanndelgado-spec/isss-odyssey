import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { authRateLimiter } from "@/lib/rate-limit";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  nationality: z.string().min(1, "Nationality is required"),
  studentId: z.string().optional(),
  role: z.enum(["STUDENT", "STAFF"]),
  staffCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      // Rate limit by email to prevent brute-force registration attempts
      const rateLimitResult = authRateLimiter.check(`register:${input.email}`);
      if (!rateLimitResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many registration attempts. Please try again later.",
        });
      }

      // Validate staff registration code server-side only
      if (input.role === "STAFF") {
        const expectedCode = process.env.STAFF_REGISTRATION_CODE;
        if (!expectedCode) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Staff registration is not configured. Please contact the administrator.",
          });
        }
        if (input.staffCode !== expectedCode) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invalid staff registration code",
          });
        }
      }

      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists",
        });
      }

      if (input.studentId) {
        const existingStudentId = await ctx.db.user.findUnique({
          where: { studentId: input.studentId },
        });

        if (existingStudentId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This student ID is already registered",
          });
        }
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          passwordHash: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
          nationality: input.nationality,
          studentId: input.studentId || null,
          role: input.role,
        },
      });

      return {
        success: true,
        message: "Registration successful. Please sign in.",
        userId: user.id,
      };
    }),

  getSession: protectedProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
});
