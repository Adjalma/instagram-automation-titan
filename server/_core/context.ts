import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const authPromise = sdk.authenticateRequest(opts.req);
    const timeoutMs = 12_000;
    user = await Promise.race([
      authPromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!user) {
      user = await sdk.getUserFromSessionCookieOnly(opts.req);
    }
  } catch {
    user = await sdk.getUserFromSessionCookieOnly(opts.req);
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
