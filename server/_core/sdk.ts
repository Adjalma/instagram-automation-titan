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

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const sessionCookie = cookies[COOKIE_NAME];
    const session = await this.verifySession(sessionCookie);

    if (!session) throw ForbiddenError("Invalid session cookie");

    const user = await db.getUserByOpenId(session.openId);

    if (!user) {
      // Virtual admin session: DB unavailable but JWT openId matches stable admin id
      if (
        ENV.adminEmail &&
        ENV.adminPassword &&
        session.openId === `admin:${ENV.adminEmail}`
      ) {
        return {
          id: 0,
          openId: session.openId,
          name: "Admin",
          email: ENV.adminEmail,
          passwordHash: null,
          loginMethod: "local",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as any;
      }
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    return user;
  }

  async loginWithPassword(
    email: string,
    password: string
  ): Promise<User | null> {
    // Fallback direto: se credenciais batem com env vars, garante usuário e loga
    if (email === ENV.adminEmail && password === ENV.adminPassword && ENV.adminPassword) {
      await this.ensureAdminUser().catch(() => {});
    }

    const user = await db.getUserByEmail(email);

    // Se banco indisponível mas credenciais batem com env vars, retorna admin virtual
    // openId é estável (determinístico) para que authenticateRequest possa reconhecê-lo
    if (!user && email === ENV.adminEmail && password === ENV.adminPassword && ENV.adminPassword) {
      const openId = `admin:${ENV.adminEmail}`;
      return { id: 0, openId, name: "Admin", email, passwordHash: null, loginMethod: "local", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as any;
    }

    if (!user || !(user as any).passwordHash) return null;

    const valid = await comparePassword(password, (user as any).passwordHash);
    if (!valid) return null;

    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
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
