import Fastify from "fastify";
import { describe, expect, it } from "vitest";

import { sessionAuthPlugin } from "../session-auth.js";
import type { AuthService } from "../../modules/auth/service.js";

describe("sessionAuthPlugin", () => {
  it("decorates requests with the session user", async () => {
    const app = Fastify();
    app.register(sessionAuthPlugin, {
      service: createAuthServiceStub()
    });
    app.get("/session", async (request) => ({
      user: request.sessionUser
    }));

    const response = await app.inject({
      headers: {
        cookie: "auditrail_session=session-token"
      },
      method: "GET",
      url: "/session"
    });

    expect(response.json()).toEqual({
      user: {
        email: "user@example.com",
        id: "user-1"
      }
    });
  });

  it("leaves requests anonymous when no session cookie exists", async () => {
    const app = Fastify();
    app.register(sessionAuthPlugin, {
      service: createAuthServiceStub()
    });
    app.get("/session", async (request) => ({
      user: request.sessionUser
    }));

    const response = await app.inject({
      method: "GET",
      url: "/session"
    });

    expect(response.json()).toEqual({});
  });
});

function createAuthServiceStub(): AuthService {
  return {
    async createSessionFromMagicLink() {
      throw new Error("not implemented");
    },
    async getSessionUser(sessionToken) {
      expect(sessionToken).toBe("session-token");

      return {
        email: "user@example.com",
        id: "user-1"
      };
    },
    async requestMagicLink() {},
    async revokeSession() {}
  };
}
