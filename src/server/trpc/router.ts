import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { dashboardRouter } from "./routers/dashboard";
import { notificationRouter } from "./routers/notification";
import { inquiryRouter } from "./routers/inquiry";
import { appointmentRouter } from "./routers/appointment";
import { availabilityRouter } from "./routers/availability";
import { visaRouter } from "./routers/visa";
import { exchangeRouter } from "./routers/exchange";
import { orientationRouter } from "./routers/orientation";
import { chatRouter } from "./routers/chat";

export const appRouter = router({
  auth: authRouter,
  dashboard: dashboardRouter,
  inquiry: inquiryRouter,
  appointment: appointmentRouter,
  availability: availabilityRouter,
  visa: visaRouter,
  exchange: exchangeRouter,
  orientation: orientationRouter,
  chat: chatRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
