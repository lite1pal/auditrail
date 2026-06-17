import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { registerApiSchemas } from "../../http-schemas.js";
import type { AuthService } from "./service.js";
import {
  createSessionRouteSchema,
  deleteSessionRouteSchema,
  getMeRouteSchema,
  requestMagicLinkRouteSchema
} from "./http-contract.js";

const requestMagicLinkBodySchema = z.object({
  email: z.string().email()
});

const createSessionBodySchema = z.object({
  email: z.string().email(),
  token: z.string().min(1)
});

export interface AuthCookieOptions {
  name?: string;
  path?: string;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
  maxAgeSeconds?: number;
}

export interface AuthRoutesOptions {
  cookie?: AuthCookieOptions;
  service: AuthService;
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  options: AuthRoutesOptions
) {
  registerApiSchemas(app);

  const cookie: Required<AuthCookieOptions> = {
    maxAgeSeconds: 60 * 60 * 24 * 30,
    name: "auditrail_session",
    path: "/",
    sameSite: "Lax" as const,
    secure: true,
    ...options.cookie
  };

  app.post(
    "/auth/magic-links",
    { schema: requestMagicLinkRouteSchema },
    async (request, reply) => {
    const body = requestMagicLinkBodySchema.safeParse(request.body);

    if (!body.success) {
      return reply.code(400).send({
        error: "invalid_auth_request"
      });
    }

    await options.service.requestMagicLink(body.data.email);

    return reply.code(202).send({
      accepted: true
    });
    }
  );

  app.post(
    "/auth/sessions",
    { schema: createSessionRouteSchema },
    async (request, reply) => {
    try {
      const body = createSessionBodySchema.safeParse(request.body);

      if (!body.success) {
        return reply.code(400).send({
          error: "invalid_auth_request"
        });
      }

      const result = await options.service.createSessionFromMagicLink(
        body.data.token,
        body.data.email
      );

      reply.header(
        "set-cookie",
        serializeSessionCookie(cookie, result.sessionToken)
      );

      return reply.code(201).send({
        user: result.user
      });
    } catch (error) {
      if (error instanceof Error && error.message === "invalid_magic_link") {
        return reply.code(401).send({
          error: "invalid_magic_link"
        });
      }

      throw error;
    }
    }
  );

  app.delete(
    "/auth/sessions/current",
    { schema: deleteSessionRouteSchema },
    async (request, reply) => {
    const sessionToken = getCookieValue(request.headers.cookie, cookie.name);

    if (sessionToken) {
      await options.service.revokeSession(sessionToken);
    }

    reply.header("set-cookie", serializeExpiredSessionCookie(cookie));

    return reply.code(204).send();
    }
  );

  app.get("/me", { schema: getMeRouteSchema }, async (request, reply) => {
    const sessionToken = getCookieValue(request.headers.cookie, cookie.name);
    const user = sessionToken
      ? await options.service.getSessionUser(sessionToken)
      : undefined;

    if (!user) {
      return reply.code(401).send({
        error: "missing_session"
      });
    }

    return reply.send({
      memberships: [],
      user
    });
  });
}

function serializeSessionCookie(cookie: Required<AuthCookieOptions>, value: string) {
  return [
    `${cookie.name}=${value}`,
    `Path=${cookie.path}`,
    "HttpOnly",
    `SameSite=${cookie.sameSite}`,
    `Max-Age=${cookie.maxAgeSeconds}`,
    cookie.secure ? "Secure" : undefined
  ]
    .filter(Boolean)
    .join("; ");
}

function serializeExpiredSessionCookie(cookie: Required<AuthCookieOptions>) {
  return [
    `${cookie.name}=`,
    `Path=${cookie.path}`,
    "HttpOnly",
    `SameSite=${cookie.sameSite}`,
    "Max-Age=0",
    cookie.secure ? "Secure" : undefined
  ]
    .filter(Boolean)
    .join("; ");
}

function getCookieValue(cookieHeader: string | undefined, name: string) {
  return cookieHeader
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
