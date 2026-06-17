import fp from "fastify-plugin";

import type { AuthUser } from "../modules/auth/service.js";
import type { AuthService } from "../modules/auth/service.js";

declare module "fastify" {
  interface FastifyRequest {
    sessionUser?: AuthUser;
  }
}

export interface SessionAuthPluginOptions {
  cookieName?: string;
  service: AuthService;
}

export const sessionAuthPlugin = fp<SessionAuthPluginOptions>(async (app, options) => {
  const cookieName = options.cookieName ?? "auditrail_session";

  app.decorateRequest("sessionUser");

  app.addHook("preHandler", async (request) => {
    const sessionToken = getCookieValue(request.headers.cookie, cookieName);

    if (!sessionToken) {
      return;
    }

    request.sessionUser = await options.service.getSessionUser(sessionToken);
  });
});

function getCookieValue(cookieHeader: string | undefined, name: string) {
  return cookieHeader
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
