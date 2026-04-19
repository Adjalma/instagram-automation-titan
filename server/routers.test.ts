import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@triarcsolutions.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.openId).toBe("test-user-001");
    expect(result?.name).toBe("Test User");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("accounts.list", () => {
  it("returns list of instagram accounts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.accounts.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("accounts.stats", () => {
  it("returns stats object for a given account", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.accounts.stats({ accountId: 1 });
    expect(result).toBeDefined();
    expect(typeof result.draft).toBe("number");
    expect(typeof result.pending).toBe("number");
    expect(typeof result.published).toBe("number");
  });
});

describe("themes.list", () => {
  it("returns list of content themes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.themes.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("posts.create and posts.list", () => {
  it("creates a post and lists it", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.posts.create({
      accountId: 1,
      caption: "Test post from vitest",
      theme: "Build in Public",
    });
    expect(created.id).toBeDefined();
    expect(typeof created.id).toBe("number");

    const allPosts = await caller.posts.list({});
    const found = allPosts.find((p: any) => p.id === created.id);
    expect(found).toBeDefined();
    expect(found?.caption).toBe("Test post from vitest");
    expect(found?.status).toBe("draft");

    // cleanup
    await caller.posts.delete({ id: created.id });
  });
});

describe("posts.approve and posts.reject", () => {
  it("approves a pending post", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.posts.create({
      accountId: 1,
      caption: "Approval test",
    });
    await caller.posts.update({ id: created.id, status: "pending" });
    const result = await caller.posts.approve({ id: created.id });
    expect(result.success).toBe(true);
    expect(result.status).toBe("approved");

    // cleanup
    await caller.posts.delete({ id: created.id });
  });

  it("rejects a post", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.posts.create({
      accountId: 1,
      caption: "Reject test",
    });
    const result = await caller.posts.reject({ id: created.id });
    expect(result.success).toBe(true);

    // cleanup
    await caller.posts.delete({ id: created.id });
  });
});
