import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, staffProcedure } from "../trpc";

const VISA_TYPES = [
  "STUDENT_VISA",
  "EXCHANGE_VISA",
  "TOURIST_VISA",
  "WORK_VISA",
  "SPECIAL_STUDY_PERMIT",
] as const;

const VISA_STATUSES = ["VALID", "EXPIRING_SOON", "EXPIRED", "PENDING_RENEWAL"] as const;
const DOCUMENT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const visaRouter = router({
  // Student: get their own visa record with documents
  getMyVisa: protectedProcedure.query(async ({ ctx }) => {
    const visaRecord = await ctx.db.visaRecord.findFirst({
      where: { studentId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });
    return visaRecord;
  }),

  // Staff: get all student visa records with filters
  getAll: staffProcedure
    .input(
      z
        .object({
          status: z.enum(VISA_STATUSES).optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;

      const where: Record<string, unknown> = {};

      if (input?.status) {
        where.status = input.status;
      }

      if (input?.search) {
        where.OR = [
          { student: { firstName: { contains: input.search } } },
          { student: { lastName: { contains: input.search } } },
          { student: { email: { contains: input.search } } },
          { visaType: { contains: input.search } },
        ];
      }

      const records = await ctx.db.visaRecord.findMany({
        where,
        orderBy: { expiryDate: "asc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, email: true, studentId: true },
          },
          _count: {
            select: { documents: true },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (records.length > limit) {
        const nextItem = records.pop();
        nextCursor = nextItem?.id;
      }

      return { records, nextCursor };
    }),

  // Staff: get a single visa record by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.db.visaRecord.findUnique({
        where: { id: input.id },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, email: true, studentId: true },
          },
          documents: {
            orderBy: { uploadedAt: "desc" },
          },
        },
      });

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Visa record not found" });
      }

      // Students can only view their own
      if (ctx.session.user.role !== "STAFF" && record.studentId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      return record;
    }),

  // Staff: update visa status, expiry, notes
  updateStatus: staffProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(VISA_STATUSES).optional(),
        visaType: z.enum(VISA_TYPES).optional(),
        expiryDate: z.string().optional(),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.visaRecord.findUnique({
        where: { id: input.id },
      });

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Visa record not found" });
      }

      const data: Record<string, unknown> = {};
      if (input.status) data.status = input.status;
      if (input.visaType) data.visaType = input.visaType;
      if (input.expiryDate) data.expiryDate = new Date(input.expiryDate);
      if (input.notes !== undefined) data.notes = input.notes;

      const updated = await ctx.db.visaRecord.update({
        where: { id: input.id },
        data,
      });

      return updated;
    }),

  // Add a document to a visa record
  addDocument: protectedProcedure
    .input(
      z.object({
        visaRecordId: z.string(),
        documentType: z.string().min(1, "Document type is required"),
        fileName: z.string().min(1, "File name is required"),
        fileUrl: z.string().url("Valid URL is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.visaRecord.findUnique({
        where: { id: input.visaRecordId },
      });

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Visa record not found" });
      }

      // Students can only add to their own record
      if (ctx.session.user.role !== "STAFF" && record.studentId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const document = await ctx.db.visaDocument.create({
        data: {
          visaRecordId: input.visaRecordId,
          documentType: input.documentType,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          status: "PENDING",
        },
      });

      return document;
    }),

  // Staff: approve/reject document
  updateDocumentStatus: staffProcedure
    .input(
      z.object({
        documentId: z.string(),
        status: z.enum(DOCUMENT_STATUSES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.db.visaDocument.findUnique({
        where: { id: input.documentId },
      });

      if (!document) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      const updated = await ctx.db.visaDocument.update({
        where: { id: input.documentId },
        data: { status: input.status },
      });

      return updated;
    }),

  // Staff: get visas expiring within N days
  getExpiringVisas: staffProcedure
    .input(
      z.object({
        withinDays: z.number().min(1).max(365).default(60),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const withinDays = input?.withinDays ?? 60;
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + withinDays);

      const records = await ctx.db.visaRecord.findMany({
        where: {
          expiryDate: {
            gte: now,
            lte: futureDate,
          },
          status: { not: "EXPIRED" },
        },
        orderBy: { expiryDate: "asc" },
        include: {
          student: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      });

      return records;
    }),

  // Get document checklist based on visa type
  getDocumentChecklist: protectedProcedure
    .input(z.object({ visaType: z.string() }))
    .query(({ input }) => {
      const commonDocs = [
        "Valid Passport",
        "Visa Application Form",
        "Passport-size Photo",
        "Proof of Financial Support",
      ];

      const visaTypeDocs: Record<string, string[]> = {
        STUDENT_VISA: [
          ...commonDocs,
          "Certificate of Enrollment",
          "Academic Transcript",
          "Letter of Acceptance",
          "Medical Certificate",
          "Police Clearance",
        ],
        EXCHANGE_VISA: [
          ...commonDocs,
          "Exchange Program Acceptance Letter",
          "Home University Endorsement",
          "Insurance Certificate",
          "Medical Certificate",
        ],
        TOURIST_VISA: [
          ...commonDocs,
          "Travel Itinerary",
          "Hotel Reservation",
          "Return Ticket",
        ],
        WORK_VISA: [
          ...commonDocs,
          "Employment Contract",
          "Company Registration",
          "Tax Identification",
          "Medical Certificate",
          "Police Clearance",
        ],
        SPECIAL_STUDY_PERMIT: [
          ...commonDocs,
          "Certificate of Enrollment",
          "Notarized Affidavit of Support",
          "ACR I-Card",
          "Medical Certificate",
        ],
      };

      return visaTypeDocs[input.visaType] ?? commonDocs;
    }),

  // Staff: create a visa record for a student
  create: staffProcedure
    .input(
      z.object({
        studentId: z.string(),
        visaType: z.enum(VISA_TYPES),
        status: z.enum(VISA_STATUSES).default("VALID"),
        expiryDate: z.string(),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const student = await ctx.db.user.findUnique({
        where: { id: input.studentId },
      });

      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
      }

      const record = await ctx.db.visaRecord.create({
        data: {
          studentId: input.studentId,
          visaType: input.visaType,
          status: input.status,
          expiryDate: new Date(input.expiryDate),
          notes: input.notes,
        },
      });

      return record;
    }),
});
