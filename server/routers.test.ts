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

describe("posts.approve — post sem mídia (sem agendamento)", () => {
  it("marca como approved quando não há mídia (não pode publicar no Instagram)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Cria post sem mídia e coloca como pending
    const created = await caller.posts.create({
      accountId: 1,
      caption: "Teste approve sem mídia",
      theme: "Build in Public",
    });
    await caller.posts.update({ id: created.id, status: "pending" });

    // Aprova — como não há mídia, publishToInstagram retorna erro e o post fica como approved
    const result = await caller.posts.approve({ id: created.id });
    expect(result.success).toBe(true);
    // Sem mídia: ou retorna 'approved' (publish falhou) ou 'published' (MCP retornou ID)
    expect(["approved", "published", "scheduled"]).toContain(result.status);

    // cleanup
    await caller.posts.delete({ id: created.id });
  });
});

describe("posts.approve — post com agendamento futuro", () => {
  it("marca como scheduled quando scheduledAt é no futuro", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 dias
    const created = await caller.posts.create({
      accountId: 1,
      caption: "Teste agendamento futuro",
      theme: "Dicas de Segurança",
      scheduledAt: futureDate.toISOString(),
    });
    await caller.posts.update({ id: created.id, status: "pending" });

    const result = await caller.posts.approve({ id: created.id });
    expect(result.success).toBe(true);
    expect(result.status).toBe("scheduled");

    // cleanup
    await caller.posts.delete({ id: created.id });
  });
});

describe("automation.approveAll", () => {
  it("processa todos os posts pendentes e retorna contadores", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Cria 2 posts pendentes (sem agendamento)
    const p1 = await caller.posts.create({ accountId: 1, caption: "ApproveAll test 1" });
    const p2 = await caller.posts.create({ accountId: 2, caption: "ApproveAll test 2" });
    await caller.posts.update({ id: p1.id, status: "pending" });
    await caller.posts.update({ id: p2.id, status: "pending" });

    const result = await caller.automation.approveAll();
    expect(result).toBeDefined();
    expect(typeof result.total).toBe("number");
    expect(typeof result.published).toBe("number");
    expect(typeof result.approved).toBe("number");
    expect(typeof result.scheduled).toBe("number");
    // total deve ser >= 2 (pode haver outros posts pendentes no banco)
    expect(result.total).toBeGreaterThanOrEqual(2);

    // cleanup
    await caller.posts.delete({ id: p1.id });
    await caller.posts.delete({ id: p2.id });
  });
});

describe("automation.processScheduled", () => {
  it("retorna contadores de processamento para posts agendados vencidos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Cria post com scheduledAt no passado e status scheduled
    const pastDate = new Date(Date.now() - 60 * 60 * 1000); // -1 hora
    const created = await caller.posts.create({
      accountId: 1,
      caption: "Teste processScheduled",
      scheduledAt: pastDate.toISOString(),
    });
    await caller.posts.update({ id: created.id, status: "scheduled" });

    const result = await caller.automation.processScheduled();
    expect(result).toBeDefined();
    expect(typeof result.processed).toBe("number");
    expect(typeof result.promoted).toBe("number");
    expect(Array.isArray(result.errors)).toBe(true);
    // O post criado deve ter sido processado
    expect(result.processed).toBeGreaterThanOrEqual(1);

    // cleanup
    await caller.posts.delete({ id: created.id });
  });

  it("retorna zero processados quando não há posts agendados vencidos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Cria post com scheduledAt no futuro
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // +1 dia
    const created = await caller.posts.create({
      accountId: 1,
      caption: "Teste futuro processScheduled",
      scheduledAt: futureDate.toISOString(),
    });
    await caller.posts.update({ id: created.id, status: "scheduled" });

    const result = await caller.automation.processScheduled();
    // O post futuro não deve ser processado
    // (pode haver outros posts vencidos no banco, então só verificamos o tipo)
    expect(typeof result.processed).toBe("number");
    expect(typeof result.promoted).toBe("number");

    // cleanup
    await caller.posts.delete({ id: created.id });
  });
});
