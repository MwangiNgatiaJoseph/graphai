import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createGraphSession,
  getGraphSessionById,
  getUserGraphSessions,
  getAllGraphSessions,
  createChatMessage,
  getSessionMessages,
  getAllMessages,
} from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  graphs: router({
    /**
     * Create a new graph analysis session with image upload
     */
    createSession: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
          imageBase64: z.string().min(1, "Image is required"),
          imageMimeType: z.string().default("image/png"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Upload image to storage
          const imageBuffer = Buffer.from(input.imageBase64, "base64");
          const fileName = `graph-${Date.now()}.${input.imageMimeType.split("/")[1] || "png"}`;
          const { url: imageUrl, key: imageKey } = await storagePut(
            `graphs/${ctx.user.id}/${fileName}`,
            imageBuffer,
            input.imageMimeType
          );

          // Create session in database
          await createGraphSession(ctx.user.id, {
            title: input.title,
            description: input.description,
            imageUrl,
            imageKey,
            imageMimeType: input.imageMimeType,
          });

          // Get the created session to return its ID
          const sessions = await getUserGraphSessions(ctx.user.id);
          const newSession = sessions[sessions.length - 1];

          return {
            sessionId: newSession?.id || 0,
            imageUrl,
            title: input.title,
          };
        } catch (error) {
          console.error("Error creating graph session:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create graph session",
          });
        }
      }),

    /**
     * Get a specific session with all messages
     */
    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getGraphSessionById(input.sessionId);
        if (!session) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        // Check authorization
        if (session.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this session",
          });
        }

        const messages = await getSessionMessages(input.sessionId);
        return { session, messages };
      }),

    /**
     * Get all sessions for the current user
     */
    listSessions: protectedProcedure.query(async ({ ctx }) => {
      const sessions = await getUserGraphSessions(ctx.user.id);
      return sessions;
    }),

    /**
     * Send a message and get AI response
     */
    sendMessage: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          message: z.string().min(1, "Message cannot be empty"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify session ownership
        const session = await getGraphSessionById(input.sessionId);
        if (!session) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        if (session.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this session",
          });
        }

        // Save user message
        await createChatMessage(input.sessionId, "user", input.message);

        // Get conversation history
        const messages = await getSessionMessages(input.sessionId);
        const conversationHistory = messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        // Prepare LLM prompt with image context
        const systemPrompt = `You are an expert at analyzing and interpreting financial graphs, especially forex trading charts. 
	Your goal is to help users understand market data, identify trends, recognize technical indicators (like RSI, MACD, Bollinger Bands, moving averages), and provide actionable trading insights from their uploaded forex charts. 
	Provide clear, accurate, and detailed explanations. When asked questions about the graph, reference specific data points, candlestick patterns, and market trends.`;

        const llmMessages = [
          { role: "system" as const, content: systemPrompt },
          ...conversationHistory,
        ];

        // If this is the first message in the session, include the image with vision capability
        if (messages.length === 1 && session.imageUrl) {
          llmMessages[llmMessages.length - 1] = {
            role: "user" as const,
            content: [
              {
                type: "text" as const,
                text: `Here is the graph to analyze. Please examine it carefully and answer: ${input.message}`,
              },
              {
                type: "image_url" as const,
                image_url: {
                  url: session.imageUrl,
                  detail: "high" as const,
                },
              },
            ] as any, // Type assertion needed for multimodal content
          };
        }

        try {
          // Get AI response
          const response = await invokeLLM({
            messages: llmMessages,
          });

          const aiContent =
            response.choices[0]?.message?.content || "Unable to generate response";
          const aiMessage = typeof aiContent === "string" ? aiContent : "";

          // Save AI response
          await createChatMessage(input.sessionId, "assistant", aiMessage);

          return {
            userMessage: input.message,
            aiMessage,
          };
        } catch (error) {
          console.error("Error getting AI response:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get AI response",
          });
        }
      }),
  }),

  admin: router({
    /**
     * Admin-only: Get all sessions and messages
     */
    getAllSessions: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access this",
        });
      }

      const sessions = await getAllGraphSessions();
      return sessions;
    }),

    /**
     * Admin-only: Get all messages across all sessions
     */
    getAllMessages: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access this",
        });
      }

      const messages = await getAllMessages();
      return messages;
    }),

    /**
     * Admin-only: Get detailed view of a session
     */
    getSessionDetail: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can access this",
          });
        }

        const session = await getGraphSessionById(input.sessionId);
        if (!session) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        const messages = await getSessionMessages(input.sessionId);
        return { session, messages };
      }),
  }),
});

export type AppRouter = typeof appRouter;
