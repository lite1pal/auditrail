import { describe, expect, it } from "vitest";

import {
  buildMagicLinkUrl,
  createInMemoryMagicLinkSender,
  createResendMagicLinkSender
} from "../senders.js";

describe("buildMagicLinkUrl", () => {
  it("builds callback URLs with email and token params", () => {
    expect(
      buildMagicLinkUrl(
        {
          email: "user@example.com",
          token: "token"
        },
        {
          webPublicUrl: "https://app.example.com"
        }
      )
    ).toBe("https://app.example.com/auth/callback?email=user%40example.com&token=token");
  });
});

describe("createInMemoryMagicLinkSender", () => {
  it("records sent magic links for development and tests", async () => {
    const sender = createInMemoryMagicLinkSender({
      webPublicUrl: "https://app.example.com"
    });

    await sender.sendMagicLink({
      email: "user@example.com",
      token: "token"
    });

    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0]?.url).toContain("/auth/callback");
  });
});

describe("createResendMagicLinkSender", () => {
  it("sends a magic link email through the Resend API", async () => {
    const calls: Array<{
      init?: RequestInit;
      url: string;
    }> = [];
    const sender = createResendMagicLinkSender({
      apiKey: "re_test_api_key",
      fetch: async (url, init) => {
        calls.push({
          init,
          url: String(url)
        });

        return new Response(null, {
          status: 202
        });
      },
      fromEmail: "noreply@example.com",
      webPublicUrl: "https://app.example.com"
    });

    await sender.sendMagicLink({
      email: "user@example.com",
      token: "token"
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.resend.com/emails");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({
      Authorization: "Bearer re_test_api_key",
      "Content-Type": "application/json"
    });
    expect(calls[0]?.init?.body).toContain("noreply@example.com");
    expect(calls[0]?.init?.body).toContain("user@example.com");
    expect(calls[0]?.init?.body).toContain(
      "https://app.example.com/auth/callback?email=user%40example.com&token=token"
    );
  });

  it("throws when Resend rejects the email request", async () => {
    const sender = createResendMagicLinkSender({
      apiKey: "re_test_api_key",
      fetch: async () =>
        new Response(
          JSON.stringify({
            message: "bad request"
          }),
          {
            status: 400
          }
        ),
      fromEmail: "noreply@example.com",
      webPublicUrl: "https://app.example.com"
    });

    await expect(
      sender.sendMagicLink({
        email: "user@example.com",
        token: "token"
      })
    ).rejects.toThrow("resend_send_failed:400");
  });
});
