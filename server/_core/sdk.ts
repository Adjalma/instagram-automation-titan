import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import bcrypt from "bcryptjs";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { parse as parseCookieHeader } from "cookie";

export type SessionPayload = {
  openId: string;
  name: string;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const getSessionSecret = () => new TextEncoder().encode(ENV.cookieSecret);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

class SDKServer {
  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = getSessionSecret();

    return new SignJWT({ openId: payload.openId, name: payload.name })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      { openId, name: options.name || "" },
      options
    );
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; name: string } | null> {
    if (!cookieValue) return null;

    try {
      const secretKey = getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId)) return null;

      return { openId, name: isNonEmptyString(name) ? name : "" };
    } catch {
      return null;
    }
  }

  async getUserFromSessionCookieOnly(req: Request): Promise<User | null> {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const session = await this.verifySession(cookies[COOKIE_NAME]);
    if (!session) return null;

    if (
      ENV.adminEmail &&
      ENV.adminPassword &&
      session.openId === `admin:${ENV.adminEmail}`
    ) {
      return {
        id: 0,
        openId: session.openId,
        name: session.name || "Admin",
        email: ENV.adminEmail,
        passwordHash: null,
        loginMethod: "local",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      } as User;
    }
    return null;
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const sessionCookie = cookies[COOKIE_NAME];
    const session = await this.verifySession(sessionCookie);

    if (!session) throw ForbiddenError("Invalid session cookie");

    // Admin via env — zero espera no banco (evita auth.me travado)
    if (
      ENV.adminEmail &&
      ENV.adminPassword &&
      session.openId === `admin:${ENV.adminEmail}`
    ) {
      void db.getUserByOpenId(session.openId)
        .then((u) => {
          if (u) void db.upsertUser({ openId: u.openId, lastSignedIn: new Date() }).catch(() => {});
        })
        .catch(() => {});
      return {
        id: 0,
        openId: session.openId,
        name: session.name || "Admin",
        email: ENV.adminEmail,
        passwordHash: null,
        loginMethod: "local",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      } as User;
    }

    let user: User | undefined;
    try {
      user = await db.getUserByOpenId(session.openId);
    } catch (err) {
      console.warn("[Auth] getUserByOpenId falhou:", (err as Error)?.message);
      user = undefined;
    }

    if (!user) {
      throw ForbiddenError("User not found");
    }

    void db.upsertUser({ openId: user.openId, lastSignedIn: new Date() }).catch((err) => {
      console.warn("[Auth] lastSignedIn update skipped:", (err as Error)?.message);
    });
    return user;
  }

  async loginWithPassword(
    email: string,
    password: string
  ): Promise<User | null> {
    // Admin via env vars — não bloqueia login se o banco estiver lento
    if (email === ENV.adminEmail && password === ENV.adminPassword && ENV.adminPassword) {
      void this.ensureAdminUser().catch(() => {});
      const openId = `admin:${ENV.adminEmail}`;
      return {
        id: 0,
        openId,
        name: "Admin",
        email,
        passwordHash: null,
        loginMethod: "local",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      } as User;
    }

    let user: User | undefined;
    try {
      user = await db.getUserByEmail(email);
    } catch (err) {
      console.warn("[Auth] getUserByEmail falhou:", (err as Error)?.message);
      user = undefined;
    }

    if (!user || !(user as any).passwordHash) return null;

    const valid = await comparePassword(password, (user as any).passwordHash);
    if (!valid) return null;

    void db.upsertUser({ openId: user.openId, lastSignedIn: new Date() }).catch(() => {});
    return user;
  }

  async ensureAdminUser(): Promise<void> {
    if (!ENV.adminPassword || !ENV.adminEmail) return;

    const existing = await db.getUserByEmail(ENV.adminEmail);
    if (existing) return;

    const passwordHash = await hashPassword(ENV.adminPassword);
    const openId = nanoid(21);

    await db.upsertUser({
      openId,
      name: "Admin",
      email: ENV.adminEmail,
      passwordHash,
      loginMethod: "local",
      role: "admin",
      lastSignedIn: new Date(),
    });

    console.log(`[Auth] Admin criado: ${ENV.adminEmail}`);
  }
}

export const sdk = new SDKServer();
