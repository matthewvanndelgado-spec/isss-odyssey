import { type inferAsyncReturnType } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";

export async function createContext(opts?: FetchCreateContextFnOptions) {
  const session = await getServerSession(authOptions);

  return {
    session,
    db,
    headers: opts && Object.fromEntries(opts.req.headers),
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
