import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { generateChatResponse, detectLanguage } from "@/lib/ai/openai";
import { getRAGContext } from "@/lib/ai/rag";
import { chatRateLimiter } from "@/lib/rate-limit";

const SUPPORTED_LANGUAGES = ["en", "fil", "ko", "zh"] as const;

export const chatRouter = router({
  // Send a message and get AI response
  sendMessage: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
        language: z.enum(SUPPORTED_LANGUAGES).default("en"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Rate limit per user to prevent OpenAI quota exhaustion
      const rateLimitResult = chatRateLimiter.check(`chat:${userId}`);
      if (!rateLimitResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You are sending messages too quickly. Please wait a moment and try again.",
        });
      }

      // Save user message
      await ctx.db.chatMessage.create({
        data: {
          studentId: userId,
          role: "USER",
          content: input.content,
          language: input.language,
        },
      });

      // Get conversation history (last 10 messages for context)
      const history = await ctx.db.chatMessage.findMany({
        where: { studentId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Reverse to get chronological order (excluding the just-saved message is fine, it's in the array)
      const conversationHistory = history
        .reverse()
        .map((msg) => ({
          role: msg.role.toLowerCase() as "user" | "assistant",
          content: msg.content,
        }));

      // Get RAG context based on the user's query
      const ragContext = await getRAGContext(input.content);

      // Generate AI response
      const aiResponse = await generateChatResponse(
        conversationHistory,
        input.language,
        ragContext
      );

      // Save assistant response
      const savedResponse = await ctx.db.chatMessage.create({
        data: {
          studentId: userId,
          role: "ASSISTANT",
          content: aiResponse,
          language: input.language,
        },
      });

      return {
        id: savedResponse.id,
        content: aiResponse,
        role: "ASSISTANT" as const,
        language: input.language,
        createdAt: savedResponse.createdAt,
      };
    }),

  // Get chat history for the current user
  getHistory: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;

      const messages = await ctx.db.chatMessage.findMany({
        where: { studentId: ctx.session.user.id },
        orderBy: { createdAt: "asc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return { messages, nextCursor };
    }),

  // Clear chat history for the current user
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.chatMessage.deleteMany({
      where: { studentId: ctx.session.user.id },
    });

    return { success: true };
  }),

  // Utility: detect language of input text
  detectLanguage: protectedProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      const detected = detectLanguage(input.text);
      return { language: detected };
    }),
});
