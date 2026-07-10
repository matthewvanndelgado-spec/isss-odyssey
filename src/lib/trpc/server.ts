import { appRouter } from "@/server/trpc/router";
import { createContext } from "@/server/trpc/context";

export async function getServerClient() {
  const ctx = await createContext();
  return appRouter.createCaller(ctx);
}
