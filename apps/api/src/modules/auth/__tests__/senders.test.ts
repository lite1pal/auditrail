import { describe, expect, it } from "vitest";

import {
  buildMagicLinkUrl,
  createInMemoryMagicLinkSender
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
